var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers')
const categoryHelpers = require('../helpers/category-helpers')
const userHelpers = require('../helpers/user-helpers');  
const { response } = require('../app');
const otpGenerator = require('otp-generator')
const nodemailer = require('nodemailer');
const multer = require('multer');
const {home,allProducts,login,signUp, logOut, proDetials, loginPost,signUpPost,userCart, addToCartGet,otp,
   cartQuantityChange, cartRemove, deliveryAddress,deliveryAddressGet, orderSuccess, addNewAddressPost, useExist} = require("../controller/user-controller")


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


// ******** User login related route ********
router.get("/login", login);

// get  method of signup **************
router.get("/signup",signUp);

//post method of signup ***************

router.post('/signup', signUpPost)


// OTP post method **************
router.post('/otp',otp)



//*********** Otp get method */
router.get('/otp', (req, res) => {
  res.render('user/otp')
})


//login post method  ************

router.post('/login',loginPost );


// logout get method *************
router.get('/logout',logOut);


//  ********* Product related get route   ********
router.get('/productdetails/:id',proDetials)

// ******** home page get method *******
router.get('/',home);

//*************All products get method *************

router.get('/all-products',allProducts)

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


///************** view you orders get method ******/

router.get('/orders', verifyLogin,  async(req,res)=>{
  let orders= await  userHelpers.getUserOrders(req.session.user._id)
res.render('user/orders',{user:req.session.user,guest:true,orders})
})






module.exports = router;
