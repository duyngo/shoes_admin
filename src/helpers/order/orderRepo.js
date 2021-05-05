import FirebaseHelper from '../firebase';
import moment from 'moment';
import { algoliaSearchOrders } from './orderAlgolia'

const db = FirebaseHelper.getDatabase();
const storage = FirebaseHelper.getStorage();
const fDb = FirebaseHelper.getfDbase();

const ORDER_COLLECTION = 'orders';
const PROMO_CODE_COLLECTION = 'promotionCodes';
const ORDER_COUNT_COLLECTION = 'orderCounts';

export const getOrders = async (page = 1, prev = null, nxt = null, searchData = null) => {
    
    try{
        
        let prevRef = prev;
        let nextRef = nxt;
        let orderPage = page;
        let searchValues = searchData;

        let myQuery =  db.collection(ORDER_COLLECTION)
                        .where("isDeleted","==",false)

        if(searchValues===null){
            if(nextRef !== undefined && nextRef !== null){
                myQuery = myQuery.orderBy("dateSent","desc")
                .limit(20).startAfter(nextRef);
            }
    
            if(prevRef !== undefined && prevRef !== null && orderPage != 1){
                myQuery = myQuery.orderBy("dateSent","asc")
                .limit(20).startAfter(prevRef);
            }
            
            if(prevRef == null && nextRef == null){
                myQuery = myQuery.orderBy("dateSent","desc");
            }

        }else{
            let queryField =  searchValues.field;
            let queryString = searchValues.searchString;

            if(queryField=="dateSent"){
                myQuery = myQuery.where(queryField,'>=',queryString[0].startOf('day').toDate()).where(queryField,'<=',queryString[1].endOf('day').toDate())
            }else{

                myQuery = myQuery.where(queryField,'>=',queryString)
    
            }

            if(nextRef !== undefined && nextRef !== null){
                myQuery = myQuery.orderBy("dateSent","asc").limit(20).startAfter(nextRef);
            }
    
            if(prevRef !== undefined && prevRef !== null && orderPage != 1){
                myQuery = myQuery.orderBy("dateSent","asc").limit(20).endBefore(nextRef)
            }
            
            if(prevRef == null && nextRef == null){
                myQuery = myQuery.orderBy("dateSent","asc").limit(20);
            }

        }

        let snapshots = await myQuery.get();
        let snapshotRefs = [];
        
        let orders = [];

        for (const order of snapshots.docs) {
    
            if(order.data().addressText !== undefined && order.data().addressText.indexOf('North Jakarta') > -1){
                orders.push({...order.data()});
                snapshotRefs.push(order);
            }

        }
        
        if(orders.length>0){
            if(nextRef !== undefined && nextRef !== null){
                orderPage++;
            }
            if(prevRef !== undefined && prevRef !== null && orderPage != 1){
                orders = [...orders.reverse()];
                snapshotRefs = [...snapshotRefs.reverse()];
                orderPage--;
            }

            nextRef = snapshotRefs[snapshotRefs.length - 1];
            if(orderPage>1)
                prevRef = snapshotRefs[0];
            else
                prevRef = null; 
        }

        return {
            orders : [...orders],
            nextRef : nextRef,
            prevRef : prevRef,
            orderPage : orderPage
        };

    }catch( error ){
        console.log(error)
        throw(error)
    }
}

export const searchOrders = async (keyword) => {

    try{
        let orders = [];
        const algoliaOrders = await algoliaSearchOrders(keyword)

        for(const order of algoliaOrders){
            const {
                addressText,
                courierName,
                customerName,
                items,
                promotionCode,
                status,
                objectID,
                addressLocation,
                courierUid,
                customerUid,
                dateSent,
                isDeleted,
                pickupConfirmationPictures,
                timeline,
                totalPrice,
                uid,
                customerPhoneNumber,
                orderID
            } = order;

            if(order.isDeleted===false && order.addressText.indexOf('North Jakarta') > -1){
                orders.push({
                    addressText,
                    courierName,
                    customerName,
                    items,
                    promotionCode,
                    status,
                    objectID,
                    addressLocation,
                    courierUid,
                    customerUid,
                    dateSent,
                    isDeleted,
                    pickupConfirmationPictures,
                    timeline,
                    totalPrice,
                    uid,
                    customerPhoneNumber,
                    orderID
                })
            }
        
        }

        return orders;

    }catch(error){
        console.log(`[ERROR] ${error}`)
    }

}

