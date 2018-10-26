import {call, all, fork, put, take, takeLatest, takeEvery} from 'redux-saga/effects'
import {Notification} from 'element-react'
import { IAction } from './types';
import watchMergeLightCyclerReport from './pages/MergeLightCyclerReport/sagas'

export function* onFileUploadingFailed(action:IAction) {
  Notification.error(`upload ${name} failed`);
}

export function* watchMyMessage() {
  yield takeEvery('FILE_UPLOADING_FAILED', onFileUploadingFailed);
}

export default function* rootSaga() {
  yield all([
    fork(watchMyMessage),
    fork(watchMergeLightCyclerReport),
  ]);
}