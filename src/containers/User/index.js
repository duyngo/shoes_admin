import React, { Component } from 'react';
import { connect } from "react-redux";
import _ from 'lodash/'

import {
    getUsers,
    searchUsers,
    updateUser,
    deleteUser,
    banUser,
    notifyBannedUser,
    emailBannedUser,
    sendAdminInvite,
    checkIfManager,
    checkDuplicateEmail,
} from '../../helpers/user/userRepo';

import {
    saveNotification
} from '../../helpers/notification/notificationRepo';

import FirebaseHelper from '../../helpers/firebase';

import Tags from '../../components/uielements/tag';
import Modal from '../../components/feedback/modal';
import Spin from '../../components/uielements/spin';
import TagWrapper from '../../containers/Tags/tag.style';
import { UserItem } from '../../components/user/UserItem';
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

const Tag = props => (
    <TagWrapper>
      <Tags {...props}>{props.children}</Tags>
    </TagWrapper>
);

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


export class User extends Component{
    
    constructor(){
        super();
        this.state = {
            users : [],
            usersLoading : false,
            displayDeleted : false,
            selectedUser : {},
            isManager : false,
            displayPhoto : "",
            user : {},
            userModalActive : false,
            isUpdating : false,
            isSaving : false,
            isDeleting : false,
            banUserModalActive : false,
            banReason : "",
            isBanning : false,
            isSending : false,
            adminInviteModalActive : false,
            isValidatingEmail : false,
            emailValidatingMessage : "",
            emailValidatingStatus : "success",
            searchKeyword : "",
        }
    }

    async componentDidMount(){
        this.loadUsers();

        let currentUser = FirebaseHelper.firebaseAuth().currentUser;
        let isManager = await checkIfManager(currentUser.uid);

        this.setState({
            isManager : isManager
        })
    }

    loadUsers = async () => {

        try{
            this.setState({
                usersLoading : true
            }, async () => {
                const { displayDeleted } = this.state;
                let users = await getUsers();
                this.setState({
                    usersLoading : false,
                    users : [...users]
                })
            })

        }catch(error){
            console.log(error)
            throw error
        }

    }

    searchUsers = _.debounce( async (keyword) => {

        if(keyword.length){
            this.setState({
                usersLoading : true,
                users : []
            }, async () => {
                let users = await searchUsers(keyword)
                this.setState({
                    usersLoading : false,
                    users : [...users]
                })
            })
        }else{
            this.loadUsers()
        }

    }, 500)

    refreshUserList = () => {
        this.setState({
            selectedUser : {}
        }, () => {
            this.loadUsers();
        })
    }
    displayUserDetails = (user) => {
        this.setState({
            selectedUser : user
        })
    }
    
    openUserModal = () => {
        this.setState({
            isUpdating : true,
            userModalActive : true
        })
    }

    closeUserModal = () => {
        this.setState({
            isUpdating : false,
            userModalActive : false
        })
    }

    openAdminviteModal = () => {
        const { isManager } = this.state

        if(isManager){
            this.setState({
                adminInviteModalActive : true
            })
        }else{
            message.error("You don't have the access rights for this feature")
        }
        
    }

    closeAdminInviteModal = () => {
        this.setState({
            adminInviteModalActive : false
        })
    }

    handleChange = info => {
        getBase64(info.file, imageUrl =>
            this.setState({
                displayPhoto : imageUrl
            })
        );
    };

    emailChange = _.debounce ((email) => {

        this.setState({
            isValidatingEmail : true
        }, async () => {
            
            const { selectedUser } = this.state

            if(selectedUser.email===email){
                this.setState({
                    isValidatingEmail : false,
                    emailValidatingStatus : "success",
                    emailValidatingMessage : ""
                })
            }else{
                let data = await checkDuplicateEmail(email)

                this.setState({
                    isValidatingEmail : false,
                    emailValidatingStatus : data.code,
                    emailValidatingMessage : data.message
                })
            }
        })
  
    },500)

