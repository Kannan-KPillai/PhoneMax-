var express = require('express');
var router = express.Router();
var productHelpers= require('../helpers/product-helpers')
const adminHelpers = require('../helpers/admin-helpers')
var categoryHelpers = require('../helpers/category-helpers')
var couponHelpers= require('../helpers/coupon-helpers')
const multer = require('multer');
const upload = multer({ dest:'public/images'});
const path = require("path");
const fs = require("fs");

const { adminLoginGet, adminLoginPost, AdminLogoutGet, }= require('../controller/admin-controller');
const { log } = require('console');

const verifyLogin=(req,res,next)=>{
  if(req.session.admin && req.session.admin.loggedIn){
    next()
  }else{
    res.redirect('/admin/adminLogin')
  }
}
/* GET users listing. */
router.get('/',verifyLogin, function(req, res, next) {
  let val =Number(req.query.p)
  productHelpers.AllProductsPagination(val).then((products)=>{
    res.render('admin/view-products',{admin:true,products})
  })
});

//************ home page(view-products )post  */
router.post('/',verifyLogin,(req, res, next)=> {
  const admin = req.session.admin;
  let searchq = String(req.body.search);
  productHelpers
    .searchProducts(searchq)
    .then((products) => {
      res.render('admin/view-products', { products, admin });
    })
    .catch((err) => {
      console.log(err);
      res.render('admin/view-products', { err, admin });
    });
  })

// ********* GET add-products listing **************//
router.get('/add-product',verifyLogin,async function(req,res){
  let admin= req.session.admin
  let category= await categoryHelpers.getAllCategory();
  res.render('admin/add-product',{category})
})




// ********* Product add edit and delete *********** //
router.post("/add-product", upload.array("Image", 4), async (req, res) => {
  console.log(req.files)
  
 const{
   name,
   category,   
   price,
   description 
   
} = req.body;  
console.log(req.body)
console.log(req.file)
  const photos=req.files.map((file)=>{
     const oldPath = `${file.path}`;
     const newPath = `${file.path}.png`;
     if(fs.existsSync(oldPath)){
       fs.rename(oldPath,newPath,function(err){
         if(err)throw err;
         console.log('file renamed')
       })
     }else{
       console.log(('not renamed'));
     }
     return {
       // id:  path.basename(newPath),
       title: file.originalname,     
        fileName: newPath.replace(/public/gi,"")
       //  filepath: file.path.replace(/views/gi,"")
     };
   })
   console.log(photos)
 productHelpers.addProduct({name:name,category:category,price:price,description:description,photos:photos}, (id) => {
   req.session.admin.loggedIn=true
   res.redirect('/admin')
 
 })
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
router.post("/edit-product/:id",verifyLogin, upload.array("Image", 4), (req, res) => {
  const { name, category, price, description } = req.body;
  const photos = req.files.map((file) => {
    const oldPath = `${file.path}`;
    const newPath = `${file.path}.png`;
    if (fs.existsSync(oldPath)) {
      fs.rename(oldPath, newPath, function (err) {
        if (err) throw err;
      });
    } else {
    }
    return {
      id: path.basename(newPath),
      title: file.originalname,
      fileName: newPath.replace(/public/gi,"")
    };
  });
  // let caName = name.toUpperCase();

  productHelpers
    .updateProduct(req.params.id, {
      name: name,
      category: category,
      price: price,
      description: description,
      photos: photos,
    })
    .then(() => {
      res.redirect("/admin/adminLogin");
    });
});

//*************  Admin Login  get method **********
router.get("/adminLogin",adminLoginGet)

//******  ADmin login post method *********/

router.post('/adminLogin',adminLoginPost);


// Admin logout get method ************//
router.get('/adminLogout',AdminLogoutGet)



router.get('/user-data',verifyLogin,async(req,res)=>{
   let val =Number(req.query.p)
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

//*********** Category management get methods **********//
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
  let val =Number(req.query.p)
  categoryHelpers.getAllCategory().then((category)=>{
    res.render('admin/view-category',{admin:true,category})
  })
});

router.get('/add-category',verifyLogin, function(req,res){
  res.render('admin/add-category',{"catError":req.session.catError})
  req.session.catError=false;

})



// Category management post methods **************
router.post('/add-category',verifyLogin,upload.array('Image',1),async(req, res) => {
  const{
    Category,  
    offer,
 } = req.body;
 console.log(req.body)
 console.log(req.files);
   const photos=req.files.map((file)=>{
      const oldPath = `${file.path}`;
      const newPath = `${file.path}.png`;
      if(fs.existsSync(oldPath)){
        fs.rename(oldPath,newPath,function(err){
          if(err)throw err;
        })
      }else{
        console.log(('not renamed'));
      }
      return {
        title: file.originalname,        
         fileName: newPath.replace(/public/gi,"")
      };
    })
    console.log(photos)
  categoryHelpers.addCategory({category:Category,offer:offer,photos:photos}).then((data)=>{
   if(data)
   { 
     res.redirect('/admin/view-category');
   }
   else{
     req.session.catError = "Category Already Exist";
     res.redirect('/admin/add-category')
   }  
   })
  })


//   Delete category get methods **************//
router.get('/delete-category/:id',verifyLogin,(req,res)=>{
  let catId = req.params.id 
  categoryHelpers.deleteCategory(catId).then((response)=>{
    res.redirect('/admin/')
  })
})


//************ edit-category get method *******//
router.get('/edit-category/:id',async(req,res)=>{
  
  let category = await categoryHelpers.getCategoryDetails(req.params.id)
  console.log(category);
  res.render('admin/edit-category',{category,admin:true})
})

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
    res.redirect('/admin/view-category');
  } catch (error) {
    console.log(error);
    res.status(500).send("Error occurred while editing the category");
  }
});



