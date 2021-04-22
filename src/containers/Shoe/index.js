import React, { Component } from 'react';
import { connect } from "react-redux";
import _ from 'lodash';

import {
    getShoes,
    saveShoe,
    deleteShoe,
    checkDuplicateShoeTitle
} from '../../helpers/shoe/shoeRepo';

import {
    getBrands
} from '../../helpers/brand/brandRepo';

import {
    getStores
} from '../../helpers/store/storeRepo';


import Modal from '../../components/feedback/modal';
import Spin from '../../components/uielements/spin';
import { ShoeItem } from '../../components/shoe/ShoeItem';
import Scrollbars from '../../components/utility/customScrollBar.js';

import './index.css'

import { 
    Row, 
    Col, 
    Icon, 
    Input, 
    Upload, 
    Form,
    Select,
    message,
    Popconfirm,
    Button,
    Switch
} from 'antd';

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

export class Shoe extends Component{
    
    constructor(){
        super();
        this.state = {
            shoes : [],
            brands : [],
            stores : [],
            shoesLoading : false,
            selectedStore : {},
            selectedStoreForSaving : {},
            displayDeleted : false,
            selectedShoe : {},
            shoe : {},
            fileList : [],
            shoeModalActive : false,
            shoeImageModalActive : false,
            previewImage : "",
            isUpdating : false,
            isSaving : false,
            isDeleting : false,
            isValidatingTitle : false,
            titleValidatingStatus : "success",
            titleValidatingMessage : "",
        }
    }

    componentDidMount(){
        this.loadShoes();
        this.loadBrands();
        this.loadStores();
    }

    loadShoes = async () => {

        try{
            this.setState({
                shoesLoading : true
            }, async () => {
                const { displayDeleted } = this.state;
                let shoes = await getShoes();
                this.setState({
                    shoesLoading : false,
                    shoes : shoes!==undefined ? [...shoes] : []
                })
            })

        }catch(error){
            console.log(error)
            throw error
        }

    }

    loadBrands = async () => {

        try{

            let brands = await getBrands();
            this.setState({
                brands : brands !== undefined ? [...brands] : []
            })

        }catch(error){
            console.log(error);
        }
    }

    loadStores = async () => {
        try{

            let stores = await getStores();
            this.setState({
                stores :  stores !== undefined ? [...stores] : []
            })

        }catch(error){
            console.log(error);
        }
    }

    refreshShoeList = () => {
        this.setState({
            selectedShoe : {}
        }, () => {
            this.loadShoes()
        })
    }

    displayShoeDetails = (shoe) => {
        this.setState({
            selectedShoe : shoe
        }, () => {

            const { stores } = this.state;
            let sStore = stores.find( s => { return shoe.storeUid === s.uid })
            this.setState({
                selectedStore : {...sStore}
            })

        })
    }

    imagePreview = (url) => {
        this.setState({
            shoeImageModalActive : !this.state.shoeImageModalActive,
            previewImage : url
        })
    }
    
    addShoe = () => {
        this.setState({
            shoeModalActive : true
        })
    }

    updateShoe = () => {

        const { stores, selectedShoe } = this.state;

        let sStore = stores.filter( (store) => store.uid === selectedShoe.storeUid )
        selectedShoe.storeName = sStore[0].name;

        this.setState({
            isUpdating : true,
            shoeModalActive : true
        })
    }

    closeShoeModal = () => {
        this.setState({
            isUpdating : false,
            shoeModalActive : false
        })
    }