    updateUser = async (data) => {

        this.props.form.validateFieldsAndScroll((err, values) => {

            
            if (!err) {

                const { emailValidatingStatus } = this.state;

                if(emailValidatingStatus=="success"){
                    try{
                        this.setState({
                            isSaving : true
                        }, async() => {
    
                            const { selectedUser } = this.state;
    
                            let userData = {
                                fullName : values.fullName,
                                email : values.email,
                                phoneNumber : values.phoneNumber,
                                type : selectedUser.type,
                                deviceType : selectedUser.deviceType,
                                fcmToken : selectedUser.fcmToken,
                                isDeleted : selectedUser.isDeleted,
                                lastOpenNotificationAt : selectedUser.lastOpenNotificationAt,
                                loginType : selectedUser.loginType,
                                status : selectedUser.status,
                                uid : selectedUser.uid
                            }
    
                            await updateUser(userData, values.imageFile)
    
                            this.setState({
                                isSaving : false,
                                userModalActive : false,
                                selectedUser : {}
                            })
        
                            this.loadUsers();
    
                            message.success("User profile has been updated.");
    
                        })
                    }catch(error){
                        console.log(error);
                        throw(error)
                    }
                }else{
                    this.setState({
                        emailValidatingStatus : "error",
                        emailValidatingMessage : "Sorry but this email address is already used. Please use another email."
                    })
                }
            }else{
                this.setState({
                    emailValidatingStatus : "error",
                    emailValidatingMessage : err.code.errors[0].message
                })
            }
        }); 

    }

    deleteUser = async () => {
        try{
            try{
                this.setState({
                    isDeleting : true
                }, async() => {
                    const { selectedUser } = this.state;
                    let s = {...selectedUser};
                    s.isDeleted = true;
                    
                    await deleteUser(s);

                    setTimeout( function(){
                        this.loadUsers();

                        this.setState({
                            isDeleting : false,
                            selectedUser : {}
                        })
    
                        message.success("User has been deleted.");
                    }.bind(this), 3000);

                   
                    
                })
            }catch(error){
                console.log(error);
                throw(error)
            }
        }catch(error){
            console.log(error);
            throw(error)
        }
    }

    openBanUserModal = () => {
        this.setState({
            banUserModalActive : true
        })
    }

    closeBanUserModal = () => {
        this.setState({
            banUserModalActive : false
        })
    }

    banUser = async () => {

        this.props.form.validateFieldsAndScroll(['banReason'],(err, values) => {
            if (!err) {

                let banReason = values.banReason;

                try{
                    this.setState({
                        isBanning : true
                    }, async() => {
                        const { selectedUser } = this.state;
                        
                        let newNotif = {
                            title : 'PULIRE Ban Account',
                            body : "Your account has been banned, Please contact the admin for information.",
                            data : {
                                reasonForBanning : values.banReason,
                                userUid : selectedUser.uid
                            },
                            type : "accountBan"
                        }

                        await saveNotification(newNotif)
                        let s = {...selectedUser};
                        s.status = "deactivated";
                        await banUser(s);

                        let body = `<div>
                            <p>You are banned from using the PULIRE services because of the following reason(s) :</p>
                            <p>${banReason}</p>

                        </div>`;

                        let url = FirebaseHelper.getFirebaseConfig().authDomain
                        
                        await emailBannedUser( {
                            userEmail : selectedUser.email,
                            subject : 'PULIRE account banned!',
                            body : body,
                            authDomain : url,
                        } )

                        await notifyBannedUser ( {
                            userToken : selectedUser.fcmToken,
                            uid : selectedUser.uid,
                            title : 'PULIRE Ban Account',
                            body : "Your account has been banned, Please contact the admin for information."
                        })

                        setTimeout( function() {

                            this.setState({
                                isBanning : false,
                                banUserModalActive : false,
                                selectedUser : {}
                            })
                            
                            this.loadUsers();

                            message.success("User has been banned.");

                        }.bind(this), 1500);

                    
                    })
                }catch(error){
                    console.log(error);
                    throw(error)
                }

            }
        }); 
    }

