import {call, all, fork, put,takeLatest} from 'redux-saga/effects'
import axios from 'axios'
import {
  ActionSaySomething,
  ActionClearMessage,
  WAIT_AND_SAY_SOMETHING,
} from './actions'

import { delay } from 'redux-saga';

export function* waitAndSaySomething() {
  try {
    yield put(ActionClearMessage());
    yield call(delay, 1000);
    yield put(ActionSaySomething('hello world after 1 second'));
    const res = yield call(axios.get,`http://localhost:8000/api/message`);
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

export function* watchMyMessage() {
  yield takeLatest(WAIT_AND_SAY_SOMETHING, waitAndSaySomething);
  yield takeLatest('testWS', testWS);
}

export default function* rootSaga() {
  yield all([
    fork(watchMyMessage),
  ]);
}