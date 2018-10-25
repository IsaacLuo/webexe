import {call, all, fork, put, take, takeLatest, takeEvery} from 'redux-saga/effects'
import { eventChannel } from 'redux-saga'
import axios from 'axios'
import {
  ActionSaySomething,
  ActionClearMessage,
  WAIT_AND_SAY_SOMETHING,
  IAction,
  IFileUploadAction,
} from './actions'

import { delay } from 'redux-saga';
import config from './config'
import uploadFile from './uploadFile'
import {Notification} from 'element-react'

export function* waitAndSaySomething() {
  try {
    yield put(ActionClearMessage());
    yield call(delay, 1000);
    yield put(ActionSaySomething('hello world after 1 second'));
    const res = yield call(axios.get,`${config.backendURL}/api/message`);
    yield put(ActionSaySomething(res.data.message));
  } catch (err) {
    yield put(ActionSaySomething('error to get message from server'));
  }
}

export function* testWS(action) {
  const ws = new WebSocket('ws://localhost:8000/api/mergeLightCycler?token=1234');

  ws.onopen = () =>{
    console.log('ws onopen');
  };

  ws.onmessage = event => {
    console.log('server ws: '+ event.data);
    const res = JSON.parse(event.data);
    if(res.prompt) {
      ws.send(JSON.stringify(action.data))
    }
  }
}

export function* mergeLightCyclerReport(action) {
  const channel = yield call(initWebSocketMergeLightCycler, action)
  while (true) {
    const newAction = yield take(channel)
    if (newAction.type) {
      yield put(newAction)
    } else if(newAction.exit) {
      break;
    }
  }
}

function initWebSocketMergeLightCycler(action) {
  return eventChannel( emitter => {
    const ws = new WebSocket('ws://localhost:8000/api/mergeLightCycler?token=1234');

    ws.onopen = () =>{
      console.log('ws onopen');
    };

    let resultCount = 0;

    ws.onmessage = event => {
      console.debug('server ws: '+ event.data);
      try {
        const res = JSON.parse(event.data);
        if(res.prompt === '>>>') {
          ws.send(JSON.stringify(action.data))
        } else {
          if(res.result) {
            console.log('got result', res.result);
            resultCount++;
            emitter({type:'addTaskResult', data: {taskId: 'mergeLightCyclerReports', name:resultCount, link:`${config.backendURL}/api/tempFile/${res.result}`}})
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

export function* uploadTempFile(action:IFileUploadAction) {
  const {file} = action.data;
  const {name, size} = file;
  try {
    const response = yield call(uploadFile, `${config.backendURL}/api/tempFile/`, file);
    const {id} = response.data;
    yield put({type:'NEW_FILE_UPLOADED', data: {id, name}});
  } catch (err) {
    Notification.error(`upload ${name} failed`);
  }
}

export function* watchMyMessage() {
  yield takeLatest(WAIT_AND_SAY_SOMETHING, waitAndSaySomething);
  yield takeLatest('testWS', testWS);
  yield takeLatest('MergeLightCyclerReport', mergeLightCyclerReport);
}

export function* watchMergeLightCyclerReport() {
  yield takeEvery('UPLOAD_TEMP_FILE', uploadTempFile);
}

export default function* rootSaga() {
  yield all([
    fork(watchMyMessage),
    fork(watchMergeLightCyclerReport),
  ]);
}