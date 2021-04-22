import React, { Component } from 'react';
import { connect } from "react-redux";
import _ from 'lodash';

import {
    getBrands,
    saveBrand,
    deleteBrand,
    checkDuplicateBrandName,
    getRelatedShoes
} from '../../helpers/brand/brandRepo';

import Modal from '../../components/feedback/modal';
import Spin from '../../components/uielements/spin';
import { BrandItem } from '../../components/brand/BrandItem';
import Scrollbars from '../../components/utility/customScrollBar.js';

import './index.css'

import { 
    Row, 
    Col, 
    Icon, 
    Input, 
    Form,
    message,
    Popconfirm,
    Button
} from 'antd';

import moment from 'moment';

const ButtonGroup = Button.Group;

export class Brand extends Component{
    
    constructor(){
        super();
        this.state = {
            brands : [],
            brandLoading : false,
            displayDeleted : false,
            selectedBrand : {},
            relatedShoes : [],
            brand : {},
            previewImage : "",
            brandImageModalActive : false,
            brandModalActive : false,
            isUpdating : false,
            isSaving : false,
            isChecking : false,
            isValidatingName : false,
            nameValidatingStatus : "success",
            nameValidatingMessage : "",
            isDeleting : false
        }
    }

    componentDidMount(){
        this.loadBrands();
    }

    loadBrands = async () => {

        try{
            this.setState({
                brandsLoading : true
            }, async () => {
                let brands = await getBrands();
                this.setState({
                    brandsLoading : false,
                    brands : brands !== undefined ? [...brands] : []
                })
            })

        }catch(error){
            console.log(error)
            throw error
        }

    }

    refreshBrandList = () => {
        this.setState({
            selectedBrand : {},
            relatedShoes : []
        }, () => {
            this.loadBrands();
        })
    }

    displayBrandDetails = (brand) => {

        this.setState({
            selectedBrand : brand
        }, () => {

            this.setState({
                isChecking : true,
            }, async () => {
                let rShoe = await getRelatedShoes(brand.name)
                this.setState({
                    relatedShoes : [...rShoe],
                    isChecking : false
                })
            })

        })
    }

    imagePreview = (url) => {
        this.setState({
            brandImageModalActive : !this.state.brandImageModalActive,
            previewImage : url
        })
    }
    
    addBrand = () => {
        this.setState({
            brandModalActive : true
        })
    }

    updateBrand = () => {
        const { relatedShoes } = this.state;

        if( relatedShoes.length === 0 ){
            this.setState({
                isUpdating : true,
                brandModalActive : true
            })
        }else{
            message.info("Brand is related to a shoe data. Brand cannot be updated.")
        }
    }

    closeBrandModal = () => {
        this.setState({
            isUpdating : false,
            brandModalActive : false,
            isValidatingName : false,
            nameValidatingStatus : "success",
            nameValidatingMessage : "",
            
        })
    }

    brandNameChange = _.debounce ((name) => {

      this.setState({
          isValidatingName : true,
          isSaving : true,
      }, async () => {
        
            const { selectedBrand, isUpdating } = this.state;

            if(isUpdating){
                if(selectedBrand.name===name){
                    this.setState({
                        isSaving : false,
                        isValidatingName : false,
                        nameValidatingStatus : "success",
                        nameValidatingMessage : ""
                    })
                }else{
                    let data = await checkDuplicateBrandName(name)

                    this.setState({
                        isSaving : false,
                        isValidatingName : false,
                        nameValidatingStatus : data.code,
                        nameValidatingMessage : data.message
                    })
                }
            }else{
                let data = await checkDuplicateBrandName(name)

                this.setState({
                    isSaving : false,
                    isValidatingName : false,
                    nameValidatingStatus : data.code,
                    nameValidatingMessage : data.message
                })
            }
      })

    },500)

