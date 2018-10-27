import {call, all, fork, put, take, takeLatest, takeEvery} from 'redux-saga/effects'
import {delay} from 'redux-saga'
import {Notification} from 'element-react'
import { IAction } from './types';
import watchMergeLightCyclerReport from './pages/MergeLightCyclerReport/sagas'
import watchTestLongTask from './pages/TestLongTask/sagas'

import axios from 'axios';
import config from './config';
import {
  TEST_CONNECTION,
  FILE_UPLOADING_FAILED,
  SHOW_CONNECTED,
  SHOW_DISCONNECTED,
  } from './actions'

export function* onFileUploadingFailed(action:IAction) {
  Notification.error(`upload ${name} failed`);
}

export function* onTestConnection(action:IAction) {
  try {
    yield call(axios.post,`${config.backendURL}/api/test`);
    yield put({type:SHOW_CONNECTED});
  } catch (err) {
    yield put({type:SHOW_DISCONNECTED});
    Notification.error('error in connecting backend server');
    yield call(delay, 6000);
  }
  
}

export function* watchSystemMessage() {
  yield takeEvery(FILE_UPLOADING_FAILED, onFileUploadingFailed);
  yield takeLatest(TEST_CONNECTION, onTestConnection);
}

export default function* rootSaga() {
  yield all([
    fork(watchSystemMessage),
    fork(watchMergeLightCyclerReport),
    fork(watchTestLongTask),
  ]);
}