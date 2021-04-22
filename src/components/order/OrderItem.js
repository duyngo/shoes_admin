import React, { Component } from 'react';
import moment from 'moment';

import Tags from '../uielements/tag';
import TagWrapper from '../../containers/Tags/tag.style';
import OrderHelper from '../../helpers/order';


const Tag = props => (
    <TagWrapper>
      <Tags {...props}>{props.children}</Tags>
    </TagWrapper>
);

export class OrderItem extends Component{

    state = {
        isDeleting : false
    }

    displayOrderDetails = () =>{
        this.props.displayOrderDetails(this.props.order);
    }

    render(){

        const { order } = this.props;

        const { tagColor, tagText } = OrderHelper.renderStatus(order.status);

        return (
            <div className="order-item">
                <div className="order-item-body" onClick={this.displayOrderDetails}>
                    { order && <span className="order-item-date">{ order.dateSent.seconds ? moment.unix(order.dateSent.seconds).format("LL") : moment.unix(order.dateSent._seconds).format("LL")}</span> }
                    { order && <span className="order-item-uid">{ order.orderID ? order.orderID : "N/A" }</span> }
                    { order && <span className="order-item-status"><Tag color={tagColor}>{tagText}</Tag></span>}
                </div>
            </div>
        )
    }

}

export default OrderItem;