    shoeTitleChange = _.debounce ((title) => {

        this.setState({
            isValidatingTitle : true,
            isSaving : true,
        }, async () => {

                const { isUpdating, selectedShoe } = this.state;

                if(isUpdating){
                    if(selectedShoe.title===title){
                        this.setState({
                            isValidatingTitle : false,
                            isSaving : false,
                            titleValidatingStatus : "success",
                            titleValidatingMessage : ""
                        })
                    }else{
                        
                        let data = await checkDuplicateShoeTitle(title)
                        this.setState({
                            isValidatingTitle : false,
                            isSaving : false,
                            titleValidatingStatus : data.code,
                            titleValidatingMessage : data.message
                        })
                    }
                }else{
                    let data = await checkDuplicateShoeTitle(title)
                    this.setState({
                        isValidatingTitle : false,
                        isSaving : false,
                        titleValidatingStatus : data.code,
                        titleValidatingMessage : data.message
                    })
                }
        })

    },500)

    fileChange = info => {

        if(info!==null && info!==undefined){
            let fileList = [...info.fileList];
    
            fileList = fileList.slice(-5);
            
            this.setState({ fileList : [...fileList] });
        }
    };

    storeChange = (value, e) => {
        
        const { children } = e.props;
        const { stores } = this.state;

        let sStore = stores.find( s => { return s.name===children })
      
        this.setState({
            selectedStoreForSaving : {...sStore}
        })
        
    }

    checkNumberInput = (rule, value, callback) => {
        if (!value.match(/^(\d+)?([.]?\d+)?$/)){
            return callback(true)
        }

        callback();
    }
    
    saveShoe = async ( data ) => {

        this.props.form.validateFieldsAndScroll((err, values) => {
            if (!err) {

                const { titleValidatingStatus, isUpdating, selectedShoe } = this.state

                if( titleValidatingStatus === "success" ){

                    try{
                        this.setState({
                            isSaving : true
                        }, async() => {
                            
                            let saveData = {
                                title : values.title,
                                brand : values.brand,
                                description : values.description,
                                storeUid : values.storeUid,
                                isFeatured : values.isFeatured,
                                priceInRp : parseFloat(values.price)
                            }
                            
                            const { images } = values;

                            let imgList = [];

                            if(isUpdating){
                                saveData.uid = selectedShoe.uid
                            }

                            if(images !== undefined){
                                images.fileList.map((data,i)=>{
                                    imgList.push({
                                        file : data.originFileObj
                                    });
                                });
                            }
                            
                            if(imgList.length!=0){
                                saveData.images = []    
                            }

                            await saveShoe(saveData,imgList)
    
                            setTimeout( function () {
    
                                this.setState({
                                    isUpdating : false,
                                    isSaving : false,
                                    shoeModalActive : false,
                                    selectedShoe : {},
                                    selectedStore : {},
                                    selectedStoreForSaving : {},
                                    fileList : []
                                })
                                
                                this.loadShoes();
        
                                message.success("Shoe has been saved.");
    
                            }.bind(this), 1500)
    
                        })
                    }catch(error){
                        console.log(error);
                        throw(error)
                    }


                }else{
                    message.error("Shoe cannot be saved.")
                }
            
            }else{
                console.log(err)
                this.setState({
                    titleValidatingStatus : "error",
                    titleValidatingMessage : err.title.errors[0].message,
                })
            }
        }); 

    } 

    deleteShoe = async () => {
        try{
            this.setState({
                isDeleting : true
            }, async() => {
                const { selectedShoe } = this.state;

                await deleteShoe(selectedShoe.uid);
                await this.loadShoes();
              
                this.setState({
                    isDeleting : false,
                    selectedShoe : {}
                })

                message.success("Shoe has been deleted.");
                
            })
        }catch(error){
            console.log(error);
            throw(error)
        }
    }

