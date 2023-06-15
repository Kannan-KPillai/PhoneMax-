var db= require('../config/connection');
var collection= require('../config/collections')
const bcrypt = require('bcrypt')
const objectId=require('mongodb').ObjectId;
const { ObjectId }= require('mongodb');
const {use} = require('../routes/admin');
module.exports={

doLogin:(adminData)=>{
    return new Promise(async(resolve,reject)=>{
        let loginStatus= false;
        let response={};
        let admin=await db.get().collection(collection.ADMIN_COLLECTION).findOne({Email:adminData.Email})
        if(admin){
            bcrypt.compare(adminData.Password,admin.Password).then((status)=>{
                if(status){
                    console.log("login success");
                    response.admin=admin
                    response.status= true
                    resolve(response)
                }else{
                    console.log("login failed");
                    resolve({status:false})
                }
            })
        }else{
            console.log('login failed');
            resolve({status:false})
        }
    })
},
getAllUsers:(user)=>{
    return new Promise(async (resolve, reject)=>{
        let users = await db.get().collection(collection.USER_COLLECTION).find({}).toArray()
        resolve(users)
    })
},
blockUser:(userId)=>{
    return new Promise(async(resolve,reject)=>{
       await db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},{$set:{isBlocked:true}},(err,res)=>{
        if(err){
          console.log("error :"+err)
          res.status(500).send("Error blocking")
      }else{
          console.log('User Blocked')
          resolve("success")
      }
      })
    })
  },
  unBlockUser:(userId)=>{
    return new Promise(async(resolve,reject)=>{
       await db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},{$set:{isBlocked:false}},(err,res)=>{
        if(err){
          console.log("error :"+err)
          res.status(500).send("Error blocking")
      }else{
          console.log('User Unblocked')
          resolve("success")
      }
      })
    })
  },

  AllProductsPagination:(val)=>{
    return new Promise(async(resolve,reject)=>{
      console.log(val)
      let products = await db.get()
      .collection(collection.PRODUCT_COLLECTION)
      .find()
      .skip((val - 1)*5)
      .limit(5)
      .toArray()
      resolve(products)
    })
  },

  searchAllUsers:(search)=>{
    return new Promise(async (resolve,reject)=>{
      let users = await db.get().collection(collection.USER_COLLECTION)
      .find(   {$or: [
        { username: { $regex: new RegExp('^' + search + '.*', 'i') } },
        { email: { $regex: new RegExp('^' + search + '.*', 'i') } },
        { number: { $regex: new RegExp('^' + search + '.*', 'i') } },
        // Add more fields as needed
      ]})
      .toArray()
      if(users.length){
        resolve(users)
        
      } else {
        let sErr = "Sorry! No such item found" 
        reject(sErr)
      }
     
    })
  },

  getAllUsersOrders:()=>{
        return new Promise(async(resolve,reject)=>{
            let usersOrders=await db.get().collection(collection.ORDER_COLLECTION).find({}).toArray()
            resolve(usersOrders)
        })
      },

    delivered:async (orderId)=>{
        await new Promise(async (resolve, reject) => {
          await db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderId) }, { $set: { 'status': 'Delivered' } })
        })
        resolve()
      },

      cancelOrder:(orderId,status)=>{
        new Promise(async (resolve, reject) => {
         await db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, { $set: { 'status': status } })
         resolve()
       })
    },

  addBanner: (banner) => {
    return new Promise(async (resolve, reject) => {
      try {
        let data = await db.get().collection(collection.BANNER_COLLECTION).insertOne(banner);
        resolve(data.insertedId);
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
  
    // deleteBanner:()=>{
    //   return new Promise((resolve,reject)=>{
    //     let remove = db.get().collection(collection.BANNER_COLLECTION).deleteOne()
    //     resolve(remove)
    //   })
    // },

    deleteBanner: (bannerId) => {
      return new Promise((resolve, reject) => {
        db.get()
          .collection(collection.BANNER_COLLECTION)
          .deleteOne({ _id: ObjectId(bannerId) })
          .then((response) => {
            resolve(response);
          });
      })
    },
    
    getOrderProducts:(orderId)=>{
      return new Promise(async(resolve,reject)=>{
        let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
          {
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
              name:1,
              quantity:1,
              product:{$arrayElemAt:['$product',0]}
            }
          }
        ]).toArray()
        resolve(orderItems)
      })
    },

    getAllLatestUsers: (user) => {
      return new Promise(async (resolve, reject) => {
        let users = await db
          .get()
          .collection(collection.USER_COLLECTION)
          .find({})
          .sort({ createdAt: -1 }) 
          .limit(6)
          .toArray();
        resolve(users);
      });
    },
    
    getAllLatestOrders: () => {
      return new Promise(async (resolve, reject) => {
        let usersOrders = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .find({})
          .sort({ createdAt: -1 }) 
          .limit(6) 
          .toArray();
        resolve(usersOrders);
      });
    },

    totalUser:()=>{
      return new Promise(async(resolve,reject)=>{
        db.get().collection(collection.USER_COLLECTION).countDocuments({}, (err, count) => {
          if (err) {
            reject(err);
          }
          // Access the total count of products
          resolve(count);
        });
        
      })
    },

    totalProduct:()=>{
      return new Promise(async(resolve,reject)=>{
        db.get().collection(collection.PRODUCT_COLLECTION).countDocuments({}, (err, count) => {
          if (err) {
            reject(err);
          }
          // Access the total count of products
          resolve(count);
        });
        
      })
    },

    totalAmount:()=>{
      return new Promise(async(resolve,reject)=>{
        db.get().collection(collection.ORDER_COLLECTION).aggregate([
          {
            $group: {
              _id: null,
              totalAmount: { $sum: "$totalAmount" },
              totalOrders: { $sum: 1 }
            }
          }
        ]).toArray((err, result) => {
          if (err) {
            reject(err);
          }
          // Access the total amount and total orders from the result
          const totalAmount = result[0].totalAmount;
          const totalOrders = result[0].totalOrders;
          resolve({ totalAmount, totalOrders });
        });
        
    })
  },

  paymentMethodCount: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const codCount = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .countDocuments({ paymentMethod: "COD" });
  
        const onlineCount = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .countDocuments({ paymentMethod: "ONLINE" });
  
        resolve({ codCount, onlineCount });
      } catch (error) {
        reject(error);
      }
    });
  },
  
  getSellingProductInEachMonth: () => {
    return new Promise(async (resolve, reject) => {
      await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $group: {
            _id: { $month: { $toDate: "$date" } },
            totalAmount: { $sum: "$totalAmount" }
          }
        }
      ]).toArray((err, result) => {
        if (err) {
          console.error(err);
          reject(err);
          return;
        }
  
        const totalAmounts = result.map(item => item.totalAmount);
        resolve(totalAmounts);
      });
    });
  }

}