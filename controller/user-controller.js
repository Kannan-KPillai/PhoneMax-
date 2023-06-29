var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers')
const categoryHelpers = require('../helpers/category-helpers')
const userHelpers = require('../helpers/user-helpers');
const otpGenerator = require('otp-generator')
const nodemailer = require('nodemailer');
const couponHelpers = require('../helpers/coupon-helpers')


//------------refferal code generator
const generatedReferralCodes = []; // Array to store generated referral codes
function generateReferralCode() {
  const referralCodeLength = 5;
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";

  let referralCode = "";

  while (referralCode === "" || generatedReferralCodes.includes(referralCode)) {
    for (let i = 0; i < referralCodeLength; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      referralCode += characters[randomIndex];
    }
  }

  generatedReferralCodes.push(referralCode); // Store the generated code

  return referralCode;
}

//***************** home page controller method cart count,latest products and category (get)****************/
async function home(req, res, next) {
  let user = req.session.user;
  let banners = await userHelpers.getBanners();
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  productHelpers.getLatestProducts().then((products) => {
    categoryHelpers.getAllCategory().then((category) => {
      res.render('user/home-page', { category, user, products, guest: true, cartCount, banners })
    })
  })
}

//***************  All-products page with pagination(get method) *********/
function allProducts(req, res, next) {
  let user = req.session.user;
  let val = Number(req.query.p);
  userHelpers.allProductsPagination(val).then((products) => {
    const showPagination = products.length >= 5;

    res.render('user/all-products', { user: true, products, user, guest: true, showPagination });
  }).catch((error) => {

    res.redirect('/'); // Handle the error by redirecting to the home page or an error page
  });
}

// ********************user login controller (get method)***************
function login(req, res) {
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    res.render('user/login', { 'loginErr': req.session.userloginErr, "blockError": req.session.blockError })
    req.session.userloginErr = false;
    req.session.blockError = false;
  }
}

// ************ user login ======checks whether the user is registered or not  (post method)**********
function loginPost(req, res) {
  userHelpers.doLogin(req.body)
    .then((response) => {
      if (response.status) {
        req.session.user = response.user;
        req.session.loggedIn = true;
        res.redirect('/');
      } else if (response == 1) {
        req.session.blockError = "You are blocked";
        res.redirect('/login')
      } else {
        req.session.userloginErr = "Invalid username or password";
        res.redirect('/login');
      }
    })
    .catch((error) => {
      req.session.userloginErr = "An error occurred while logging in";
      res.redirect('/login');
    });
}

// ********************  user signup (get method) controller ************
function signUp(req, res) {
  let otpError = req.session.otpError
  let numError = req.session.numError
  res.render('user/signup', { loginErr: req.session.loginError, otpError, numError })
  req.session.loginError = false

}

//************* verify otp method **********/
function verifyOtp(req, res) {
  const { enteredOtp } = req.body;
  const { userOtp } = req.session;

  if (enteredOtp === userOtp) {
    // OTP is correct, proceed with creating the account
    // Add your code here to create the account and redirect to the appropriate page
  } else {
    // Incorrect OTP, handle the error
    res.render('user/otp', { error: 'Incorrect OTP' });
  }
}

//*********user  signup post method === checks whether the user using existing email ornot and other functions*/
function signUpPost(req, res) {
  let code = req.query.referral_code;
  req.session.refCode = code;
  userHelpers.doSignup(req.body).then((response) => {
    if (response === 1) {
      req.session.loginError = "Email Already Used";
      res.redirect("/signup");
    } else if (response === 2) {
      req.session.numError = "Number Already Used";
      res.redirect("/signup");
    } else {
      req.session.details = req.body;
      const email = req.body.Email
      let otp = otpGenerator.generate(6, {
        digits: true,
        alphabets: false,
        upperCase: false,
        specialChars: false,
      });

      req.session.signupOtp = otp
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'wyman15@ethereal.email',
          pass: 'am66euQDZmncwMhA6u'
        }
      });
      const mailOptions = {

        from: 'wyman15@ethereal.email',
        to: email,
        subject: 'OTP for sign up',
        text: ` Your OTP is ${otp}`
      };
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.log(err);
          res.status(500).send({ message: "Error sending OTP email" });
          client.close();
          return;
        }
      });
      res.render("user/otp");
    }
  })
}

//*********** user logout controller(get method) ***********//
function logOut(req, res) {
  req.session.user = null;
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
      res.redirect('/');
    } else {
      res.redirect('/');
    }
  });
}

//*********** product details(get method) controller   **********/

async function proDetials(req, res) {
  let product = await productHelpers.getProductDetails(req.params.id)
  let user = req.session.user
  res.render("user/product-details.hbs", { product, user: true, user, guest: true })
}

