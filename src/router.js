import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { ConnectedRouter } from 'react-router-redux';
import { connect } from 'react-redux';

import App from './containers/App/App';
import asyncComponent from './helpers/AsyncFunc';
import { Icon } from 'antd';

const RestrictedRoute = ({ component: Component, isLoggedIn, ...rest }) => (
  <Route
    {...rest}
    render={props =>
      isLoggedIn ? (
        <Component {...props} />
      ) : (
        <Redirect
          to={{
            pathname: '/signin',
            state: { from: props.location }
          }}
        />
      )
    }
  />
);
const PublicRoutes = ({ history, isLoggedIn , authInit}) => {

  if(!authInit) {
    return <div style={{
        display:'flex',
        justifyContent:'center',
        alignItems:'center',
        minHeight:'100vh',
        flexDirection:'column',
        backgroundColor:'white'
    }}><h1 style={{ marginBottom : "50px" }}></h1> <Icon style={{fontSize:'40px'}} type="loading"></Icon> </div>
  }

  return (
    <ConnectedRouter history={history}>
      <div>
        <Route
          exact
          path={'/'}
          component={asyncComponent(() => import('./containers/Page/signin'))}
        />
        <Route
          exact
          path={'/signin'}
          component={asyncComponent(() => import('./containers/Page/signin'))}
        />
        <Route
          exact
          path={'/admin/invite/:token'}
          component={asyncComponent(() => import('./containers/User/adminInvite'))}
        />
        <Route
          path={'/admin/signup'}
          component={asyncComponent(() => import('./containers/User/AdminSignup'))}
        />
        <RestrictedRoute
          path="/dashboard"
          component={App}
          isLoggedIn={isLoggedIn}
        />
      </div>
    </ConnectedRouter>
  );
};

export default connect(state => ({
  isLoggedIn: state.Auth.idToken !== null,
  authInit: !!state.Auth.authInit
}))(PublicRoutes);
