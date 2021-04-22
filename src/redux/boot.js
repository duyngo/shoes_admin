import { store } from './store';
import authActions from './auth/actions';
import FirebaseHelper from '../helpers/firebase'

export default () =>
  new Promise((resolve) => {
    // store.dispatch(authActions.checkAuthorization());
    FirebaseHelper.firebaseAuth().onAuthStateChanged((user)=>{
    
      store.dispatch(authActions.checkAuthorization());

      resolve()
    })
  });
