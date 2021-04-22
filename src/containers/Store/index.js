import React, { Component } from 'react';
import { connect } from "react-redux";
import _ from 'lodash';

import {
    getStores,
    saveStore,
    deleteStore,
    checkDuplicateStoreName,
    checkDuplicateStoreLink
} from '../../helpers/store/storeRepo';

import Modal from '../../components/feedback/modal';
import Spin from '../../components/uielements/spin';
import { StoreItem } from '../../components/store/StoreItem';
import Scrollbars from '../../components/utility/customScrollBar.js';

import './index.css'

import { 
    Icon, 
    Input, 
    Form,
    message,
    Popconfirm,
    Button
} from 'antd';

import moment from 'moment';

const{
    TextArea 
} = Input;

const ButtonGroup = Button.Group;

export class Store extends Component{
    
    constructor(){
        super();
        this.state = {
            stores : [],
            storeLoading : false,
            displayDeleted : false,
            selectedStore : {},
            store : {},
            storeModalActive : false,
            isUpdating : false,
            isSaving : false,
            isValidatingName : false,
            nameValidatingStatus : "success",
            nameValidatingMessage : "",
            isValidatingLink : false,
            linkValidatingStatus : "success",
            linkValidatingMessage : "",
            isDeleting : false
        }
    }

    componentDidMount(){
        this.loadStores();
    }

    loadStores = async () => {

        try{
            this.setState({
                storesLoading : true
            }, async () => {
                let stores = await getStores();
                this.setState({
                    storesLoading : false,
                    stores : stores !== undefined ? [...stores] : []
                })
            })

        }catch(error){
            console.log(error)
            throw error
        }

    }

    refreshStoreList = () => {
        this.setState({
            selectedStore : {}
        }, () => {
            this.loadStores()
        })
    }

    displayStoreDetails = (store) => {
        this.setState({
            selectedStore : store
        })
    }
    
    addStore = () => {
        this.setState({
            storeModalActive : true
        })
    }

    updateStore = () => {
        this.setState({
            isUpdating : true,
            storeModalActive : true
        })
    }

    closeStoreModal = () => {
        this.setState({
            isUpdating : false,
            storeModalActive : false,
            isValidatingName : false,
            isValidatingLink : false,
            nameValidatingStatus : "success",
            linkValidatingStatus : "success",
            nameValidatingMessage : "",
            linkValidatingMessage : "",
        })
    }

    storeNameChange = _.debounce ((name) => {

        this.setState({
            isValidatingName : true,
            isSaving : true,
        }, async () => {

                const { isUpdating, selectedStore } = this.state;

                if(isUpdating){
                    if(selectedStore.name===name){
                        this.setState({
                            isValidatingName : false,
                            isSaving : false,
                            nameValidatingStatus : "success",
                            nameValidatingMessage : ""
                        })
                    }else{
                        let data = await checkDuplicateStoreName(name)

                        this.setState({
                            isValidatingName : false,
                            isSaving : false,
                            nameValidatingStatus : data.code,
                            nameValidatingMessage : data.message
                        })
                    }
                }else{
                    let data = await checkDuplicateStoreName(name)

                    this.setState({
                        isValidatingName : false,
                        isSaving : false,
                        nameValidatingStatus : data.code,
                        nameValidatingMessage : data.message
                    })
                }
        })

    },500)

    storeLinkChange = _.debounce ((link) => {
  
        this.setState({
            isValidatingLink : true,
            isSaving : true
        }, async () => {
            
            const { isUpdating, selectedStore } = this.state;

                if(isUpdating){
                    if(selectedStore.link===link){
                        this.setState({
                            isValidatingLink : false,
                            isSaving : false,
                            linkValidatingStatus : "success",
                            linkValidatingMessage : ""
                        })
                    }else{
                        let data = await checkDuplicateStoreLink(link)
  
                        this.setState({
                            isValidatingLink : false,
                            isSaving : false,
                            linkValidatingStatus : data.code,
                            linkValidatingMessage : data.message
                        })
                    }
                }else{
                    let data = await checkDuplicateStoreLink(link)
  
                    this.setState({
                        isValidatingLink : false,
                        isSaving : false,
                        linkValidatingStatus : data.code,
                        linkValidatingMessage : data.message
                    })
                }

           
  
        })
  
      },500)

