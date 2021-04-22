const userType = {
    MANAGER : 'manager',
    ADMIN  :   'admin',
    CUSTOMER : 'customer',
    COURIER    :   'courier'
}

class UserHelper{
    
    renderUserType = type => {

        let userTypeRender = {};

        switch( type ){
            case userType.MANAGER:
                userTypeRender = {
                    tagColor : "#e4934d",
                    tagText : "MANAGER"
                }
                break;
            case userType.ADMIN:
                userTypeRender = {
                    tagColor : "#6d4dea",
                    tagText : "ADMIN"
                }
                break;
            case userType.CUSTOMER:
                userTypeRender = {
                    tagColor : "#1a8ebf",
                    tagText : "CUSTOMER"
                }
                break;
            case userType.COURIER:
                userTypeRender = {
                    tagColor : "#5fbf8f",
                    tagText : "COURIER"
                }
                break;
          
            default : break;
        }

        return userTypeRender;
    
    }

}

export default new UserHelper();
