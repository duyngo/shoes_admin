
import FirebaseHelper from '../firebase';
import * as _ from 'lodash';

const db = FirebaseHelper.getDatabase();
const functions = FirebaseHelper.getFunctions();

const NOTIFICATION_COLLECTION = 'notifications';
const USER_COLLECTION = 'users';

export const saveNotification = async (users, notification) => {
 
    const offset = 500;
    console.log(users)

    try {
        if(users.length >= offset){

            let usersChunk = [];
            usersChunk = _.chunk(users, offset);
            
            for (const chunk of usersChunk) {
                let batch = db.batch();
                
                chunk.forEach(user => {
                    const ref = db.collection(NOTIFICATION_COLLECTION).doc()
                    batch.set(
                        ref, {
                        uid : ref.id,
                        recipient: user.uid,
                        dateSent: FirebaseHelper.firestore.Timestamp.now(),
                        title: notification.title,
                        body: notification.body,
                        data : notification.data,
                        type : notification.type,
                        isRemoved : false
                    });
                });
                await batch.commit();
            }
            
        } else {
            let batch = db.batch();
            for (const user of users) {
                const ref = db.collection(NOTIFICATION_COLLECTION).doc()
                batch.set(
                    ref, {
                    uid : ref.id,
                    recipient: user.uid,
                    dateSent: FirebaseHelper.firestore.Timestamp.now(),
                    title: notification.title,
                    body: notification.body,
                    data : notification.data,
                    type : notification.type,
                    isRemoved : false
                });
            }
            await batch.commit();
        }

        notifyPromoUsers(users,notification);

    } catch(e) {
        console.log('[TOP_LEVEL_ERROR]', e.message);
    }

}

// export const saveNotification = async (notification) => {

//     let doc = db.collection(NOTIFICATION_COLLECTION).doc()
//     let uid = doc.id
    
//     notification.isRemoved = false;
//     doc.set({
//         ...notification, 
//         uid
//     }, {merge : true})
    
// }

const notifyPromoUsers = async (users, notification) => {

    var notifyPromoUsers = functions.httpsCallable('notifyPromoUsers');
    notifyPromoUsers({ users:users, notification : notification }).then(function(result) {
       console.log(result);
    }).catch(httpsError => {
        console.log(httpsError); 
        throw(httpsError)
    })

}