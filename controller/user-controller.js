var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers')
const categoryHelpers = require('../helpers/category-helpers')
const userHelpers = require('../helpers/user-helpers');
const otpGenerator = require('otp-generator')
const nodemailer = require('nodemailer');


//***************** home controller method  (get)****************/
async function home(req, res, next) {
    let user = req.session.user;
   
    let cartCount= null;
    if(req.session.user){
    cartCount=await userHelpers.getCartCount(req.session.user._id)
    }
    productHelpers.getLatestProducts().then((products) => {
      categoryHelpers.getAllCategory().then((category) => {
        res.render('user/home-page', { category, user, products, guest: true,cartCount })
      })
    })
  }

  //***************  All-products page (get method) *********/
  function allProducts(req, res, next) {
    let user = req.session.user;   
    let val = Number(req.query.p);
    userHelpers.allProductsPagination(val).then((products) => {
      
      res.render('user/all-products', { user: true, products, user,guest:true });
    }).catch((error) => {
      console.log(error);
      res.redirect('/'); // Handle the error by redirecting to the home page or an error page
    });
  }
   
  
 
  // ********************user login controller (get method)***************

  function login(req, res){
    if (req.session.loggedIn) {
      res.redirect('/')
    } else {
      res.render('user/login', { 'loginErr': req.session.userloginErr, "blockError": req.session.blockError })
      req.session.userloginErr = false;
      req.session.blockError = false;
    }
  }


  // ************ user login (post method)**********

  function loginPost(req, res)  {
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
        console.log(error);
        req.session.userloginErr = "An error occurred while logging in";
        res.redirect('/login');
      });
  }


// ********************  user signup controller ************

function signUp(req, res)  {
    res.render('user/signup', { 'loginErr': req.session.loginErr })
    req.session.loginErr = false;
  }



  //************* user signup (post method) **********/

 function signUpPost (req, res) {
    userHelpers.doSignup(req.body)
    .then((response) => {
    
      if (response == 1) {
        req.session.loginErr = "Email already used"
        res.redirect('/signup')
      }
      if (response != 1) {
        userHelpers.doMailVarify(req.body.email)
        const { name, Email, password } = req.body; //---1 
        const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });//----2 
     // req.session.UserOtp=otp;      //==== 
       userHelpers.insertOtp(req.body, otp)
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
       to: Email,
       subject: 'OTP for sign up',
       text: ` Your OTP is ${otp}`
      };
       transporter.sendMail(mailOptions, (err, info) => {
       if (err) {
          console.log(err);
          res.status(500).send({ message: 'Error sending OTP email' });
          client.close();
          return;
              }
       })
       req.session.user = response
       req.session.user.loggedIn = true
         res.render('user/otp')
        }
       })
    }




  //*********** user logout controller(get method) ***********//

 function logOut (req, res)  {
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

  async function proDetials (req, res) {
    let product = await productHelpers.getProductDetails(req.params.id)
    let user = req.session.user
    res.render("user/product-details.hbs", { product, user: true, user })
  
  }

  
  //************** User Cart (get method) controller  *********/

  async function userCart(req,res){
   
    let products=await userHelpers.getCartProducts(req.session.user._id)
    if(products.length){
    let total = await userHelpers.getTotalAmount(req.session.user._id)
    console.log(products);
    res.render('user/cart',{products, 'user':req.session.user._id,total})
    }else{
    req.session.cartEmpty= "Your cart is empty !!"
    let emptyError = req.session.cartEmpty
    res.render('user/cart',{user:req.session.user._id,emptyError})
    }
  }


  //*****************add to cart (get method) controller *******/

  function addToCartGet(req,res){
    userHelpers.addToCart(req.params.id, req.session.user._id).then(()=>{
     res.json({status:true})
    })
  }

//****************** otp post method controller ************/
  function otp(req, res) {

    userHelpers.doMailCheck(req.body).then((status) => {
      if (status.status) {
        userHelpers.doMailVarifySuccess(req.body)
        res.redirect("/login")
      } else {
        console.log("wrong otp" + req.session.UserOtp)
        alert("Wrong otp")
        res.redirect('/signup')
      }
    })
  }




  //*********** cart product qunatity change (post method) controller **********/


function cartQuantityChange(req,res,next){
  userHelpers.changeProductQuantity(req.body).then(async(response)=>{
    response.total = await userHelpers.getTotalAmount(req.body.user)
    res.json(response)
  })
}


//************* remove form cart (post )controller ***********
function cartRemove(req,res,next){
  userHelpers.removeFromCart(req.body).then((response)=>{
    res.json(response)
  })
}

//***************delivery address (get method) controller ***********/

async function deliveryAddressGet(req,res){
  let user = await userHelpers.userAddresses(req.session.user._id)
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/address',{total,user})
}




//*************** delivery address (post method)**************//
async function deliveryAddress(req,res){
  let products = await userHelpers.getCartProductList(req.body.userId)
  let totalPrice= await userHelpers.getTotalAmount(req.body.userId)
  userHelpers.placeOrder(req.body,products,totalPrice).then((response)=>{
  res.json({status:true})
  })
}

//**************** Order successful(get method) ***********/
function orderSuccess(req, res)  {
  res.render('user/order-success',{user:req.session.user});
}



//****************** Adding new address (post method) ******/

function addNewAddressPost(req,res){
  let userId = req.body.userId;
  let addressobj = {
    name:req.body.fullName,
    address:req.body.address,
    pincode:req.body.pincode,
    mobile:req.body.mobile
  }
  userHelpers.addNewAddress(userId,addressobj).then(()=>{
    res.redirect('/delivery-address')
  })
}

//*******************user existing address (get method) controller*************/

async function useExist(req, res){
  let userId = req.query.id;
  let index = req.query.i;
  let user = await userHelpers.userAddresses(userId);
  let userAddress = user.addresses[index];
  let total = await userHelpers.getTotalAmount(userId);
  res.render('user/address', { userAddress, user, total });
}



module.exports={home,allProducts,login,signUp,logOut,proDetials,loginPost,signUpPost,userCart,addToCartGet,otp,cartQuantityChange,cartRemove,
  deliveryAddress,deliveryAddressGet,orderSuccess,addNewAddressPost,useExist}