    saveBrand = async ( data ) => {

        this.props.form.validateFieldsAndScroll((err, values) => {
            if (!err) {

                const { nameValidatingStatus, isUpdating, selectedBrand } = this.state
                
                if(nameValidatingStatus === "success" ){

                    try{
                        this.setState({
                            isSaving : true
                        }, async() => {
                        
                            let brandData = {
                                name : values.name,
                            }

                            if(isUpdating){
                                brandData.uid = selectedBrand.uid
                            }
    
                            await saveBrand(brandData)
    
                            setTimeout( function(){

                                this.setState({
                                    isValidatingName : false,
                                    nameValidatingStatus : "success",
                                    nameValidatingMessage : "",
                                    isUpdating : false,
                                    isSaving : false,
                                    brandModalActive : false,
                                    selectedBrand : {},
                                    relatedShoes : []
                                })

                                this.loadBrands();

                                message.success("Brand has been saved.");

                            }.bind(this), 1500);
                        
                        })
                    }catch(error){
                        console.log(error);
                        throw(error)
                    }

                }else{
                    message.error("Brand cannot be saved.")
                }
            }else{
                this.setState({
                    nameValidatingStatus : "error",
                    nameValidatingMessage : err.name.errors[0].message
                })
            }
        }); 

    } 

    deleteBrand = async () => {

        const { relatedShoes } = this.state;

        if( relatedShoes.length === 0 ){
            try{
                this.setState({
                    isDeleting : true
                }, async() => {
                    const { selectedBrand } = this.state;
    
                    let result = await deleteBrand(selectedBrand.uid);
                    if(result.code===204){
                        await this.loadBrands();
                      
                        this.setState({
                            isDeleting : false,
                            selectedBrand : {},
                            relatedShoes : []
                        })
        
                        message.success("Brand has been deleted.");
                    }else{
                        this.setState({
                            isDeleting : false
                        })
    
                        message.error("Brand cannot be deleted.");
                    }
                   
                    
                })
            }catch(error){
                console.log(error);
                throw(error)
            }
        }else{
            message.info("Brand is related to a shoe data. Brand cannot be deleted.")
        }

    }

