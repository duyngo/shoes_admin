import { all, takeEvery, put, fork } from 'redux-saga/effects';
import { push } from 'react-router-redux';
import { getToken, clearToken } from '../../helpers/utility';
import actions from './actions';
import FirebaseHelper from '../../helpers/firebase';

const fakeApiCall = true; // auth0 or express JWT
let errorCount = 0;

export function* loginRequest() {
  yield takeEvery('LOGIN_REQUEST', function*(action) {
    if (fakeApiCall) {

      try{

        let profile  = yield FirebaseHelper.login(FirebaseHelper.EMAIL, action);
      
        yield put({
          type: actions.LOGIN_SUCCESS,
          token: '1',
          profile
        });

      }catch( error ){

        yield put ({
          type : actions.LOGIN_ERROR,
          error : error.message,
          errorCount : errorCount++
        })

      }
    } else {
      yield put({ type: actions.LOGIN_ERROR });
    }
  });
}

export function* loginSuccess() {
  yield takeEvery(actions.LOGIN_SUCCESS, function*(payload) {

    if (window.location.pathname.indexOf('/dashboard') != 0 ){
      yield put(push('/dashboard'))
    }

    yield localStorage.setItem('id_token', payload.token);
  });
}

export function* loginError() {
  yield takeEvery(actions.LOGIN_ERROR, function*(payload) {
    
    if(payload.error=="There is no user record corresponding to this identifier. The user may have been deleted."){
      payload.error = "Your username or your password is incorrect."
    }
    
  });
}

export function* logout() {
  yield takeEvery(actions.LOGOUT, function*() {
    clearToken();
    FirebaseHelper.logout();
    yield put(push('/'));
  });
}
export function* checkAuthorization() {
  yield takeEvery(actions.CHECK_AUTHORIZATION, function*(payload) {
    // const token = getToken().get('idToken');
    
    let isLoggedIn = yield FirebaseHelper.isAuthenticated();
  
    if (isLoggedIn) {
      yield put({
        type: actions.LOGIN_SUCCESS,
        token : '1',
        profile: 'Profile'
      });
    }
  
    yield put({
      type : actions.AUTH_INIT
    })
  });
}

export function* authInit() {
  yield takeEvery(actions.AUTH_INIT, function*() {
    
  });
}

export default function* rootSaga() {
  yield all([
    fork(checkAuthorization),
    fork(loginRequest),
    fork(loginSuccess),
    fork(loginError),
    fork(logout)
  ]);
}
