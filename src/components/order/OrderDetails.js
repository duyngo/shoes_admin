import React, { Component } from 'react';

import { connect } from "react-redux";

import {
    updateOrderStatus
} from '../../helpers/order/orderRepo';

import Tags from '../uielements/tag';
import TagWrapper from '../../containers/Tags/tag.style';
import OrderHelper from '../../helpers/order';
import Scrollbars from '../utility/customScrollBar.js';
import Button, { ButtonGroup } from '../uielements/button';
import Modal from '../feedback/modal';
import Select, {
    SelectOption as Option,
  } from '../uielements/select';
import {
    Fieldset,
    Form,
    Label,
  } from './form.style';
import { Upload, Icon, Popconfirm, message } from 'antd';
import Dropdown, {
    DropdownMenu,
    MenuItem,
  } from '../uielements/dropdown';
import Timeline, {
    TimelineItem,
} from '../uielements/timeline';
import moment from 'moment';
import firebase from 'firebase';

const Tag = props => (
    <TagWrapper>
      <Tags {...props}>{props.children}</Tags>
    </TagWrapper>
);

export class OrderDetails extends Component {

    constructor(props){
        super(props);
        this.state = {
            order : this.props.order,
            isSaving : false,
            statusModalActive : false,
            statusOnTheWay : false,
            statusPaid : false,
            updateStatusValue : '',
            updateStatusCourier : {},
            updateStatusError : true,
            updateStatusValidation : "",
            updateStatusFileList : [],
            timelineModalActive : false,
            orderItems : {},
            viewImageModal : false,
            previewImage: ""
        }
    }

    handleStatusModal = () => {
       
        this.setState({
            statusModalActive : !this.state.statusModalActive
        })
    }

    handleSave = async () => {
        let orderData = {};

        const { order, updateStatusValue, updateStatusCourier, updateStatusFileList } = this.state;
        let timeline = this.props.order.timeline;
        let pickupConfirmationPictures = this.props.order.pickupConfirmationPictures;
        let errCount = 0;
        let imgList = [];
        
        if( updateStatusValue === "onTheWay" ){
            
            if( Object.keys(updateStatusCourier).length == 0 ){
                
                errCount++;

                this.setState({
                    updateStatusError : true,
                    updateStatusValidation  : "Please select a courier."
                })
            }else{

                orderData= {
                    status : updateStatusValue,
                    courierName : updateStatusCourier[0].fullName,
                    courierUid : updateStatusCourier[0].uid
                }
            }
        }else if( updateStatusValue === "paidAndOnProgress" ){

            if( updateStatusFileList.length == 0 ){
                
                errCount++;
                this.setState({
                    updateStatusError : true,
                    updateStatusValidation  : "Please upload atleast one image for confirmation."
                })
            }else{

                
                updateStatusFileList.map((data,i)=>{
                    imgList.push({
                        file : data
                    });
                });
                
                orderData = {
                    status : updateStatusValue
                }

            }

        }else{
        
            orderData = {
                status : updateStatusValue
            };
        }

        if( errCount == 0 ){

            try{
                this.setState({
                    isSaving : true,

                }, async () => {

                    let t = "";

                    if(updateStatusValue=="paidAndOnProgress"){
                        t = "pickupConfirmationPictures"
                    }

                    let uploadArr = {
                        files : imgList,
                        target : t
                    }

                    let result = await updateOrderStatus(Object.assign( {}, order, orderData), uploadArr)

                    if(result.code==204 || result.code==203){
                        message.error(result.message);
                        this.setState({
                            isSaving : false
                        })
                    }else{
                        message.success(result.message)
                        this.props.loadOrders();
                        this.props.clearState();
                        this.setState({
                            isSaving : false,
                            statusModalActive : !this.state.statusModalActive,
                            statusOnTheWay : false,
                            statusPaid : false,
                            updateStatusValue : '',
                            updateStatusCourier : {},
                            updateStatusFiles : [],
                            updateStatusError : false,
                            updateStatusValidation : ""
                        })
                    }
                    
                })
    
            }catch(error){
                console.log(error);
                throw(error)
            }


            
        }
    }

