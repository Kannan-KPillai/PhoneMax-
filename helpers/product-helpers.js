var db= require('../config/connection');
var collection= require('../config/collections');
const { response } = require('../app');
var objectId = require('mongodb').ObjectId
module.exports={

    addProduct:(product,callback)=>{
        db.get().collection('product').insertOne(product).then((data)=>{
            callback(data.insertedId)
        })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    getLatestProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let ltstProducts = await db.get()
            .collection(collection.PRODUCT_COLLECTION)
            .find()
            .sort({_id: -1})  //Sort by _id field in descending order
            .limit(4)   // Limit the result to 8 documents
            .toArray();
            resolve(ltstProducts) 
        })
    },
    deleteProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectId(proId)}).then((response)=>{
                resolve(response)
            })
         })
    },
    getProductDetails:(proId)=>{
        return new Promise((resolve, reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
                resolve(product)
            })
        })
    },
    updateProduct:(proId, proDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION)
            .updateOne({_id:objectId(proId)}, {
                $set:{
                    name:proDetails.name,
                    description:proDetails.description,
                    price:proDetails.price,
                    category:proDetails.category,
                    photos:proDetails.photos,
                }
            }).then((response)=>{
                resolve()
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


      searchProducts:(search)=>{
        return new Promise(async (resolve,reject)=>{
          let products = await db.get().collection(collection.PRODUCT_COLLECTION)
          .find(   {$or: [
            { category: { $regex: new RegExp('^' + search + '.*', 'i') } },
            { name: { $regex: new RegExp('^' + search + '.*', 'i') } },
            { price: { $regex: new RegExp('^' + search + '.*', 'i') } },
            // Add more fields as needed
          ]})
          .toArray()
          if(products.length){
            resolve(products)
            console.log(products)
          } else {
            let sErr = "No such item found" 
            reject(sErr)
          }
         
        })
      },

     
      findProCat: async (catName, offerPer) => {
        try {
          const products = await db.get()
            .collection(collection.PRODUCT_COLLECTION)
            .find({ category: catName })
            .toArray();
      
          const updatedProducts = products.map((product) => {
            product.OfferPrice = product.price - (product.price * offerPer) / 100;
            return product;
          });
      
          return updatedProducts;
        } catch (error) {
          throw error;
        }
      },
      







}
