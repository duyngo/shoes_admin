import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import Input from '../../components/uielements/input';
import Checkbox from '../../components/uielements/checkbox';
import Button from '../../components/uielements/button';
import authAction from '../../redux/auth/actions';
import IntlMessages from '../../components/utility/intlMessages';
import SignInStyleWrapper from './signin.style';

import Image from '../../image/group@4x.png';

const { login } = authAction;

class SignIn extends Component {

  state = {
    redirectToReferrer: false,
    email : '',
    password : '',
    loading : false,
    error : '',
    errorCount : 0
  };

  componentWillReceiveProps(nextProps) {
    if (
      this.props.isLoggedIn !== nextProps.isLoggedIn &&
      nextProps.isLoggedIn === true
    ) {
      this.setState({ redirectToReferrer: true });
    }
  
    if( nextProps.error && nextProps.errorCount !== this.props.errorCount ){
      this.setState({
        error: nextProps.error,
        loading:false,
      });
    }
  }

  handleLogin = () => {
    const { login } = this.props;
    const { email, password } = this.state;
    
    this.setState({
      loading : true
    });

    login(email, password);
  };

  handleInputChange = (e) => {
    let { value, name } = e.target;

    this.setState({
      [name]  : value
    })
  }

  render() {
    const from = { pathname: '/dashboard/orders' };
    const { redirectToReferrer , loading, error } = this.state;

    let displayError = "";

    if (redirectToReferrer) {
      return <Redirect to={from} />;
    }

    if(error==="There is no user record corresponding to this identifier. The user may have been deleted." || 
       error==="The password is invalid or the user does not have a password."){
        displayError = "Your username or password is incorrect."
    }else{
        displayError = error;
    }

    return (
      
      <SignInStyleWrapper className="isoSignInPage">
        <div className="isoLoginContentWrapper">
          <div className="isoLoginContent">
            <div className="isoLogoWrapper">
              <img style={{ height: "200px", width: "200px" }} alt="PULIRE Logo" src={Image} />
              {/* <Link to="/dashboard/order">
                <IntlMessages id="page.signInTitle" />
              </Link> */}
            </div>

            <div className="isoSignInForm">
              <div className="isoInputWrapper">
                <Input size="large" placeholder="Email" name="email" onChange={this.handleInputChange} />
              </div>

              <div className="isoInputWrapper">
                <Input size="large" type="password" placeholder="Password" name="password" onChange={this.handleInputChange} />
              </div>

              <div className="isoInputWrapper isoLeftRightComponent">
                { error && <p style={{ marginTop : "10px", color: "#ad2323" }}>{displayError}</p> }
                <Button htmlType={'submit'} type="primary" loading={loading} onClick={this.handleLogin}>
                  <IntlMessages id="page.signInButton" />
                </Button>
              </div>

              
              
            </div>
          </div>
        </div>
      </SignInStyleWrapper>
    );
  }
}

export default connect(
  state => ({
    isLoggedIn: state.Auth.idToken !== null ? true : false,
    error : state.Auth.error,
    errorCount : state.Auth.errorCount
  }),
  { login }
)(SignIn);
