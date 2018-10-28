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
  START_TEST_LONG_TASK,
  PROGRESS_TEST_LONG_TASK,
  FINISH_TEST_LONG_TASK,
  ABORT_TEST_LONG_TASK,
} from './actions'

export function* startTestLongTask(action) {
  
  const channel = yield call(initWebSocketTestLongTask);
  while (true) {
    const newAction = yield take(channel)
    if (newAction.type) {
      yield put(newAction)
    } else if(newAction.exit) {
      break;
    }
  }
}

function initWebSocketTestLongTask() {
  return eventChannel( emitter => {
    const ws = new WebSocket(`${config.pythonServerURL}/api/ws/testLongTask?token=1234`);

    ws.onopen = () =>{
      console.log('ws onopen');
    };

    ws.onmessage = event => {
      console.debug('server ws: '+ event.data);
      try {
        const res = JSON.parse(event.data);
        if(res.prompt === '>>>') {
          ws.send('{}\n');
        } else {
          switch (res.type) {
            case 'progress':
              emitter({
                type: PROGRESS_TEST_LONG_TASK,
                data: {message: res.message, progress:Math.ceil(res.progress*100)},
              });
              break;
            case 'result':
              emitter({
                type: FINISH_TEST_LONG_TASK,
                data: {},
              });
              break;
            case 'abort':
              emitter({
                type: ABORT_TEST_LONG_TASK,
                data: {message: res.message},
              });
              break;
            default:
              console.warn('unknown message', res);
          }
        }
      } catch (err) {
        console.error(event.data);
      }
    }

    ws.onclose = () => {
      console.log('websocket closed')
      emitter({exit: true})
    }

    return () => {
      console.log('Socket off')
    }
  });
}

function* abortTestLongTask(action:IAction) {
  yield call(Notification.error, action.data.message);
}

export default function* watchTestLongTask() {
  
  yield takeEvery(START_TEST_LONG_TASK, startTestLongTask);
  yield takeEvery(ABORT_TEST_LONG_TASK, abortTestLongTask);
  
}
