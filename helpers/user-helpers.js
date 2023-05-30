var db= require('../config/connection');
var collection= require('../config/collections')
const bcrypt = require('bcrypt')
const alert = require('alert');
const { ObjectId } = require('mongodb');
module.exports={
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
          let userExist = await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
          console.log(userExist);
          if (!userData.Password || userData.Password.trim() === '') {
            reject(new Error('Password field is required'));
            return;
          }
    
          try {
            userData.Password = await bcrypt.hash(userData.Password, 10);
            const data = await db.get().collection(collection.USER_COLLECTION).insertOne(userData);
            resolve(data);
          } catch (err) {
            reject(err);
          }
        });
        },
        doLogin:(userData)=>{
            return new Promise(async(resolve,reject)=>{
                let loginStatus= false;
                let response={};
                let user=await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
                
                if(user){
                  if(!user.isBlocked){
                    bcrypt.compare(userData.Password,user.Password).then((status)=>{

                        if(status){
                            console.log("login success");
                            response.user=user
                            response.status= true
                            resolve(response)
                        }else{
                            console.log("login failed");
                            resolve({status:false})
                        }
                    })
                }else{
                    console.log('You are Blocked');
                    resolve(1)
                }
              }else{
                console.log("Loginn Failed 2")
                resolve({status:false}) 
              }
            })
        },



  doMailVarify: (userEmail) => {
    return new Promise(async (resolve, reject) => {
      await db.get().collection(collection.USER_COLLECTION).updateOne({ email: userEmail }, { $set: { isBlocked: true } }, (err, result) => {
        if (err) {
          console.log("error :" + err)
          res.status(500).send("Error blocking")
        } else {

          resolve()
        }
      })
    })

  },

  doMailVarifySuccess: (userOtp) => {
    return new Promise(async (resolve, reject) => {
      await db.get().collection(collection.USER_COLLECTION).updateOne({ otp: userOtp.otp }, { $set: { isBlocked: false } }, (err, result) => {
        if (err) {
          console.log("error :" + err)
          res.status(500).send("Error blocking")
        } else {
          console.log('User Blocked')
          resolve("success")
          alert("Account successfully created")
        }
      })
    })

  },

  doMailCheck: (userOtp) => {

    return new Promise(async (resolve, reject) => {
      let response = {}
      let getOtp = await db.get().collection(collection.USER_COLLECTION).findOne({ otp: userOtp.otp })


      if (getOtp) {

        response.status = true
        resolve(response)
      }
      else {
        response.status = false
        resolve(response)
      }
    })

  },

  insertOtp: (userData, userotp) => {

    return new Promise(async (resolve, reject) => {
      await db.get().collection(collection.USER_COLLECTION).updateOne({ Email: userData.Email }, { $set: { otp: userotp } }, (err, result) => {
        if (err) {
          console.log("error :" + err)
          res.status(500).send("Error blocking")
        } else {
          console.log("otp set cheythu")
          resolve("success")
        }
      })
    })
  },

  addToCart:(proId,userId)=>{
    let proObj={
      item:ObjectId(proId),
      quantity:1
    }
    return new Promise(async(resolve,reject)=>{
      console.log("Hai" + proId);
      console.log(userId);
      let userCart =await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
      if(userCart){
        let proExist = userCart.products.findIndex(product=> product.item == proId)
        console.log(proExist)
        if(proExist != -1){
          db.get().collection(collection.CART_COLLECTION).updateOne({'products.item':ObjectId(proId)},
          {
            $inc:{'products.$.quantity':1}
          }
          ).then(()=>{
            resolve()
          })
        }else{
        db.get().collection(collection.CART_COLLECTION)
        .updateOne({user:ObjectId(userId)},
         { 
            $push:{products:proObj}
        }
        ).then((response)=>{
          resolve()
        })
      }
      }else{
          let cartObj={
            user:ObjectId(userId),
            products:[proObj]
          }
          db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
            resolve()
          })
      }
    })
  },
  
  getCartProducts:(userId)=>{
    return new Promise(async(resolve,reject)=>{
      let cartItems= await db.get().collection(collection.CART_COLLECTION).aggregate([
        {
          $match:{user:ObjectId(userId)}
        },
        {
          $unwind:'$products'
        },{
          $project:{
            item:'$products.item',
            quantity:'$products.quantity' 
          }
        },{
          $lookup:{
            from:collection.PRODUCT_COLLECTION,
            localField:'item',
            foreignField:'_id',
            as:'product'
          }
        }
        // {
        //   $lookup:{
        //     from:collection.PRODUCT_COLLECTION,
        //     let:{prodList:'$products'},
        //     pipeline:[
        //       {
        //         $match:{
        //           $expr:{
        //             $in:['$_id',"$$prodList"]
        //           }
        //         }
        //       }
        //     ],
        //     as:'cartItems'
        //   }
        // }
      ]).toArray()
      console.log(cartItems[0].products)
      resolve(cartItems)
    })
  },

  getCartCount:(userId)=>{
    return new Promise(async(resolve,reject)=>{
      let count =0
      let cart= await db.get().collection(collection.CART_COLLECTION)
      .findOne({user:ObjectId(userId)})
      if(cart){
        count = cart.products.length
      }
      resolve(count)
    })
  }



}