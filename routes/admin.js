var express = require('express');
var router = express.Router();
var productHelpers= require('../helpers/product-helpers')
const adminHelpers = require('../helpers/admin-helpers')
var categoryHelpers = require('../helpers/category-helpers')
// const multer = require('multer');
// const upload = multer({dest:"upload"})

const verifyLogin=(req,res,next)=>{
  if(req.session.admin && req.session.admin.loggedIn){
    next()
  }else{
    res.redirect('/admin/adminLogin')
  }
}
/* GET users listing. */
router.get('/',verifyLogin, function(req, res, next) {
  productHelpers.getAllProducts().then((products)=>{
    res.render('admin/view-products',{admin:true,products})
  })
});


// ********* GET add-products lilsting **************//
router.get('/add-product',verifyLogin,async function(req,res){
  let admin= req.session.admin
  let category= await categoryHelpers.getAllCategory();
  res.render('admin/add-product',{category})
})




// ********* Product add edit and delete *********** //
router.post('/add-product', (req, res) => {
  console.log(req.body);
  console.log(req.files.Image);

  productHelpers.addProduct(req.body, (insertedId) => {
    let image = req.files.Image;
    image.mv('./public/product-image/' + insertedId + '.jpg', (err) => {
      if (!err) {
        res.redirect("/admin");
      } else {
        console.log(err);
        res.status(500).send("Error occurred while uploading the image");
      }
    });
  });
});


// Delete Product get method
router.get('/delete-product/:id',verifyLogin,(req,res)=>{
  let proId = req.params.id 
  productHelpers.deleteProduct(proId).then((response)=>{
    res.redirect('/admin/')
  })
})

// Edit Product get method
router.get('/edit-product/:id',async(req,res)=>{
  let product = await productHelpers.getProductDetails(req.params.id)
  console.log(product);
  res.render('admin/edit-product',{product})
})

// ********* edit product post method
router.post('/edit-product/:id', async (req, res) => {
  try {
    let insertedId = req.params.id;
    await productHelpers.updateProduct(req.params.id, req.body);

    if (req.files && req.files.image) {
      let image = req.files.image;
      image.mv('./public/product-image/' + insertedId + '.jpg', (err) => {
        if (err) {
          console.log(err);
        }
      });
    }
    res.redirect('/admin');
  } catch (error) {
    console.log(error);
    res.status(500).send("Error occurred while editing the product");
  }
});


// Admin Login  get method
router.get("/adminLogin",(req,res)=>{
  if(req.session.admin){
    res.redirect('/admin')
  }else{
    res.render('admin/login', {'loginErr':req.session.adminloginErr})
    req.session.adminloginErr= false
  }
})

// router.post('/adminLogin',(req, res)=>{
//   adminHelpers.doLogin(req.body).then((response)=>{
//    if(response.status){
//      req.session.admin= response.admin
//      req.session.admin.loggedIn= true
//      res.render('admin/dashboard')
//    }else{
//      req.session.adminloginErr= "Invalid username or password"
//      res.redirect('/admin/adminLogin' )
//    }
//   })
// })
router.post('/adminLogin', (req, res) => {
  adminHelpers.doLogin(req.body)
    .then((response) => {
      if (response.status) {
        req.session.admin = response.admin;
        req.session.admin.loggedIn = true;
        res.render('admin/dashboard');
      } else {
        req.session.adminloginErr = "Invalid username or password";
        res.redirect('/admin/adminLogin');
      }
    })
    .catch((error) => {
      console.log(error);
      req.session.adminloginErr = "An error occurred while logging in";
      res.redirect('/admin/adminLogin');
    });
});


// Admin logout get method ************//
router.get('/adminLogout', (req,res)=>{
  // req.session.admin = null
  req.session.destroy();
  res.redirect('/admin/adminLogin')
})

router.get('/user-data',verifyLogin,async(req,res)=>{
  let users = await adminHelpers.getAllUsers(req.session)
  res.render('admin/all-users', {admin:true, users})
})

// block and unblock user methods **************
router.get('/block-user/:id',verifyLogin,(req,res)=>{

  let userId = req.params.id
  adminHelpers.blockUser(userId).then(()=>{
  res.redirect('/admin/user-data')
  })
})

router.get('/unblock-user/:id',verifyLogin,(req,res)=>{
  let userId = req.params.id
  adminHelpers.unBlockUser(userId).then(()=>{
  res.redirect('/admin/user-data')
  })
})

// Category management get methods **********

router.get('/hide-category/:id',verifyLogin,(req,res)=>{
  let catId = req.params.id;
  categoryHelpers.hideCategory(catId).then(()=>{
    res.redirect('/admin/view-category')
  })
})

router.get('/show-category/:id',verifyLogin,(req,res)=>{
  let catId = req.params.id;
  categoryHelpers.showCategory(catId).then(()=>{
    res.redirect('/admin/view-category')
  })
})


router.get('/view-category',verifyLogin, function(req, res, next) {
  categoryHelpers.getAllCategory().then((category)=>{
    res.render('admin/view-category',{admin:true,category})
  })
});

router.get('/add-category',verifyLogin, function(req,res){
  res.render('admin/add-category',{"catError":req.session.catError})
  req.session.catError=false;

})
// router.post('/add-category',(req,res)=>{
//   console.log(req.body);
//   console.log(req.files.Image);

//   categoryHelpers.addCategory(req.body,(insertedId)=>{
//     let image= req.files.Image;
//     image.mv('./public/category-image/'+insertedId+'.jpg',(err)=>{
//       if(!err){
//         res.render("admin/add-category")
//       }else{
//         console.log(err);
//       }
//     })
   
//   });
// })


// Category management post methods **************
router.post('/add-category',verifyLogin, (req, res) => {

  categoryHelpers.addCategory(req.body).then((data) => {
      if(data){
        console.log(data);
        let image= req.files.Image;
    image.mv('./public/category-image/' + insertedId + '.jpg', (err) => {
      if (!err) {
        res.render("admin/view-category");
      } else {
        console.log(err);
      }
    });
  }else{
       req.session.catError = "Category already exists"
       res.redirect('/admin/add-category')
  }
  });
});


//   Delete category get methods **************
router.get('/delete-category/:id',verifyLogin,(req,res)=>{
  let catId = req.params.id 
  categoryHelpers.deleteCategory(catId).then((response)=>{
    res.redirect('/admin/')
  })
})



router.get('/edit-category/:id',async(req,res)=>{
  
  let category = await categoryHelpers.getCategoryDetails(req.params.id)
  console.log(category);
  res.render('admin/edit-category',{category})
})

// router.post('/edit-category/:id', (req,res)=>{
//    let insertedId= req.params.id
//   categoryHelpers.updateCategory(req.params.id, req.body).then(()=>{
//     res.redirect('/admin')
//     if (req.files.image){
//       let image = req.files.image
//       image.mv('./public/category-image/'+insertedId+'.jpg')
        
//     }
//    })
// })


// edit category post methods *************
router.post('/edit-category/:id', async (req, res) => {
  try {
    let insertedId = req.params.id;
    await categoryHelpers.updateCategory(req.params.id, req.body);

    if (req.files && req.files.image) {
      let image = req.files.image;
      image.mv('./public/category-image/' + insertedId + '.jpg', (err) => {
        if (err) {
          console.log(err);
        }
      });
    }
    res.redirect('/admin');
  } catch (error) {
    console.log(error);
    res.status(500).send("Error occurred while editing the category");
  }
});



module.exports = router;









