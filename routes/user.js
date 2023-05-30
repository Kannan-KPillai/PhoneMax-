var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers')
const categoryHelpers = require('../helpers/category-helpers')
const userHelpers = require('../helpers/user-helpers');
const { response } = require('../app');
const otpGenerator = require('otp-generator')
const nodemailer = require('nodemailer');
const multer = require('multer');




const verifyLogin = (req, res, next) => {
  if (req.session.user) {
    next()
  } else {
    res.redirect('/login')
  }
}


/* GET home page. */

const goToLoginIfNotLoggedIn = (req, res, next) => {
  if (!req.session.user) {
    redirect('/login');
  } else {
    next();
  }
};




// ******** User login and Sign UP related routes ********
router.get("/login", (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    res.render('user/login', { 'loginErr': req.session.userloginErr, "blockError": req.session.blockError })
    req.session.userloginErr = false;
    req.session.blockError = false;
  }
});

// get and post methods of signup **************
router.get("/signup", (req, res) => {
  res.render('user/signup', { 'loginErr': req.session.loginErr })
  req.session.loginErr = false;
});


router.post('/signup', (req, res) => {
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
})


// OTP post method **************
router.post('/otp', (req, res) => {

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
})


router.get('/otp', (req, res) => {
  res.render('user/otp')
})


//login post methods  ************

router.post('/login', (req, res) => {
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
});


// logout get methods *************
router.get('/logout', (req, res) => {
  req.session.user = null;
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
      res.redirect('/');
    } else {
      res.redirect('/');
    }
  });
});


//  ********* Product related routes   ********
router.get('/productdetails/:id', async (req, res) => {
  let product = await productHelpers.getProductDetails(req.params.id)
  let user = req.session.user
  // console.log(product+"gay")
  res.render("user/product-details.hbs", { product, user: true, guest: true, user })

})

// ******** home page get methods *******
router.get('/',async function (req, res, next) {
  let user = req.session.user;
  console.log(user);
  let cartCount= null;
  if(req.session.user){
  cartCount=await userHelpers.getCartCount(req.session.user._id)
  }
  productHelpers.getLatestProducts().then((products) => {
    categoryHelpers.getAllCategory().then((category) => {
      res.render('user/home-page', { category, user, products, guest: true,cartCount })
    })
  })
});

router.get('/all-products', function (req, res) {
  let user = req.session.user
  productHelpers.getAllProducts().then((products) => {
    res.render('user/all-products', { products, user, guest: true })
  })

})

// ********** Cart management get and post methods ******************

router.get('/cart',verifyLogin,async(req,res)=>{
  let product=await userHelpers.getCartProducts(req.session.user._id)
  console.log(product);
  res.render('user/cart',{  user: true, guest: true,product, user:req.session.user})
})


router.get('/add-to-cart/:id',verifyLogin,(req,res)=>{
  console.log(req.params.id)
  userHelpers.addToCart(req.params.id, req.session.user._id).then(()=>{
    res.redirect('/')
  })
})

module.exports = router;