    render(){

        const {
            shoes,
            stores,
            brands,
            shoesLoading,
            selectedStore,
            selectedStoreForSaving,
            displayDeleted,
            selectedShoe,
            shoeModalActive,
            shoeImageModalActive,
            previewImage,
            isUpdating,
            isSaving,
            isValidatingTitle,
            titleValidatingStatus,
            titleValidatingMessage,
            isDeleting,
            fileList
        } = this.state

        const { getFieldDecorator, getFieldValue } = this.props.form;
        
        return(
            <div>
                <div className="content-header">Shoes</div>
                    <div style={{ display : "flex", height: this.props.height - 130 }}> 
                        <div style={{ position: "relative", flex: "1 0 25%" , maxWidth : "420px" , minWdith : "240px"}}>
                            <div className="shoe-list-header">
                            <Button style={{ float: "left", zIndex : "10" }} onClick={this.addShoe}><Icon type="plus"/>New Shoe</Button>
                            <Button style={{ float: "right", zIndex : "10" }} onClick={this.refreshShoeList}><Icon type="retweet"/></Button>
                                {/* <Form>
                                    <Form.Item style={{marginBottom: "0"}}>
                                        <Input
                                            style={{ marginBottom: "0", width: "100%"}}
                                            onKeyUp={(e) => this.searchshoes(e.target.value)}
                                            placeholder="Search shoes"
                                        />
                                    </Form.Item>
                                </Form> */}
                            </div>
                            <div className="shoe-list-body">
                                {
                                    shoesLoading ? <div style={{ marginTop: "200px", textAlign : "center" }}>
                                    <Spin size="large"/>
                                    </div> :
                                    shoes.length==0 ? <p className="shoe-no-list">No shoe on the list.</p> :
                                    <Scrollbars style={{ height: this.props.height - 240 }}>
                                        {
                                            shoes.map( (data,i) => (
                                                <ShoeItem displayShoeDetails={this.displayShoeDetails} key={i} shoe={data}/>
                                            ))
                                        }
                                    </Scrollbars>
                                }
                            </div>
                            <div className="shoe-list-footer">
                                {/* <div style={{ textAlign: "left", flex : "1" }}>
                                    { hasPrev && <Button  disabled={shoesLoading} onClick={this.prevPage} icon="caret-left" type="default"></Button> }
                                </div>
                                <div style={{ textAlign: "center", flex : "1" }}>
                                    { shoes && shoes.length > 0 && <span style={{ display: "block", marginTop:"10px", color: "#1b1b1b"}}>Page {shoePage}</span> }
                                </div>
                                <div style={{ textAlign: "right", flex : "1" }}>
                                    { hasNext && <Button style={{ float: "right" }} disabled={shoesLoading} onClick={this.nextPage} icon="caret-right" type="default"></Button>}
                                </div> */}
                            </div>
                        </div>
                        <div style={{ flex: "1 1 0%" }}>
                            <div style={{ flex : "2 0 0%", overflow : "hidden", position : "relative", display : "flex", flexDirection : "column", borderLeft: "1px solid #e4e4e4" }}>
                                <div className="shoe-details-header">
                                    
                                    {
                                        Object.keys(selectedShoe).length == 0 ? "" :
                                        <div className="sd-actions">
                                            <ButtonGroup>
                                                <Button loading={isDeleting} onClick={this.updateShoe} title="Update shoe" className="action-edit"><Icon type="edit"/></Button>
                                                <Popconfirm
                                                    title="Delete this partner shoe? This action cannot be undone."
                                                    onConfirm={this.deleteShoe}
                                                    okText="Yes"
                                                    cancelText="No"
                                                >
                                                    <Button loading={isDeleting} title="Delete shoe" className="action-delete"><Icon type="delete"/></Button>
                                                </Popconfirm>
                                            </ButtonGroup>
                                        </div> 
                                    }
                                </div>
                                <div className="shoe-details-body">
                                    {
                                        Object.keys(selectedShoe).length == 0 ? 
                                        <p className="no-selected-shoe">Please select a shoe</p> :
                                        <Scrollbars style={{ height: this.props.height - 190 }}>
                                            <div>
                                                <div className="sd-section">
                                                    <p className="sd-section-header">Shoe Information</p>
                                                    <Row style={{ marginBottom: "10px" }}>
                                                        <Col span={8}>
                                                            <span className="sd-label">TITLE</span>
                                                            <span className="sd-value">{selectedShoe.title}</span>
                                                        </Col>
                                                        <Col span={8}>
                                                            <span className="sd-label">BRAND</span>
                                                            <span className="sd-value">{selectedShoe.brand}</span>
                                                        </Col>
                                                        <Col span={8}>
                                                            <span className="sd-label">PRICE</span>
                                                            <span className="sd-value">Rp {selectedShoe.priceInRp}</span>
                                                        </Col>
                                                    </Row>
                                                    <Row style={{ marginBottom: "10px" }}>
                                                        <Col span={24}>
                                                            <span className="sd-label">DESCRIPTION</span>
                                                            <span className="sd-value">{selectedShoe.description}</span>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Col span={24}>
                                                            <span className="sd-label">IMAGES</span>
                                                            {
                                                                selectedShoe.images.length==0 ? <p className="sd-value">No images/s to display</p> :
                                                                <ul className="sd-image-list">
                                                                    {
                                                                    selectedShoe.images.map( (data, i ) => (
                                                                            <li key={i}>
                                                                                <img onClick={ () => this.imagePreview(data) } src={data}/>
                                                                            </li>
                                                                        ))
                                                                    }
                                                                </ul>
                                                            }
                                                        </Col>
                                                    </Row>
                                                </div>
                                                <div className="sd-section">
                                                    <p className="sd-section-header">Store Information</p>
                                                    {
                                                        Object.keys(selectedStore).length===0 ? "" :
                                                        <div>
                                                            <Row style={{ marginBottom: "10px" }}>
                                                                <Col span={12}>
                                                                    <span className="sd-label">NAME</span>
                                                                    <span className="sd-value">{ selectedStore.name}</span>
                                                                </Col>
                                                                <Col span={12}>
                                                                    <span className="sd-label">LINK</span>
                                                                    <span className="sd-value">{ selectedStore.link}</span>
                                                                </Col>
                                                            </Row>
                                                            <Row style={{ marginBottom: "10px" }}>
                                                                <Col span={24}>
                                                                    <span className="sd-label">CALL TO ACTION TEXT</span>
                                                                    <span className="sd-value">{ selectedStore.visitCTA}</span>
                                                                </Col>
                                                            </Row>
                                                        </div>

                                                    }
                                                </div>
                                            </div>
                                        </Scrollbars>
                                    }
                                </div>
                                <div className="shoe-details-footer">

                                </div>
                            </div>
                        </div>
                        {/* 
                            MODALS
                        */}
                        {
                            shoeImageModalActive && <Modal visible={shoeImageModalActive} footer={null} onCancel={ () => this.imagePreview('')}>
                                <img style={{ width: '100%' }} src={previewImage} />
                            </Modal>
                        }

                        { shoeModalActive && <Modal
                        width={600}
                        visible={shoeModalActive}
                        onClose={this.closeShoeModal}
                        title={ isUpdating ? "Update shoe" : "Add New shoe"}
                        okText="Submit"
                        onOk={this.saveShoe}
                        onCancel={this.closeShoeModal}
                        confirmLoading={isSaving}
                        okButtonProps={{ disabled: isSaving }}
                        cancelButtonProps={{ disabled: isSaving }}
                        closable={false}
                        maskClosable={false}
                        >
                            <Form>
                                <Form.Item label="Title"
                                    validateStatus={isValidatingTitle ? "validating" : titleValidatingStatus}
                                    help={isValidatingTitle ? "" : titleValidatingMessage }
                                    >
                                    {getFieldDecorator('title', {
                                        rules : [
                                            { required : true , message : "Please enter shoe title."}
                                        ],
                                        initialValue : isUpdating ? selectedShoe.title : ""
                                    })(
                                        <Input onKeyUp={e => this.shoeTitleChange(e.target.value)} className="form-control" placeholder="Enter shoe title" />
                                    )
                                    }
                                </Form.Item>
                                <Form.Item label="Brand">
                                    {getFieldDecorator('brand', {
                                        initialValue : isUpdating ? selectedShoe.brand : undefined,
                                        rules : [{ required : true, message : 'Please select a brand'}]
                                    })(<Select 
                                        placeholder="Select brand"
                                        size="large"
                                        >
                                        {
                                            brands.map( (data, key) =>
                                                <Option key={key} value={data.name}>{data.name}</Option>
                                            )
                                        }
                                        </Select>
                                    )}
                                </Form.Item>
                                <Form.Item label="Shoe image/s">
                                    {getFieldDecorator('images', {
                                            rules : [
                                                { required : isUpdating ? false : true , message : "Please add image/s for this shoe."}
                                            ]
                                        }
                                    )(
                                        <Upload 
                                            accept="image/*"
                                            beforeUpload={beforeUpload}
                                            onChange={this.fileChange}
                                            multiple={true}
                                            fileList={fileList}
                                        >
                                            <Button>
                                                <Icon type="upload" /> Upload
                                            </Button>
                                        </Upload>
                                    )}
                                </Form.Item>
                                <Form.Item label="Shoe description">
                                    {getFieldDecorator('description', {
                                        initialValue : isUpdating ? selectedShoe.description : "",
                                        rules :[
                                            { required : true, message : "Please add a description to the shoe."}
                                        ]
                                        }
                                    )(
                                        <TextArea rows={5}></TextArea>
                                    )}
                                    
                                </Form.Item>
                                <Form.Item label="Featured">
                                    {
                                        getFieldDecorator('isFeatured', 
                                        { 
                                            valuePropName: 'checked',
                                            initialValue : isUpdating ? selectedShoe.isFeatured : false,
                                        })(<Switch 
                                            checkedChildren="Yes"
                                            unCheckedChildren="No"
                                        />)}
                                </Form.Item>
                                <Form.Item label="Price">
                                    {getFieldDecorator('price', {
                                       getValueFromEvent: (e: React.FormEvent<HTMLInputElement>) => {
                                            const convertedValue = parseInt(e.currentTarget.value);
                                            if (isNaN(convertedValue)) {
                                              return parseInt(this.props.form.getFieldValue("price"));
                                            } else {
                                              return Math.round(convertedValue);
                                            }
                                        },
                                        initialValue : isUpdating ? selectedShoe.priceInRp : "",
                                        rules : [
                                            {
                                                required : true,
                                                type : "number",
                                                message : "Please add a price."
                                            }
                                        ]
                                    })( <Input
                                        placeholder="Enter shoe price"
                                        className="form-control"
                                    />)}
                                </Form.Item>
                                <Form.Item label="Store">
                                    {getFieldDecorator('storeUid', {
                                        initialValue : isUpdating ? selectedShoe.storeUid : undefined,
                                        rules : [{ required : true, message : 'Please select a store'}]
                                    })(<Select 
                                        placeholder="Select store"
                                        size="large"
                                        onChange={(value,e) => this.storeChange(value, e)}
                                        >
                                        {
                                            stores.map( (data, key) =>
                                                <Option key={key} value={data.uid}>{data.name}</Option>
                                            )
                                        }
                                        </Select>
                                    )}
                                </Form.Item>
                                <Form.Item label="Store link">
                                    <Input disabled value={ Object.keys(selectedStoreForSaving).length!==0 ? selectedStoreForSaving.link : ""} className="form-control" placeholder="Select store to display shoe link" />
                                </Form.Item>
                                <Form.Item label="Call to action text">
                                    <TextArea autosize={{ minRows: 5, maxRows: 10 }} disabled value={ Object.keys(selectedStoreForSaving).length !== 0 ? selectedStoreForSaving.visitCTA : "" } className="form-control" placeholder="Select store to display call to action text" ></TextArea>
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
const WrappedShoe = Form.create()(Shoe)
export default connect(mapStateToProps)(WrappedShoe);
