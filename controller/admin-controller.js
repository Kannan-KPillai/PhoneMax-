var express = require('express');
var router = express.Router();
var productHelpers= require('../helpers/product-helpers')
const adminHelpers = require('../helpers/admin-helpers')
var categoryHelpers = require('../helpers/category-helpers')


//*********** AdminLogin (get method) controller */
 function adminLoginGet(req,res){
    if(req.session.admin){
      res.redirect('/admin')
    }else{
      res.render('admin/login', {'loginErr':req.session.adminloginErr})
      req.session.adminloginErr= false
    }
  }

//*********** Admin login (POst method) controller *************/

  function adminLoginPost(req, res) {
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
  }


  //********* Admin logout (get method) controller **********/\

   function AdminLogoutGet(req,res){
    req.session.destroy();
    res.redirect('/admin/adminLogin')
  }















module.exports={adminLoginGet,adminLoginPost,AdminLogoutGet}