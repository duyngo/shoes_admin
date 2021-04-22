import { all } from 'redux-saga/effects';
import authSagas from './auth/saga';
import orderSagas from './order/saga';
export default function* rootSaga(getState) {
  yield all([
    authSagas(),
    orderSagas()
  ]);
}