    saveStore = async () => {

        this.props.form.validateFieldsAndScroll((err, values) => {
            if (!err) {

                const { nameValidatingStatus, linkValidatingStatus, isUpdating, selectedStore } = this.state
                
                if(nameValidatingStatus === "success" && linkValidatingStatus === "success" ){

                    try{
                        this.setState({
                            isSaving : true
                        }, async() => {
                        
                            let storeData = {
                                name : values.name,
                                link : values.link,
                                visitCTA : values.visitCTA 
                            }

                            if(isUpdating){
                                storeData.uid = selectedStore.uid
                            }
    
                            await saveStore(storeData)
    
                            setTimeout( function () {

                                this.setState({
                                    isValidatingName : false,
                                    isValidatingLink : false,
                                    nameValidatingStatus : "success",
                                    linkValidatingStatus : "success",
                                    nameValidatingMessage : "",
                                    linkValidatingMessage : "",
                                    isUpdating : false,
                                    isSaving : false,
                                    storeModalActive : false,
                                    selectedStore : {}
                                })
                                
                                this.loadStores();
        
                                message.success("Store has been saved.");

                            }.bind(this), 1500)
    
                        })
                    }catch(error){
                        console.log(error);
                        throw(error)
                    }

                }else{
                    message.error("Store cannot be saved.")
                }
            }else{
                this.setState({
                    nameValidatingStatus : "error",
                    nameValidatingMessage : err.name.errors[0].message,
                    linkValidatingStatus : "error",
                    linkValidatingMessage : err.link.errors[0].message
                })
            }
        }); 

    } 

    deleteStore = async () => {
        try{
            this.setState({
                isDeleting : true
            }, async() => {
                const { selectedStore } = this.state;

                await deleteStore(selectedStore.uid);
                await this.loadStores();
              
                this.setState({
                    isDeleting : false,
                    selectedStore : {}
                })

                message.success("Store has been deleted.");
                
            })
        }catch(error){
            console.log(error);
            throw(error)
        }
    }

