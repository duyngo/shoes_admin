import firebase from 'firebase';
import actions from './actions';
import FirebaseHelper from '../../helpers/firebase';
import { all, takeEvery, put, fork, call } from 'redux-saga/effects';

const {
    database,
    rsfFirestore,
    processFireStoreCollection,
    rsfStorage,
} = FirebaseHelper;

const ORDERS_COLLECTION_NAME = 'orders';
const COURIERS_COLLECTION_NAME = 'users';
const SERVICES_COLLECTION_NAME = 'services';

function* fetchOrders({ payload = {} }){
    const { searchString } = payload;
  
    try{
        let collections;
        if(searchString !== ""){
            collections = database.collection(ORDERS_COLLECTION_NAME).orderBy('uid').startsWith(searchString).limit(20);
        }else{
            collections = database.collection(ORDERS_COLLECTION_NAME).orderBy('dateSent','desc').limit(20);
        }
        
        const snapshot = yield call(rsfFirestore.getCollection, collections);
        let data = processFireStoreCollection(snapshot);
        yield put(actions.fetchOrdersSuccess(data));

    }catch(error){
        console.log(error);
        yield put(actions.fetchOrdersError(error))
    } 
}

function* fetchCouriers(){
    try{
        
        const collections = database.collection(COURIERS_COLLECTION_NAME).where('type','==','courier').orderBy('fullName','desc');
        const snapshot = yield call(rsfFirestore.getCollection, collections);
        let data = processFireStoreCollection(snapshot);
        yield put(actions.fetchCouriersSuccess(data));

    }catch(error){
        console.log(error);
        yield put(actions.fetchCouriersError(error))
    } 
}

function* updateOrderStatus( {payload} ){
    
    const { data } = payload;
    
    let updateData;

    if( data.status === "onTheWay" ){
        updateData = {
            status : data.status,
            courierName : data.courierName,
            courierUid : data.courierUid,
            timeline : [...data.timeline]
        }
    }else if( data.status === "paidAndOnProgress" ){

        data.imgList.map( (file,i) => {
            rsfStorage.uploadFile(`orders/${data.orderUid}/pickupConfirmation/${file.name}`, file)
        })

        data.imgList.map( (file,i) => {
            const task = rsfStorage.uploadFile(`orders/${data.orderUid}/pickupConfirmation/${file.name}`, file)
            let imgName = file.name;
            let orderId = data.orderUid;
            
            task.on(firebase.storage.TaskEvent.STATE_CHANGED,
                null,
                null,
                function (){
                    firebase.storage().ref(`orders/${orderId}/pickupConfirmation`).child(imgName).getDownloadURL().then( url => {
                        
                        firebase.firestore().runTransaction( t => {
                            
                            let orderRef = firebase.firestore().collection('orders').doc(orderId);
                            
                            return t.get(orderRef)
                                .then( doc => {
                                    let newImagesArr = doc.data().pickupConfirmationPictures;
                                    newImagesArr.push(url);

                                    t.update(orderRef, {pickupConfirmationPictures : [...newImagesArr]});
                                });
                    
                        }).then( result => {
                            console.log(result);
                        }).catch( error => {
                           console.log(error); 
                        });

                    })
                }
            )

        })

        updateData = {
            status : data.status,
            timeline : [...data.timeline]
        }

    }else{
        updateData = {
            status : data.status,
            timeline : [...data.timeline]
        }
    }
        
    
    try{

        yield call(rsfFirestore.updateDocument, `${ORDERS_COLLECTION_NAME}/${data.orderUid}`, updateData);
    
        yield put({ type: actions.FETCH_ORDERS , payload : { searchString : "" }});
        yield put({ type: actions.DISPLAY_ORDER_DETAILS, payload : { data : null } })

    }catch(error){
        yield put(actions.updateOrderStatusError(error));
    }
}

function* addNewOrder ( {payload} ){

    const { data } = payload;
    
    let newItemList = [];

    let doc = database.collection(ORDERS_COLLECTION_NAME).doc();

    let newOrder = {
        
        addressText : data.addressText,
        addressLocation: new firebase.firestore.GeoPoint(data.addressLocation.lat,data.addressLocation.lng),
        dateSent : new Date(),
        courierName : data.courierName,
        courierUid : data.courierUid,
        customerName : data.customerName,
        customerUid : data.customerUid,
        items : [],
        timeline : [],
        pickupConfirmationPictures : [],
        status : "waitingForPickup",
        promotionCode : "",
        uid : doc.id
    }

    try{

        yield call(rsfFirestore.setDocument, `${ORDERS_COLLECTION_NAME}/${doc.id}`, newOrder);
        
        data.items.map( (data,i) => {
            const task = rsfStorage.uploadFile(`orders/${doc.id}/items/${data.image.name}`, data.image)
            let imgName = data.image.name;
            let description = data.description;
            let serviceType = data.service;
            task.on(firebase.storage.TaskEvent.STATE_CHANGED,
                null,
                null,
                function (){
                    firebase.storage().ref(`orders/${doc.id}/items`).child(imgName).getDownloadURL().then( url => {
                        
                        firebase.firestore().runTransaction( t => {
                            
                            let orderRef = firebase.firestore().collection('orders').doc(doc.id);
                           
                            return t.get(orderRef)
                                .then( doc => {
                                    let newItemsArr = doc.data().items;
                                    newItemsArr.push({
                                        imageUrl : url,
                                        description : description,
                                        serviceType : serviceType
                                    });

                                    t.update(orderRef, {items : [...newItemsArr]});
                                });
                    
                        }).then( result => {
                            console.log(result);
                        }).catch( error => {
                           console.log(error); 
                        });

                    })
                }
            )

        })

        yield put({ type: actions.FETCH_ORDERS , payload : { searchString : "" }});
        yield put({ type: actions.DISPLAY_ORDER_DETAILS, payload : { data : null } })

    }catch(error){
        console.log(error);
        yield put(actions.addOrderError(error));
    }

}

function* fetchCustomers(){
    try{
        
        const collections = database.collection(COURIERS_COLLECTION_NAME).where('type','==','customer').orderBy('fullName','desc');
        const snapshot = yield call(rsfFirestore.getCollection, collections);
        let data = processFireStoreCollection(snapshot);
        yield put(actions.fetchCustomersSuccess(data));

    }catch(error){
        console.log(error);
        yield put(actions.fetchCustomersError(error))
    } 
}

function* fetchServices(){
    try{
        
        const collections = database.collection(SERVICES_COLLECTION_NAME);
        const snapshot = yield call(rsfFirestore.getCollection, collections);
        let data = processFireStoreCollection(snapshot);
        yield put(actions.fetchServicesSuccess(data));

    }catch(error){
        console.log(error);
        yield put(actions.fetchServicesError(error))
    } 
}

export default function* rootSaga() {
    yield all([
        takeEvery(actions.FETCH_ORDERS, fetchOrders),
        takeEvery(actions.FETCH_COURIERS, fetchCouriers),
        takeEvery(actions.FETCH_CUSTOMERS, fetchCustomers),
        takeEvery(actions.FETCH_SERVICES, fetchServices),
        takeEvery(actions.UPDATE_ORDER_STATUS, updateOrderStatus),
        takeEvery(actions.ADD_ORDER, addNewOrder),
    ]);
}
