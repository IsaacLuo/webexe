import {call, select, all, fork, put, take, takeLatest, takeEvery} from 'redux-saga/effects'
import config from '../../config'
import uploadFile from '../../common/uploadFile'
import { eventChannel, delay } from 'redux-saga'
import {Notification} from 'element-react'

import {
  IAction,
  IFileUploadAction,
  IStoreState,
  INamedLink,
  ITestLongTaskStoreState,
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
} from './actions'

const wsURL = `${config.pythonServerURL}/api/ws/testLongTask?token=1234`;
type IPageStoreState = ITestLongTaskStoreState;
const subStoreKey = 'testLongTask'

function* heartBeat(action: IAction) {
  const ws = action.data;
  yield call(delay, 30000);
  if(ws && ws.readyState === 1) {
    ws.send(JSON.stringify({type:'heartbeat'}));
  }
  yield put({type:HEARTBEAT});
}

export function* createWebSocket(action: IAction) {
  const pageState:IPageStoreState = yield select((state:IStoreState) =>state[subStoreKey]);
  let ws = pageState.ws;
  const {clientId} = pageState;
  if (!ws || ws.readyState !== 1) {
    ws = new WebSocket(wsURL);
    const channel = yield call(initWebSocket, ws, clientId);
    console.log('new ws', ws);
    yield put({type:HEARTBEAT, data:ws});
    yield put({type:SET_WS, data: ws});
    while (true) {
      const serverAction = yield take(channel)
      switch (serverAction.type) {
        case 'initialize':
          yield put({
              type: SET_CLIENT_ID,
              data: serverAction.data.clientId,
            });
            break;
        case 'prompt':
          yield put({
              type: PROGRESS,
              data: {message: 'started', progress:0},
            });
            break;
        case 'queueing':
          yield put({
            type: SERVER_MESSAGE,
            data: {message: serverAction.message},
          });
          break;
        case 'progress':
          yield put({
            type: PROGRESS,
            data: {message: serverAction.message, progress:Math.ceil(serverAction.progress*100)},
          });
          break;
        case 'result':
          yield put({
            type: SERVER_RESULT,
            data: {},
          });
          break;
        case 'finish':
          yield put({
            type: FINISH_TASK,
          });
          break;
        case 'rejected':
          yield put({
            type: REJECT_TASK,
            data: {message: serverAction.message},
          });
          break;
        case 'message':
          yield put({
            type: SERVER_MESSAGE,
            data: {message: serverAction.message},
          });
          break;
      }
    }
  }
}

function initWebSocket(ws:WebSocket, clientId:string) {
  return eventChannel( emitter => {
    ws.onmessage = event => {
      console.debug('server ws: '+ event.data);
      try {
        const serverAction = JSON.parse(event.data);
        emitter(serverAction);
      } catch (err) {
        console.error(event.data);
      }
    }
    ws.onopen = () => {
      console.log('websocket open');
    }

    ws.onclose = () => {
      console.log('websocket closed');
      emitter({type:WS_DISCONNECTED});
    }

    return () => {
      console.log('Socket off')
    }
  });
}

function* endWebSocket(action:IAction) {
  const ws = action.data;
  if (ws) {
    console.log('ready to close ws', ws);
    ws.close();
  }
  

}

function* startTask() {
  const pageState:IPageStoreState = yield select((state:IStoreState) =>state[subStoreKey]);
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
  yield takeLatest(CREATE_WS, createWebSocket);
  yield takeEvery(START_TASK, startTask);
  yield takeEvery(REJECT_TASK, rejectTask);
  yield takeEvery(ABORT_TASK, abortTask);
  yield takeLatest(END_WS, endWebSocket);
  yield takeLatest(WS_DISCONNECTED, onWebsocketDisconnected);
  yield takeEvery(HEARTBEAT, heartBeat);
  
}