    onSelectChange = value => {
    
        switch( value ){
            case "onTheWay":
                this.setState({
                    statusOnTheWay : true,
                    statusPaid : false
                })
            break;
            case "paidAndOnProgress":
                this.setState({
                    statusOnTheWay : false,
                    statusPaid : true
                })
            break;
            default:
                this.setState({
                    statusOnTheWay : false,
                    statusPaid : false
                })
        }

        this.setState({
            updateStatusValue : value
        })
    }

    onCourierSelectChange = value => {
  
        const { couriers } = this.props;

        let courier = couriers.filter( c => c.uid === value );
        
        this.setState({
            updateStatusCourier : Object.assign( this.state.updateStatusCourier, courier )
        })
    }

    onFileChange = info => {
        let updateStatusFileList = [...info.fileList];

        updateStatusFileList = updateStatusFileList.map(file => {
            if (file.response) {
                // Component will show file.url as link
                file.url = file.response.url;
            }
            return file;
        });
    
        this.setState({ updateStatusFileList });

    }

    handleImagePreview = (url) => {

        this.setState({
            viewImageModal : !this.state.viewImageModal,
            previewImage : url
        })
    }

    handleTimelineModal = () => {
        this.setState({
            timelineModalActive : !this.state.timelineModalActive
        })
    }