    render(){

        const {
            brands,
            brandsLoading,
            previewImage,
            selectedBrand,
            relatedShoes,
            isChecking,
            brandModalActive,
            brandImageModalActive,
            isUpdating,
            isSaving,
            isDeleting,
            isValidatingName,
            nameValidatingStatus,
            nameValidatingMessage
        } = this.state

        const { getFieldDecorator } = this.props.form;

        return(

            <div>
                <div className="content-header">Brands</div>
                    <div style={{ display : "flex", height: this.props.height - 130 }}> 
                        <div style={{ position: "relative", flex: "1 0 25%" , maxWidth : "420px" , minWdith : "240px"}}>
                            <div className="brand-list-header">
                                <Button style={{ float:"left", zIndex: "10" }} onClick={this.addBrand}><Icon type="plus"/>New Brand</Button>
                                <Button style={{ float:"right", zIndex: "10" }} onClick={this.refreshBrandList}><Icon type="retweet"/></Button>
                                {/* <Form>
                                    <Form.Item style={{marginBottom: "0"}}>
                                        <Input
                                            style={{ marginBottom: "0", width: "100%"}}
                                            onKeyUp={(e) => this.searchbrands(e.target.value)}
                                            placeholder="Search brands"
                                        />
                                    </Form.Item>
                                </Form> */}
                            </div>
                            <div className="brand-list-body">
                                {
                                    brandsLoading ? <div style={{ marginTop: "200px", textAlign : "center" }}>
                                    <Spin size="large"/>
                                    </div> :
                                    brands.length===0 ? <p className="brand-no-list">No brand on the list.</p> :
                                    <Scrollbars style={{ height: this.props.height - 240 }}>
                                        {
                                            brands.map( (data,i) => (
                                                <BrandItem displayBrandDetails={this.displayBrandDetails} key={i} brand={data}/>
                                            ))
                                        }
                                    </Scrollbars>
                                }
                            </div>
                            <div className="brand-list-footer">
                                {/* <div style={{ textAlign: "left", flex : "1" }}>
                                    { hasPrev && <Button  disabled={brandsLoading} onClick={this.prevPage} icon="caret-left" type="default"></Button> }
                                </div>
                                <div style={{ textAlign: "center", flex : "1" }}>
                                    { brands && brands.length > 0 && <span style={{ display: "block", marginTop:"10px", color: "#1b1b1b"}}>Page {brandPage}</span> }
                                </div>
                                <div style={{ textAlign: "right", flex : "1" }}>
                                    { hasNext && <Button style={{ float: "right" }} disabled={brandsLoading} onClick={this.nextPage} icon="caret-right" type="default"></Button>}
                                </div> */}
                            </div>
                        </div>
                        <div style={{ flex: "1 1 0%" }}>
                            <div style={{ flex : "2 0 0%", overflow : "hidden", position : "relative", display : "flex", flexDirection : "column", borderLeft: "1px solid #e4e4e4" }}>
                                <div className="brand-details-header">
                                    
                                    {
                                        Object.keys(selectedBrand).length === 0 ? "" :
                                        <div className="bd-actions">
                                            { isChecking ? "" : 
                                                ( relatedShoes && relatedShoes.length===0 ) && <ButtonGroup>
                                                <Button onClick={this.updateBrand} loading={isDeleting} title="Update brand" className="action-edit"><Icon type="edit"/></Button>
                                                <Popconfirm
                                                    title="Delete this brand? This action cannot be undone."
                                                    onConfirm={this.deleteBrand}
                                                    okText="Yes"
                                                    cancelText="No"
                                                >
                                                    <Button loading={isDeleting} title="Delete brand" className="action-delete"><Icon type="delete"/></Button>
                                                </Popconfirm>
                                            </ButtonGroup> 
                                            }
                                        </div> 
                                    }
                                </div>
                                <div className="brand-details-body">
                                    {
                                        Object.keys(selectedBrand).length === 0 ? 
                                        <p className="no-selected-brand">Please select a brand</p> :
                                        <Scrollbars style={{ height: this.props.height - 190 }}>
                                            <div>
                                                <p className="bd-name">{ selectedBrand.name }</p>
                                                <span className="bd-dateAdded">Date added : { selectedBrand.dateAdded ? moment.unix(selectedBrand.dateAdded.seconds).format("LLL") : "N/A"}</span><span className="bd-dateUpdated">Last modified date : { selectedBrand.dateUpdated ? moment.unix(selectedBrand.dateUpdated.seconds).format("LLL") : "N/A"}</span>
                                                <div className="clearfix"></div>
                                                {
                                                    isChecking ? <div style={{ marginTop: "200px", textAlign : "center" }}>
                                                    <Spin size="large"/>
                                                    </div> :
                                                    relatedShoes.length === 0 ?
                                                    "":
                                                    <div className="bd-section">
                                                        <p className="bd-section-header">List of shoes</p>
                                                        <ul className="bd-shoe-list">
                                                            {
                                                                relatedShoes.map( (data, i) => (
                                                                    <div key={i} style={{ marginBottom : "10px" }}>
                                                                        <Row>
                                                                            <Col span={4}>
                                                                                <img onClick={ () => this.imagePreview(data.images[0]) } alt={data.title}  src={data.images[0]} className="related-shoe-img"/>
                                                                            </Col>
                                                                            <Col span={12}>
                                                                                <p className="bd-label">{ data.title }</p>
                                                                            </Col>
                                                                        </Row>
                                                                    </div>
                                                                ))
                                                            }
                                                        </ul>
                                                    </div>
                                                }
                                            </div>
                                        </Scrollbars>
                                        
                                    }
                                </div>
                                <div className="brand-details-footer">

                                </div>
                            </div>
                        </div>
                        {/* 
                            MODALS
                        */}
                        {
                            brandImageModalActive && <Modal visible={brandImageModalActive} footer={null} onCancel={ () => this.imagePreview('')}>
                                <img alt="Preview Image" style={{ width: '100%' }} src={previewImage} />
                            </Modal>
                        }

                        { brandModalActive && <Modal
                        width={600}
                        visible={brandModalActive}
                        onClose={this.closeBrandModal}
                        title={ isUpdating ? "Update brand" : "Add New brand"}
                        okText="Submit"
                        onOk={this.saveBrand}
                        onCancel={this.closeBrandModal}
                        confirmLoading={isSaving}
                        okButtonProps={{ disabled: isSaving }}
                        cancelButtonProps={{ disabled: isSaving }}
                        closable={false}
                        maskClosable={false}
                        >
                            <Form>
                                <Form.Item label="Brand name"
                                    validateStatus={isValidatingName ? "validating" : nameValidatingStatus}
                                    help={isValidatingName ? "" : nameValidatingMessage }
                                    >
                                    {getFieldDecorator('name', {
                                        rules : [
                                            { required : true , message : "Please enter brand name."}
                                        ],
                                        initialValue : isUpdating ? selectedBrand.name : ""
                                    })(
                                        <Input onKeyUp={e => this.brandNameChange(e.target.value)} className="form-control" placeholder="Enter brand name" />
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
const WrappedBrand = Form.create()(Brand)
export default connect(mapStateToProps)(WrappedBrand);
