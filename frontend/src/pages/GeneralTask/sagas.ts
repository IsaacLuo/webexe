import io from 'socket.io-client';
import {call, select, all, fork, put, take, takeLatest, takeEvery} from 'redux-saga/effects'
import uploadFile from '../../common/uploadFile'
import { eventChannel } from 'redux-saga'
import {delay} from 'redux-saga/effects'
import {Notification} from 'element-react'
import config from 'conf.json';
import {
  IAction,
  IFileUploadAction,
  IStoreState,
  INamedLink,
  ITestLongTaskStoreState,
  IGeneralTaskState,
} from '../../types'

import{
  START_TASK,
  PROGRESS,
  REJECT_TASK,
  ABORT_TASK,
  SET_PROCESS_ID,
  SET_PROCESS_STATE,
  UPLOAD_FILE_PARAMS,
  SERVER_MESSAGE,
  SERVER_RESULT,
  SERVER_LOG,
} from './actions'
import Axios from 'axios';
// import socketIoWildcard from 'socketio-wildcard'
// const wildcardPatch = socketIoWildcard(io.Manager)

function monitorSocket(socket:SocketIOClient.Socket) {
  // wildcardPatch(socket);
  return eventChannel( emitter => {
    const types = ['message', 'progress', 'state', 'result', 'stderr', 'abort'];
    types.forEach(type=>{
      socket.on(type,(data)=>{
        // console.log('*', type, data)
        emitter({type, data});
      })
    })
    return () => {
      console.log('Socket off')
    }
  });
}

const sockets:any = {};

function* startTask(action:IAction) {
  const pageState:IGeneralTaskState = yield select((state:IStoreState) =>state.generalTask);
  const {taskName, params} = action.data;
  console.log('starting new task ', taskName);
  try {
    // 1. call API to create a task
    const newTaskContent = yield call(Axios.post, `${config.backendURL}/api/task/${taskName}`, {params}, {withCredentials: true});
    const {processId} = newTaskContent.data;
    yield put({type:SET_PROCESS_ID, data:processId});

    // 2. use socket.io
    const socket = io(config.backendURL);
    sockets[processId] = socket;
    const channel = yield call(monitorSocket, socket);

    socket.emit('startTask',processId, ()=>{})

    while (true) {
      const serverAction = yield take(channel)
      // console.debug('messageType', serverAction.type)
      console.log(serverAction);
      switch (serverAction.type) {
        case 'message':
            yield put({
              type: SERVER_MESSAGE,
              data: serverAction.data,
            });
            break;
        case 'progress':
            yield put({
              type: PROGRESS,
              data: serverAction.data,
            });
            break;
        case 'state':
          yield put({
            type: SET_PROCESS_STATE,
            data: serverAction.data,
          })
          break;
        case 'result':
          yield put({
            type: SERVER_RESULT,
            data: serverAction.data,
          })
          break;
        case 'stderr':
          yield put({
            type: SERVER_LOG,
            data: serverAction.data
          })
          break;
        case 'abort':
          yield put({
            type: ABORT_TASK,
            data: serverAction.data,
          })
          break;
      }
    }
  } catch(err) {

  }
}

function* abortTask(action:IAction) {
  if (sockets[action.data]) {
    sockets[action.data].emit('abort');
    sockets[action.data].close();
    delete sockets[action.data];
  }
}

function* rejectTask(action:IAction) {
  yield call(Notification.error, action.data.message);
}

function* onUploadFileParams(action:IAction) {
  try {
    yield call(Axios.post, `${config.backendURL}/api/fileParam`, action.data, {withCredentials: true});
  } catch (err) {

  }
}

export default function* watchTestLongTask() {
  yield takeEvery(START_TASK, startTask);
  yield takeEvery(REJECT_TASK, rejectTask);
  yield takeEvery(ABORT_TASK, abortTask);
  yield takeLatest(UPLOAD_FILE_PARAMS, onUploadFileParams);
}