    sendAdminInvite = async () => {
        
        const { isManager } = this.state;

        if(isManager){

            this.props.form.validateFieldsAndScroll(['emailAddress'],(err, values) => {
                if (!err) {
    
                    let emailAddress = values.emailAddress;
    
                    try{
                        this.setState({
                            isSending : true
                        },  async() => {
                                                  
                            const uuidv1 = require('uuid/v1');
                            let adminToken = uuidv1();
                            
                            let url = FirebaseHelper.getFirebaseConfig().authDomain
            
                            sendAdminInvite( {
                                userEmail : emailAddress,
                                subject : 'PULIRE admin invite',
                                body : `<div>
                                
                                    <p>Greetings! <br><br> You are invited to be an administrator of PULIRE admin panel. Please click the link below.</p>
                                    <a style="cursor: pointer" target="_blank" rel="noindex ,nofollow" href="${url}/admin/invite/${adminToken}">PULIRE admin sign up</a>

                                </div>`,
                                token : adminToken,
                                authDomain : url,
                            } ).then( (result) => {
                                if(result){
                                    if(result.code=="success"){
                                        message.success(result.message)
                                    }else{
                                        message.error(result.message)
                                    }
                                }else{
                                    message.error("Error sending email.")
                                }
            
                                this.setState({
                                    isSending : false,
                                    adminInviteModalActive : false
                                })
                            }).catch(error => {
                                console.log(error)
                                this.setState({
                                    isSending : false,
                                    adminInviteModalActive : false
                                })
                            })
                
                        })
                        
                    }catch(error){
                        console.log(error)
                        message.error("Error sending email.")
                        throw(error)
                    }
                }
            }); 

        }else{

            message.error("You don't have the access rights for this feature")

        }


    }

