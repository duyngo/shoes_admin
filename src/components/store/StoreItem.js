import React, { Component } from 'react';


export class StoreItem extends Component {

    displayStoreDetails = () => {
        this.props.displayStoreDetails(this.props.store)
    }

    render(){
        
        const {
            store
        } = this.props;

        return (
            <div className="store-item">
                <div className="store-item-body" onClick={this.displayStoreDetails}>
                    { store && <span className="store-item-name">{ store.name }</span> }
                </div>
            </div>
        )

    }

}

export default StoreItem;