export const saveOrder = async (order, uploadArr ) => {

    let doc = null;
    let uid = order.uid

    if(uid){
        doc = db.collection(ORDER_COLLECTION).doc(order.uid)
        
    }else{
        doc = db.collection(ORDER_COLLECTION).doc()
        uid = doc.id
    }

    

    if(order.addressLocation.lat!==undefined && order.addressLocation.lng!==undefined){
        let geoPt = new FirebaseHelper.firestore.GeoPoint(order.addressLocation.lat,order.addressLocation.lng)
        order.addressLocation = geoPt;
    }

    doc.dateSent = FirebaseHelper.getTimeStamp();
    const { target, files } = uploadArr;
    // if(order.promotionCode!==""){

    //     let promoCodeData = await checkPromotionCode(order.promotionCode);
    //     if(promoCodeData !== null){

    //         if(promoCodeData.status=="published"){

    //             let eligibilityCount = promoCodeData.eligibilities.length;
    //             let passCount = 0;

    //             let dateEligible = false, serviceEligible= false, locationEligibile = false, quantityEligible = false;
    //             const { files } = uploadArr;
    //             for(var e of promoCodeData.eligibilities){
    //                 if(e.type=="location"){
    //                     if(order.addressText.includes(e.criteria)){
    //                         passCount++;
    //                     }
    //                 }

    //                 if(e.type=="service"){
    //                     let svc = e.criteria.split(",");
    //                     let sCount = 0;

    //                     for(var i=0; i<svc.length; i++){
    //                         for(var f of files){
    //                             if(svc[i]==f.serviceType){
    //                                 sCount++;
    //                             }
    //                         }
    //                     }

    //                     if(sCount!=0){
    //                         passCount++;
    //                     }
    //                 }

    //                 if(e.type=="quantity"){
    //                     if(parseInt(e.criteria)==files.length){
    //                         passCount++;
    //                     }
    //                 }

    //                 if(e.type=="date"){
    //                     let dates = e.criteria.split("-");
    //                     let sMonth = dates[0].substring(0,2);
    //                     let sDay = dates[0].substring(2,4);
    //                     let sYear = dates[0].substring(4,dates[0].length);

    //                     let startDate = moment(new Date(`${sMonth}-${sDay}-${sYear}`));
    //                     let eMonth = dates[1].substring(0,2);
    //                     let eDay = dates[1].substring(2,4);
    //                     let eYear = dates[1].substring(4,dates[0].length);

    //                     let endDate = moment(new Date(`${eMonth}-${eDay}-${eYear}`));

    //                     if(moment(order.dateSent) <= endDate && moment(order.dateSent) >= startDate){
    //                         passCount++;
    //                     }                    
    //                 }
    //             }

    //             if(passCount!==eligibilityCount){
    //                 return {
    //                     message : "Sorry you are not eligible for this promotion code.",
    //                     code : 203
    //                 }
    //             }else{
                    
    //                 let newTotalPrice = 0;

    //                 if(promoCodeData.isAdjustmentInPercent){
    //                     newTotalPrice = order.totalPrice - ( (promoCodeData.priceAdjustment/100) * order.totalPrice )
    //                 }else{
    //                     newTotalPrice = order.totalPrice - promoCodeData.priceAdjustment;
    //                 }

    //                 order.totalPrice = newTotalPrice;
    //             }

    //         }else{
    //             return {
    //                 message : "Sorry promotion code not available.",
    //                 code : 204
    //             }
    //         }
            

    //     }else{
    //         return {
    //             message : "Sorry promotion code not available.",
    //             code : 204
    //         }
    //     }

    // }

    if(!order.uid){

        let countID = moment(new Date()).format('YYYY-MM-DD');

        let countRef = db.collection(ORDER_COUNT_COLLECTION).doc(countID);

        await countRef.get().then( async (querySnapshot) =>{
            
            if( typeof querySnapshot.data() === "undefined"){

                let batch = db.batch();

                batch.set(countRef, {
                    count : "0000"
                })

                await batch.commit();
            }

        }).catch( function(error) {
            console.log(error);
        });
    
        let orderID = await updateOrderCount(countRef);
        order.orderID = orderID+"-"+countID;

    }


    await doc.set({
        ...order, 
        uid
    }, {merge : true})
    
    let newFileList = [];
    for(const file of files){
        
        let url = "";
        if(target == "itemImages"){
            
            if( file.file !== undefined ){
                url = await uploadImage( doc, file, target)
            }else{
                url = file.imageUrl;
            }

            const uuidv1 = require('uuid');
            newFileList.push({
                description : file.description,
                imageUrl  : url,
                serviceType : file.serviceType,
                servicePrice : file.servicePrice,
                uuid:  uuidv1.v1()
            })
        }
       
        if(target == "pickupConfirmationPictures"){
            url = await uploadImage( doc, file, target)
            newFileList.push(url)
        }
    }
    
    if(target!==""){
        await updateItem(doc, target, newFileList);
    }

    return {
        message : "Order saved.",
        code : 200
    }

}