    render(){

        const {
            stores,
            storesLoading,
            selectedStore,
            storeModalActive,
            isUpdating,
            isSaving,
            isDeleting,
            isValidatingName,
            nameValidatingStatus,
            nameValidatingMessage,
            isValidatingLink,
            linkValidatingStatus,
            linkValidatingMessage
        } = this.state

        const { getFieldDecorator } = this.props.form;

        return(

            <div>
                <div className="content-header">Stores</div>
                    <div style={{ display : "flex", height: this.props.height - 130 }}> 
                        <div style={{ position: "relative", flex: "1 0 25%" , maxWidth : "420px" , minWdith : "240px"}}>
                            <div className="store-list-header">
                            <Button style={{ float: "left", zIndex : "10" }} onClick={this.addStore}><Icon type="plus"/>New Store</Button>
                            <Button style={{ float: "right", zIndex : "10" }} onClick={this.refreshStoreList}><Icon type="retweet"/></Button>
                                {/* <Form>
                                    <Form.Item style={{marginBottom: "0"}}>
                                        <Input
                                            style={{ marginBottom: "0", width: "100%"}}
                                            onKeyUp={(e) => this.searchstores(e.target.value)}
                                            placeholder="Search stores"
                                        />
                                    </Form.Item>
                                </Form> */}
                            </div>
                            <div className="store-list-body">
                                {
                                    storesLoading ? <div style={{ marginTop: "200px", textAlign : "center" }}>
                                    <Spin size="large"/>
                                    </div> :
                                    stores.length===0 ? <p className="store-no-list">No store on the list.</p> :
                                    <Scrollbars style={{ height: this.props.height - 240 }}>
                                        {
                                            stores.map( (data,i) => (
                                                <StoreItem displayStoreDetails={this.displayStoreDetails} key={i} store={data}/>
                                            ))
                                        }
                                    </Scrollbars>
                                }
                            </div>
                            <div className="store-list-footer">
                                {/* <div style={{ textAlign: "left", flex : "1" }}>
                                    { hasPrev && <Button  disabled={storesLoading} onClick={this.prevPage} icon="caret-left" type="default"></Button> }
                                </div>
                                <div style={{ textAlign: "center", flex : "1" }}>
                                    { stores && stores.length > 0 && <span style={{ display: "block", marginTop:"10px", color: "#1b1b1b"}}>Page {storePage}</span> }
                                </div>
                                <div style={{ textAlign: "right", flex : "1" }}>
                                    { hasNext && <Button style={{ float: "right" }} disabled={storesLoading} onClick={this.nextPage} icon="caret-right" type="default"></Button>}
                                </div> */}
                            </div>
                        </div>
                        <div style={{ flex: "1 1 0%" }}>
                            <div style={{ flex : "2 0 0%", overflow : "hidden", position : "relative", display : "flex", flexDirection : "column", borderLeft: "1px solid #e4e4e4" }}>
                                <div className="store-details-header">
                                    
                                    {
                                        Object.keys(selectedStore).length === 0 ? "" :
                                        <div className="sd-actions">
                                            <ButtonGroup>
                                                <Button loading={isDeleting} onClick={this.updateStore} title="Update store" className="action-edit"><Icon type="edit"/></Button>
                                                <Popconfirm
                                                    title="Delete this partner store? This action cannot be undone."
                                                    onConfirm={this.deleteStore}
                                                    okText="Yes"
                                                    cancelText="No"
                                                >
                                                    <Button loading={isDeleting} title="Delete store" className="action-delete"><Icon type="delete"/></Button>
                                                </Popconfirm>
                                            </ButtonGroup>
                                        </div> 
                                    }
                                </div>
                                <div className="store-details-body">
                                    {
                                        Object.keys(selectedStore).length === 0 ? 
                                        <p className="no-selected-store">Please select a store</p> :
                                        <Scrollbars style={{ height: this.props.height - 190 }}>
                                            <div>
                                                <p className="sd-name">{ selectedStore.name }</p>
                                                <a target="_blank" href={selectedStore.link}><span className="sd-link">{ selectedStore.link }</span></a>
                                                <br/><br/>
                                                <p className="sd-visitCTA">{ selectedStore.visitCTA }</p>
                                                <span className="sd-dateAdded">Date added : { selectedStore.dateAdded ? moment.unix(selectedStore.dateAdded.seconds).format("LLL") : "N/A"}</span><span className="sd-dateUpdated">Last modified date : { selectedStore.dateUpdated ? moment.unix(selectedStore.dateUpdated.seconds).format("LLL") : "N/A"}</span>
                                            </div>
                                        </Scrollbars>

                                    }
                                </div>
                                <div className="store-details-footer">

                                </div>
                            </div>
                        </div>
                        {/* 
                            MODALS
                        */}
                        { storeModalActive && <Modal
                        width={600}
                        visible={storeModalActive}
                        onClose={this.closeStoreModal}
                        title={ isUpdating ? "Update Store" : "Add New Store"}
                        okText="Submit"
                        onOk={this.saveStore}
                        onCancel={this.closeStoreModal}
                        confirmLoading={isSaving}
                        okButtonProps={{ disabled: isSaving }}
                        cancelButtonProps={{ disabled: isSaving }}
                        closable={false}
                        maskClosable={false}
                        >
                            <Form>
                                <Form.Item label="Store name"
                                    validateStatus={isValidatingName ? "validating" : nameValidatingStatus}
                                    help={isValidatingName ? "" : nameValidatingMessage }
                                    >
                                    {getFieldDecorator('name', {
                                        rules : [
                                            { required : true , message : "Please enter store name."}
                                        ],
                                        initialValue : isUpdating ? selectedStore.name : ""
                                    })(
                                        <Input onKeyUp={e => this.storeNameChange(e.target.value)} className="form-control" placeholder="Enter store name" />
                                    )
                                    }
                                </Form.Item>
                                <Form.Item label="Store link"
                                    validateStatus={isValidatingLink ? "validating" : linkValidatingStatus}
                                    help={isValidatingLink ? "" : linkValidatingMessage }
                                    >
                                    {getFieldDecorator('link', {
                                        rules : [
                                            { required : true , message : "Please enter store link"}
                                        ],
                                        initialValue : isUpdating ? selectedStore.link : ""
                                    })(
                                        <Input onKeyUp={e => this.storeLinkChange(e.target.value)} className="form-control" placeholder="Enter store link" />
                                    )
                                    }
                                </Form.Item>
                                <Form.Item label="Call to action text">
                                    {getFieldDecorator('visitCTA', {
                                        rules : [
                                            { required : true , message : "Please enter call to action text"}
                                        ],
                                        initialValue : isUpdating ? selectedStore.visitCTA : ""
                                    })(
                                        <TextArea className="form-control" placeholder="Enter call to action text" ></TextArea>
                                    )
                                    }
                                </Form.Item>
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
const WrappedStore = Form.create()(Store)
export default connect(mapStateToProps)(WrappedStore);
