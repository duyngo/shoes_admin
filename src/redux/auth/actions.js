const actions = {
  CHECK_AUTHORIZATION: 'CHECK_AUTHORIZATION',
  LOGIN_REQUEST: 'LOGIN_REQUEST',
  LOGOUT: 'LOGOUT',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_ERROR: 'LOGIN_ERROR',
  AUTH_INIT : 'AUTH_INIT',
  checkAuthorization: () => ({ type: actions.CHECK_AUTHORIZATION }),
  login: (email, password) => ({
    type: actions.LOGIN_REQUEST,
    email : email,
    password : password
  }),
  logout: () => ({
    type: actions.LOGOUT
  }),
  authInit : () => ({
    type: actions.AUTH_INIT
  })
};
export default actions;
