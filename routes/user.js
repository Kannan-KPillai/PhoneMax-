var express = require('express');
var twilio = require('twilio');
var router = express.Router();
var db= require('../config/connection');
var collection= require('../config/collections')
const productHelpers = require('../helpers/product-helpers')
const categoryHelpers = require('../helpers/category-helpers')
const userHelpers = require('../helpers/user-helpers');  
const { response } = require('../app');
const otpGenerator = require('otp-generator')
const nodemailer = require('nodemailer');
const multer = require('multer');
const {home,allProducts,login,signUp, logOut, proDetials, loginPost,signUpPost,userCart, addToCartGet,otp,returnOrder,walletget,
   cartQuantityChange, cartRemove, deliveryAddress,deliveryAddressGet, orderSuccess, addNewAddressPost, deleteAddressGet, useExist, ordersGet,edituseraddresspost,
   deleteAddressget,edituseraddress,userprofilepost,userprofileget,applyCouponPost,forgotPost,allProPost,verifyPayPost,useWalletPost} = require("../controller/user-controller");
const { log } = require('handlebars');


//------------refferal code generator
const generatedReferralCodes = []; // Array to store generated referral codes



//******** verifying login *********/
const verifyLogin = (req, res, next) => {
  if (req.session.user) {
    next()
  } else {
    res.redirect('/login')
  }
}

const goToLoginIfNotLoggedIn = (req, res, next) => {
  if (!req.session.user) {
    redirect('/login');
  } else {
    next();
  }
};


// ******** User login related get route ********
router.get("/login", login);

//login post method  ************
router.post('/login',loginPost );

// get  method of signup **************
router.get("/signup",signUp);

//**********post method of signup */
router.post('/signup',signUpPost)

// OTP post method **************
router.post('/otp',otp)
 
//*********** Otp get method */
router.get('/otp', (req, res) => {
  res.render('user/otp')
})

///**********otp login get method ***********
router.get('/otp-login',(req,res)=>{
  res.render('user/otp-login')
})

//**********otp login post method *********/
router.post('/otp-login',  (req, res) => {
  function generateRandomNumber() {
    return Math.floor(1000 + Math.random() * 9000);
  }
  const otp = generateRandomNumber();
 userHelpers.replaceOtp(req.body.number,otp)
  userHelpers.checkNumber(req.body)
    .then(async (response) => {
      if (response.status) {
        const accountSid = process.env.MY_ACC;
      const authToken = process.env.MY_AUTH;
      const client = twilio(accountSid, authToken);
      client.messages
        .create({
          body:` Your OTP is ${otp}`,
          to:  `+91${req.body.number}`, // Text your number
          from: `${process.env.MY_PH}`, // From a valid Twilio number
        })
        .then(async (message) => {
          console.log("Message is Succesfully Sent");
          console.log("*******************************************************")
        let user = await db
      .get()
      .collection(collection.USER_COLLECTION)
      .findOne({ number: req.body.number });
      console.log(user);     
        res.render('user/otp-login',{num:req.body.number,Email:user.Email});
        });
        
      } else if (response === 1) {
        req.session.blockError = "You are blocked";
        res.redirect('/login');
      } else {
        req.session.userloginErr = "Invalid number";
        res.redirect('/login');
      }
    })
    .catch((error) => {
      req.session.userloginErr = "An error occurred";
      res.redirect('/login');
    });
});
//********otp success post method************//
router.post('/otp-success', async (req, res) => {
  let userOtp = req.body.otp;
  let num = req.body.num;
  let Email = req.body.Email;
  let otp = await userHelpers.findOtp(num);

  console.log("myOtp: ", userOtp);
  console.log("db Otp: ", otp.otp);

  if (Number(otp.otp) === Number(userOtp)) {
    let data = { Email: Email };
    userHelpers
      .doCheckIn(data)
      .then((response) => {
        if (response.status) {
          req.session.user = response.user;
          req.session.loggedIn = true;
          res.redirect('/');
        } else if (response === 1) {
          req.session.blockError = "You are blocked";
          res.redirect('/login');
        } else {
          req.session.userloginErr = "Invalid username or password";
          res.redirect('/login');
        }
      })
      .catch((error) => {
        req.session.userloginErr = "An error occurred while logging in";
        res.redirect('/login');
      });
  } else {
    res.redirect('/login');
  }
});



// logout get method *************
router.get('/logout',logOut);

//  ********* Product related get route   ********
router.get('/productdetails/:id',proDetials)

// ******** home page get method *******
router.get('/',home);

//*************All products get method *************
router.get('/all-products',allProducts)

//************all porudcts page post method *******************
router.post('/all-products',allProPost)

// ********** Cart management get  method ******************
router.get('/cart',verifyLogin,userCart)

//*********add to cart get method ***********/
router.get('/add-to-cart/:id',addToCartGet)

//*********cart porduct quantity change post method ***********
router.post('/change-product-quantity',cartQuantityChange)

//**********remove from cart post method *********** 
router.post('/remove-from-cart',cartRemove)

//***********User Address related get route *********************
router.get('/delivery-address',verifyLogin,deliveryAddressGet)

//**************** User Address related post route***************
router.post('/delivery-address',deliveryAddress)

//************** order Success page get method ************/
router.get('/order-success', verifyLogin,orderSuccess);

//**************** user add new address post method *************/
router.post('/add-new-address',addNewAddressPost)

//********** use existing address get method **************/
router.get('/use_address',useExist );

//*********** delete existing address get method **********/
router.get('/delete_address',deleteAddressGet)

///************** view your orders get method ******/
router.get('/orders', verifyLogin, ordersGet )

///************** cancel order get  *********/
router.get('/cancel-order',async(req,res)=>{
  let id = req.query.id
  let status= req.query.st
  await userHelpers.cancelOrder(id,status)
  res.redirect('/orders')
})

//**************verify payment post method **********/
router.post('/verify-payment',verifyPayPost)

//************user profile related routes****************//
router.get('/user-profile',verifyLogin,userprofileget )

router.post('/add-new-address-profile',userprofilepost)

router.get('/edit-address',verifyLogin, edituseraddress)

router.post('/edit-address',edituseraddresspost)

router.get('/delete-address',deleteAddressget)

//forgot password get method*********************
router.get("/updatePass", (req, res) => {
  res.render("user/forgot-p");
});

//forgot password post method********************//
router.post('/updatePass',forgotPost)

//***********apply coupon post */
 router.post('/apply-coupon',verifyLogin,applyCouponPost)

//************return order get method ********/
router.get('/return-order',verifyLogin,returnOrder)

//**********use wallet post method *************/
router.post('/use-wallet',verifyLogin,useWalletPost)

//********** user wallet get method **********/
router.get('/wallet',verifyLogin,walletget)

//*********** refferal link get method ************//
router.get("/refferal-link", verifyLogin, (req, res) => {
  users = req.session.user;
  console.log(users)
  cartCount = req.session.cartCount;
  res.render("user/refferal-link", { user: true, users,cartCount});
});


module.exports = router;