    render () {
        const { couriers } = this.props;
        const { order } = this.props;
        const { tagColor, tagText } = OrderHelper.renderStatus(order.status);
        const { viewImageModal, previewImage, isSaving, timelineModalActive, statusModalActive, statusOnTheWay, statusPaid , updateStatusError, updateStatusValidation , updateStatusFileList } = this.state;

        const uploadProps = {
            onRemove: file => {

                const index = updateStatusFileList.indexOf(file);
                const newList = updateStatusFileList.slice();
                newList.splice(index, 1);

                this.setState({
                    updateStatusFileList: [...newList]
                })
            },
            beforeUpload: file => {
                
                updateStatusFileList.push(file);
                this.setState({
                    updateStatusFileList : [...updateStatusFileList],
                    updateStatusError : false
                })

                return false;
            },
            updateStatusFileList,
            multiple: true,
        };

        const menuHover = (
            <DropdownMenu>
              <MenuItem onClick={this.handleStatusModal}>
                <span > Update Status</span>
              </MenuItem>
              <MenuItem onClick={this.props.updateOrder}>
                <span > Update Order</span>
              </MenuItem>
              <MenuItem onClick={this.handleTimelineModal}>
                <span>View Timeline</span>
              </MenuItem>
            </DropdownMenu>
        );

        return (
            <div>
                {
                    viewImageModal && <Modal visible={viewImageModal} footer={null} onCancel={ () => this.handleImagePreview('')}>
                        <img style={{ width: '100%' }} src={previewImage} />
                    </Modal>
                }
                { timelineModalActive && <Modal
                visible={timelineModalActive}
                onClose={this.handleTimelineModal}
                onCancel={this.handleTimelineModal}
                title="Order Timeline"
                footer={[
                    null,
                    null,
                ]}
                >
                    <Timeline>
                        {
                            order.timeline.map( (data,i) => (
                                <TimelineItem key={i} color="green">
                                    <p style={{ display :"block"}}>Order updated from <span style={{ fontWeight: "bold" }}>{data.from}</span> to <span  style={{ fontWeight: "bold" }}>{data.to}</span></p>
                                    <p>{ moment.unix(data.timestamp.seconds).format("LLLL")}</p>
                                </TimelineItem>
                            ))
                        }
                    </Timeline>
                </Modal> }



                { statusModalActive && <Modal
                visible={statusModalActive}
                onClose={this.handleStatusModal}
                title="Update Status"
                okText="Submit"
                onOk={this.handleSave}
                confirmLoading={isSaving}
                okButtonProps={{ disabled: isSaving }}
                cancelButtonProps={{ disabled: isSaving }}
                onCancel={this.handleStatusModal}
                closable={false}
                maskClosable={false}
                >
                    <Form>
                        <Fieldset>
                            <Label>Status</Label>
                            <Select
                                defaultValue={order.status}
                                placeholder="Select status"
                                onChange={this.onSelectChange}
                                size="large"
                                // style={{ width: '170px' }}
                            >
                                <Option value="waitingForPickup">Waiting for pickup</Option>
                                <Option value="onTheWay">On the way</Option>
                                <Option value="paidAndOnProgress">In Progress</Option>
                                <Option value="done">Done</Option>
                                <Option value="delivered">Paid & Delivered</Option>
                            </Select>
                        </Fieldset>
                        {
                            statusOnTheWay &&
                            <Fieldset>
                                <Label>Courier</Label>
                                <Select
                                    placeholder="Select courier"
                                    onChange={this.onCourierSelectChange}
                                    size="large"
                                    // style={{ width: '170px' }}
                                >
                                    {
                                        couriers.map( (data, key) =>(
                                            <Option key={key} value={data.uid}>{data.fullName}</Option>
                                        ))
                                    }
                                    
        
                                </Select>
                                { updateStatusError && <span className="error">{updateStatusValidation}</span> }
                            </Fieldset>
                        }
                        {
                            statusPaid &&
                            <Fieldset>
                                <Upload {...uploadProps} fileList={this.state.updateStatusFileList}>
                                    <Button>
                                    <Icon type="upload" /> Upload
                                    </Button>
                                </Upload>
                                { updateStatusError && <span className="error">{updateStatusValidation}</span> }
                            </Fieldset>
                        }
                    </Form>


                </Modal> }
                <div className="detailsHeader">
                    <span className="detailsUID">Order ID: {order.uid}</span>
                    <span className="detailsActions">
                        <Dropdown overlay={menuHover} trigger={['click']}>
                            <Icon style={{ fontSize : "x-large", marginTop: "5px" }} type="setting" />
                        </Dropdown>
                    </span>
                    <span className="detailsStatus"><Tag color={tagColor}>{tagText}</Tag></span>
                </div>
                <div className="detailsItems">
                    <Scrollbars style={{ height: "245px" }}>
                        <ul className="itemList">
                        {
                            order.items.map( (data, i ) => (
                                <li key={i}>
                                    <div className="itemDiv">
                                        <img onClick={ () => this.handleImagePreview(data.imageUrl) } src={data.imageUrl} className="itemImage"/>
                                        <h4 className="itemServiceType">{data.serviceType}</h4>
                                        <p className="itemDescription">{data.description}</p>
                                    </div>
                                </li>
                            ))
                        }
                        </ul>
                    </Scrollbars>
                </div>
                {
                    order.pickupConfirmationPictures.length!==0 &&
                    <div className="detailsPickupPictures">
                        <span style={{ fontSize: "15px" }}>Confirmation pictures</span>
                        <Scrollbars style={{ height: "100px" }}>
                            <div style={{ display: "flex", padding: "5px 20px"}}>
                            {
                                order.pickupConfirmationPictures.map( (data, i ) => (
                                    <div key={i} style={{ flex: "1" }}>
                                        <img  onClick={ () => this.handleImagePreview(data) } src={data} className="itemImage"/>
                                    </div>
                                ))
                            }
                            </div>
                        </Scrollbars>
                    </div>
                }
                <div className="detailsCustomer">
                    <span className="detailsCourier">Courier: {order.courierName}</span>
                    <span className="detailsCustomerName">Name: {order.customerName}</span>
                    <span className="detailsCustomerAddress">Address: {order.addressText}</span>
                    <div style={{ marginTop: "10px"}}>
                        <span className="detailsOrderAmountLabel">Amount</span><span className="detailsOrderAmount">Rp {order.totalPrice}</span>
                        {
                            order.promotionCode !== "" && <span className="detailsPromoCode">with Promotion Code : {order.promotionCode}</span>
                        }
                    </div>
                </div>
            </div>
        )
    }

}

export default OrderDetails;