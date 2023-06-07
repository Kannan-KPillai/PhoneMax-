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
    }
}