    render(){

        const {
            users,
            usersLoading,
            displayDeleted,
            selectedUser,
            isManager,
            displayPhoto,
            userModalActive,
            isUpdating,
            isSaving,
            isDeleting,
            banUserModalActive,
            banReason,
            isBanning,
            adminInviteModalActive,
            isSending,
            isValidatingEmail,
            emailValidatingStatus,
            emailValidatingMessage
        } = this.state

        const { getFieldDecorator, getFieldValue } = this.props.form;

        return(

            <div>
                <div className="content-header">Users</div>
                    <div style={{ display : "flex", height: this.props.height - 130 }}> 
                        <div style={{ position: "relative", flex: "1 0 25%" , maxWidth : "420px" , minWdith : "240px"}}>
                            <div className="user-list-header">
                            <Button style={{ float: "left", zIndex : "10" }} onClick={this.openAdminviteModal}><Icon type="mail" /> Send admin invite</Button>
                            <Button style={{ float: "right", zIndex : "10" }} onClick={this.refreshUserList}><Icon type="retweet" /></Button>
                                <Form>
                                    <Form.Item style={{marginBottom: "0"}}>
                                        <Input
                                            style={{ marginBottom: "0", width: "100%"}}
                                            onKeyUp={(e) => this.searchUsers(e.target.value)}
                                            placeholder="Search users"
                                            suffix={
                                                <Tooltip title="Search criteria : Email, Fullname, Phone number, User type">
                                                <Icon type="info-circle" style={{ color: 'rgba(0,0,0,.45)' }} />
                                                </Tooltip>
                                            }
                                        />
                                    </Form.Item>
                                </Form>
                            </div>
                            <div className="user-list-body">
                                {
                                    usersLoading ? <div style={{ marginTop: "200px", textAlign : "center" }}>
                                    <Spin size="large"/>
                                    </div>:
                                    users.length==0 ? <p className="user-no-list">No user on the list.</p> :
                                    <Scrollbars style={{ height: this.props.height - 240 }}>
                                        {
                                            users.map( (data,i) => (
                                                <UserItem displayUserDetails={this.displayUserDetails} key={i} user={data}/>
                                            ))
                                        }
                                    </Scrollbars>
                                }
                            </div>
                            <div className="user-list-footer">
                                {/* <div style={{ textAlign: "left", flex : "1" }}>
                                    { hasPrev && <Button  disabled={usersLoading} onClick={this.prevPage} icon="caret-left" type="default"></Button> }
                                </div>
                                <div style={{ textAlign: "center", flex : "1" }}>
                                    { users && users.length > 0 && <span style={{ display: "block", marginTop:"10px", color: "#1b1b1b"}}>Page {userPage}</span> }
                                </div>
                                <div style={{ textAlign: "right", flex : "1" }}>
                                    { hasNext && <Button style={{ float: "right" }} disabled={usersLoading} onClick={this.nextPage} icon="caret-right" type="default"></Button>}
                                </div> */}
                            </div>
                        </div>
                        <div style={{ flex: "1 1 0%" }}>
                            <div style={{ flex : "2 0 0%", overflow : "hidden", position : "relative", display : "flex", flexDirection : "column", borderLeft: "1px solid #e4e4e4" }}>
                                <div className="user-details-header">
                                    
                                    {
                                    Object.keys(selectedUser).length == 0 ? "" :
                                        
                                        selectedUser.status=="deactivated" ? "" :
                                        <div className="ud-actions">
                                            <ButtonGroup>
                                                <Button loading={isDeleting} onClick={this.openUserModal} title="Update user" className="action-update"><Icon type="edit"/></Button>
                                                <Popconfirm
                                                    title={`Delete this user from ${selectedUser.type} users? This can not be undone.`}
                                                    onConfirm={this.deleteUser}
                                                    okText="Yes"
                                                    cancelText="No"
                                                >
                                                    <Button loading={isDeleting} title="Delete user" className="action-delete"><Icon type="delete"/></Button>
                                                </Popconfirm>
                                            </ButtonGroup>
                                        </div> 
                                        
                                    }
                                </div>
                                <div className="user-details-body">
                                    {
                                        Object.keys(selectedUser).length == 0 ? 
                                        <p className="no-selected-user">Please select a user</p> :
                                        <Row>
                                            <Col span={6} style={{ textAlign : "left" }}>
                                                <img src={selectedUser.imageUrl ? selectedUser.imageUrl : require('../../image/default-user.jpg')} className="ud-photo"></img>
                                            </Col>
                                            <Col span={18}>
                                                <p className="ud-fullname">{selectedUser.fullName}</p>
                                                <div className="ud-contact">
                                                    <span className="ud-email"><Icon type="mail" style={{ marginRight: "10px"}}/>{selectedUser.email ? selectedUser.email : "N/A"}</span><span className="ud-phone"><Icon type="phone" style={{ marginRight: "10px"}}/>{selectedUser.phoneNumber ? selectedUser.phoneNumber : "N/A"}</span>
                                                </div>
                                                <div style={{ marginTop : "50px" }}>
                                                    {
                                                        selectedUser.status=="deactivated" ? <Tag color="#ca453b">BANNED</Tag> :
                                                        <Button loading={isDeleting} className="action-ban" onClick={this.openBanUserModal}>Ban user</Button>
                                                    }
                                                </div>
                                            </Col>
                                        </Row>
                                    }
                                </div>
                                <div className="user-details-footer">

                                </div>
                            </div>
                        </div>
                        {/* 
                            MODALS
                        */}
                        { userModalActive && <Modal
                        width={600}
                        visible={userModalActive}
                        onClose={this.closeUserModal}
                        title="Update User"
                        okText="Submit"
                        onOk={this.updateUser}
                        onCancel={this.closeUserModal}
                        confirmLoading={isSaving}
                        okButtonProps={{ disabled: isSaving }}
                        cancelButtonProps={{ disabled: isSaving }}
                        closable={false}
                        maskClosable={false}
                        >
                            <Form>
                                <Form.Item label="Name"
                                >
                                    {getFieldDecorator('fullName', {
                                        rules : [
                                            { required : true , message : "Please enter name."}
                                        ],
                                        initialValue : isUpdating ? selectedUser.fullName : ""
                                    })(
                                        <Input className="form-control" placeholder="Enter name" 
                                       />
                                    )
                                    }
                                </Form.Item>
                            </Form>
                            <Form>
                                <Form.Item label="Email"
                                     validateStatus={isValidatingEmail ? "validating" : emailValidatingStatus}
                                     help={isValidatingEmail ? "" : emailValidatingMessage }
                                >
                                    {getFieldDecorator('email', {
                                        rules : [
                                            { required : true , message : "Please enter email address."}
                                        ],
                                        initialValue : isUpdating ? selectedUser.email : ""
                                    })(
                                        <Input className="form-control" placeholder="Enter email address" 
                                        onChange={(e) => this.emailChange(e.target.value)}/>
                                    )
                                    }
                                </Form.Item>
                            </Form>
                            <Form>
                                <Form.Item label="Contact number">
                                    {getFieldDecorator('phoneNumber', {
                                        rules : [
                                            { required : true , message : "Please enter contact number."}
                                        ],
                                        initialValue : isUpdating ? selectedUser.phoneNumber : ""
                                    })(
                                        <Input className="form-control" placeholder="Enter contact number" />
                                    )
                                    }
                                </Form.Item>
                            </Form>
                            <Form.Item label="Display photo">
                                {getFieldDecorator('imageFile', {
                                        rules : [
                                            { required : isUpdating ? false : true , message : "Please add an image to the promotion."}
                                        ]
                                    }
                                )(
                                    <Upload 
                                        accept="image/*"
                                        showUploadList={false}
                                        beforeUpload={beforeUpload}
                                        onChange={this.handleChange}
                                    >
                                        <Button>
                                            <Icon type="upload" /> Upload
                                        </Button>
                                    </Upload>
                                )}
                                <img style={{ width: "100%", height: "200px"}} src={ selectedUser.imageUrl ? selectedUser.imageUrl : displayPhoto}></img>
                            </Form.Item>
                            

                        </Modal>
                        }

                        { banUserModalActive && <Modal
                        width={600}
                        visible={banUserModalActive}
                        onClose={this.closeBanUserModal}
                        title="Ban user"
                        okText="Submit"
                        onOk={this.banUser}
                        onCancel={this.closeBanUserModal}
                        confirmLoading={isBanning}
                        okButtonProps={{ disabled: isBanning }}
                        cancelButtonProps={{ disabled: isBanning }}
                        closable={false}
                        maskClosable={false}
                        >
                            <Form>
                                <Form.Item label="Reasons for banning">
                                    {getFieldDecorator('banReason', {
                                        rules : [
                                            { required :  true, message : "Please enter a reason."}
                                        ]
                                    })(
                                        <TextArea className="form-control" placeholder="Enter reason"></TextArea>
                                    )
                                    }
                                </Form.Item>
                            </Form>
                        </Modal>
                        }
                        { adminInviteModalActive && <Modal
                        width={600}
                        visible={adminInviteModalActive}
                        onClose={this.closeAdminInviteModal}
                        title="User admin invite"
                        okText="Submit"
                        onOk={this.sendAdminInvite}
                        onCancel={this.closeAdminInviteModal}
                        confirmLoading={isSending}
                        okButtonProps={{ disabled: isSending }}
                        cancelButtonProps={{ disabled: isSending }}
                        closable={false}
                        maskClosable={false}
                        >
                            <Form>
                                <Form.Item label="Email">
                                    {getFieldDecorator('emailAddress', {
                                        rules : [
                                            {
                                                type: 'email',
                                                message: 'Please enter a valid email address',
                                            },
                                            { required :  true, message : "Please enter an email address."}
                                        ]
                                    })(
                                        <Input className="form-control" placeholder="Enter email address"/>
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
const WrappedUser = Form.create()(User)
export default connect(mapStateToProps)(WrappedUser);
