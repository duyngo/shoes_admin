import FirebaseHelper from '../firebase';
import moment from 'moment';
import { algoliaSearchUsers } from './userAlgolia'

const db = FirebaseHelper.getDatabase();
const storage = FirebaseHelper.getStorage();
const functions = FirebaseHelper.getFunctions();

const USER_COLLECTION = "users";
const ADMIN_TOKEN_COLLECTION = "adminTokens";

export const getUsers = async () => {

    try{
        let snapshots = await db.collection(USER_COLLECTION)
                                .orderBy("fullName","asc")
                                .where("isDeleted","==",false)
                                .get();

        let users = [];
        for(const user of snapshots.docs){
            if(user.data().type!=="manager" && user.data().type!=="admin"){
                users.push({...user.data()})
            }
        }

        return users;
    }catch(error){
        console.log(error)
        throw(error)
    }

}

export const searchUsers = async (keyword) => {

    try{
        let users = [];
        const algoliaUsers = await algoliaSearchUsers(keyword)

        for(const user of algoliaUsers){
            
            const {
                uid,
                deviceType,
                fullName,
                type,
                presence,
                loginType,
                email,
                phoneNumber,
                imageUrl,
                isDeleted,
                objectID,
                status
            } = user;

            if(user.isDeleted===false && (user.type!=="admin" && user.type!=="manager")){
                users.push({
                    uid,
                    deviceType,
                    fullName,
                    type,
                    presence,
                    loginType,
                    email,
                    phoneNumber,
                    imageUrl,
                    isDeleted,
                    objectID,
                    status
                })
            }
        }

        return users;

    }catch(error){
        console.log(`[ERROR] ${error.message}`)
    }

}

export const getCouriers = async () => {
    try{
        let snapshots = await db.collection(USER_COLLECTION)
                            .where("type","==","courier")
                            .orderBy("fullName","desc")
                            .get()

        let couriers = [];

        for (const courier of snapshots.docs) {
            couriers.push({...courier.data()})
        }

        return couriers;
    }catch( error ){
        console.log(error)
        throw(error)
    }
}

export const getCustomers = async () => {
    try{
        let snapshots = await db.collection(USER_COLLECTION)
                            .where("type","==","customer")
                            .orderBy("fullName","desc")
                            .get()

        let customers = [];

        for (const customer of snapshots.docs) {
            customers.push({...customer.data()})
        }

        return customers;
    }catch( error ){
        console.log(error)
        throw(error)
    }
}

export const deleteUser = async (data) => {

    let doc = db.collection(USER_COLLECTION).doc(data.uid);

    await doc.set({
        isDeleted : true
    }, { merge : true })

    var disableUser = functions.httpsCallable('disableUser');
    await disableUser(data).then(function(result) {
       return result;
    }).catch(error => {
        console.log(error); 
        throw(error)
    })

}

const uploadImage = ( uid, file ) => {

    return new Promise( resolve => {
    
        storage.ref(`${uid}/profilePictures/${file.name}`).put(file)
        .on('state_changed', (snapshot) => {
        },
        (error) =>{
            console.log(error);
        },
        () => {
            storage.ref(`${uid}/profilePictures/`).child(file.name).getDownloadURL().then( async (url) => {
                resolve(url)
            })
        });
    })

    
}

export const checkDuplicateEmail = async ( email ) => {

    return new Promise ( async ( resolve ) => {

        try{

            let emailSnapshots = await db.collection(USER_COLLECTION).where('email','==',email).where('isDeleted','==',false).get();

            let code = "success";
            let message = "";

            if(emailSnapshots.docs.length>0){
                code = "error";
                message = "Sorry but this email address is already used. Please use another email."
            }

            resolve({
                code : code,
                message : message
            })

        }catch(error){
            console.log(`[ERROR] ${error.message}`)
            throw(error)
        }
    })

}

export const updateUser = async ( data, file ) =>{

    let docRef = null;
    docRef = db.collection(USER_COLLECTION).doc(data.uid)

    let  userData = {
        email : data.email,
        fullName : data.fullName,
        phoneNumber : data.phoneNumber
    }

    if(file){
       let url = await uploadImage(data.uid, file.file);
       userData.imageUrl = url;
    }

    return new Promise( resolve => {
        db.runTransaction( t => {
            return t.get(docRef)
                .then( doc => {
                    t.update(docRef, userData )
                });
    
        }).then( async (result) => {

            userData.uid = data.uid;

            var updateUserProfile = functions.httpsCallable('updateUserProfile');

            await updateUserProfile(data).then(function(result) {
                resolve("SUCCESS")
            }).catch(error => {
                console.log(error); 
                throw(error)
            })

           
        }).catch( error => {
            console.log(error);
        });
    })

}

export const banUser = async (data) => {

    let doc = db.collection(USER_COLLECTION).doc(data.uid);

    await doc.set({
        status : "deactivated"
    }, { merge : true })

    var banUser = functions.httpsCallable('banUser');

    await banUser(data).then(function(result) {
        console.log(result);
        return { "test" : "test" };
    }).catch(error => {
        console.log(error); 
        throw(error);
    })
}

