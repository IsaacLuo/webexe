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
  SET_WS,
} from './actions'

export function* createWebSocket(action: IAction) {
  const {ws, taskId} = (yield select((state:IStoreState) =>state.testLongTask)) as ITestLongTaskStoreState;
  if (ws && ws.readyState === 1) {
    ws.close();
  }
  const newWS = new WebSocket(`${config.pythonServerURL}/api/ws/testLongTask?token=1234`);
  yield put({type:SET_WS, data:newWS});
  const channel = yield call(initWebSocketTestLongTask, newWS, taskId);
  while (true) {
    const newAction = yield take(channel)
    if (newAction.type) {
      yield put(newAction)
    } else if(newAction.exit) {
      break;
    }
  }
}

function initWebSocketTestLongTask(ws:WebSocket, taskId:string) {
  return eventChannel( emitter => {
    ws.onmessage = event => {
      console.debug('server ws: '+ event.data);
      try {
        const res = JSON.parse(event.data);
        switch (res.type) {
          case 'prompt':
            ws.send('{}\n');
            emitter({
              type: PROGRESS,
              data: {message: 'started', progress:0},
            });
            break;
          case 'queueing':
            emitter({
              type: SERVER_MESSAGE,
              data: {message: res.message},
            });
            break;
          case 'progress':
            emitter({
              type: PROGRESS,
              data: {message: res.message, progress:Math.ceil(res.progress*100)},
            });
            break;
          case 'result':
            emitter({
              type: FINISH_TASK,
              data: {},
            });
            break;
          case 'rejected':
            emitter({
              type: REJECT_TASK,
              data: {message: res.message},
            });
            break;
          case 'message':
            emitter({
              type: SERVER_MESSAGE,
              data: {message: res.message},
            });
            break;
        }
      } catch (err) {
        console.error(event.data);
      }
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

function* startTestLongTask() {
  const {ws, taskId} = (yield select((state:IStoreState) =>state.testLongTask)) as ITestLongTaskStoreState;
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify({type:'requestToStart', data:{taskId}}));
    // ws.send(JSON.stringify({type:'requestToStart', data:{taskId}}));
  } else {
    yield put({type:WS_DISCONNECTED});
  }
}

function* onWebsocketDisconnected() {
  Notification.error('disconnected from the server');
  yield call(delay, 10000);
  yield put({type:CREATE_WS});
}

function* abortTestLongTask(action:IAction) {
  const {ws,taskId} = yield select((state:IStoreState) =>state.testLongTask);
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify({type:'abortTask', data:{taskId}}));
  }
  return;
}

function* rejectTestLongTask(action:IAction) {
  yield call(Notification.error, action.data.message);
}

export default function* watchTestLongTask() {
  yield takeLatest(CREATE_WS, createWebSocket);
  yield takeEvery(START_TASK, startTestLongTask);
  yield takeEvery(REJECT_TASK, rejectTestLongTask);
  yield takeEvery(ABORT_TASK, abortTestLongTask);
  yield takeLatest(WS_DISCONNECTED, onWebsocketDisconnected);
  
}
