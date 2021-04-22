import React, { Component } from 'react';
import LayoutContent from '../../components/utility/layoutContent';
import LayoutContentWrapper from '../../components/utility/layoutWrapper';
import { 
  checkTokenAuthenticity,
  saveAdmin
} from '../../helpers/user/userRepo';
import FirebaseHelper from '../../helpers/firebase';

import { 
    Input, 
    Form,
    Button,
} from 'antd';

export class AdminSignup extends Component {

  state = {
    code : "",
    message : "",
    email : "",
    uid : "",
    isSaving : false
  }

  async componentDidMount(){
    
    if(this.props.location.state.token===undefined){
        this.props.history.push("/")
    }
    const { token } = this.props.location.state;
    this.checkToken(token)
  }

  checkToken = async (token) => {
    let result = await checkTokenAuthenticity(token);

    if(result.code!=="success"){
        this.props.history.push("/")
    }else{
        this.setState({
            email : result.data.email,
            uid : result.data.uid
        })
    }

  }

  handleConfirmBlur = e => {
    const { value } = e.target;
    this.setState({ confirmDirty: this.state.confirmDirty || !!value });
  };

  compareToFirstPassword = (rule, value, callback) => {
    const { form } = this.props;
    if (value && value !== form.getFieldValue('password')) {
      callback('Please confirm your password.');
    } else {
      callback();
    }
  };

  validateToNextPassword = (rule, value, callback) => {
    const { form } = this.props;
    if (value && this.state.confirmDirty) {
      form.validateFields(['confirm'], { force: true });
    }
    callback();
  };

  signUp = async () => {
    this.props.form.validateFieldsAndScroll(['fullName','password'],(err, values) => {

        if(!err){

            const { fullName, password } = values;
            const { email, uid } = this.state;

            try{
                this.setState({
                    isSaving : true,
                }, async () => {
                    let userData = {
                        email : email,
                        type : "admin",
                        fullName : fullName,
                        isDeleted : false,
                        loginType : "email",
                        phoneNumber : "",
                        presence : "online"
                    }

                    let result = await saveAdmin(userData, uid);

                    if(result.code===200){
                        FirebaseHelper.firebaseAuth().createUserWithEmailAndPassword(email, password).catch( async function(error) {
                            // Handle Errors here.
                            var errorMessage = error.message;
            
                            console.log(errorMessage);
                            throw(errorMessage);
                            
                            // ...
                        });
                    }else{
                        console.log(`[ERROR] ${result.message}`);
                        throw "Signup error";
                    }
                })
            }catch(error){
                console.log(`[ERROR] ${error.message}`);
                throw(error)
            }
        }
    });
  }

  render() {

    const {
      email,
      isSaving
    } = this.state

    const { getFieldDecorator } = this.props.form;
 
    return (
      <LayoutContentWrapper style={{ height: '100vh' }}>
        <LayoutContent>
          <div style={{ margin: "0 auto", width: "500px" }}>
            <h1>Sign up</h1>
            <p>Your email address will be : { email }</p>
            <Form>
                <Form.Item label="Full name">
                {getFieldDecorator('fullName', {
                    rules: [
                    {
                        required: true,
                        message: 'Please input your fullname',
                    },
    
                    ],
                })(<Input className="form-control" placeholder="Enter fullname" />)}
                </Form.Item>
                <Form.Item label="Password" hasFeedback>
                {getFieldDecorator('password', {
                    rules: [
                    {
                        required: true,
                        message: 'Please input your password!',
                    },
                    {
                        validator: this.validateToNextPassword,
                    },
                    ],
                })(<Input type="password" className="form-control" placeholder="Enter password" />)}
                </Form.Item>
                <Form.Item label="Confirm Password" hasFeedback>
                {getFieldDecorator('confirm', {
                    rules: [
                    {
                        required: true,
                        message: 'Please confirm your password!',
                    },
                    {
                        validator: this.compareToFirstPassword,
                    },
                    ],
                })(<Input type="password" className="form-control" placeholder="Confirm password" onBlur={this.handleConfirmBlur} />)}
                </Form.Item>
                <Button loading={isSaving} onClick={this.signUp} size="large" type="primary" style={{ width : "100%" }}>Sign up</Button>
            </Form>
          </div>
        </LayoutContent>
      </LayoutContentWrapper>
    );
  }
}

const WrappedSignup = Form.create()(AdminSignup)
export default WrappedSignup;