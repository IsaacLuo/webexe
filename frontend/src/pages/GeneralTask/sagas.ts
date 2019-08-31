import {call, select, all, fork, put, take, takeLatest, takeEvery} from 'redux-saga/effects'
import config from '../../config'
import uploadFile from '../../common/uploadFile'
import { eventChannel } from 'redux-saga'
import {delay} from 'redux-saga/effects'
import {Notification} from 'element-react'

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
  SET_WS,
  HEARTBEAT,
  END_WS,
  SET_CLIENT_ID,
  SET_PROCESS_ID,
} from './actions'
import Axios from 'axios';

const wsURL = `${config.pythonServerURL}/api/ws/testLongTask?token=1234`;

function* heartBeat(action: IAction) {
  const ws = action.data;
  yield call(delay, 30000);
  if(ws && ws.readyState === 1) {
    ws.send(JSON.stringify({type:'heartbeat'}));
  }
  yield put({type:HEARTBEAT});
}


function* startTask(action:IAction) {
  const pageState:IGeneralTaskState = yield select((state:IStoreState) =>state.generalTask);
  console.log('starting new task ', action.data);
  try {
    // 1. call API to create a task
    const newTaskContent = yield call(Axios.post, `${config.backendURL}/api/task/${action.data}`, {}, {withCredentials: true});
    const {processId} = newTaskContent.data;
    yield put({type:SET_PROCESS_ID, data:processId});

    // 2. create websocket to receive progress
    const webSocket = new WebSocket(`${config.pythonServerURL}/ws/process/${processId}`);
    yield put({type:SET_WS, data: webSocket});
    webSocket.onmessage = function (evt) {
        console.log("服务端说" + evt.data)
    }
    webSocket.onclose = function (evt) {
        console.log("Connection closed.")
    }
  } catch (err) {

  }
  const {
    ws,
    clientId,
    } = pageState;
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify({
      type:'requestToStart', 
      data:{
        clientId,
        params: {},
      }
    }));
  } else {
    console.warn('ws wrong', ws, ws?ws.readyState:undefined);
    yield put({type:WS_DISCONNECTED});
  }
}

function* onWebsocketDisconnected() {
  Notification.error('disconnected from the server');
  yield call(delay, 10000);
  yield put({type:CREATE_WS});
}

function* abortTask(action:IAction) {
  const {ws,clientId} = yield select((state:IStoreState) =>state.testLongTask);
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify({type:'abortTask', data:{clientId}}));
  }
  return;
}

function* rejectTask(action:IAction) {
  yield call(Notification.error, action.data.message);
}

export default function* watchTestLongTask() {
  // yield takeLatest(CREATE_WS, createWebSocket);
  yield takeEvery(START_TASK, startTask);
  yield takeEvery(REJECT_TASK, rejectTask);
  yield takeEvery(ABORT_TASK, abortTask);
  // yield takeLatest(END_WS, endWebSocket);
  yield takeLatest(WS_DISCONNECTED, onWebsocketDisconnected);
  yield takeEvery(HEARTBEAT, heartBeat);
  
}
