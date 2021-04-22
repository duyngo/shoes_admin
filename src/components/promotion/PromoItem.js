import React,{ Component } from 'react';

import { 
    Icon
} from 'antd';

export class PromoItem extends Component {

    displayPromoDetails = () => {
        this.props.displayPromoDetails(this.props.promo)
    }

    render(){
        
        const {
            promo
        } = this.props;

        return (
            <div className="promo-item">
                <div className="promo-item-body" onClick={this.displayPromoDetails}>
                    { promo && <span className="promo-item-featured" title="Featured Promotion">{ promo.isFeatured ? <Icon type="star" theme="filled" /> : "" }</span> }
                    { promo && <span className="promo-item-code">{ promo.code }</span> }
                    { promo && <span className="promo-item-title">{ promo.title }</span> }
                </div>
            </div>
        )

    }
}

export default PromoItem;