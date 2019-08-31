import {call, all, fork, put, take, takeLatest, takeEvery} from 'redux-saga/effects'
import {delay} from 'redux-saga/effects'
import {Notification} from 'element-react'
import { IAction } from './types';
import watchMergeLightCyclerReport from './pages/MergeLightCyclerReport/sagas'
import watchTestLongTask from './pages/TestLongTask/sagas'
import watchTaskManager from './pages/TaskManager/sagas'
import watchGeneralTask from './pages/GeneralTask/sagas'

import axios from 'axios';
import config from './config';
import {
  TEST_CONNECTION,
  FILE_UPLOADING_FAILED,
  SHOW_CONNECTED,
  SHOW_DISCONNECTED,
  GET_AVAILABLE_TASKS,
  SET_AVAILABLE_TASKS,
  } from './actions'

export function* onFileUploadingFailed(action:IAction) {
  Notification.error(`upload failed`);
}

export function* onTestConnection(action:IAction) {
  try {
    yield call(axios.get,`${config.backendURL}/api/user/current`, {withCredentials: true});
    yield put({type:SHOW_CONNECTED});
  } catch (err) {
    yield put({type:SHOW_DISCONNECTED});
    Notification.error('error in connecting backend server');
    yield call(delay, 6000);
  }
}
export function* getAllTasks() {
  try {
    const tasks = yield call(axios.get, `${config.backendURL}/api/tasks`, {withCredentials: true});
    yield put({type:SET_AVAILABLE_TASKS, data: tasks.data});
  } catch (err) {

  }
}

export function* watchSystemMessage() {
  yield takeEvery(FILE_UPLOADING_FAILED, onFileUploadingFailed);
  yield takeLatest(TEST_CONNECTION, onTestConnection);
}

export function* watchTaskDict() {
  yield takeLatest(GET_AVAILABLE_TASKS, getAllTasks);
}

export default function* rootSaga() {
  yield all([
    fork(watchTaskDict),
    fork(watchSystemMessage),
    fork(watchMergeLightCyclerReport),
    fork(watchTestLongTask),
    fork(watchTaskManager),
    fork(watchGeneralTask),
  ]);
}