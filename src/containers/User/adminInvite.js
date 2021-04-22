import React, { Component } from 'react';
import LayoutContent from '../../components/utility/layoutContent';
import LayoutContentWrapper from '../../components/utility/layoutWrapper';
import { 
  checkTokenAuthenticity
} from '../../helpers/user/userRepo';

export default class extends Component {

  state = {
    code : "",
    message : ""
  }

  async componentDidMount(){
    
    const { token } = this.props.match.params;
    this.checkToken(token)

  }

  checkToken = async (token) => {
    let result = await checkTokenAuthenticity(token);

    if(result.code==="success"){
      this.props.history.push({
        pathname: '/admin/signup',
        state: { token: token }
      });
    }

    this.setState({
      code : result.code,
      message : result.message
    })
  }

  render() {

    const {
      code,
      message
    } = this.state

    return (
      <LayoutContentWrapper style={{ height: '100vh' }}>
        <LayoutContent>
          <div style={{ textAlign : "center" }}>
            <h1>Welcome, user!</h1>
            { (code && code==="success") && 
              <div>
                <h3>{ message }</h3>
                <span style={{ display : "block", fontSize: "18px"}}> <a href=''>Link to sign up form.</a></span>
              </div>
            }
            { (code && code==="error") && <h3>{ message }</h3>}
          </div>
        </LayoutContent>
      </LayoutContentWrapper>
    );
  }
}
