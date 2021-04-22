import React, { Component } from 'react';
import { connect } from "react-redux";
import _ from 'lodash';
import calculateAspectRatio from 'calculate-aspect-ratio';

import {
    getCustomers
} from '../../helpers/user/userRepo';

import {
    getServices
} from '../../helpers/service/serviceRepo';

import {
    getPromotions,
    savePromotion,
    checkDuplicatePromotionCode,
    deletePromotion,
    getPromoUsers,
    searchPromos
} from '../../helpers/promotion/promotionRepo';

import {
    saveNotification
} from '../../helpers/notification/notificationRepo';

import AutoComplete from '../../components/googleMaps/AutoComplete';
import Modal from '../../components/feedback/modal';
import Spin from '../../components/uielements/spin';
import { PromoItem } from '../../components/promotion/PromoItem';
import Scrollbars from '../../components/utility/customScrollBar.js';

import './index.css'

import { 
    Row, 
    Col, 
    Icon, 
    Input, 
    Upload, 
    Form,
    Switch,
    Checkbox,
    Select,
    Radio,
    Table,
    Tag,
    Button,
    Popconfirm,
    message,
    Tooltip
} from 'antd';

import { DatePicker } from 'antd';
import moment from 'moment';

const { MonthPicker, RangePicker } = DatePicker;

const dateFormat = 'MMDDYYYY';

const{
    TextArea 
} = Input;
const{
    Option
} = Select;

const ButtonGroup = Button.Group;

function getBase64(img, callback) {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result));
    reader.readAsDataURL(img);
}

function beforeUpload(file) {

    return false;
}


export class promo extends Component{
    
    constructor(){
        super();
        this.state = {
            promotions : [],
            promotionsLoading : false,
            displayDeleted : false,
            searchText : "",
            promotion : {},
            selectedPromo : {},
            eligibilities : [],
            promotionImage : null,
            promotionModalActive : false,
            promoImageModalActive : false,
            previewImage : "",
            isUpdating : false,
            isSaving : false,
            isValidatingPromotionCode : false,
            codeValidatingStatus : "success",
            codeValidatingMessage : "",
            isSending : false,
            inPercent : false,
            isFeatured : false,
            isDeleting : false,
            setDateEligibility : false,
            dateCriteria : {},
            setQuantityEligibility : false,
            quantityCriteria : 0,
            setServiceEligibility : false,
            serviceCriteria : [],
            setLocationEligibility : false,
            locationCriteria : "",
            services : [],
            servicesLoading : false,
            mapLat : 1,
            mapLng : 1,
            address : "",
            addressComponents : [],
            notificationModalActive : false,
            promoUsers : [],
            allUsersSelected : true,
            selectedPromoUsers : [],
            customers : [],
            broadcastPromoCode : "",
            isImgLoaded : false
        }
    }

    componentDidMount(){
        const script = document.createElement("script");

        script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyCdpvUgaSmIUmvxIOtOMuubZmVoaEQhwa4&libraries=places";
        script.async = true;

        document.body.appendChild(script);

        this.loadServices();
        this.loadPromotions();
        this.getGeoLocation();
        this.loadCustomers();
    }

    componentWillUnmount(){

    }

    // Initialize values
    loadPromotions = async () => {

        try{

            this.setState({
                promotionsLoading : true
            }, async () => {
                const { displayDeleted } = this.state;
                let promotions = await getPromotions(displayDeleted);
                this.setState({
                    promotionsLoading : false,
                    promotions : promotions!== undefined ? [...promotions] : []
                })
            })

        }catch(error){
            console.log(error)
        }
    }

    refreshPromoList = () => {
        this.setState({
            selectedPromo : {}
        }, () => {
            this.loadPromotions();
        });
    }

    loadServices = async () =>{
        let services = await getServices();
        this.setState({
            servicesLoading : false,
            services : [...services]
        })
    }

    loadCustomers = async () =>{
        let customers = await getCustomers();

        this.setState({
            customers : [...customers]
        })
    }
    // End

    searchPromos = _.debounce( async (keyword) => {

        if(keyword.length){
            this.setState({
                promotionsLoading : true,
                promotions : []
            }, async () => {
                let promotions = await searchPromos(keyword)
                this.setState({
                    promotionsLoading : false,
                    promotions : [...promotions]
                })
            })
        }else{
            this.loadPromotions()
        }

    }, 500)

    imageFileChange = info => {
      
        
        let _this = this;
        let _URL = window.URL || window.webkitURL;

        let file, image;
       
        if (file = info.file) {
        
            image = new Image();
            
            image.onload = () => {
                
                let imageAspectRatio = calculateAspectRatio(image.width, image.height);

                if(imageAspectRatio=="7:4"){
                    getBase64(file, imageUrl =>{
                        _this.setState({
                            promotionImage : imageUrl,
                            isImgLoaded : true
                        })
                });

                }else{
                    message.error("Image must have a 7:4 aspect ratio.")
                    this.setState({
                        isImgLoaded : false
                    })
                }
            };
            
            image.src = _URL.createObjectURL(file);
        }
    };

    setPromoImagePreview = (imgUrl) => {
    }

