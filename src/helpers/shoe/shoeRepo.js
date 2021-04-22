import FirebaseHelper from '../firebase';

const db = FirebaseHelper.getDatabase();
const storage = FirebaseHelper.getStorage();

const SHOE_COLLECTION = 'partnerShoes';
const STORE_COLLECTION = 'partnerStores';
const BRAND_COLLECTION = 'brands';

export const getShoes = async () => {

    try{
        
        let myQuery = db.collection(SHOE_COLLECTION).where("isDeleted","==",false).orderBy("title","desc"); 

        let snapshots = await myQuery.get();

        let shoes = [];

        for (const shoe of snapshots.docs) {
            shoes.push({...shoe.data()})
        }

        return shoes;

    }catch(error){
        console.log(error)
    }

}

export const saveShoe = async ( data , uploadArr ) => {

    return new Promise ( async ( resolve ) => {

        try{

            let doc = null;
            let uid = data.uid

            if(uid) {
                doc = db.collection(SHOE_COLLECTION).doc(uid)
            }else{
                doc = db.collection(SHOE_COLLECTION).doc();
                data.uid = doc.id;
                data.dateAdded = FirebaseHelper.getTimeStamp();
            }

            data.isDeleted = false;
            data.dateUpdated = FirebaseHelper.getTimeStamp();
    
            doc.set({
                ...data
            }, {merge :true})

            let newFileList = [];
            for(const file of uploadArr){
          
                let url = "";
                if( file !== undefined ){
                    url = await uploadImage( doc, file)
                }else{
                    url = file;
                }
    
                newFileList.push(url)
            }

            if(uploadArr.length!==0){
                await updateItem(doc, newFileList);
            }
            
            resolve( {
                code : 200,
                message : "Shoe has been saved."
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

export const checkDuplicateShoeTitle = async ( title ) => {

    return new Promise ( async ( resolve ) => {

        try{

            let titleSnapshots = await db.collection(SHOE_COLLECTION).where('title','==',title).where('isDeleted','==',false).get();

            let code = "success";
            let message = "";

            if(titleSnapshots.docs.length>0){
                code = "error";
                message = "Sorry but this title is already taken. Please use a different shoe title."
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

const uploadImage = ( docRef, file ) => {
    return new Promise( resolve => {

        let path = `partnerShoes/${docRef.uid}/shoes/`;

        storage.ref(`${path}${file.file.name}`).put(file.file)
        .on('state_changed', (snapshot) => {
        },
        (error) =>{
            console.log(error);
        },
        () => {
            storage.ref(`${path}`).child(file.file.name).getDownloadURL().then( async (url) => {
                resolve(url)
            })
        });
    })

    
}

const updateItem = async ( docRef, fileList) =>{
    return new Promise( resolve => {
        db.runTransaction( t => {
    
            return t.get(docRef)
                .then( doc => {
                    t.update(docRef, {images : [...fileList]});
                });
    
        }).then( result => {
            resolve("SUCCESS")
        }).catch( error => {
            console.log(error);
        });
    })

}

export const deleteShoe = async ( uid ) => {

    return new Promise( async (resolve) => {
       
        try{

            let doc = db.collection(SHOE_COLLECTION).doc(uid);

            await doc.set({
                isDeleted : true
            }, { merge : true})

            resolve({
                code : 204,
                message : "Shoe deleted."
            })

        }catch(error){
            console.log(`[ERROR] ${error.message}`)
        }

    })

}


