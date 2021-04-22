import React, { Component } from 'react';

import Map from '../../components/googleMaps/Map';
import Modal from '../../components/feedback/modal';
import Spin from '../../components/uielements/spin';
import Button from '../../components/uielements/button';
import PriceInput from '../../components/helpers/PriceInput';
import NumberInput from '../../components/helpers/NumberInput';

import {
    Row,
    Col,
    Form,
    Input,
    Select,
    DatePicker,
    Checkbox,
    Icon,
    Switch,
    Upload
}  from 'antd'

import moment from 'moment';

import './modal.css'

const { MonthPicker, RangePicker } = DatePicker;

const dateFormat = 'YYYY/MM/DD';
const monthFormat = 'YYYY/MM';

const dateFormatList = ['DD/MM/YYYY', 'DD/MM/YY'];

const{
    TextArea 
} = Input;

const{
    Option
} = Select;


function getBase64(img, callback) {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result));
    reader.readAsDataURL(img);
}

function beforeUpload(file) {

    const isJPG = file.type === 'image/jpeg';
    if (!isJPG) {
        console.log('You can only upload JPG file!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
        console.log('Image must smaller than 2MB!');
    }
    
    return false;
}

export const PromotionForm = Form.create()(
    class extends Component{
        
        state = {
            promotion : {},
            eligibilities : [],
            promotionImage : null,
            promotionModalActive : false,
            isUpdating : false,
            setDateEligibility : false,
            setQuantityEligibility : false,
            setServiceEligibility : false,
            setLocationEligibility : false,
            services : [],
            servicesLoading : false,
            mapLat : 1,
            mapLng : 1,
            address : ""
        }

        componentDidMount(){
            this.getGeoLocation();
        }
    
        handleChange = info => {
            getBase64(info.file, imageUrl =>
                this.setState({
                    promotionImage : imageUrl
                })
            );
        };
    
        handleDescriptionOnBlur = () => {
    
        }
    
        handleEligibilityChange = (e) => {
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
    
        handleServiceChange = (value) => {
            const { services, items } = this.state;
            console.log(value);
        }
    
        /**
         * Google maps function
        */
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
    
        setAddress = ( lng, lat, address ) => {
            this.setState({
                mapLat : lat,
                mapLng : lng,
                address : address
            })
        }
    
        checkPrice = (rule, value, callback) => {
            if (value.number > 0) {
              callback();
              return;
            }
            callback('Price must greater than zero!');
        }
    
        checkNumber = (rule, value, callback) => {
            if (value.number > 0) {
              callback();
              return;
            }
            callback('Quantity must greater than zero!');
        }
    
        closeModal = () => {
            this.props.handlePromotionModal();
        }
    
        render () {
    
            const {
                isUpdating,
                isSaving,
                promotionImage,
                setDateEligibility,
                setQuantityEligibility,
                setServiceEligibility,
                setLocationEligibility,
                mapLat,
                mapLng,
                address
            }  = this.state;
    
            const {
                services,
                isPromotionModalActive
            } = this.props;
    
            const { getFieldDecorator, getFieldValue } = form;
            let formItemValues = [];
    
            getFieldDecorator('keys', { initialValue: [...formItemValues] });
            const keys = getFieldValue('keys');
    
            return (
                <Modal
                    width={900}
                    onClose={this.closeModal}
                    visible={isPromotionModalActive}
                    title={ isUpdating ? "Update Promotion" : "New Promotion"}
                    okText="Submit"
                    onOk={this.handleSave}
                    onCancel={this.handlePromotionModal}
                    confirmLoading={isSaving}
                    okButtonProps={{ disabled: isSaving }}
                    cancelButtonProps={{ disabled: isSaving }}
                >
                    <Form>
                        <Row gutter={24}>
                            <Col span={12}>
                                <Row gutter={24}>
                                    <Col span={16}>
                                        <Form.Item label="Promotion Code">
                                            {
                                                getFieldDecorator('code', {
                                                    rules : [
                                                        {
                                                            required : true,
                                                            message : "Please input a promotion code"
                                                        }
                                                    ]
                                                })(
                                                    <Input
                                                        value={ isUpdating ? "" : "" }
                                                        placeholder="Enter promotion code"
                                                        className="form-control"
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
                                                    valuePropName: 'checked' }
                                                )(<Switch 
                                                    checkedChildren="Yes"
                                                    unCheckedChildren="No"
                                                />)}
                                        </Form.Item>
                                    </Col>
                                </Row>
                                
                                
                                <Form.Item label="Promotion image">
                                    {getFieldDecorator('imageUrl', {
                                            rules : [
                                                { required : true, message : "Please add an image to the promotion."}
                                            ]
                                        }
                                    )(
                                        <Upload 
                                            showUploadList={false}
                                            beforeUpload={beforeUpload}
                                            onChange={this.handleChange}
                                        >
                                            <Button>
                                                <Icon type="upload" /> Upload
                                            </Button>
                                        </Upload>
                                    )}
                                    <img style={{ width: "100%", height: "200px"}} src={promotionImage}></img>
                                </Form.Item>
                                <Row gutter={24}>
                                    <Col span={16}>
                                        <Form.Item label="Promotion description">
                                            {getFieldDecorator('description', {
                                                initialValue : isUpdating ? "" : "",
                                                rules :[
                                                    { required : true, message : "Please add a description to the promotion."}
                                                ]
                                                }
                                            )(
                                                <TextArea onBlur={this.handleDescriptionOnBlur} rows={2}></TextArea>
                                            )}
                                            
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item label="Price adjusment">
                                            {getFieldDecorator('priceAdjustment', {
                                                initialValue: { number: 0 },
                                                rules: [{ validator: this.checkPrice }],
                                            })(<PriceInput />)}
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="">
                                    {
                                    getFieldDecorator('dateEligibility', 
                                    { 
                                        valuePropName: 'checked' }
                                    )(<Checkbox 
                                        onChange={this.handleEligibilityChange}
                                    >Date eligibility</Checkbox>)}
                                </Form.Item>
                                {
                                    setDateEligibility && <Form.Item>
                                        {
                                            getFieldDecorator('eliDateRange',
                                            {
                                                rules : [
                                                    {
                                                        required : true,
                                                        message : "Please select dates"
                                                    }
                                                ]
                                            }
                                            )(<RangePicker
                                                defaultValue={[moment(new Date(), dateFormat), moment(new Date(), dateFormat)]}
                                                format={dateFormat}
                                            />)
                                        }
                                    </Form.Item>
                                }
                                <Form.Item label="">
                                    {
                                    getFieldDecorator('quantityEligibility', 
                                    { 
                                        valuePropName: 'checked' }
                                    )(<Checkbox 
                                        onChange={this.handleEligibilityChange}
                                    >Quantity eligibility</Checkbox>)}
                                </Form.Item>
                                {
                                    setQuantityEligibility && <Form.Item>
                                        {getFieldDecorator('eliQuantity', {
                                            initialValue: { number: 0 },
                                            rules: [{ validator: this.checkNumber }],
                                        })(<NumberInput />)}
                                    </Form.Item>
                                }
                                <Form.Item label="">
                                    {
                                    getFieldDecorator('serviceEligibility', 
                                    { 
                                        valuePropName: 'checked' }
                                    )(<Checkbox 
                                        onChange={this.handleEligibilityChange}
                                    >Service eligibility</Checkbox>)}
                                </Form.Item>
                                {
                                    setServiceEligibility && <Form.Item label="Service">
                                    {getFieldDecorator('eliService',{
                                            validateTrigger : ['onChange'],
                                            rules : [ { required : true, message : "Please select a service." }]
                                        }
                                    )(
                                        <Select
                                            placeholder="Select service"
                                            size="large"
                                            onChange={this.handleServiceChange}
                                        >
                                            <Option value={""}>Select service</Option>
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
                                        valuePropName: 'checked' }
                                    )(<Checkbox 
                                        onChange={this.handleEligibilityChange}
                                    >Location eligibility</Checkbox>)}
                                </Form.Item>
                                {
                                    setLocationEligibility && <Form.Item>
                                        {
                                            getFieldDecorator('eliLocation',
                                            {
                                                initialValue : address,
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
                                        <Map
                                            google={this.props.google}
                                            center={{lat: mapLat, lng: mapLng}}
                                            height='0'
                                            zoom={15}
                                            isDraggable={false}
                                            setAddress={ (lng, lat, address) => this.setAddress(lng,lat,address) }
                                        />
                                    
                                    </Form.Item>
                                    
                                }
                            </Col>
                        </Row>
                        
                    </Form>
    
                </Modal>
            )
    
        }
    
    }
)

