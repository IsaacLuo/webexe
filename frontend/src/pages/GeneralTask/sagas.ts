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
  CREATE_WS,
  START_TASK,
  PROGRESS,
  FINISH_TASK,
  REJECT_TASK,
  ABORT_TASK,
  WS_DISCONNECTED,
  SERVER_MESSAGE,
  SERVER_RESULT,
  SET_SOCKET,
  HEARTBEAT,
  END_WS,
  SET_CLIENT_ID,
  SET_PROCESS_ID,
  SET_PROCESS_SIGNAL,
  SET_PROCESS_LOG,
  UPLOAD_FILE_PARAMS,
} from './actions'
import Axios from 'axios';
// import socketIoWildcard from 'socketio-wildcard'
// const wildcardPatch = socketIoWildcard(io.Manager)

function* heartBeat(action: IAction) {
  const ws = action.data;
  yield call(delay, 30000);
  if(ws && ws.readyState === 1) {
    ws.send(JSON.stringify({type:'heartbeat'}));
  }
  yield put({type:HEARTBEAT});
}


function monitorSocket(socket:SocketIOClient.Socket) {
  // wildcardPatch(socket);
  return eventChannel( emitter => {
    console.log('eventChannel');
    const types = ['progress', 'state', 'result'];
    types.forEach(type=>{
      socket.on(type,(data)=>{
        console.log('*', type, data)
        emitter({type, data});
      })
    })
    return () => {
      console.log('Socket off')
    }
  });
}

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
    let socket:SocketIOClient.Socket;
    if (!pageState.socket) {
      socket = io(config.backendURL + '/tasks');
      yield put({type:SET_SOCKET, data:socket});
      console.log('new socket')
    } else {
      socket = pageState.socket;
      console.log('reuse socket')
    }

    console.log('hhahh');
    yield call(socket.emit, 'startTask', processId, (n:any)=>{
      console.log(n);
    });

    const channel = yield call(monitorSocket, socket);



    while (true) {
      const serverAction = yield take(channel)
      console.debug('messageType', serverAction.type)
      switch (serverAction.type) {
        case 'signal':
          yield put({
            type: SET_PROCESS_SIGNAL,
            data: serverAction.message,
          });
          break;
        case 'progress':
            yield put({
              type: PROGRESS,
              data: {message: serverAction.message, progress:Math.ceil(serverAction.progress)},
            });
            break;
      }
    }
  } catch(err) {

  }
}

    // // 2. create websocket to receive progress
    // const webSocket = new WebSocket(`${config.backendURL}/ws/process/${processId}`);
    // const channel = yield call(initWebSocket, webSocket);
    // yield put({type:SET_WS, data: webSocket});
    // // yield put({type:HEARTBEAT, data:webSocket});
    // while (true) {
    //   const serverAction = yield take(channel)
    //   console.debug('messageType', serverAction.type)
    //   switch (serverAction.type) {
    //     case 'signal':
    //       yield put({
    //         type: SET_PROCESS_SIGNAL,
    //         data: serverAction.message,
    //       });
    //       break;

    //     case 'progress':
    //         yield put({
    //           type: PROGRESS,
    //           data: {message: serverAction.message, progress:Math.ceil(serverAction.progress*100)},
    //         });
    //         yield put({
    //           type: SET_PROCESS_SIGNAL,
    //           data: serverAction.message,
    //         });
    //         break;

    //     case 'log':
    //         yield put({
    //           type: SET_PROCESS_LOG,
    //           data: serverAction.message,
    //         });
    //         break;

    //     case 'result':
    //         yield put({
    //           type: SERVER_RESULT,
    //           data: serverAction.data,
    //         });
    //         yield put({
    //           type: SET_PROCESS_LOG,
    //           data: serverAction.message,
    //         });
    //         break;

    //     case 'initialize':
    //       yield put({
    //           type: SET_CLIENT_ID,
    //           data: serverAction.data.clientId,
    //         });
    //         break;
    //     case 'prompt':
    //       yield put({
    //           type: PROGRESS,
    //           data: {message: 'started', progress:0},
    //         });
    //       break;
    //     case 'queueing':
    //       yield put({
    //         type: SERVER_MESSAGE,
    //         data: {message: serverAction.message},
    //       });
    //       break;
        

    //     case 'finish':
    //       yield put({
    //         type: FINISH_TASK,
    //       });
    //       break;
    //     case 'rejected':
    //       yield put({
    //         type: REJECT_TASK,
    //         data: {message: serverAction.message},
    //       });
    //       break;
    //     case 'message':
    //       yield put({
    //         type: SERVER_MESSAGE,
    //         data: {message: serverAction.message},
    //       });
    //       break;
    //   }
    // }

function* onWebsocketDisconnected() {
  Notification.error('disconnected from the server');
  yield call(delay, 10000);
  yield put({type:CREATE_WS});
}

function* abortTask(action:IAction) {
  try {
    yield call(Axios.delete, `${config.backendURL}/api/process/${action.data}`, {withCredentials: true});
  } catch (err) {

  }
  return;
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
  // yield takeLatest(CREATE_WS, createWebSocket);
  yield takeEvery(START_TASK, startTask);
  yield takeEvery(REJECT_TASK, rejectTask);
  yield takeEvery(ABORT_TASK, abortTask);
  // yield takeLatest(END_WS, endWebSocket);
  yield takeLatest(WS_DISCONNECTED, onWebsocketDisconnected);
  yield takeEvery(HEARTBEAT, heartBeat);
  yield takeLatest(UPLOAD_FILE_PARAMS, onUploadFileParams);
}
