import actions from './actions';

const initState = {
    orders : {},
    isFetchingOrders : false,
    fetchOrdersMessage : '',
    selectedOrder : null,
    isFetchingOrderDetails : false,
    fetchOrderDetailsMessage : '',
    couriers : {},
    isFetchingCouriers : false,
    fetchCouriersMessage : '',
    isUpdatingStatus : false,
    updatingStatusMessage : '',
    customers : {},
    isFetchingCustomers : false,
    fetchCustomersMessage : '',
    services : {},
    isFetchingServices : false,
    fetchServicesMessage : "",
    isSavingNewOrder : false,
    savingNewOrderMessage : ""
}

export default function orderReducer( state = initState, action ){
    
    switch( action.type ){
        case actions.FETCH_ORDERS:
            return {
                ...state,
                searchString : action.payload.searchString === "" ? "" : action.payload.searchString,
                isFetchingOrders : true,
            }
        case actions.FETCH_ORDERS_SUCCESS:

            return {
                ...state,
                isFetchingOrders : false,
                fetchOrdersMessage : "SUCCESS",
                orders : action.payload.data
            }
        case actions.FETCH_ORDERS_ERROR:
            return {
                ...state,
                isFetchingOrders : false,
                fetchOrdersMessage : action.payload.message,
                orders : {}
            }
        case actions.DISPLAY_ORDER_DETAILS:
            return {
                ...state,
                selectedOrder : action.payload.data
            }
        case actions.FETCH_COURIERS:
            return {
                ...state,
                isFetchingCouriers: true
            }
        case actions.FETCH_COURIERS_SUCCESS:
            return {
                ...state,
                isFetchingCouriers : false,
                fetchCouriersMessage : "SUCCESS",
                couriers : action.payload.data
            }
        case actions.FETCH_COURIERS_ERROR:
            return {
                ...state,
                isFetchingCouriers : false,
                fetchCouriersMessage : action.payload.message,
                couriers : {}
            }
        case actions.UPDATE_ORDER_STATUS:
            return {
                ...state,
                isUpdatingStatus : true
            }
        case actions.UPDATE_ORDER_STATUS_SUCCESS:
            return{
                ...state,
                isUpdatingStatus : false,
            }
        case actions.UPDATE_ORDER_STATUS_ERROR:
            return{
                ...state,
                isUpdatingStatus : false,
            }
        case actions.FETCH_CUSTOMERS:
            return {
                ...state,
                isFetchingCustomers: true
            }
        case actions.FETCH_CUSTOMERS_SUCCESS:
            return {
                ...state,
                isFetchingCustomers : false,
                fetchCustomersMessage : "SUCCESS",
                customers : action.payload.data
            }
        case actions.FETCH_CUSTOMERS_ERROR:
            return {
                ...state,
                isFetchingCustomers : false,
                fetchCustomersMessage : action.payload.message,
                customers : {}
            }
        case actions.FETCH_SERVICES:
            return {
                ...state,
                isFetchingServices: true
            }
        case actions.FETCH_SERVICES_SUCCESS:
            return {
                ...state,
                isFetchingServices : false,
                fetchServicesMessage : "SUCCESS",
                services : action.payload.data
            }
        case actions.FETCH_SERVICES_ERROR:
            return {
                ...state,
                isFetchingServices : false,
                fetchServicesMessage : action.payload.message,
                services : {}
            }
        case actions.ADD_ORDER:
            return {
                ...state,
                isSavingNewOrder : true
            }
        case actions.ADD_ORDER_SUCCESS:
            return{
                ...state,
                isSavingNewOrder : false,
            }
        case actions.ADD_ORDER_ERROR:
            return{
                ...state,
                isSavingNewOrder : false,
            }

        default:
            return state
    }

}