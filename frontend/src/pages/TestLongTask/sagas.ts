import {call, select, all, fork, put, take, takeLatest, takeEvery} from 'redux-saga/effects'
import config from '../../config'
import uploadFile from '../../common/uploadFile'
import { eventChannel } from 'redux-saga'
import {Notification} from 'element-react'

import {
  IAction,
  IFileUploadAction,
  IStoreState,
  INamedLink,
} from '../../types'

import{
  CREATE_WS,
  START_TASK,
  PROGRESS,
  FINISH_TASK,
  REJECT_TASK,
  ABORT_TASK,
  WS_DISCONNECTED,
} from './actions'

export function* startTestLongTask(action: IAction) {
  const {ws,taskId} = yield select((state:IStoreState) =>state.testLongTask);
  if (ws && ws.readyState === 1) {
    const channel = yield call(initWebSocketTestLongTask, ws, taskId);
    while (true) {
      const newAction = yield take(channel)
      if (newAction.type) {
        yield put(newAction)
      } else if(newAction.exit) {
        break;
      }
    }
  } else {
    yield put({type:REJECT_TASK, data:{message: 'websocket failed'}});
    // try to connect again
    yield put({type:CREATE_WS});
    yield put({type:ABORT_TASK});
  }
}

function initWebSocketTestLongTask(ws:WebSocket, taskId:string) {
  return eventChannel( emitter => {
    ws.send(JSON.stringify({type:'requestToStart', data:{taskId}}));
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
              type: PROGRESS,
              data: {message: res.message, progress:0},
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
  
  yield takeEvery(START_TASK, startTestLongTask);
  yield takeEvery(REJECT_TASK, rejectTestLongTask);
  yield takeEvery(ABORT_TASK, abortTestLongTask);
  yield takeLatest(WS_DISCONNECTED, startTestLongTask);
  
}