//************** User Cart page == get products to the page and total amount  (get method) controller  *********/
async function userCart(req, res) {
  let userId = req.session.user._id;
  let user = await userHelpers.userDetails(userId);
  let products = await userHelpers.getCartProducts(userId);
  if (products.length) {
    let total = await userHelpers.getTotalAmount(user._id);
    req.session.user.pAmount = total;
    user.pAmount = total
    req.session.usedCoupon = null
    res.render("user/cart", { products, user, total });
  } else {
    req.session.cartEmptyError = "Your Cart is Empty !";
    let emptyError = req.session.cartEmptyError;
    res.render("user/cart", { user, emptyError });
  }
}
//*****************add to cart (get method) controller *******/
function addToCartGet(req, res) {
  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true })
  })
}

//****************** otp post method controller==check that the user entered is wrong otp or not ************/
async function otp(req, res) {
  let otp = req.session.signupOtp
  let userOtp = req.body.otp
  let userDetails = req.session.details
  let refCode = req.session.refCode;
  const referralCode = generateReferralCode();
  if (otp === userOtp) {
    userDetails.referralCode = referralCode
    let userData = await userHelpers.addUser(userDetails)
    if (userData) {
      if (refCode) {
        userHelpers.addRefWallet(refCode);
      }
      res.redirect("/login");
    }
  } else {
    req.session.otpError = true;
    res.redirect("/signup");
  }
  req.session.otpError = false
}

//*********** cart product qunatity change (post method) controller **********/
function cartQuantityChange(req, res, next) {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.body.user)
    res.json(response)
  })
}

//************* remove form cart (post )controller ***********
function cartRemove(req, res, next) {
  userHelpers.removeFromCart(req.body).then((response) => {
    res.json(response)
  })
}

//***************delivery address page  (get method) controller ***********/
async function deliveryAddressGet(req, res) {
  let user = req.session.user;
  let userAddresses = await userHelpers.getUserAddress(req.session.user._id);
  res.render("user/address", { user, userAddresses });
}

//*************** delivery address page == payemets and total amount is calculated(post method)**************//
async function deliveryAddress(req, res) {
  let products = await userHelpers.getCartProductList(req.body.userId);
  let total = req.session.user.pAmount

  userHelpers.placeOrder(req.body, products, total).then((orderId) => {
    req.session.orderId = orderId;
    if (req.body["payment-method"] === "COD") {
      res.json({ codSuccess: true });
    } else {
      userHelpers.generateRazorpay(orderId, total).then((response) => {
        res.json(response);
      });
    }
  });
}

//**************** Order successful page(get method) ***********/
async function orderSuccess(req, res) {
  let user = req.session.user;
  let price = req.session.user.pAmount;
  let amount = req.session.user.walletBalance;
  let id = req.session.orderId
  let amountUsed = req.session.user.amountUsed
  if (req.session.walletApply) {
    userHelpers. walletDebit(amountUsed, user._id)  
    userHelpers.deductAmountWallet(amount, user._id)
    req.session.walletApply = false;
    req.session.walletBalance = 0;
  }
  if (req.session.usedCoupon) {
    let user = req.session.user;
    let usedCoupon = req.session.usedCoupon;
    userHelpers.deleteCoupon(user._id, usedCoupon);
    req.session.usedCoupon = null;
    req.session.couponDiscount = false;
  }
  let coupon = await couponHelpers.giveCoupon(price);
  if (coupon) {
    let userId = user._id;
    userHelpers.addCouponUser(userId, coupon);
  }
  req.session.user.pAmount = 0;
  // let order = await userHelpers.getOrder(id);
  req.session.orderId = null;
  res.render("user/order-success", { user, coupon });
}


//****************** Adding new address (post method) ******/
function addNewAddressPost(req, res) {
  let userId = req.body.userId;
  let addressobj = {
    name: req.body.fullName,
    address: req.body.address,
    pincode: req.body.pincode,
    mobile: req.body.mobile
  }
  userHelpers.addNewAddress(userId, addressobj).then(() => {
    res.redirect('/delivery-address')
  })
}
  
//*******************user existing address (get method) controller*************/
async function useExist(req, res) {
  let Id = req.query.id;
  let user = req.session.user;
  let userAddresses = await userHelpers.getUserAddress(user._id);
  let userAddress = await userHelpers.getOneAddress(Id);
  // let total = await userHelpers.getTotalAmount(user._id);
  let total = req.session.user.pAmount
  if (req.session.couponDiscount) {
    total = total - req.session.couponDiscount
  }
  res.render('user/address', { userAddress, user, total, userAddresses });
}

//**************delete existing address (get method)  controller******/
function deleteAddressGet(req, res) {
  let Id = req.query.id
  userHelpers.deleteAddress(Id)
  res.redirect('/delivery-address')
}


//********************** view you orders get controller *************/
async function ordersGet(req, res) {
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  res.render('user/orders', { user: req.session.user, guest: true, orders })
}

//********** */ user profile management(get method//
async function userprofileget(req, res) {
  let user = req.session.user
  let userAddresses = await userHelpers.getUserAddress(user._id)
  res.render('user/user-profile', { user, userAddresses })
}


