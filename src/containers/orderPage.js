import React, { Component } from 'react';

import PageHeader from "../components/utility/pageHeader";
import LayoutContent from '../components/utility/layoutContent';
import LayoutContentWrapper from '../components/utility/layoutWrapper';

export class Order extends Component {

    render() {
        return (
        <LayoutContentWrapper style={{ height: '100vh' }}>
            <LayoutContent>
            <PageHeader>Orders</PageHeader>
            </LayoutContent>
        </LayoutContentWrapper>
        );
    }
}

export default connect(state => ({
    ...state.App,
    height: state.App.height
}))(Order);
