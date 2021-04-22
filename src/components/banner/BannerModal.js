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
    Checkbox,
    Icon,
    Switch,
    Upload
}  from 'antd'

import moment from 'moment';

import './modal.css'


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

export const BannerForm = Form.create()(
    class extends Component{
        
        state = {
            banner : {},
            bannerImage : null,
            bannerModalActive : false,
            isUpdating : false,
        }

        componentDidMount(){
        }
    
        handleChange = info => {
            getBase64(info.file, imageUrl =>
                this.setState({
                    bannerImage : imageUrl
                })
            );
        };
    
        handleDescriptionOnBlur = () => {
    
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
                bannerImage,
            }  = this.state;
    
            const {
                services,
                isBannerModalActive
            } = this.props;
    
            const { getFieldDecorator, getFieldValue } = form;
            let formItemValues = [];
    
            getFieldDecorator('keys', { initialValue: [...formItemValues] });
            const keys = getFieldValue('keys');
    
            return (
                <Modal
                    width={900}
                    onClose={this.closeModal}
                    visible={isBannerModalActive}
                    title={ isUpdating ? "Update Banner" : "New Banner"}
                    okText="Submit"
                    onOk={this.handleSave}
                    onCancel={this.handleBannerModal}
                    confirmLoading={isSaving}
                    okButtonProps={{ disabled: isSaving }}
                    cancelButtonProps={{ disabled: isSaving }}
                >
                    <Form>
                        <Row gutter={24}>
                            <Col span={12}>
                                <Row gutter={24}>
                                    <Col span={16}>
                                        <Form.Item label="Banner Title">
                                            {
                                                getFieldDecorator('title', {
                                                    rules : [
                                                        {
                                                            required : true,
                                                            message : "Please input a banner title"
                                                        }
                                                    ]
                                                })(
                                                    <Input
                                                        value={ isUpdating ? ""  : "" }
                                                        placeholder="Enter banner title"
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
                                
                                
                                <Form.Item label="Banner image">
                                    {getFieldDecorator('imageUrl', {
                                            rules : [
                                                { required : true, message : "Please add an image to the banner."}
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
                                    <img style={{ width: "100%", height: "200px"}} src={bannerImage}></img>
                                </Form.Item>
                                <Row gutter={24}>
                                    <Col span={16}>
                                        <Form.Item label="Banner description">
                                            {getFieldDecorator('description', {
                                                initialValue : isUpdating ? "" : "",
                                                rules :[
                                                    { required : true, message : "Please add a description to the banner."}
                                                ]
                                                }
                                            )(
                                                <TextArea onBlur={this.handleDescriptionOnBlur} rows={2}></TextArea>
                                            )}
                                            
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </Form>
                </Modal>
            )
    
        }
    
    }
)

