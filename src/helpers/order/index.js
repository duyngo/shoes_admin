const orderStatus = {
    WAITING_FOR_PICKUP : 'waitingForPickup',
    ON_THE_WAY  :   'onTheWay',
    PAID_AND_ON_PROGRESS : 'paidAndOnProgress',
    DONE    :   'done',
    DELIVERED : 'delivered'
}


class OrderHelper{

    computeTotalAmount = items => {

        let total = 0;
    
        items.forEach( (item, i) => {
            total += item.priceInRp;
        })
    
        return total;
    }
    
    renderStatus = status => {
    
        let statusRender = {};
    
        switch( status ){
            case orderStatus.WAITING_FOR_PICKUP:
                statusRender = {
                    tagColor : "#e4934d",
                    tagText : "WAITING FOR PICK UP"
                }
                break;
            case orderStatus.ON_THE_WAY:
                statusRender = {
                    tagColor : "#6d4dea",
                    tagText : "ON THE WAY"
                }
                break;
            case orderStatus.PAID_AND_ON_PROGRESS:
                    statusRender = {
                        tagColor : "#1a8ebf",
                        tagText : "IN PROGRESS"
                    }
                    break;
            case orderStatus.DONE:
                    statusRender = {
                        tagColor : "#5fbf8f",
                        tagText : "DONE"
                    }
                    break;
            case orderStatus.DELIVERED:
                    statusRender = {
                        tagColor : "#1781d5",
                        tagText : "PAID & DELIVERED"
                    }
                    break;
            default : break;
        }
        
        return statusRender;
    
    }

}

export default new OrderHelper();
