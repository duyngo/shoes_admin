import React, { Component } from 'react';
import { Route } from 'react-router-dom';
import asyncComponent from '../../helpers/AsyncFunc';

const routes = [
  {
    path: '',
    component: asyncComponent(() => import('../Order')),
  },
  {
    path: 'orders',
    component: asyncComponent(() => import('../Order')),
  },
  {
    path: 'promotions',
    component: asyncComponent(() => import('../Promotion')),
  },
  {
    path: 'banners',
    component: asyncComponent(() => import('../Banner')),
  },
  {
    path: 'users',
    component: asyncComponent(() => import('../User')),
  },
  {
    path: 'stores',
    component: asyncComponent(() => import('../Store')),
  },
  {
    path: 'brands',
    component: asyncComponent(() => import('../Brand')),
  },
  {
    path: 'shoes',
    component: asyncComponent(() => import('../Shoe')),
  },
  {
    path: 'blankPage',
    component: asyncComponent(() => import('../blankPage')),
  },
  {
    path: 'authCheck',
    component: asyncComponent(() => import('../AuthCheck')),
  },
];

class AppRouter extends Component {
  render() {
    const { url, style } = this.props;
    return (
      <div style={style}>
        {routes.map(singleRoute => {
          const { path, exact, ...otherProps } = singleRoute;
          return (
            <Route
              exact={exact === false ? false : true}
              key={singleRoute.path}
              path={`${url}/${singleRoute.path}`}
              {...otherProps}
            />
          );
        })}
      </div>
    );
  }
}

export default AppRouter;