export const updateOrderStatus = async(order,uploadArr) => {
    let doc = db.collection(ORDER_COLLECTION).doc(order.uid)


    let batch = db.batch();

    batch.set(doc, {
        ...order
    }, { merge : true })

    await batch.commit();

    const { target, files } = uploadArr;
    
    let newFileList = [];
    for(const file of files){
        
        let url = "";
        if(target == "itemImages"){
            
            if( file.file !== undefined ){
                url = await uploadImage( doc, file, target)
            }else{
                url = file.imageUrl;
            }

            const uuidv1 = require('uuid');
    
            newFileList.push({
                description : file.description,
                imageUrl  : url,
                serviceType : file.serviceType,
                servicePrice : file.servicePrice,
                uuid:  uuidv1.v1()
            })
        }
       
        if(target == "pickupConfirmationPictures"){
            url = await uploadImage( doc, file, target)
            newFileList.push(url)
        }
    }
    
    if(target!==""){
        await updateItem(doc, target, newFileList);
    }

    return {
        message : "Order saved.",
        code : 200
    }
}

export const deleteOrder = async ( uid ) => {

    let doc = db.collection(ORDER_COLLECTION).doc(uid);

    doc.update({
        isDeleted : true
    })

}

export const checkSinglePromoCodeEligibility = async(data) => {
    console.log(data)
    let promoCodeData = await checkPromotionCode(data.promotionCode);
    let errors = [];
    if(promoCodeData !== null){
        if(promoCodeData.status=="published"){

            let eligibilityCount = promoCodeData.eligibilities.length;
            let passCount = 0;
            
            let dateEligible = true, serviceEligible= true, locationEligibile = true, quantityEligible = true;
            const { items } = data;

            let serviceEligibilitiesCount = null;
            let quantityEligibilities = null;

            promoCodeData.eligibilities.map( (data) => {
                if(data.type==="service"){
                    let svc = data.criteria.split(",");
                    serviceEligibilitiesCount = svc.length
                }

                if(data.type==="quantity"){
                    quantityEligibilities = data.criteria;
                }
            })

            if( (serviceEligibilitiesCount!==null && serviceEligibilitiesCount!=1) || (quantityEligibilities!==null && quantityEligibilities!=1)){
                
                errors.push("Sorry. The promo code is invalid.")
                return {
                    errors : errors,
                    code : 500
                }
            }else{

                for(var e of promoCodeData.eligibilities){
                    if(e.type=="location"){
                        if(!data.addressText.includes(e.criteria)){
                            errors.push(`Pickup location should be within ${e.criteria}`)
                            locationEligibile = false;
                        }
                    }
    
                    if(e.type=="service"){
                        let svc = e.criteria.split(",");
                        let sCount = 0;
    
                        for(var i=0; i<svc.length; i++){
                            for(var f of items){
                                if(svc[i]==f.serviceType){
                                    sCount++;
                                }
                            }
                        }
                        console.log(sCount)
                        if(sCount==0){
                            errors.push(`Order should avail of the ${svc[0]} service`)
                            serviceEligible = false;
                        }
                    }
    
                    if(e.type=="quantity"){
                        if(parseInt(e.criteria)!=items.length){
                            quantityEligible = false;
                        }
                    }
    
                    if(e.type=="date"){
                        let dates = e.criteria.split("-");
                        let sMonth = dates[0].substring(0,2);
                        let sDay = dates[0].substring(2,4);
                        let sYear = dates[0].substring(4,dates[0].length);
    
                        let startDate = moment(new Date(`${sMonth}-${sDay}-${sYear}`)).startOf('day');
                        let eMonth = dates[1].substring(0,2);
                        let eDay = dates[1].substring(2,4);
                        let eYear = dates[1].substring(4,dates[0].length);
    
                        let endDate = moment(new Date(`${eMonth}-${eDay}-${eYear}`)).endOf('day');
      
                        
                        if(moment(new Date()) <= endDate && moment(new Date()) >= startDate){
                            dateEligible = true
                        }else if(endDate > moment(new Date())   && startDate > moment(new Date())){
                            errors.push(`Order should be made during ${startDate.format("L")} to ${endDate.format("L")}`)
                            dateEligible = false
                        }else{
                            errors.push("Sorry. The promo code has already expired.")
                            dateEligible = false
                        }                    
                    }
                }

                if(dateEligible &&
                serviceEligible &&
                locationEligibile && 
                quantityEligible ){

                    let newServicePrice = items[0].servicePrice;

                    if(promoCodeData.isAdjustmentInPercent){
                        newServicePrice = items[0].servicePrice - ( (promoCodeData.priceAdjustment/100) * items[0].servicePrice )
                    }else{
                        newServicePrice = items[0].servicePrice - promoCodeData.priceAdjustment;
                    }

                    return {
                        code : 200,
                        data : {
                            adjustedPrice : newServicePrice
                        }
                    }
                }else{
                    return {
                        errors : errors,
                        code : 500
                    }
                }

                
            }

            

            // if(passCount!==eligibilityCount){
            //     return {
            //         message : "Sorry you are not eligible for this promotion code.",
            //         code : 203
            //     }
            // }else{
                
            //     // let newTotalPrice = 0;



            //     // data.totalPrice = newTotalPrice;
            // }

        }else{
            errors.push("Sorry. The promo code is invalid.")
            return {
                errors : errors,
                code : 500
            }
        }
        
    }else{
        errors.push("Sorry. The promo code is invalid.")
        return {
            errors : errors,
            code : 500
        }
    }


}