//************ user profile post method  controller *********/
function userprofilepost(req, res) {
  let userId = req.body.userId;
  let addressobj = {
    name: req.body.firstname,
    address: req.body.address,
    pincode: req.body.pincode,
    phone: req.body.phone
  }
  userHelpers.addNewAddress(userId, addressobj).then(() => {
    res.redirect('/user-profile')
  })
}

//*************** edit user addreess(get method) ***********/
async function edituseraddress(req, res) {
  let user = req.session.user;
  let addressId = req.query.id;
  let Address = await userHelpers.getOneAddress(addressId)

  res.render('user/edit-address', { Address, user })
}

//*******edit user address post method */
function edituseraddresspost(req, res) {
  let Id = req.query.id;
  let addressobj = {
    name: req.body.firstname,
    address: req.body.address,
    pincode: req.body.pincode,
    phone: req.body.phone
  }
  userHelpers.editAddress(Id, addressobj)
  res.redirect('/user-profile')
}

//*********delete address get method controller *********/
function deleteAddressget(req, res) {
  let Id = req.query.id;
  userHelpers.deleteAddress(Id)
  res.redirect('/user-profile')
}

//************Apply coupon (post method) controller *****/
async function applyCouponPost(req, res) {
  let couponCode = req.body.coupon;
  const currDate = new Date();
  let endDate
  let userCoupon = await couponHelpers.applyCoupon(couponCode);
  if (userCoupon && !req.session.usedCoupon) {

    endDate = new Date(userCoupon.expiryDate);

    if (endDate > currDate) {

      let total = req.session.user.pAmount
      let response = {}

      req.session.usedCoupon = userCoupon.couponCode;
      response.response = true;
      response.discountAmount = userCoupon.discount
      response.newTotal = (total - userCoupon.discount)
      req.session.user.pAmount = (total - userCoupon.discount)
      res.json(response);
    } else {
      res.json({ response: false });
    }
  } else {
    res.json({ response: false })
  }
}

//****************forgot password post method ***********/
async function forgotPost(req, res) {
  try {
    const { email, newPass } = req.body;
    const user = await userHelpers.getUserByEmail(email);
    if (!user) {
      throw new Error("user not found")
    }
    await userHelpers.doUpdatePassword(user._id.toString(), newPass)
    res.redirect('/login');
  } catch (error) {
    console.log(error)
    res.render('user/forgot-p', { loginErr: error.message })
  }
}


//********all products page post method controller *********/

function allProPost(req, res, next) {
  const user = req.session.user;
  let searchq = String(req.body.search);
  productHelpers
    .searchProducts(searchq)
    .then((products) => {
      res.render('user/all-products', { products, user });
    })
    .catch((err) => {
      console.log(err);
      res.render('user/all-products', { err, user });
    });
}

//**************verify payment post method ********/
function verifyPayPost(req, res) {
  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      res.json({ status: true })
    })
  }).catch((err) => {
    res.json({ status: false, errMsg: '' })
  })
}


//***********user wallet post controller *********/
async function useWalletPost(req, res) {

  let wallet = req.body.wallet;
  let Amount = req.session.user.pAmount
  let balance
  let walletBalance
  let amountUsed 

  if (wallet > Amount) {
    balance = 0;
    walletBalance = Math.abs(Amount - wallet);
    amountUsed = Amount
  } else {
    balance = Math.abs(Amount - wallet);
    walletBalance = 0
    amountUsed = wallet
  }
  req.session.user.pAmount = balance;
  req.session.user.walletBalance = walletBalance
  req.session.user.amountUsed = amountUsed;
  req.session.walletApply = true;


  let response = {}
  response.total = balance;
  response.walletBalance = walletBalance
  response.amountUsed= amountUsed
  res.json(response)

}
//**********return order get method ***************/
async function returnOrder(req, res) {
  let id = req.query.id;
  let status = req.query.st;
  let userId = req.session.user._id;
  userHelpers.cancelOrder(id, status);
  let order = await userHelpers.getOrder(id)
  let amount = order.totalAmount

  const expiryDays = 7;
  const purchaseDate = new Date(order.date.$date);
  const expiryDate = new Date(purchaseDate);
  expiryDate.setDate(expiryDate.getDate() + expiryDays);
  const currentDate = new Date();
  const hasExpired = currentDate > expiryDate;
  userHelpers.walletCredit(amount, userId)
  userHelpers.addAmountWallet(amount, userId)
  res.redirect("/orders");
}

//*************user wallet get method controller ***********//
async function walletget(req, res) {
  let userId = req.session.user._id
  let user = await userHelpers.userDetails(userId)
  res.render('user/wallet', { user })
}




module.exports = {
  home, allProducts, login, signUp, logOut, proDetials, loginPost, signUpPost, userCart, addToCartGet, otp, cartQuantityChange, cartRemove,
  deliveryAddress, deliveryAddressGet, orderSuccess, addNewAddressPost, useExist, ordersGet, deleteAddressget, edituseraddresspost, edituseraddress,
  userprofilepost, userprofileget, deleteAddressGet, applyCouponPost, forgotPost, allProPost, verifyPayPost, useWalletPost, returnOrder, walletget
}