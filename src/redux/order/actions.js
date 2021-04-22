const actions = {

    FETCH_ORDERS : 'FETCH_ORDERS',
    FETCH_ORDERS_ERROR : 'FETCH_ORDERS_ERROR',
    FETCH_ORDERS_SUCCESS : 'FETCH_ORDERS_SUCCESS',
    DISPLAY_ORDER_DETAILS : 'DISPLAY_ORDER_DETAILS',
    SEARCH_ORDERS : 'SEARCH_ORDERS',
    FETCH_COURIERS : 'FETCH_COURIERS',
    FETCH_COURIERS_SUCCESS : 'FETCH_COURIERS_SUCCESS', 
    FETCH_COURIERS_ERROR : 'FETCH_COURIERS_ERROR', 
    UPDATE_ORDER_STATUS : 'UPDATE_ORDER_STATUS',
    UPDATE_ORDER_STATUS_SUCCESS : 'UPDATE_ORDER_STATUS_SUCCESS',
    UPDATE_ORDER_STATUS_ERROR : 'UPDATE_ORDER_STATUS_ERROR',
    DELETE_ORDER : 'DELETE_ORDER',
    DELETE_ORDER_SUCCESS : 'DELETE_ORDER_SUCCESS',
    DELETE_ORDER_ERROR : 'DELETE_ORDER_ERROR',
    FETCH_CUSTOMERS : 'FETCH_CUSTOMERS',
    FETCH_CUSTOMERS_SUCCESS : 'FETCH_CUSTOMERS_SUCCESS',
    FETCH_CUSTOMERS_ERROR : 'FETCH_CUSTOMERS_ERROR',
    FETCH_SERVICES : 'FETCH_SERVICES',
    FETCH_SERVICES_SUCCESS : 'FETCH_SERVICES_SUCCESS',
    FETCH_SERVICES_ERROR : 'FETCH_SERVICES_ERROR',
    ADD_ORDER : 'ADD_ORDER',
    ADD_ORDER_SUCCESS : 'ADD_ORDER_SUCCESS',
    ADD_ORDER_ERROR : 'ADD_ORDER_ERROR',
    IMAGE_UPLOAD : 'IMAGE_UPLOAD',

    fetchOrders: ( searchString = ""  ) => {
        return { 
            type: actions.FETCH_ORDERS,
            payload : { searchString }
        }
    },

    fetchOrdersSuccess: ( data, message ) => {
        return {
            type : actions.FETCH_ORDERS_SUCCESS,
            payload: { data , message }
        }
    },

    fetchOrdersError: ( message ) =>{
        return {
            type : actions.FETCH_ORDERS_ERROR,
            payload : { message }
        }
    },

    displayOrderDetails: ( data ) => {
        return {
            type : actions.DISPLAY_ORDER_DETAILS,
            payload : { data }
        }
    },

    fetchCouriers: ( data ) => {
        return {
            type : actions.FETCH_COURIERS
        }
    },

    fetchCouriersSuccess: ( data, message ) => {
        return {
            type : actions.FETCH_COURIERS_SUCCESS,
            payload: { data , message }
        }
    },

    fetchCouriersError: ( message ) =>{
        return {
            type : actions.FETCH_COURIERS_ERROR,
            payload : { message }
        }
    },

    updateOrderStatus : ( data ) =>{
        return {
            type : actions.UPDATE_ORDER_STATUS,
            payload : { data }
        }
    },

    updateOrderStatusSuccess : ( data ) =>{
        return {
            type : actions.UPDATE_ORDER_STATUS_SUCCESS
        }
    },

    updateOrderStatusError : ( data ) =>{
        return {
            type : actions.UPDATE_ORDER_STATUS_ERROR
        }
    },

    fetchCustomers: ( data ) => {
        return {
            type : actions.FETCH_CUSTOMERS
        }
    },

    fetchCustomersSuccess: ( data, message ) => {
        return {
            type : actions.FETCH_CUSTOMERS_SUCCESS,
            payload: { data , message }
        }
    },

    fetchCustomersError: ( message ) =>{
        return {
            type : actions.FETCH_CUSTOMERS_ERROR,
            payload : { message }
        }
    },

    fetchServices: ( data ) => {
        return {
            type : actions.FETCH_SERVICES
        }
    },

    fetchServicesSuccess: ( data, message ) => {
        return {
            type : actions.FETCH_SERVICES_SUCCESS,
            payload: { data , message }
        }
    },

    fetchServicesError: ( message ) =>{
        return {
            type : actions.FETCH_SERVICES_ERROR,
            payload : { message }
        }
    },

    addOrder : ( data ) =>{
        return {
            type : actions.ADD_ORDER,
            payload : { data }
        }
    },

    addOrderSuccess : ( data ) =>{
        return {
            type : actions.ADD_ORDER_SUCCESS
        }
    },

    addOrderError : ( data ) =>{
        return {
            type : actions.ADD_ORDER_ERROR
        }
    },

    imageUpload : ( data ) => {
        return {
            type : actions.IMAGE_UPLOAD,
            payload : { data }
        }
    }
}

export default actions;