    eligibilityChange = (e) => {
        const { checked, id } = e.target;
        
        switch ( id ){
            case "dateEligibility":
                this.setState({
                    setDateEligibility : checked
                })
                break;
            case "quantityEligibility":
                this.setState({
                    setQuantityEligibility : checked
                })
                break;
            case "serviceEligibility":
                this.setState({
                    setServiceEligibility : checked
                })
                break;
            case "locationEligibility":
                this.setState({
                    setLocationEligibility : checked
                })
                break;
            default : return ""; break;
        }

    }

    // Google maps function
    getGeoLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    this.setState({
                        mapLat: position.coords.latitude,
                        mapLng: position.coords.longitude
                    })
                }
            )
        }
    }

    setAddressFromAutocomplete = ( lng, lat, address, addressComponents ) => {
        
        this.setState({
            mapLat : lat,
            mapLng : lng,
            address : addressComponents[0].long_name,
            addressComponents : [...addressComponents]
        })

        this.props.form.setFieldsValue({
            'eliLocation' : addressComponents[0].long_name
        })
    }
    // End
    
    displayPromoDetails = (promo) => {
        this.setState({
            selectedPromo : promo
        })
    }

    checkNumberInput = (rule, value, callback) => {
        if (!value.match(/^(\d+)?([.]?\d+)?$/)){
            return callback(true)
        }

        callback();
    }

    featureChange = (e) => {        
    }

    inPercentChange = (e) => {
    }

    openPromotionModal = () => {
        this.setState({
            promotionModalActive : true
        })
    }

    closePromotionModal = () => {

        this.setState({
            promotionModalActive : false,
            isUpdating : false,
            promotion : {},
            setQuantityEligibility : false,
            setLocationEligibility : false,
            setDateEligibility : false,
            setServiceEligibility : false,
            isValidatingPromotionCode : false,
            codeValidatingStatus : "success",
            codeValidatingMessage : ""
        })

    }

    openNotificationModal = async () => {
        
        const { selectedPromo } = this.state;

        this.loadCustomers();

        let u = await getPromoUsers(selectedPromo.code);
        this.setState({
            broadcastPromoCode : selectedPromo.code,
            notificationModalActive : true,
        })
        
    }

    closeNotificationModal = () => {
        this.setState({
            notificationModalActive : false,
            allUsersSelected : true,
            broadcastPromoCode : ""
        })
    }

    userSelectedChange = (e) => {
        this.setState({
            allUsersSelected : e.target.checked
        })
    }

    handleUserChange = (key,value) => {
        this.setState({
            selectedPromoUsers : [...value]
        })
    }

    sendNotification = (notification) => {

        this.props.form.validateFieldsAndScroll((err, values) => {
            if (!err) {

                try{
                    const { selectedPromoUsers, allUsersSelected, customers, broadcastPromoCode, selectedPromo } = this.state;

                    let users = [];
                    if(allUsersSelected){
                        for(var sp of customers){
                            if(sp.fcmToken!=="" && sp.fcmToken !== undefined){
                                users.push({
                                    uid : sp.uid,
                                    fcmToken : sp.fcmToken
                                })
                            }
                        }
                    }else{
                        for(var sp of selectedPromoUsers){
                            if(sp.props.value!=="" && sp.props.value !== undefined){
                                users.push({
                                    uid : sp.key,
                                    fcmToken : sp.props.value
                                })
                            }
                        }    
                    }

                    let newNotif = {
                        title : values.title,
                        body : values.body,
                        type : "promotionCode",
                        data : {
                            promotionUid : selectedPromo.uid
                        }
                    }

                    this.setState({
                        isSending : true,
                    }, async () => {
                        
                        await saveNotification(users,newNotif)
                        message.success(`Sending notifications for ${broadcastPromoCode}`)
                        this.setState({
                            isSending : false,
                            broadcastPromoCode : "",
                            selectedPromoUsers : [],
                            notificationModalActive : false
                        })

                    })


                }catch(error){
                    console.log(error)
                    message.error("Oop! Something went wrong.")
                }

            }
        });

    }

    updatePromotion = () => {

        const { selectedPromo } = this.state;

        let recordEligibilities = [...selectedPromo.eligibilities];
        let disLoc = false, disSer = false, disDate = false, disQ = false;
        let locVal = "", dateVal = {}, serVal = [], qVal = 0;

        for(var rec of recordEligibilities){
            if(rec.type=="location"){
                disLoc = true;
                locVal = rec.criteria;
            }
            if(rec.type=="date"){
                disDate = true;
                if(rec.criteria.indexOf("Invalid date")!==-1){
                    let startDate = moment(new Date())
                    let endDate = moment(new Date())
                    dateVal = {
                        startDate : startDate,
                        endDate : endDate
                    }
                }else{
                    
                    let dates = rec.criteria.split("-");
                    let sMonth = dates[0].substring(0,2);
                    let sDay = dates[0].substring(2,4);
                    let sYear = dates[0].substring(4,dates[0].length);

                    let startDate = moment(new Date(`${sMonth}-${sDay}-${sYear}`))

                    let eMonth = dates[1].substring(0,2);
                    let eDay = dates[1].substring(2,4);
                    let eYear = dates[1].substring(4,dates[0].length);

                    let endDate = moment(new Date(`${eMonth}-${eDay}-${eYear}`))
                    dateVal = {
                        startDate : startDate,
                        endDate : endDate
                    }
                }

                
            }
            if(rec.type=="service"){
                disSer = true;
                serVal = rec.criteria.split(",");
            }
            if(rec.type=="quantity"){
                disQ = true;
                qVal = rec.criteria;
            }
        }


        this.setState({
            isUpdating : true,
            promotionModalActive : true,
            setQuantityEligibility : disQ,
            quantityCriteria : qVal,
            setLocationEligibility : disLoc,
            locationCriteria : locVal,
            setServiceEligibility : disSer,
            serviceCriteria : [...serVal],
            setDateEligibility : disDate,
            dateCriteria : {...dateVal},
            promotionImage : selectedPromo.imageUrl
        });
    }

    imagePreview = (url) => {
        this.setState({
            promoImageModalActive : !this.state.promoImageModalActive,
            previewImage : url
        })
    }

    promotionCodeChange = _.debounce ((code) => {

        this.setState({
            isValidatingCode : true
        }, async () => {
            
            const { selectedPromo, isUpdating } = this.state

            if(isUpdating){
                if(selectedPromo.code===code.toUpperCase()){
                    this.setState({
                        isValidatingPromotionCode : false,
                        codeValidatingStatus : "success",
                        codeValidatingMessage : ""
                    })
                }else{
                    let data = await checkDuplicatePromotionCode(code.toUpperCase())
  
                    this.setState({
                        isValidatingPromotionCode : false,
                        codeValidatingStatus : data.code,
                        codeValidatingMessage : data.message
                    })
                }
            }else{
                let data = await checkDuplicatePromotionCode(code.toUpperCase())
  
                this.setState({
                    isValidatingPromotionCode : false,
                    codeValidatingStatus : data.code,
                    codeValidatingMessage : data.message
                })
            }  
        })
  
    },500)
    
    savePromotion = async () => {
        this.props.form.validateFieldsAndScroll((err, values) => {
            if (!err) {

                let newPromotion ;
                const { isUpdating, selectedPromo } = this.state;

                let _this = this;
                let _URL = window.URL || window.webkitURL;

                let file, image;
                file = values.imageUrl ? values.imageUrl.file : null;
                if (file) {
                
                    image = new Image();
                    
                    image.onload = () => {
                        
                        let imageAspectRatio = calculateAspectRatio(image.width, image.height);
                    
                        if(imageAspectRatio=="7:4"){

                            newPromotion = {
                                title : values.title,
                                code : values.code.toUpperCase(),
                                status : values.status,
                                description : values.description,
                                isFeatured : values.isFeatured,
                                isAdjustmentInPercent : values.isAdjustmentInPercent,
                                priceAdjustment : parseFloat(values.priceAdjustment),
                                isDeleted : false,
                                eligibilities : []
                            }
            
                            if(isUpdating){
                                newPromotion.uid = selectedPromo.uid;
                                newPromotion.imageUrl = selectedPromo.imageUrl;
                                newPromotion.dateUpdated = new Date();
                            }else{
                                newPromotion.dateAdded = new Date();
                            }
            
                            let eligibilities = [];
            
                            const { setDateEligibility, setQuantityEligibility, setServiceEligibility, setLocationEligibility } = _this.state;
            
                            if( setDateEligibility ){
            
                                let startDate = values.eliDateRange[0];
                                let endDate = values.eliDateRange[1];
            
                                eligibilities.push({
                                    type : "date",
                                    criteria : moment(startDate).format('MMDDYYYY') + "-" + moment(endDate).format('MMDDYYYY')
                                })
                            }
            
                            if( setQuantityEligibility ){
                                eligibilities.push({
                                    type : "quantity",
                                    criteria : values.eliQuantity
                                })
                            }
            
                            if( setServiceEligibility ){
                                let serviceValues = values.eliService.join(",");
                                eligibilities.push({
                                    type : "service",
                                    criteria : serviceValues
                                })
                                
                            }
            
                            if( setLocationEligibility ){
                                eligibilities.push({
                                    type : "location",
                                    criteria : _this.state.address
                                })
                            }
            
                            newPromotion.eligibilities = [...eligibilities]
                            
                            try{
            
                                _this.setState({
                                    isSaving : true,
            
                                }, async () => {
                                    
                                    await savePromotion(Object.assign( {}, newPromotion), values.imageUrl ? values.imageUrl.file : null)
                                    message.success("Promotion saved.")
                                    _this.setState({
                                        isSaving : false,
                                        isUpdating : false,
                                        promotion : {},
                                        promotionModalActive : false,
                                        setQuantityEligibility : false,
                                        setLocationEligibility : false,
                                        setDateEligibility : false,
                                        setServiceEligibility : false,
                                        promotionImage : null,
                                        selectedPromo : {}
                                    })
            
                                    _this.loadPromotions()
                                })
            
            
                            }catch(error){
                                console.log(error)
                                message.error("Oop! Something went wrong.")
                            }


                        }else{
                            message.error("Image must have a 7:4 aspect ratio.")
                            
                        }
                    };
                    
                    image.src = _URL.createObjectURL(file);
                }else{
                
                    newPromotion = {
                        title : values.title,
                        code : values.code.toUpperCase(),
                        status : values.status,
                        description : values.description,
                        isFeatured : values.isFeatured,
                        isAdjustmentInPercent : values.isAdjustmentInPercent,
                        priceAdjustment : values.priceAdjustment,
                        isDeleted : false,
                        eligibilities : []
                    }
    
                    if(isUpdating){
                        newPromotion.uid = selectedPromo.uid;
                        newPromotion.imageUrl = selectedPromo.imageUrl;
                        newPromotion.dateUpdated = new Date();
                    }else{
                        newPromotion.dateAdded = new Date();
                    }
    
                    let eligibilities = [];
    
                    const { setDateEligibility, setQuantityEligibility, setServiceEligibility, setLocationEligibility } = _this.state;
    
                    if( setDateEligibility ){
    
                        let startDate = values.eliDateRange[0];
                        let endDate = values.eliDateRange[1];
    
                        eligibilities.push({
                            type : "date",
                            criteria : moment(startDate).format('MMDDYYYY') + "-" + moment(endDate).format('MMDDYYYY')
                        })
                    }
    
                    if( setQuantityEligibility ){
                        eligibilities.push({
                            type : "quantity",
                            criteria : values.eliQuantity
                        })
                    }
    
                    if( setServiceEligibility ){
                        let serviceValues = values.eliService.join(",");
                        eligibilities.push({
                            type : "service",
                            criteria : serviceValues
                        })
                        
                    }
    
                    if( setLocationEligibility ){
                        eligibilities.push({
                            type : "location",
                            criteria : _this.state.address
                        })
                    }
    
                    newPromotion.eligibilities = [...eligibilities]
                    
                    try{
    
                        _this.setState({
                            isSaving : true,
    
                        }, async () => {
                            
                            await savePromotion(Object.assign( {}, newPromotion), values.imageUrl ? values.imageUrl.file : null)
                            message.success("Promotion saved.")
                            _this.setState({
                                isSaving : false,
                                isUpdating : false,
                                promotion : {},
                                promotionModalActive : false,
                                setQuantityEligibility : false,
                                setLocationEligibility : false,
                                setDateEligibility : false,
                                setServiceEligibility : false,
                                promotionImage : null,
                                selectedPromo : {}
                            })
    
                            _this.loadPromotions()
                        })
    
    
                    }catch(error){
                        console.log(error)
                        message.error("Oop! Something went wrong.")
                    }
                    
                }

            }else{
                this.setState({
                    codeValidatingStatus : "error",
                    codeValidatingMessage : err.code.errors[0].message
                })
            }
        });
    }

    displayDeleted = async () => {

        try{
            this.setState({
                displayDeleted : !this.state.displayDeleted
            }, async() =>{
                await this.loadPromotions();
            })
        }catch(error){
            console.log(error);
            throw(error)
        }
    }

    deletePromotion = async () => {
        try{
            this.setState({
                isDeleting : true
            }, async () => {
                const { selectedPromo } = this.state;

                await deletePromotion(selectedPromo.uid);
                this.setState({
                    isDeleting : false,
                    selectedPromo : {}
                })
                message.success("Promotion deleted.")
                await this.loadPromotions();
            })
        }catch(error){
            console.log(error)
            message.error(`[ERROR] ${error.message}`)
            throw(error)
        }
    }

    render(){

        const {
            promotionModalActive,
            promoImageModalActive,
            previewImage,
            promotionsLoading,
            displayDeleted,
            promotions,
            selectedPromo,
            promotion,
            isUpdating,
            isSaving,
            isSending,
            isDeleting,
            promotionImage,
            setDateEligibility,
            dateCriteria,
            setQuantityEligibility,
            quantityCriteria,
            setServiceEligibility,
            serviceCriteria,
            setLocationEligibility,
            locationCriteria,
            services,
            mapLat,
            mapLng,
            address,
            notificationModalActive,
            promoUsers,
            selectedPromoUsers,
            allUsersSelected,
            customers,
            broadcastPromoCode,
            isValidatingPromotionCode,
            codeValidatingMessage,
            codeValidatingStatus
        } = this.state

        const { getFieldDecorator, getFieldValue } = this.props.form;
  
        return(

            <div>
                <div className="content-header">Promotions</div>
                    <div style={{ display : "flex", height: this.props.height - 130 }}> 
                        <div style={{ position: "relative", flex: "1 0 25%" , maxWidth : "420px" , minWdith : "140px"}}>
                            <div className="promo-list-header">
                                <Button style={{ float: "left", zIndex : "10" }} onClick={this.openPromotionModal}><Icon type="plus" />New Promotion</Button>
                                <Button style={{ float :"right", zIndex : "10" }} onClick={this.refreshPromoList}><Icon type="retweet" /></Button>
                                <Form>
                                    <Form.Item style={{marginBottom: "0"}}>
                                        <Input
                                            style={{ marginBottom: "0", width: "100%"}}
                                            onKeyUp={(e) => this.searchPromos(e.target.value)}
                                            placeholder="Search promotions"
                                            suffix={
                                                <Tooltip title="Search criteria : Code, Description, Title, Promotion criteria, Status">
                                                <Icon type="info-circle" style={{ color: 'rgba(0,0,0,.45)' }} />
                                                </Tooltip>
                                            }
                                        />
                                    </Form.Item>
                                </Form>
                            </div>
                            <div className="promo-list-body">
                                {
                                    promotionsLoading ? <div style={{ marginTop: "200px", textAlign : "center" }}>
                                    <Spin size="large"/>
                                    </div> :
                                    promotions.length==0 ? <p className="promo-no-list">No promotion on the list.</p> :
                                    <Scrollbars style={{ height: this.props.height - 240 }}>
                                        {
                                            promotions.map( (data,i) => (
                                                <PromoItem displayPromoDetails={this.displayPromoDetails} key={i} promo={data}/>
                                            ))
                                        }
                                    </Scrollbars>
                                }
                            </div>
                            <div className="promo-list-footer">
                                {/* <div style={{ textAlign: "left", flex : "1" }}>
                                    { hasPrev && <Button  disabled={promotionsLoading} onClick={this.prevPage} icon="caret-left" type="default"></Button> }
                                </div>
                                <div style={{ textAlign: "center", flex : "1" }}>
                                    { promotions && promotions.length > 0 && <span style={{ display: "block", marginTop:"10px", color: "#1b1b1b"}}>Page 1</span> }
                                </div>
                                <div style={{ textAlign: "right", flex : "1" }}>
                                    { hasNext && <Button style={{ float: "right" }} disabled={promotionsLoading} onClick={this.nextPage} icon="caret-right" type="default"></Button>}
                                </div> */}
                            </div>
                        </div>
                        <div style={{ flex: "1 1 0%", maxWidth: this.props.view }}>
                            <div style={{ flex : "2 0 0%", width: "100%", overflow : "hidden", position : "relative", display : "flex", flexDirection : "column", borderLeft: "1px solid #e4e4e4"}}>
                                <div className="promo-details-header">
                                    {
                                        Object.keys(selectedPromo).length == 0 ? "" :
                                        <div className="pd-actions">
                                            <ButtonGroup>

                                                <Button onClick={this.updatePromotion} loading={isDeleting} title="Update promotion" className="action-update"><Icon type="edit"/></Button>
                                                <Button title="Broadcast notification" loading={isSending || isDeleting} className="action-broadcast" onClick={this.openNotificationModal}><Icon type="notification"/></Button>                                                
                                                <Popconfirm
                                                    title="Are you sure you want to remove this promotion code?"
                                                    onConfirm={this.deletePromotion}
                                                    okText="Yes"
                                                    cancelText="No"
                                                >
                                                    <Button loading={isDeleting} title="Delete promotion" className="action-delete"><Icon type="delete"/></Button>
                                                </Popconfirm>
                                            </ButtonGroup>
                                        </div> 
                                    }
                                </div>
                                <div className="promo-details-body">
                                    {
                                        Object.keys(selectedPromo).length == 0 ? 
                                        <p className="no-selected-promo">Please select a promotion</p> :
                                        <Scrollbars style={{ height: this.props.height - 190 }}>
                                            <div className="promo-details">
                                                <div className="pd-section">
                                                    <p className="pd-section-header">Promotion Information</p>
                                                    <Row style={{ marginBottom: "10px" }}>
                                                        <Col span={12}>
                                                            <span className="pd-label">TITLE</span>
                                                            <span className="pd-value">{selectedPromo.title}</span>
                                                        </Col>
                                                        <Col span={12}>
                                                            <span className="pd-label">CODE</span>
                                                            <span className="pd-value">{selectedPromo.code}</span>
                                                        </Col>
                                                    </Row>
                                                    <Row style={{ marginBottom: "10px" }}>
                                                        <Col span={24}>
                                                            <span className="pd-label">DESCRIPTION</span>
                                                            <span className="pd-value">{selectedPromo.description}</span>
                                                        </Col>
                                                    </Row>
                                                    <Row style={{ marginBottom : "10x"}}>
                                                        <Col span={24}>
                                                            <span className="pd-label">PROMOTION PHOTO</span>
                                                            <img className="pd-image" onClick={ () => this.imagePreview(selectedPromo.imageUrl) } src={selectedPromo.imageUrl}/>
                                                        </Col>
                                                    </Row>
                                                </div>
                                                <div className="pd-section">
                                                    <p className="pd-section-header">Eligibilities</p>
                                                    {
                                                        selectedPromo.eligibilities.map( (eligibility,i) => {

                                                            let criteria = "";
            
                                                            criteria = eligibility.criteria;
            
                                                            if(eligibility.type=="date"){
                                                                let dates = eligibility.criteria.split("-");
                                                                let sMonth = dates[0].substring(0,2);
                                                                let sDay = dates[0].substring(2,4);
                                                                let sYear = dates[0].substring(4,dates[0].length);
            
                                                                let startDate = moment(new Date(`${sMonth}-${sDay}-${sYear}`)).format("LL");
            
                                                                let eMonth = dates[1].substring(0,2);
                                                                let eDay = dates[1].substring(2,4);
                                                                let eYear = dates[1].substring(4,dates[0].length);
            
                                                                let endDate = moment(new Date(`${eMonth}-${eDay}-${eYear}`)).format("LL");
                                                                criteria = `${startDate} - ${endDate}`
                                                            }
            
                                                            return (
                                                                <div className="pd-eligibility" key={i}>
                                                                    <span className="pd-label" style={{ textTransform: "uppercase" }}>{eligibility.type}</span>
                                                                    <span className="pd-value">{criteria}</span>
                                                                </div>)
                                                        })
                                                    }
                                                </div>
                                            </div>
                                        </Scrollbars>
                                    }
                                </div>
                                <div className="promo-details-footer">

                                </div>
                            </div>
                        </div>
                        {/* 
                            MODALS
                        */}

                        {
                            promoImageModalActive && <Modal visible={promoImageModalActive} footer={null} onCancel={ () => this.imagePreview('')}>
                                <img style={{ width: '100%' }} src={previewImage} />
                            </Modal>
                        }
                        {
                            notificationModalActive && <Modal
                                width={500}
                                visible={notificationModalActive}
                                onClose={this.closeNotificationModal}
                                title="Send notification"
                                okText="Send"
                                onOk={this.sendNotification}
                                onCancel={this.closeNotificationModal}
                                confirmLoading={isSending}
                                okButtonProps={{ disabled: isSending }}
                                cancelButtonProps={{ disabled: isSending }}
                                closable={false}
                                maskClosable={false}
                            >
                                <Form>
                                    <Row gutter={24}>
                                        <Col>
                                        <Form.Item label="Title">
                                            {
                                                getFieldDecorator('title', {
                                                    rules : [
                                                        {  
                                                            required : true,
                                                            message : "Please input a title"
                                                        }
                                                    ]
                                                })(
                                                    <Input
                                                        placeholder={`Notification title for ${broadcastPromoCode}`}
                                                        className="form-control"
                                                    />
                                                )
                                            }
                                        </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row gutter={24}>
                                        <Col>
                                        <Form.Item label="Message">
                                            {getFieldDecorator('body', {
                                                rules :[
                                                    { required : true, message : "Please add a message"}
                                                ]
                                                }
                                            )(
                                                <TextArea rows={3} placeholder={`Notification body for ${broadcastPromoCode}`}></TextArea>
                                            )}
                                            
                                        </Form.Item>
                                        </Col>
                                    </Row>
                                    <Form.Item label="">
                                        {
                                        getFieldDecorator('isAll', 
                                        { 
                                            initialValue : allUsersSelected,
                                            valuePropName: 'checked' 
                                        }
                                        )(<Checkbox 
                                            onChange={this.userSelectedChange}
                                        >Select All</Checkbox>)}
                                    </Form.Item>
                                    {
                                        
                                        !allUsersSelected && 
                                        <Row gutter={24}>
                                            <Col>
                                            <Form.Item label="Users">
                                                {getFieldDecorator('users',{
                                                        rules : [ { required : true, message : "Please select user/s." }]
                                                    }
                                                )(
                                                    <Select
                                                        placeholder="Select user/s"
                                                        size="large"
                                                        mode="multiple"
                                                        onChange={this.handleUserChange}
                                                    >
                                                        {
                                                            customers.map( (data, key) =>
                                                                <Option key={data.uid} value={data.fcmToken}>{data.fullName}</Option>
                                                            )
                                                        }
                                                    </Select>
                                                )}
                                                
                                            </Form.Item>
                                            </Col>
                                        </Row>
                                    }
                                        
                                </Form>
                            </Modal>
                        }
                        {
                            promotionModalActive && <Modal
                                width={900}
                                visible={promotionModalActive}
                                onClose={this.closePromotionModal}
                                title={ isUpdating ? "Update Promotion" : "New Promotion"}
                                okText="Submit"
                                onOk={this.savePromotion}
                                onCancel={this.closePromotionModal}
                                confirmLoading={isSaving}
                                okButtonProps={{ disabled: isSaving }}
                                cancelButtonProps={{ disabled: isSaving }}
                                closable={false}
                                maskClosable={false}
                            >
                                <Form>
                                    <Row gutter={24}>
                                        <Col span={12}>
                                        <Row gutter={24}>
                                                <Col span={16}>
                                                    <Form.Item label="Promotion Title"
                                                        >
                                                        {
                                                            getFieldDecorator('title', {
                                                                initialValue : isUpdating ? selectedPromo.title : "",
                                                                rules : [
                                                                    {  
                                                                        required : true,
                                                                        message : "Please input a promotion title"
                                                                    }
                                                                ]
                                                            })(
                                                                <Input
                                                                    placeholder="Enter promotion title"
                                                                    className="form-control"
                                                                />
                                                            )
                                                        }
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                            <Row gutter={24}>
                                                <Col span={16}>
                                                    <Form.Item label="Promotion Code"
                                                        validateStatus={isValidatingPromotionCode ? "validating" : codeValidatingStatus}
                                                        help={isValidatingPromotionCode ? "" : codeValidatingMessage }>
                                                        {
                                                            getFieldDecorator('code', {
                                                                initialValue : isUpdating ? selectedPromo.code : "",
                                                                rules : [
                                                                    {  
                                                                        required : true,
                                                                        message : "Please input a promotion code"
                                                                    }
                                                                ]
                                                            })(
                                                                <Input
                                                                    placeholder="Enter promotion code"
                                                                    className="form-control upper"
                                                                    onChange={(e) => this.promotionCodeChange(e.target.value)}
                                                                />
                                                            )
                                                        }
                                                    </Form.Item>
                                                </Col>
                                                <Col span={8}>
                                                    <Form.Item label="Featured">
                                                        {
                                                            getFieldDecorator('isFeatured', 
                                                            { 
                                                                valuePropName: 'checked',
                                                                initialValue : isUpdating ? selectedPromo.isFeatured : false,
                                                            })(<Switch 
                                                                onChange={this.handleFeatureChange}
                                                                checkedChildren="Yes"
                                                                unCheckedChildren="No"
                                                            />)}
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                            <Form.Item label="Promotion image">
                                                {getFieldDecorator('imageUrl', {
                                                        rules : [
                                                            { required : isUpdating ? false : true , message : "Please add an image to the promotion."}
                                                        ]
                                                    }
                                                )(
                                                    <Upload 
                                                        accept="image/*"
                                                        showUploadList={false}
                                                        beforeUpload={beforeUpload}
                                                        onChange={this.imageFileChange}
                                                    >
                                                        <Button>
                                                            <Icon type="upload" /> Upload
                                                        </Button>
                                                    </Upload>
                                                )}
                                                <img style={{ width: "100%", height: "200px"}} src={promotionImage}></img>
                                            </Form.Item>
                                            <Form.Item label="Promotion description">
                                                {getFieldDecorator('description', {
                                                    initialValue : isUpdating ? selectedPromo.description : "",
                                                    rules :[
                                                        { required : true, message : "Please add a description to the promotion."}
                                                    ]
                                                    }
                                                )(
                                                    <TextArea onBlur={this.handleDescriptionOnBlur} rows={2}></TextArea>
                                                )}
                                                
                                            </Form.Item>
                                            <Row>
                                                <Col span={12}>
                                                    <Form.Item label="Is in percent?">
                                                        {
                                                            getFieldDecorator('isAdjustmentInPercent', 
                                                            { 
                                                                valuePropName: 'checked',
                                                                initialValue : isUpdating ? selectedPromo.isAdjustmentInPercent : false,
                                                            })(<Switch 
                                                                onChange={this.handleInPercentChange}
                                                                checkedChildren="Yes"
                                                                unCheckedChildren="No"
                                                            />)}
                                                    </Form.Item>
                                                </Col>
                                                <Col span={12}>
                                                    <Form.Item label="Price adjusment">
                                                            {getFieldDecorator('priceAdjustment', {
                                                                getValueFromEvent: (e: React.FormEvent<HTMLInputElement>) => {
                                                                  const convertedValue = parseInt(e.currentTarget.value);
                                                                  if (isNaN(convertedValue)) {
                                                                    return parseInt(this.props.form.getFieldValue("priceAdjustment"));
                                                                  } else {
                                                                    return Math.round(convertedValue);
                                                                  }
                                                                },
                                                                initialValue : isUpdating ? selectedPromo.priceAdjustment : "",
                                                                rules : [
                                                                    {
                                                                        required : true,
                                                                        message : "Please add a price adjustment value."
                                                                    },
                                                                    {
                                                                        type : "number",
                                                                        min : 1,
                                                                        max : this.props.form.getFieldValue('isAdjustmentInPercent') ? 100 : null,
                                                                        message : this.props.form.getFieldValue('isAdjustmentInPercent') ? "Please input a valid number from 1 to 100" : "Please input a valid number at least 1"
                                                                    }
                                                                ]
                                                            })( <Input
                                                                placeholder="Enter price adjustment"
                                                                className="form-control"
                                                            />)}
                                                        </Form.Item>
                                                </Col>
                                            </Row>
                                            <Form.Item label="Status">
                                                {
                                                    getFieldDecorator('status',
                                                    {
                                                        initialValue  : isUpdating ? selectedPromo.status : "draft"
                                                    })(<Radio.Group value="draft">
                                                        <Radio.Button value="draft">Draft</Radio.Button>
                                                        <Radio.Button value="published">Published</Radio.Button>
                                                    </Radio.Group>)
                                                }
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item label="">
                                                {
                                                getFieldDecorator('dateEligibility', 
                                                { 
                                                    initialValue : isUpdating ? setDateEligibility : false,
                                                    valuePropName: 'checked' 
                                                }
                                                )(<Checkbox 
                                                    onChange={this.eligibilityChange}
                                                >Date eligibility</Checkbox>)}
                                            </Form.Item>
                                            {
                                                setDateEligibility && <Form.Item>
                                                    {
                                                        getFieldDecorator('eliDateRange',
                                                        {   
                                                            initialValue : isUpdating && Object.keys(dateCriteria).length!==0 ? [moment(dateCriteria.startDate, dateFormat), moment(dateCriteria.endDate, dateFormat)] : [moment(new Date(), dateFormat), moment(new Date(), dateFormat)],
                                                            rules : [
                                                                {
                                                                    required : true,
                                                                    message : "Please select dates"
                                                                }
                                                            ]
                                                        }
                                                        )(<RangePicker
                                                            format={dateFormat}
                                                        />)
                                                    }
                                                </Form.Item>
                                            }
                                            <Form.Item label="">
                                                {
                                                getFieldDecorator('quantityEligibility', 
                                                { 
                                                    initialValue : isUpdating ? setQuantityEligibility : false,
                                                    valuePropName: 'checked' 
                                                }
                                                )(<Checkbox 
                                                    onChange={this.eligibilityChange}
                                                >Quantity eligibility</Checkbox>)}
                                            </Form.Item>
                                            {
                                                setQuantityEligibility && <Form.Item>
                                                    {getFieldDecorator('eliQuantity', {
                                                        getValueFromEvent: (e: React.FormEvent<HTMLInputElement>) => {
                                                          const convertedValue = parseInt(e.currentTarget.value);
                                                          if (isNaN(convertedValue)) {
                                                            return parseInt(this.props.form.getFieldValue("eliQuantity"));
                                                          } else {
                                                            return Math.round(convertedValue);
                                                          }
                                                        },
                                                        initialValue : isUpdating ? quantityCriteria : "",
                                                        rules : [
                                                            {
                                                                required : true,
                                                                type : "number",
                                                                min : 1,
                                                                message : "Please add quantity."
                                                            }
                                                        ]
                                                    })( <Input
                                                        placeholder="Enter quantity"
                                                        className="form-control"
                                                    />)}
                                                </Form.Item>
                                            }
                                            <Form.Item label="">
                                                {
                                                getFieldDecorator('serviceEligibility', 
                                                { 
                                                    initialValue : isUpdating ? setServiceEligibility : false,
                                                    valuePropName: 'checked' 
                                                }
                                                )(<Checkbox 
                                                    onChange={this.eligibilityChange}
                                                >Service eligibility</Checkbox>)}
                                            </Form.Item>
                                            {
                                                setServiceEligibility && <Form.Item label="Service">
                                                {getFieldDecorator('eliService',{
                                                        validateTrigger : ['onChange'],
                                                        initialValue : isUpdating ? serviceCriteria : [],
                                                        rules : [ { required : true, message : "Please select a service." }]
                                                    }
                                                )(
                                                    <Select
                                                        placeholder="Select service/s"
                                                        size="large"
                                                        mode="multiple"
                                                        onChange={this.handleServiceChange}
                                                    >
                                                        {
                                                            services.map( (data, key) =>
                                                                <Option key={key} value={data.serviceName}>{data.serviceName}</Option>
                                                            )
                                                        }
                                                    </Select>
                                                )}
                                                
                                            </Form.Item>
                                            }
                                            <Form.Item label="">
                                                {
                                                getFieldDecorator('locationEligibility', 
                                                { 
                                                    initialValue : isUpdating ? setLocationEligibility : false,
                                                    valuePropName: 'checked' 
                                                }
                                                )(<Checkbox 
                                                    onChange={this.eligibilityChange}
                                                >Location eligibility</Checkbox>)}
                                            </Form.Item>
                                            {
                                                setLocationEligibility && <Form.Item>
                                                    {
                                                        getFieldDecorator('eliLocation',
                                                        {
                                                            initialValue : isUpdating && locationCriteria ? locationCriteria : address,
                                                            rules : [
                                                                {
                                                                    required : true,
                                                                    message : "Please select a location"
                                                                }
                                                            ]
                                                        })( <Input
                                                            disabled={true}
                                                            className="form-control"
                                                        />)
                                                    }
                                                    <br/>

                                                    <AutoComplete
                                                        customSearchOptions={{ types: ['(cities)'] }}
                                                        setAddressFromAutocomplete={ (lng, lat, address, addressComponents ) => this.setAddressFromAutocomplete(lng,lat,address, addressComponents ) }
                                                    >

                                                    </AutoComplete>

                                                    {/* <Map
                                                        google={this.props.google}
                                                        center={ isUpdating? "" : {lat: mapLat, lng: mapLng}}
                                                        height='0'
                                                        zoom={15}
                                                        isDraggable={false}
                                                        setAddressFromAutocomplete={ (lng, lat, address, addressComponents ) => this.setAddressFromAutocomplete(lng,lat,address, addressComponents ) }
                                                        displayType = {'(cities)'}
                                                    /> */}
                                                
                                                </Form.Item>
                                                
                                            }
                                        </Col>
                                    </Row>
                                    
                                </Form>

                            </Modal>
                        }
                </div>
            </div>
        )
    }

}

const mapStateToProps = state => ({
    ...state.App
})
const Wrappedpromo = Form.create()(promo)
export default connect(mapStateToProps)(Wrappedpromo);
