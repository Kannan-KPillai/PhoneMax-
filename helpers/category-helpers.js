var db= require('../config/connection');
var collection= require('../config/collections');
const { response } = require('../app');
var objectId = require('mongodb').ObjectId
module.exports={

    addCategory:(category)=>{
        return new Promise(async(resolve,reject)=>{
            let catExist  = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({Category:category.Category})

            if(!catExist){
                db.get().collection(collection.CATEGORY_COLLECTION).insertOne(category)
                console.log(data.Category)

                   resolve(data);
            }else{
                let data = false;
                resolve(data)
            }
        })
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
    updateCategory:(catId, catDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION)
            .updateOne({_id:objectId(catId)}, {
                $set:{
                    name:catDetails.name,
                    description:catDetails.description,
                    price:catDetails.price,
                    category:catDetails.category
                }
            }).then((response)=>{
                resolve()
            })
        })
    }
}