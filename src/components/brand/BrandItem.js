import React, { Component } from 'react';

export class BrandItem extends Component {

    displayBrandDetails = () => {
        this.props.displayBrandDetails(this.props.brand)
    }

    render(){
        
        const {
            brand
        } = this.props;

        return (
            <div className="brand-item">
                <div className="brand-item-body" onClick={this.displayBrandDetails}>
                    { brand && <span className="brand-item-name">{ brand.name }</span> }
                </div>
            </div>
        )

    }

}

export default BrandItem;