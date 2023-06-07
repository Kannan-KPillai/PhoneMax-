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
      
      let userCart =await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
      if(userCart){
        let proExist = userCart.products.findIndex(product=> product.item == proId)
        console.log(proExist)
        if(proExist != -1){
          db.get().collection(collection.CART_COLLECTION)
          .updateOne({user:ObjectId(userId),'products.item':ObjectId(proId)},
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
        },
        {
          $project:{
            item:1,
            quantity:1,
            product:{$arrayElemAt:['$product',0]}
          }
        }
       
      ]).toArray()
      
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
  },

  changeProductQuantity:(details)=>{
    details.count= parseInt(details.count)
    details.quantity= parseInt(details.quantity)

    return new Promise((resolve,reject)=>{
      if(details.count == -1 && details.quantity == 1){
      db.get().collection(collection.CART_COLLECTION)
      .updateOne({_id:ObjectId(details.cart)},
      {
        $pull:{products:{item:ObjectId(details.product)}}
      }
      ).then((response)=>{
        resolve({removeProduct:true})
      })

    }else{
      db.get().collection(collection.CART_COLLECTION)
      .updateOne({_id:ObjectId(details.cart),'products.item':ObjectId(details.product)},
   {
    $inc:{'products.$.quantity':details.count}
   }   
    ).then((response)=>{
      resolve({status:true})
    })
  }
    })
  },

  removeFromCart:(details)=>{
    details.quantity = parseInt(details.quantity)

    return new Promise((resolve,reject)=>{
      db.get().collection(collection.CART_COLLECTION)
      .updateOne({_id:ObjectId(details.cart)},
      {
        $pull:{products:{item:ObjectId(details.product)}}
      }
      ).then((response)=>{
        resolve(true)
      })
    })
  },

  getTotalAmount:(userId)=>{
    return new Promise(async(resolve,reject)=>{
      let total= await db.get().collection(collection.CART_COLLECTION).aggregate([
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
        },
        {
          $project:{
            item:1,
            quantity:1,
            product:{$arrayElemAt:['$product',0]}
          }
        },
        {
          $project: {
            item: 1,
            quantity: 1,
            product: {
              $mergeObjects: [
                '$product',
                { price: { $toInt: '$product.price' } }
              ]
            }
          }
        },
        {
          $group:{
            _id:null,
            total:{$sum:{$multiply:['$quantity','$product.price']}}
          }
        }
       
      ]).toArray()    
      resolve(total[0].total)
    })
  },

  allProductsPagination:(val)=>{
    return new Promise(async(resolve,reject)=>{
      let products = await db.get()
      .collection(collection.PRODUCT_COLLECTION)
      .find()
      .skip((val - 1)*5)
      .limit(5)
      .toArray()
      resolve(products)
    })
  },

  placeOrder:(order,products,total)=>{
    return new Promise((resolve,reject)=>{
      
      let status = order['payment-method']==='COD'?'placed':'pending'
      let orderObj = {
        deliveryDetails:{
          name:order.fullName,
          mobile:order.mobile,
          address:order.address,
          pincode:order.pincode          
        },
        userId:ObjectId(order.userId),
        paymentMethod:order['payment-method'],
        products:products,
        totalAmount:total,
        status:status
      }
        db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
          db.get().collection(collection.CART_COLLECTION).deleteOne({user:ObjectId(order.userId)})
          resolve()
        })
    }) 
    
  },


  getCartProductList:(userId)=>{
    return new Promise(async(resolve,reject)=>{
      let cart= await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
          resolve(cart.products)
    })
  },


  addNewAddress:(userId,address)=>{
    return new Promise( async (resolve,reject)=>{
      let isAdress = await db.get().collection(collection.USER_COLLECTION).aggregate([{$match:{userId}},{$group:{_id:"$addresses"}}])
      
      if(isAdress){
        db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectId(userId)},{$push:{addresses:address}})
        resolve()
      } else {
        db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectId(userId)},{$set:{addresses:[address]}})
        resolve()
      }
    
    })
  },

  userAddresses:(userId)=>{
    return new Promise(async(resolve,reject)=>{
      let existAddress = await db.get().collection(collection.USER_COLLECTION).findOne({_id:ObjectId(userId)})
      resolve(existAddress)
    })
  },


  getUserOrders:(userId)=>{
    return new Promise(async(resolve,reject)=>{     
      let orders=await db.get().collection(collection.ORDER_COLLECTION).find({userId:ObjectId(userId)}).toArray()     
      resolve(orders)
    })
  },

  getOrderProducts:(orderId)=>{
    return new Promise(async(resolve,reject)=>{
      let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match:{_id:ObjectId(orderId)}
        },{
          $unwind:'$products'
        },{
          $project:{
            item:'products.item',
            quantity:'$products.quantity'
          }  
        },{
          $lookup:{
            from:collection.PRODUCT_COLLECTION,
            localField:'item',
            foreignField:'_id',
            as:'product'
          }
        },
        {
          $project:{
            item:1,
            quantity:1,
            product:{$arrayElemAt:['$product',0]}
          }
        }
      ]).toArray()
      resolve(orderItems)
    })
  }







  
}



