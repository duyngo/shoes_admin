import actions from './actions';

const initState = { idToken: null , authInit : false, error : '' };

export default function authReducer(state = initState, action) {
  
  switch (action.type) {
    case actions.LOGIN_SUCCESS:
      return { ...state, idToken: action.token };
    case actions.LOGIN_ERROR:
      return { ...state, error : action.error, errorCount : action.errorCount };
    case actions.AUTH_INIT:
      return { ...state, authInit : true }
    case actions.LOGOUT:
      return initState;
    default:
      return state;
  }
}
