import React,{ Component } from 'react';

import { 
    Icon
} from 'antd';

export class BannerItem extends Component {

    displayBannerDetails = () => {
        this.props.displayBannerDetails(this.props.banner)
    }

    render(){
        
        const {
            banner
        } = this.props;

        return (
            <div className="banner-item">
                <div className="banner-item-body" onClick={this.displayBannerDetails}>
                    { banner && <span className="banner-item-featured" title="Featured Banner">{ banner.isFeatured ? <Icon type="star" theme="filled" /> : "" }</span> }
                    { banner && <span className="banner-item-code">{ banner.code }</span> }
                    { banner && <span className="banner-item-title">{ banner.title }</span> }
                </div>
            </div>
        )

    }
}

export default BannerItem;