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
} from './actions'

const wsURL = `${config.pythonServerURL}/api/ws/testLongTask?token=1234`;
type IPageStoreState = ITestLongTaskStoreState;

function* heartBeat(action: IAction) {
  const ws = action.data;
  yield call(delay, 30000);
  if(ws && ws.readyState === 1) {
    ws.send(JSON.stringify({type:'heartbeat'}));
  }
  yield put({type:HEARTBEAT});
}

export function* createWebSocket(action: IAction) {
  const pageState:IPageStoreState = yield select((state:IStoreState) =>state.mergeLightCyclerReport);
  let ws = pageState.ws;
  const {taskId} = pageState;
  if (!ws || ws.readyState !== 1) {
    ws = new WebSocket(wsURL);
    console.log('new ws', ws);
    yield put({type:HEARTBEAT, data:ws});
  }  
  yield put({type:SET_WS, data: ws});
  const channel = yield call(initWebSocket, ws, taskId);
  while (true) {
    const res = yield take(channel)
    switch (res.type) {
      case 'prompt':
        yield put({
            type: PROGRESS,
            data: {message: 'started', progress:0},
          });
          break;
      case 'queueing':
        yield put({
          type: SERVER_MESSAGE,
          data: {message: res.message},
        });
        break;
      case 'progress':
        yield put({
          type: PROGRESS,
          data: {message: res.message, progress:Math.ceil(res.progress*100)},
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
          data: {message: res.message},
        });
        break;
      case 'message':
        yield put({
          type: SERVER_MESSAGE,
          data: {message: res.message},
        });
        break;
    }
  }
}

function initWebSocket(ws:WebSocket, taskId:string) {
  return eventChannel( emitter => {
    ws.onmessage = event => {
      console.debug('server ws: '+ event.data);
      try {
        const res = JSON.parse(event.data);
        emitter(res);
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

function* startTask() {
  const pageState:IPageStoreState = yield select((state:IStoreState) =>state.testLongTask)
  const {
    ws,
    taskId,
    } = pageState;
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify({
      type:'requestToStart', 
      data:{
        taskId,
        params: {},
      }
    }));
  } else {
    console.warn('ws wrong', ws, ws?ws.readyState:undefined);
    yield put({type:WS_DISCONNECTED});
  }
}

// function initWebSocketTestLongTask(ws:WebSocket, taskId:string) {
//   return eventChannel( emitter => {
//     ws.onmessage = event => {
//       console.debug('server ws: '+ event.data);
//       try {
//         const res = JSON.parse(event.data);
//         switch (res.type) {
//           case 'prompt':
//             ws.send('{}\n');
//             emitter({
//               type: PROGRESS,
//               data: {message: 'started', progress:0},
//             });
//             break;
//           case 'queueing':
//             emitter({
//               type: SERVER_MESSAGE,
//               data: {message: res.message},
//             });
//             break;
//           case 'progress':
//             emitter({
//               type: PROGRESS,
//               data: {message: res.message, progress:Math.ceil(res.progress*100)},
//             });
//             break;
//           case 'result':
//             emitter({
//               type: FINISH_TASK,
//               data: {},
//             });
//             break;
//           case 'rejected':
//             emitter({
//               type: REJECT_TASK,
//               data: {message: res.message},
//             });
//             break;
//           case 'message':
//             emitter({
//               type: SERVER_MESSAGE,
//               data: {message: res.message},
//             });
//             break;
//         }
//       } catch (err) {
//         console.error(event.data);
//       }
//     }

//     ws.onclose = () => {
//       console.log('websocket closed');
//       emitter({type:WS_DISCONNECTED});
//     }

//     return () => {
//       console.log('Socket off')
//     }
//   });
// }



function* onWebsocketDisconnected() {
  Notification.error('disconnected from the server');
  yield call(delay, 10000);
  yield put({type:CREATE_WS});
}

function* abortTask(action:IAction) {
  const {ws,taskId} = yield select((state:IStoreState) =>state.testLongTask);
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify({type:'abortTask', data:{taskId}}));
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
  yield takeLatest(WS_DISCONNECTED, onWebsocketDisconnected);
  yield takeEvery(HEARTBEAT, heartBeat);
  
}
