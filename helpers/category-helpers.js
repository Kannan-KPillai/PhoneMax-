var db= require('../config/connection');
var collection= require('../config/collections');
const { response } = require('../app');
var objectId = require('mongodb').ObjectId
module.exports={

    addCategory: (category) => {
        return new Promise(async (resolve, reject) => {
        //   let catExist = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ Category: category.category });
          let catExist = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ Category: { $regex: new RegExp('^' + category.category + '$', 'i') } });
          if (!catExist) {
            let data = await db.get().collection(collection.CATEGORY_COLLECTION).insertOne(category);
            console.log(data.Category);
            resolve(data);
          } else {
            let data = false;
            resolve(data);
          }
        });
      },
      
    getAllCategory:()=>{
        return new Promise(async(resolve,reject)=>{
            let category=await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(category)
        })
    },
    hideCategory:(catId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).updateOne({_id:objectId(catId)},{$set:{isHide:true}},(err,res)=>{
                if(err){
                    console.log("error :"+err)
                    res.status(500).send("Error Hiding")
                }else{
                    console.log('Category Hided')
                    resolve("success")
                }
            })
         })
    },
    showCategory:(catId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).updateOne({_id:objectId(catId)},{$set:{isHide:false}},(err,res)=>{
            if(err){
                console.log("error :"+err)
                res.status(500).send("Error Hiding")
            }else{
                console.log('Category Unhided')
                resolve("success")
            }
        })
    })
    },

    getCategoryDetails:(catId)=>{
        return new Promise((resolve, reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).findOne({_id:objectId(catId)}).then((category)=>{
                resolve(category)
            })
        })
    }, 
    updateCategory:(catId,catDetails)=>{
        return new Promise(async(resolve,reject)=>{
      let catExist= await db.get().collection(collection.CATEGORY_COLLECTION).findOne({Category:catDetails.Category})
            if(!catExist){
                db.get().collection(collection.CATEGORY_COLLECTION).updateOne({_id:objectId(catId)},{
                $set:{
                    category:catDetails.Category,
                    photos:catDetails.photos,
                    offer:catDetails.offer,
                   
                }
            }).then((response)=>{
                resolve(response)
            })
        }else{
            let response=false;
            resolve(response)
        }
                
            
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









}


