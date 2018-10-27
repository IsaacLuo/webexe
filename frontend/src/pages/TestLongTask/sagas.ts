import {call, select, all, fork, put, take, takeLatest, takeEvery} from 'redux-saga/effects'
import config from '../../config'
import uploadFile from '../../common/uploadFile'
import { eventChannel } from 'redux-saga'

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
          if(res.type==='progress') {
            emitter({
              type: PROGRESS_TEST_LONG_TASK,
              data: {message: res.message, progress:Math.ceil(res.progress*100)},
            });
          }
          if(res.result) {
            console.log('got result', res.result);
            emitter({
              type: FINISH_TEST_LONG_TASK,
              data: {},
            });
          }else if(res.finish) {
            console.log('finish')
          } else {
            console.log(res.message);
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

export default function* watchTestLongTask() {
  
  yield takeEvery(START_TEST_LONG_TASK, startTestLongTask);
  
}
