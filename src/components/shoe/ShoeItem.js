import React, { Component } from 'react';
import { 
    Row, 
    Col,
    Icon
} from 'antd';

export class ShoeItem extends Component {

    displayShoeDetails = () => {
        this.props.displayShoeDetails(this.props.shoe)
    }

    render(){
        
        const {
            shoe
        } = this.props;

        return (
            <div className="shoe-item">
                <div className="shoe-item-body" onClick={this.displayShoeDetails}>
                    <Row>
                        <Col span={8}>
                            { shoe && <img alt={shoe.title} src={ shoe.images[0] } />}
                        </Col>
                        <Col span={16}>
                        { shoe && <span className="shoe-item-featured" title="Featured Shoes">{ shoe.isFeatured ? <Icon type="star" theme="filled" /> : "" }</span> }
                        { shoe && <span className="shoe-item-title">{ shoe.title }</span> }
                        { shoe && <span className="shoe-item-brand">{ shoe.brand }</span> }
                        { shoe && <span className="shoe-item-price">Rp { shoe.priceInRp }</span> }
                        </Col>
                    </Row>

                </div>
            </div>
        )

    }

}

export default ShoeItem;