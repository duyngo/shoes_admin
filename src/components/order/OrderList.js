import React, { Component } from 'react';

import { connect } from "react-redux";
import Spin from '../uielements/spin';
import { Order } from './Order';
import { InputSearch } from '../uielements/input';
import  actions  from '../../redux/order/actions';

const {
    displayOrderDetails
}  = actions;

export class OrderList extends Component {

    render(){

        const { orders } = this.props;
        return (
            Object.keys( orders ).map( (data, key) => 
                <Order actions={this.props.actions} data-key={data} key={data} order={orders[data]}/>
            )
        )

    }

}

const mapStateToProps = state => ({
    ...state.Order
})

export default connect( mapStateToProps, { displayOrderDetails } )(Order);