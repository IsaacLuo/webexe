import {call, select, all, fork, put, take, takeLatest, takeEvery} from 'redux-saga/effects'
import config from '../../config'
import uploadFile from '../../common/uploadFile'
import { eventChannel} from 'redux-saga'
import {delay} from 'redux-saga/effects'
import {Notification} from 'element-react'

import {
  IAction,
  IFileUploadAction,
  IStoreState,
  INamedLink,
  IMergeLightCyclerReportsStoreState,
  ITaskManagerStoreState,
} from '../../types'

import{
  CREATE_WS,
  WS_DISCONNECTED,
  SERVER_MESSAGE,
  SET_WS,
  HEARTBEAT,
  SET_MESSAGE,
  
} from './actions'

const wsURL = `${config.pythonServerURL}/api/ws/taskManager?token=1234`;
type IPageState = ITaskManagerStoreState;
const subStoreKey = 'taskManager';

function* heartBeat(action: IAction) {
  yield call(delay, 10000);
  const {ws} = yield select((state:IStoreState) =>state[subStoreKey]);
  if(ws && ws.readyState === 1) {
    ws.send(JSON.stringify({type:'heartbeat'}));
  } else {
    yield put({type:WS_DISCONNECTED});
  }
  yield put({type:HEARTBEAT});
}

export function* createWebSocket(action: IAction) {
  const pageState:IPageState = yield select((state:IStoreState) =>state[subStoreKey]);
  let ws = pageState.ws;
  if (!ws || ws.readyState !== 1) {
    ws = new WebSocket(wsURL);
    yield put({type:SET_MESSAGE, data: 'creating new socket'});
  }
  const channel = yield call(initWebSocket, ws);
  let statusFetchedCount=0;
  while (true) {
    const serverAction = yield take(channel)
    switch (serverAction.type) {
      case 'webSocketOpen':
        yield put({type:SET_WS, data: ws});
        yield put({type:HEARTBEAT});
        yield put({type:SET_MESSAGE, data: 'connected to task manager'});
        break;
      case 'tasks':
        yield put({
          type: SERVER_MESSAGE,
          data: serverAction.data,
        });
        yield put({type:SET_MESSAGE, data: `status refreshed (${statusFetchedCount++})`});
        break;
    }
  }
}

function initWebSocket(ws:WebSocket) {
  return eventChannel( emitter => {
    ws.onmessage = event => {
      console.debug('server ws: '+ event.data);
      try {
        const res = JSON.parse(event.data);
        // console.log({res});
        emitter(res);
      } catch (err) {
        console.error(event.data);
      }
    }
    ws.onopen = () => {
      console.log('websocket open');
      emitter({type:'webSocketOpen', data: ws});
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

function* onWebsocketDisconnected() {
  Notification.error('disconnected from the server');
  yield put({type:SET_MESSAGE, data: `disconnected from the server`});
  yield call(delay, 1000);
  yield put({type:SET_MESSAGE, data: `connecting`});
  yield put({type:CREATE_WS});
}

export default function* watchMergeLightCyclerReport() {
  yield takeLatest(CREATE_WS, createWebSocket);
  yield takeLatest(WS_DISCONNECTED, onWebsocketDisconnected);
  yield takeLatest(HEARTBEAT, heartBeat);
}