export const notifyBannedUser = async (data) => {

    var notifyBannedUser = functions.httpsCallable('notifyBannedUser');
    await notifyBannedUser({ userToken : data.userToken, uid : data.uid , title : data.title, body : data.body }).then(function(result) {
       return result;
    }).catch(error => {
        console.log(error); 
        throw(error)
    })

}

export const emailBannedUser = async( data ) => {

    var emailBannedUser = functions.httpsCallable('emailBannedUser');
    await emailBannedUser({ userEmail : data.userEmail, subject : data.subject, body : data.body }).then(function(result) {
       return result;
    }).catch(error => {
        console.log(error); 
        throw(error)
    })

}

export const checkIfManager = async (uid) => {
    
    try{

        let snapshots = await db.collection(USER_COLLECTION)
        .where("uid","==",uid).get()

        let user = null;
        for(const u of snapshots.docs){
            user = u.data();
        }
        
        if(user){
            return user.type==="manager"
        }else{
            return false
        }

    }catch(error){
        console.log(error)
        throw(error)
    }
   
}

export const sendAdminInvite = async ( data ) => {

    return new Promise ( async (resolve, reject ) => {

        let userSnapshots = await db.collection(USER_COLLECTION).where("email","==", data.userEmail).get();

        let user = null;
        for(const u of userSnapshots.docs){
            user = u.data();
        }

        if(user){
            resolve({
                code : "error",
                message : `The email address you entered is already registered as ${user.type} in PULIRE. Please send invite to another email address.`
            })

            return
        }

        let snapshots = await db.collection(ADMIN_TOKEN_COLLECTION).where("email","==", data.userEmail).get();

        let adminToken = null;
        for(const a of snapshots.docs){
            adminToken = a.data();
        }
        
        var sendAdminInvite = functions.httpsCallable('sendAdminInvite');

        if(adminToken){
            
            let dateSent = adminToken.dateSent;
            let expiry = adminToken.expiry.hours;
            let dateNow = moment(new Date());
            let expiryDate = moment.unix(dateSent.seconds).add(expiry,'hours');

            if( dateNow > expiryDate ){
            
                db.collection(ADMIN_TOKEN_COLLECTION).doc(adminToken.uid).delete().then( async () =>{
                    
                    sendAdminInvite({ userEmail : data.userEmail, subject : data.subject, body : data.body }).then( async function(result) {
                
                        await saveAdminToken(data.token, data.userEmail);
                        resolve({
                            code : "success",
                            message : "Email sent"
                        });
    
                    }).catch(error => {
                        console.log(error); 
                        throw(error)
                    })

                }).catch(function(error){
                    console.log(error);
                    throw(error)
                })


            }else{
                resolve({
                    code : "pending",
                    message : "The recipient still has a pending invite."
                })
            }
        }else{
            sendAdminInvite({ userEmail : data.userEmail, subject : data.subject, body : data.body }).then(function(result) {
                
                saveAdminToken(data.token, data.userEmail);
                resolve({
                    code : "success",
                    message : "Email sent"
                });

            }).catch(error => {
                console.log(error); 
                throw(error)
            })
        }


    })
}

const saveAdminToken = async(token, userEmail) => {
   
    let doc = db.collection(ADMIN_TOKEN_COLLECTION).doc()
    let uid = doc.id;

    await doc.set({
        token : token,
        dateSent : FirebaseHelper.getTimeStamp(),
        expiry : {
            hours : 24
        },
        email : userEmail,
        uid : uid
    }, {merge : true})
    
    return {
        status : "done",
        message : "Invite sent."
    }

}

export const checkTokenAuthenticity = async(token) => {

    return new Promise ( async (resolve, reject ) => {

        let snapshots = await db.collection(ADMIN_TOKEN_COLLECTION).where("token","==", token).get();

        let adminToken = null;
        for(const a of snapshots.docs){
            adminToken = a.data();
        }

        if(adminToken){
                
            let dateSent = adminToken.dateSent;
            let expiry = adminToken.expiry.hours;
            let dateNow = moment(new Date());
            let expiryDate = moment.unix(dateSent.seconds).add(expiry,'hours');

            if( dateNow > expiryDate ){
            
                resolve({
                    code : "error",
                    message : "This link has already expired. Please contact the administrator for more information"
                });


            }else{
                resolve({
                    code : "success",
                    message : "You can now proceed to signing up.",
                    data : {
                        email : adminToken.email,
                        uid : adminToken.uid
                    }
                })
            }
        }else{
            resolve({
                code : "error",
                message : "Your token is invalid.. Please contact the administrator for more information"
            });
        }

    });

}

export const saveAdmin = async ( data, tokenUid ) => {

    return new Promise ( async ( resolve ) => {

        try{

            let doc = null;
            let tokenDoc = null;

            tokenDoc = db.collection(ADMIN_TOKEN_COLLECTION).doc(tokenUid);
    
            await tokenDoc.delete();

            doc = db.collection(USER_COLLECTION).doc();
            data.uid = doc.id;

            doc.set({
                ...data
            }, {merge :true})

            resolve( {
                code : 200,
                message : "User has been added."
            })

        }catch(error){
            console.log(`[ERROR] ${error.message}`)
            resolve({
                code : 500,
                message : "Error occurred."
            })
        }

    })
}