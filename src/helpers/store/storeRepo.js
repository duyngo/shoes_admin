import FirebaseHelper from '../firebase';

const db = FirebaseHelper.getDatabase();
const storage = FirebaseHelper.getStorage();

const STORE_COLLECTION = 'partnerStores';
const SHOE_COLLECTION = 'partnerShoes';

export const getStores = async () => {

    try{
        
        let myQuery = db.collection(STORE_COLLECTION).where("isDeleted","==",false).orderBy("name","desc"); 

        let snapshots = await myQuery.get();

        let stores = [];

        for (const store of snapshots.docs) {
            stores.push({...store.data()})
        }

        return stores;

    }catch(error){
        console.log(error)
    }

}

export const saveStore = async ( data ) => {

    return new Promise ( async ( resolve ) => {

        try{

            let doc = null;
            let uid = data.uid

            if(uid) {
                doc = db.collection(STORE_COLLECTION).doc(uid)
            }else{
                doc = db.collection(STORE_COLLECTION).doc();
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
                message : "Store has been added."
            })

        }catch(error){
            console.log(`[ERROR] ${error}`)
            resolve({
                code : 500,
                message : "Error occurred."
            })
        }

    })
}

export const deleteStore = async ( uid ) => {

    return new Promise( async (resolve) => {
       
        try{

            let doc = db.collection(STORE_COLLECTION).doc(uid);

            await doc.set({
                isDeleted : true
            }, { merge : true})

            try{
        
                let myQuery = db.collection(SHOE_COLLECTION).where("storeUid","==",uid); 
        
                let snapshots = await myQuery.get();
                
                for (const shoe of snapshots.docs) {

                    let shoeDoc = db.collection(SHOE_COLLECTION).doc(shoe.data().uid); 
                    await shoeDoc.set({
                        isDeleted : true
                    }, { merge : true})
                }
                
            }catch(error){
                console.log(error)
            }

            resolve({
                code : 204,
                message : "Store deleted."
            })

        }catch(error){
            console.log(`[ERROR] ${error}`)
        }

    })

}

export const checkDuplicateStoreName = async ( name ) => {

    return new Promise ( async ( resolve ) => {

        try{

            let nameSnapshots = await db.collection(STORE_COLLECTION).where('name','==',name).where('isDeleted','==',false).get();

            let code = "success";
            let message = "";
            console.log(nameSnapshots.docs.length);
            if(nameSnapshots.docs.length>0){
                code = "error";
                message = "Sorry but this name is already taken. Please use a different store name."
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

export const checkDuplicateStoreLink = async ( link ) => {

    return new Promise ( async ( resolve ) => {

        try{

            let linkSnapshots = await db.collection(STORE_COLLECTION).where('link','==',link).where('isDeleted','==',false).get();

            let code = "success";
            let message = "";

            if(linkSnapshots.docs.length>0){
                code = "error";
                message = "Sorry but this link is already used by another store."
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