export const checkGeneralPromoCodeEligibility = async(data) => {
    
    let promoCodeData = await checkPromotionCode(data.promotionCode);
    let errors = [];
    const { items } = data;

    let newData = items;
    if(promoCodeData !== null){
        if(promoCodeData.status=="published"){

            let eligibilityCount = promoCodeData.eligibilities.length;
            let passCount = 0;

            // for checking 1 service eligibility
            let hasServiceEligibilities = false;
            let serviceEligibilitiesCount = 0;
            let quantityEligibilities = 0;
            let serviceEligibities = []

            promoCodeData.eligibilities.map( (data) => {
                if(data.type==="service"){
                    hasServiceEligibilities = true;
                    serviceEligibities = data.criteria.split(",");
                    serviceEligibilitiesCount = serviceEligibities.length
                }

                if(data.type==="quantity"){
                    quantityEligibilities = data.criteria;
                }
            })

            if(serviceEligibilitiesCount==1 && quantityEligibilities>1){
                let servicesMatch = newData.filter( d => d.serviceType==serviceEligibities[0] );
                if(servicesMatch.length!=quantityEligibilities){
                    errors.push("Sorry you are not eligible for this promotion code - quantity should be equal to services found in order")
                    return {
                        code : 500,
                        errors : errors,
                        data : {
                            items : newData
                        }
                    }
                }
            }
            
            let dateEligible = true, serviceEligible= true, locationEligibile = true, quantityEligible = true;
            let hasDate = false, hasService = false, hasLocation = false, hasQuantity = false;
            const { items } = data;

            let ct=0;
           
            for(var e of promoCodeData.eligibilities){
                console.log(e)

                if(e.type=="date"){
                    let dates = e.criteria.split("-");
                    let sMonth = dates[0].substring(0,2);
                    let sDay = dates[0].substring(2,4);
                    let sYear = dates[0].substring(4,dates[0].length);

                    let startDate = moment(new Date(`${sMonth}-${sDay}-${sYear}`)).startOf('day');
                    let eMonth = dates[1].substring(0,2);
                    let eDay = dates[1].substring(2,4);
                    let eYear = dates[1].substring(4,dates[0].length);

                    let endDate = moment(new Date(`${eMonth}-${eDay}-${eYear}`)).endOf('day');
                   
                    if(moment(new Date()) <= endDate && moment(new Date()) >= startDate){
                        dateEligible = true
                    }else if(endDate > moment(new Date()) && startDate > moment(new Date())){
                        errors.push(`Order should be made during ${startDate.format("L")} to ${endDate.format("L")}`)
                        dateEligible = false
                    }else{
                        errors.push("Sorry. The promo code has already expired.")
                        dateEligible = false
                    }                   
                }

                if(e.type=="location"){
                    if(!data.addressText.includes(e.criteria)){
                        errors.push(`Pickup location should be within ${e.criteria}`)
                        locationEligibile = false;
                    }
                }

                if(e.type=="service"){
                    let svc = e.criteria.split(",");
                    let sCount = 0;
                 
                    for(var i=0; i<svc.length; i++){
                        let x=0;
                        for(var f of items){
                            let newServicePrice = 0;
                            if(svc[i]==f.serviceType){
                                sCount++;
                                
                                newServicePrice = f.servicePrice;
                                if(promoCodeData.isAdjustmentInPercent){
                                    newServicePrice = f.servicePrice - ( (promoCodeData.priceAdjustment/100) * f.servicePrice )
                                }else{
                                    newServicePrice = f.servicePrice - promoCodeData.priceAdjustment;
                                }
                              
                                f.adjustedPrice = newServicePrice;
                                newData[x] = f;
                            }
                           
                            x++;
                        }
                    }

                    if(svc.length==1){
                        if(quantityEligibilities>1){
                            if(sCount!=quantityEligibilities){
                                errors.push(`Order should avail of the ${svc.join(",")} service(s)`)
                                serviceEligible = false;
                            }
                        }
                    }else{
                        if(sCount!=svc.length){
                            errors.push(`Order should avail of the ${svc.join(",")} service`)
                            serviceEligible = false;
                        }
                    }

                   

                }

                if(e.type=="quantity"){
                    if(parseInt(e.criteria)!=items.length){
                        errors.push(`Order should be atleast ${e.criteria} items`)
                        quantityEligible = false;
                    }
                }

                ct++;
            }


            if(dateEligible &&
                serviceEligible &&
                locationEligibile && 
                quantityEligible ){
                    return {
                        code : 200,
                        errors : [],
                        data : {
                            items : newData
                        }
                    }
                }else{
                    return {
                        code : 500,
                        errors : errors,
                        data : {
                            items : newData
                        }
                    }
                }
            

        }else{
            errors.push("Sorry. The promo code is invalid.")
            return {
                errors : errors,
                code : 500
            }
        }
        
    }else{
        errors.push("Sorry. The promo code is invalid.")
        return {
            errors : errors,
            code : 500
        }
    }


}

