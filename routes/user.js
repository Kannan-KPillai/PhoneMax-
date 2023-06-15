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
   cartQuantityChange, cartRemove, deliveryAddress,deliveryAddressGet, orderSuccess, addNewAddressPost, deleteAddressGet, useExist, ordersGet,edituseraddresspost,
   deleteAddressget,edituseraddress,userprofilepost,userprofileget} = require("../controller/user-controller");
const { log } = require('handlebars');


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
router.post('/verify-payment',(req,res)=>{
  userHelpers.verifyPayment(req.body).then(()=>{
  userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
    res.json({status:true})
  })
  }).catch((err)=>{
    res.json({status:false,errMsg:''})
  })
})


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

router.post('/updatePass',async(req,res)=>{
  try{
    const {email, newPass} = req.body;
    console.log(newPass)
    console.log(email)
    const user = await userHelpers.getUserByEmail(email);
    console.log(user)
    if(!user){
      throw new Error("user not found")
    }
    await userHelpers.doUpdatePassword(user._id.toString(), newPass)
    res.redirect('/login');
  }catch(error){
    console.log(error)
    res.render('user/forgot-p',{loginErr:error.message})
  }
})

router.post('/all-products',verifyLogin,(req, res, next)=> {
  const user = req.session.user;
  let searchq = String(req.body.search);
  productHelpers
    .searchProducts(searchq)
    .then((products) => {
      res.render('user/all-products', { products, user});
    })
    .catch((err) => {
      console.log(err);
      res.render('user/all-products', { err,user });
    });
  })


module.exports = router;
