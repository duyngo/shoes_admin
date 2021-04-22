import FirebaseHelper from '../firebase';
import { algoliaSearchPromos } from './promotionAlgolia'

const db = FirebaseHelper.getDatabase();
const storage = FirebaseHelper.getStorage();

const PROMOTION_CODES_COLLECTION = 'promotionCodes';
const ORDER_COLLECTION = 'orders';
const USER_COLLECTION = 'users';

export const getPromotions = async (displayDeleted = false ) => {

    try{
        
        let myQuery;
                       
        if(displayDeleted){
            myQuery = db.collection(PROMOTION_CODES_COLLECTION).orderBy("dateAdded","desc");    
        }else{
            myQuery = db.collection(PROMOTION_CODES_COLLECTION).orderBy("dateAdded","desc").where("isDeleted","==",false)  
        }

        let snapshots = await myQuery.get();

        let promotions = [];

        for (const promotion of snapshots.docs) {
            promotions.push({...promotion.data()})
        }

        return promotions;

    }catch(error){
        console.log(error)
    }

}

export const searchPromos = async (keyword) => {

    try{
        let promos = [];
        const algoliaPromos = await algoliaSearchPromos(keyword)

        for(const promo of algoliaPromos){
      
            const {
                code,
                description,
                eligibilities,
                status,
                title,
                objectID,
                dateAdded,
                isAdjustmentInPercent,
                isDeleted,
                isFeatured,
                priceAdjustment,
                uid,
                imageUrl
            } = promo;

            if(promo.isDeleted===false){
                promos.push({
                    code,
                    description,
                    eligibilities,
                    status,
                    title,
                    objectID,
                    dateAdded,
                    isAdjustmentInPercent,
                    isDeleted,
                    isFeatured,
                    priceAdjustment,
                    uid,
                    imageUrl
                })
            }
        }

        return promos;

    }catch(error){
        console.log(`[ERROR] ${error}`)
    }

}

export const savePromotion = async (promotion, file ) => {

    let doc = null;
    let uid = promotion.uid

    if(uid){
        doc = db.collection(PROMOTION_CODES_COLLECTION).doc(promotion.uid)
    }else{
        doc = db.collection(PROMOTION_CODES_COLLECTION).doc()
        uid = doc.id
    }
    
    await doc.set({
        ...promotion, 
        uid
    },{ merge : true })
    
    if(file){
        let url = await uploadImage( doc, file );
        await doc.update({
            imageUrl : url
        })
    }

}

export const checkDuplicatePromotionCode = async ( promoCode ) => {

    return new Promise ( async ( resolve ) => {

        try{

            let codeSnapshots = await db.collection(PROMOTION_CODES_COLLECTION).where('code','==',promoCode).where('isDeleted','==',false).get();

            let code = "success";
            let message = "";

            if(codeSnapshots.docs.length>0){
                code = "error";
                message = "Sorry but this code is already used."
            }

            resolve({
                code : code,
                message : message
            })

        }catch(error){
            console.log(`[ERROR] ${error}`)
            throw(error)
        }
    })

}

export const deletePromotion = async ( uid ) => {

    let doc = db.collection(PROMOTION_CODES_COLLECTION).doc(uid);

    doc.update({
        isDeleted : true
    })

}

const uploadImage = ( docRef, file ) => {
    if( file !== null && file !== undefined ){
        return new Promise( resolve => {
            let path = `promotionCodes/${docRef.id}/`;
    
            storage.ref(`${path}${file.name}`).put(file)
            .on('state_changed', (snapshot) => {
            },
            (error) =>{
                console.log(error);
            },
            () => {
                storage.ref(`${path}`).child(file.name).getDownloadURL().then( async (url) => {
                    resolve(url)
                })
            });
        })  
    }
     
}

export const getPromoUsers = async(code) => {
    try{

        let myQuery =  db.collection(ORDER_COLLECTION).orderBy("customerName","desc").where("promotionCode","==",code);

        let snapshots = await myQuery.get();

        let users = [];

        for (const order of snapshots.docs) {
           
            let userQuery = db.collection(USER_COLLECTION).where("uid",'==',order.data().customerUid);

            let snapshot = await userQuery.get();

            for(const u of snapshot.docs){

                if(u.data().fcmToken!=="" && u.data().fcmToken !== undefined){
                    if(users.filter(user => (user.uid === u.data().uid)).length===0){
                        users.push({
                            uid : u.data().uid,
                            userName : u.data().fullName,
                            fcmToken : u.data().fcmToken,
                        })
                    }
                   
                }
            }
        }

        return users;

    }catch(error){
        console.log(error)
        throw(error);
    }

}