const uploadImage = ( docRef, file, target ) => {
    return new Promise( resolve => {
        let path = "";

        if( target == "pickupConfirmationPictures" ){
            path = `orders/${docRef.id}/pickupConfirmation/`;
        }

        if( target == "itemImages" ){
            path = `orders/${docRef.id}/items/`;
        }

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

const updateItem = async ( docRef, target, fileList) =>{
    return new Promise( resolve => {
        db.runTransaction( t => {
    
            return t.get(docRef)
                .then( doc => {
                    if( target == "pickupConfirmationPictures" ){
                        t.update(docRef, {pickupConfirmationPictures : [...fileList]});
                    }
    
                    if( target == "itemImages" ){
                        t.update(docRef, {items : [...fileList]});
                    }
                    
                });
    
        }).then( result => {
            //console.log(result);
            resolve("SUCCESS")
        }).catch( error => {
            console.log(error);
        });
    })

}

const updateOrderCount = async ( docRef ) => {
    return new Promise( resolve => {
        db.runTransaction( t => {
    
            return t.get(docRef)
                .then( doc => {

                    let newCount = parseInt(doc.data().count) + 1;
                    newCount = newCount.toString().padStart(4,'0');
                    t.update(docRef, {count: newCount});
                    resolve(newCount);

                });
    
        }).then( result => {
            //console.log(result)
        }).catch( error => {
            console.log(error);
        });
    })
}

const checkPromotionCode = async( code ) => {
    
    try{

        let myQuery =  db.collection(PROMO_CODE_COLLECTION)
                        .where("code","==",code)
                        .limit(1)

        let snapshots = await myQuery.get();

        let promoCode = null;

        for (const promo of snapshots.docs) {
            promoCode = promo.data();
        }
       
        return promoCode;

    }catch(error){
        console.log(error);
        throw(error)
    }

}