//*********view-orders */

router.get('/view-orders',async(req,res)=>{
  let orders = await adminHelpers.getAllUsersOrders()
  res.render('admin/view-orders',{admin:true,orders})
})

router.get("/status-change", async (req, res) => {
  let id = req.query.id;
  let status = req.query.st
  adminHelpers.cancelOrder(id,status);
  adminHelpers.returnOrder(id,status);
  res.redirect("/admin/view-orders");
});



//********** banner management get method ****/
router.get('/banners', async (req, res) => {
  let banners = await adminHelpers.getBanners();
  res.render('admin/banners', { admin: true, banners });
});

//******* add banner get method ****/
router.get('/addBanner', (req, res) => {
  res.render('admin/add-banner');
});

//********* banner management post ******/
router.post('/addBanner', (req, res) => {
  upload.array('Image')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred during file upload
      console.log(err);
      res.redirect('/admin/addBanner');
    } else if (err) {
      // An unknown error occurred during file upload
      console.log(err);
      res.redirect('/admin/addBanner');
    } else {
      if (!req.files || req.files.length === 0) {
        // Image file is not selected
        console.log('No image selected');
        res.redirect('/admin/addBanner');
        return;
      }

      const photos = req.files.map((file) => {
        const oldPath = file.path;
        const newPath = `${file.path}.png`;
        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
          console.log('File renamed');
        } else {
          console.log('File not renamed');
        }
        return {
          title: file.originalname,
          fileName: newPath.replace(/public/gi, ''),
        };
      });

      try {
        const insertedId = await adminHelpers.addBanner({ photos: photos });
        req.session.admin.loggedIn = true;
        res.redirect('/admin/addBanner');
      } catch (error) {
        console.log(error);
        res.redirect('/admin/addBanner');
      }
    }
  });
})

//*********** add-banner get **********/

router.get('/add-banner',(req,res)=>{
  res.render('admin/add-banner')
})

//**********delete-banner get ********/
router.get('/delete-banner/:id',verifyLogin, (req, res) => {
  let bannerId = req.params.id;
  adminHelpers.deleteBanner(bannerId).then((response) => {
    res.redirect('/admin/banners');
  });
});


//******************dashboard *************

router.get('/dashboard',verifyLogin,async(req,res)=>{
  let orders = await adminHelpers.getAllLatestOrders()
  let users = await adminHelpers.getAllLatestUsers()
  let totalUsers = await adminHelpers.totalUser() 
  let totalProducts = await adminHelpers.totalProduct()
  let totalAmount  = await adminHelpers.totalAmount()
  let paymentCounts = await adminHelpers. paymentMethodCount()
  let totalSelling = await adminHelpers.getSellingProductInEachMonth()
  res.render('admin/dashboard',{admin:true,orders,users,totalUsers,totalProducts,totalAmount,paymentCounts,totalSelling})
})


//*************coupon get method *************/
router.get('/view-coupon',verifyLogin,(req,res)=>{
  let admin = req.session.admin
  couponHelpers.getCoupons().then((response) => {
    res.render("admin/view-coupon", { response,admin });
  });
}),

//*********** add coupon get method ************/
router.get('/add-coupon',verifyLogin,(req,res)=>{
  let admin = req.session.admin
    res.render("admin/add-coupon",{admin});
  }),


  //************add coupon post method ***********/
  router.post('/add-coupon',verifyLogin,(req,res)=>{
    req.body.couponCode = req.body.couponCode.toUpperCase()
    req.body.discount = parseInt(req.body.discount)
    req.body.maxPurchase = parseInt(req.body.maxPurchase)

    couponHelpers.addcoupon(req.body).then((response) => {
      res.json({ response });
    })
  });
   
   
  //**************** edit-coupon get method ******/
  router.get('/edit-coupon/:id',verifyLogin,(req,res)=>{
    let id = req.params.id;
      couponHelpers.getOneCoupon(id).then((coupon)=>{
        res.render('admin/edit-coupon', {coupon})
      })
    })

    //************ edit-coupon post method*********** */
    router.post('/edit-coupon',(req,res)=>{
      let couponCode = req.body.couponCode.toUpperCase()
      let discount = parseInt(req.body.discount)
      let maxPurchase = parseInt(req.body.maxPurchase)
      let id = req.body.id
  
      let data = {
        couponCode: couponCode,
        expiryDate: req.body.expiryDate,
        discount: discount,
        maxPurchase: maxPurchase
      }
      couponHelpers.editCoupon(id,data).then((response) => {
        res.json({ response });
      });
    })

    //************delete coupon post method *************/
    router.post('/delete-coupon',verifyLogin,(req,res)=>{
      let id = req.body.id
      console.log(req.body)
      couponHelpers.deleteCoupon(id).then((response)=>{
        res.json({response})
  })
  })

  // //************offers get method ************//
  router.get('/offers',verifyLogin,async(req, res) => {
    let admin = req.session.admin
   let category= await categoryHelpers.getAllCategory()
    res.render('admin/offers',{admin:true,category});
    
  })
  
  //**************offers post method ****************/
// router.post('/offers/:id', async (req, res) => {
//   let catName = req.params.category
//   let offerPer = req.body.offerPercentage
//   await productHelpers.findProCat(catName, offerPer).then((response)=> {
//     res.redirect('/admin/offers')
//   })
// })
router.post('/offers/:id',(req, res) => {
  try {
    console.log(req.body)
    const catName = req.params.id;
    const offerPer = req.body.offerPercentage;
    console.log(offerPer + "##############");
    productHelpers.findProCat(catName, offerPer);
    res.redirect('/admin/offers');
  } catch (error) {
    console.error(error);
    res.redirect('/admin/error');
  }
});












module.exports = router;









