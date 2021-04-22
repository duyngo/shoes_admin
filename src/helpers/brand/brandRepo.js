import FirebaseHelper from '../firebase';

const db = FirebaseHelper.getDatabase();

const BRAND_COLLECTION = 'brands';
const SHOE_COLLECTION = 'partnerShoes';


export const getBrands = async () => {
    
    try{
        
        let myQuery = db.collection(BRAND_COLLECTION).where("isDeleted","==",false).orderBy("name","desc"); 

        let snapshots = await myQuery.get();
        let brands = [];

        for (const brand of snapshots.docs) {
            brands.push({...brand.data()})
        }

        return brands;

    }catch(error){

        console.log(`[ERROR] ${error}`)
    }
}

export const saveBrand = async ( data ) => {

    return new Promise ( async ( resolve ) => {

        try{

            let doc = null;
            let uid = data.uid

            if(uid) {
                doc = db.collection(BRAND_COLLECTION).doc(uid)
            }else{
                doc = db.collection(BRAND_COLLECTION).doc();
                data.uid = doc.id;
                data.dateAdded = FirebaseHelper.getTimeStamp();
            }

            data.isDeleted = false;
            data.dateUpdated = FirebaseHelper.getTimeStamp();
    
            doc.set({
                ...data
            }, {merge :true})

            resolve( {
                code : 200,
                message : "Brand has been added."
            })

        }catch(error){
            console.log(error)
            resolve({
                code : 500,
                message : "Error occurred."
            })
        }

    })
}

export const getRelatedShoes = async ( name ) => {

    try{
        
        let myQuery = db.collection(SHOE_COLLECTION).where("brand","==",name).where("isDeleted","==",false).orderBy("title","desc"); 

        let snapshots = await myQuery.get();

        let shoes = [];

        for (const brand of snapshots.docs) {
            shoes.push({...brand.data()})
        }

        return shoes;

    }catch(error){
        console.log(`[ERROR] $error`)
        throw(error);
    }

}

export const checkToModify = async ( uid ) => {

    return new Promise( async (resolve) => {
       
        try{

            let doc = db.collection(BRAND_COLLECTION).doc(uid);

            await doc.set({
                isDeleted : true
            }, { merge : true})

            resolve({
                code : 204,
                message : "Brand deleted."
            })

        }catch(error){
            console.log(error)
        }

    })

}

export const deleteBrand = async ( uid ) => {

    return new Promise( async (resolve) => {
       
        try{

            let doc = db.collection(BRAND_COLLECTION).doc(uid);

            await doc.set({
                isDeleted : true
            }, { merge : true})

            resolve({
                code : 204,
                message : "Brand deleted."
            })

        }catch(error){
            console.log(error)
        }

    })

}

export const checkDuplicateBrandName = async ( name ) => {

    return new Promise ( async ( resolve ) => {

        try{

            let nameSnapshots = await db.collection(BRAND_COLLECTION).where('name','==',name).where('isDeleted','==',false).get();

            let code = "success";
            let message = "";

            if(nameSnapshots.docs.length>0){
                code = "error";
                message = "Sorry but this name is already taken. Please use a different brand name."
            }

            resolve({
                code : code,
                message : message
            })

        }catch(error){
            console.log(error)
            throw(error)
        }
    })

}

