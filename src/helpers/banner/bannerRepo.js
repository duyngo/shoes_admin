import FirebaseHelper from '../firebase';

const db = FirebaseHelper.getDatabase();
const storage = FirebaseHelper.getStorage();

const BANNER_COLLECTION = 'banners';

export const getBanners = async () => {

    try{
        
        let myQuery;
                       
        // if(displayDeleted){
        //     myQuery = db.collection(BANNER_COLLECTION).orderBy("title","desc");    
        // }else{
        //     myQuery = db.collection(BANNER_COLLECTION).orderBy("dateAdded","desc").where("isDeleted","==",false)  
        // }

        myQuery = db.collection(BANNER_COLLECTION).orderBy("title","desc").where("isDeleted","==",false); 

        let snapshots = await myQuery.get();

        let banners = [];

        for (const banner of snapshots.docs) {
            banners.push(banner.data())
        }
        
        return banners;

    }catch(error){
        console.log(error)
    }

}

export const saveBanner = async (banner, file ) => {

    let doc = null;
    let uid = banner.uid

    if(uid){
        doc = db.collection(BANNER_COLLECTION).doc(banner.uid)
    }else{
        doc = db.collection(BANNER_COLLECTION).doc()
        uid = doc.id
        banner.dateAdded = FirebaseHelper.getTimeStamp();
    }
    
    await doc.set({
        ...banner, 
        uid
    },{ merge : true })
    
    if(file){
        let url = await uploadImage( doc, file );
        await doc.update({
            imageUrl : url
        })
    }

}

export const checkDuplicateBanner = async ( bannerTitle ) => {

    return new Promise ( async ( resolve ) => {

        try{
            let codeSnapshots = await db.collection(BANNER_COLLECTION).where('title','==', bannerTitle).get();

            let code = "success";
            let message = "";

            if(codeSnapshots.docs.length>0){
                code = "error";
                message = "Sorry but this title is already used."
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
    if( file !== null && file !== undefined ){
        return new Promise( resolve => {
            let path = `banners/${docRef.id}/`;
    
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


export const deleteBanner = async ( uid ) => {

    let doc = db.collection(BANNER_COLLECTION).doc(uid);

    doc.update({
        isDeleted : true
    })

}