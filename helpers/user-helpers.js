var db= require('../config/connection');
var collection= require('../config/collections')
const bcrypt = require('bcrypt')
const alert = require('alert');
const{ ObjectId } = require('mongodb');
const Razorpay = require('razorpay');
const { resolve } = require('path');



var instance = new Razorpay({
  key_id: 'rzp_test_6dmeULoXfLlnAO',
  key_secret: 'ZQx2LpBueVUDxYwlzDcfXRHF',
});


module.exports={
  // doSignup: (userData) => {
  //   return new Promise(async (resolve, reject) => {
  //     let userExist = await db
  //       .get()
  //       .collection(collection.USER_COLLECTION)
  //       .findOne({ Email: userData.Email });
  //     if (!userExist) {
  //       resolve(userExist)
  //     } else {
  //       resolve(1);
  //     }
  //   });
  // },
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      let userExist = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ Email: userData.Email });
      let numExist = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ number: userData.number });
        
      if (userExist) {
        resolve(1); // Email already exists
      }  if (numExist) {
        resolve(2); // Number already exists
      } else {
        resolve(null); // Neither email nor number exists
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
                            response.user=user
                            response.status= true
                            resolve(response)
                        }else{
                            resolve({status:false})
                        }
                    })
                }else{
                    resolve(1)
                }
              }else{
                resolve({status:false}) 
              }
              
            })
        },
   doCheckIn:(userData)=>{
    return new Promise(async(resolve,reject)=>{
      let loginStatus= false;
      let response={};
      let user=await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
      
      if(user){
                  
        if(!user.isBlocked){               
          response.user=user
          response.status= true
          resolve(response)    
        }else{
            resolve(1)
        }
    }else{
      resolve({status:false}) 
    }
    
  })

   },
        addUser:(userData) =>{
          return new Promise(async (resolve) => {
              if (!userData.Password || userData.Password.trim() === "") {
                reject(new Error("Password field is required"));
                return;
              }
      
              try {
                userData.Password = await bcrypt.hash(userData.Password, 10);
                const data = await db
                  .get()
                  .collection(collection.USER_COLLECTION)
                  .insertOne(userData);
                resolve(data);
              } catch (err) {
                reject(err);
              }
          })
        },

  doMailVarify: (userEmail) => {
    return new Promise(async (resolve, reject) => {
      await db.get().collection(collection.USER_COLLECTION).updateOne({ email: userEmail }, { $set: { isBlocked: true } }, (err, result) => {
        if (err) {         
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
      let pro = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:ObjectId(proId)})
       proObj.itemName = pro.name
      let userCart =await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
      if(userCart){
        let proExist = userCart.products.findIndex(product=> product.item == proId)
       
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
  checkOffer: (productId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: ObjectId(productId) })
        .then((product) => {
          if (product) {
            const offerPrice = product.offerPrice || null;
            resolve(offerPrice);
          } else {
            resolve(null);
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
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


  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
          // aggregation pipeline stages
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
                  { price: { $toInt: '$product.offerPrice' } }
                ]
              }
            }
          },
          {
            $group:{
              _id:null,
              total:{$sum:{$multiply:['$quantity','$product.offerPrice']}}
            }
          }
        ]).toArray();
  
        if (total.length > 0 && total[0].total) {
          resolve(total[0].total);
        } else {
          resolve(0); // or any default value you want to set
        }
      } catch (error) {
        reject(error);
      }
    });
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
      const currDate = new Date()
      const dateString = currDate.toLocaleDateString()
      let status = order['payment-method']==='COD'?'placed' : 'pending'
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
        status:status,
        pDate:dateString,
        date: new Date()
      }
        db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
          db.get().collection(collection.CART_COLLECTION).deleteOne({user:ObjectId(order.userId)})
          resolve(response.insertedId)
        })
    }) 
    
  },

  cancelOrder:(orderId,status)=>{
    new Promise(async (resolve, reject) => {
     await db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderId) }, { $set: { 'status': status } })
     resolve()
   })
},
   returnOrder:(orderId,status)=>{
     return new Promise(async(resolve,reject)=>{
    await db.get().collection(collection.ORDER_COLLECTION).updateOne({_id: ObjectId(orderId)}, {$set:{'status':status } })
    resolve()
  })
},
  getCartProductList:(userId)=>{
    return new Promise(async(resolve,reject)=>{
      let cart= await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
      if(cart.products){
        resolve(cart.products)
      }else{
        resolve(0)
      }
    })
  },

  userAddresses:(userId)=>{
    return new Promise(async(resolve,reject)=>{
      let existAddress = await db.get().collection(collection.USER_COLLECTION).findOne({_id:ObjectId(userId)})
      resolve(existAddress)
    })
  },

  getUserOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let orders = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .find({ userId: ObjectId(userId) })
          .sort({ _id: -1 }) // Sort by descending order of _id to get the latest orders first
          .toArray();
        resolve(orders);
      } catch (error) {
        reject(error);
      }
    });
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
            quantity:'$products.quantity',
            itemName:'products.itemName'
          }  
        },{
          $lookup:{
            from:collection.PRODUCT_COLLECTION,
            localField:'item',
            foreignField:'_id',
            as:'product'
          }
        },
        // {
        //   $project:{
        //     item:1,
        //     quantity:1,
        //     itemName:1,
        //     product:{$arrayElemAt:['$product',0]}
        //   }
        // }
      ]).toArray()
      resolve(orderItems)
    })
  },
  addNewAddress:(userId,address)=>{  
    return new Promise(async (resolve, reject) => {
      const userAddressCollection = db.get().collection(collection.USER_ADDRESS_COLLECTION);
      const userAddress = {
        userId: userId,
        address: address
      };
      await userAddressCollection.insertOne(userAddress)
    .then(() => {
      resolve();
    })
    .catch((error) => {
      reject(error);
    });
        
     })
  },
  getUserAddress:(userId)=>{
    return new Promise(async(resolve,reject)=>{
      const addresses=await db.get().collection(collection.USER_ADDRESS_COLLECTION).find({userId:userId}).toArray();
     
      if(addresses){
       resolve(addresses)
      }else{
        resolve('empty')
      }
    })
  },
  getOneAddress:(id)=>{
    return new Promise(async(resolve,reject)=>{
      const address = await db.get().collection(collection.USER_ADDRESS_COLLECTION).findOne({_id:ObjectId(id)})
    
      if(address){
       resolve(address)
      }else{
        resolve('empty')
      }
    })
  },
  editAddress: (Id,address) => {
    return new Promise(async (resolve, reject) => {
      try {
        await db.get().collection(collection.USER_ADDRESS_COLLECTION).updateOne(
          { _id: ObjectId(Id) },
          {
            $set: {
              address
            }
          },
          { upsert: false }
        );
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },
  
  deleteAddress:(userId)=>{
    return new Promise(async(resolve,reject)=>{
       db.get().collection(collection.USER_ADDRESS_COLLECTION).deleteOne({_id:ObjectId(userId)}).then((response)=>{
        resolve({removeAddress:true})
      })
    })
  },

 generateRazorpay:(orderId,totalPrice)=>{
  return new Promise((resolve,reject)=>{
   var options = {
         amount: totalPrice*100,  // amount in the smallest currency unit
        currency: "INR",
        receipt: ""+ orderId
       };
       instance.orders.create(options, function(err, order) {
        if(err){
          console.log(err)
        }else{
       resolve(order)
        }
      });
   })
 },

 verifyPayment:(details)=>{
  return new Promise((resolve,reject)=>{
    const crypto = require('crypto');
     let hmac = crypto.createHmac('sha256','ZQx2LpBueVUDxYwlzDcfXRHF')    
     hmac.update(details['payment[razorpay_order_id]'] + '|' + details[ 'payment[razorpay_payment_id]']);
     hmac= hmac.digest('hex') 
     if(hmac ===details['payment[razorpay_signature]']){
      resolve()
     }else{
      reject()
     }
    })
 },

changePaymentStatus: (orderId) => {
  return new Promise((resolve, reject) => {
    try {
      const objectId = new ObjectId(orderId);
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId },
          {
            $set: {
              status: 'placed',
            },
          }
        )
        .then(() => {
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    } catch (error) {
      reject(error);
    }
  });
},

getBanners: () => {
  return new Promise(async (resolve, reject) => {
    try {
      let banners = await db.get().collection(collection.BANNER_COLLECTION).find().toArray();
      resolve(banners);
    } catch (error) {
      reject(error);
    }
  });
},
    
getUserByEmail: async (email) => {
  try {
    const user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: email });
    return user;
  } catch (error) {
    throw error;
  }
},
   
doUpdatePassword:(userId,newPassword)=>{
  return new Promise(async(resolve,reject)=>{
    try{
      const hashedPassword= await bcrypt.hash(newPassword,10)
        console.log(hashedPassword)
      await db.get().collection(collection.USER_COLLECTION)
      .updateOne({_id: ObjectId(userId)}, {$set:{Password:hashedPassword}})
      resolve()
    }catch(error){
      reject(error)
    }
  })
},
checkNumber: (userData) => {
  return new Promise(async (resolve, reject) => {
    let response = {};
    let user = await db
      .get()
      .collection(collection.USER_COLLECTION)
      .findOne({ number: userData.number });

    if (user) {
      if (!user.isBlocked) {
        if (userData.number === user.number) {
          response.user = user;
          response.status = true;
          resolve(response);
        } else {
          resolve({ status: false });
        }
      } else {
        resolve({ status: false });
      }
    } else {
      resolve({ status: false });
    }
  });
},

// replaceOtp:(num,newOtp)=>{
//       return new Promise(async(resolve,reject)=>{
//         let result = await db
//         .get()
//         .collection(collection.USER_COLLECTION)
//         .updateOne(
//           { number: num },
//           { $set: { otp: newOtp } }
//         )
//         resolve(result)
//       })
// },
replaceOtp: (num, newOtp) => {
  return new Promise(async (resolve, reject) => {
    let result = await db
      .get()
      .collection(collection.USER_COLLECTION)
      .updateOne({ number: num},{$set:{ otp: newOtp }});
    resolve(result);
  });
},

findOtp: (num) => {
  return new Promise(async (resolve, reject) => {
    let otp = await db.get().collection(collection.USER_COLLECTION).findOne({ number: num });
    resolve(otp);
  });
},
//coupon management //
// addCouponUser:(userId,coupon)=>{
//   return new Promise(async(resolve,reject)=>{
//      db.get().collection(collection.USER_COLLECTION).updateOne(
//       { _id: ObjectId(userId) },
//       { $push: { couponCodes: coupon } }
//     ).then(()=>{
//       resolve()
//     })

//     })
//  },
addCouponUser: (userId, coupon) => {
  return new Promise(async (resolve, reject) => {
    let coupons = await db.get().collection(collection.USER_COLLECTION)
    .aggregate([
      { $match: { _id: ObjectId (userId) } },
      { $unwind: "$couponCodes" },
      { $match: { "couponCodes.coupon": coupon } },
    ]).toArray();
    if (coupons.length) {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: ObjectId(userId), "couponCodes.coupon": coupon },
          { $inc: { "couponCodes.$.count": 1 } }
        );
    } else {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: ObjectId(userId) },
          { $push: { couponCodes: { coupon, count: 1 } } }
        )
        .then(() => {
          resolve();
        });
    }
  });
},

 deleteCoupon:(userId,usedCoupon) => {
  return new Promise(async (resolve, reject) => {
    try {
      const userCollection = db.get().collection(collection.USER_COLLECTION);
      const user = await userCollection.findOne({ _id: ObjectId(userId) });
      const couponCodes = user.couponCodes;
      
      // Find the index of the first occurrence of the coupon code
      const index = couponCodes.indexOf(usedCoupon);
      
      // Remove the coupon code from the array at the specified index
      if (index > -1) {
        couponCodes.splice(index, 1);
      }
      
      // Update the user document with the modified couponCodes array
      await userCollection.updateOne(
        { _id: ObjectId(userId) },
        { $set: { couponCodes: couponCodes } }
      );
      resolve();
    } catch (error) {
      reject(error);
    }
  });
 },

 addAmountWallet : (amount, userId) => {
  db.get()
    .collection(collection.USER_COLLECTION)
    .updateOne({ _id: ObjectId(userId) }, { $inc: { walletAmount: amount } });
},
deductAmountWallet : (amount, userId) => {
  db.get()
    .collection(collection.USER_COLLECTION)
    .updateOne({ _id: ObjectId(userId) }, { $set: { walletAmount: amount } });
},
 
 
 walletCredit:(amount,userId)=>{
  const credit = {
    amount,
    date: new Date()
  }
  db.get().collection(collection.USER_COLLECTION).
  updateOne({_id:ObjectId(userId)}, {$push:{walletCredit:credit}});
 },

 walletDebit:(amount,userId)=>{
  const debit= {
    amount,
    date: new Date()
  }
  db.get().collection(collection.USER_COLLECTION).
  updateOne({_id:ObjectId(userId)}, {$push:{walletDebit:debit}});
 },

getOrder: (id) => {
  return new Promise(async (resolve) => {
    let order = await db
      .get()
      .collection(collection.ORDER_COLLECTION)
      .findOne({ _id: ObjectId(id) });
    resolve(order);
  });
},
userDetails:(userId)=>{
  return new Promise( async (resolve,reject)=>{
    let user = await db.get().collection(collection.USER_COLLECTION).findOne({_id:ObjectId(userId)})
    resolve(user);
  })
},
addRefWallet: (refCode) => {
  return new Promise((resolve, reject) => {
    db.get().collection(collection.USER_COLLECTION).updateOne(
      { referralCode: refCode },
      { $inc: { walletAmount: 100 } }, // Increment the wallet field by 100
      (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      }
    );
  });
},







}





    




