import {call, select, all, fork, put, take, takeLatest, takeEvery} from 'redux-saga/effects'
import config from '../../config'
import uploadFile from '../../common/uploadFile'
import { eventChannel, delay} from 'redux-saga'
import {Notification} from 'element-react'

import {
  IAction,
  IFileUploadAction,
  IStoreState,
  INamedLink,
  IMergeLightCyclerReportsStoreState,
} from '../../types'

import{
  UPLOAD_PLATE_DEFINITION_FILE,
  UPLOAD_LIGHT_CYCLER_REPORT_FILE,
  REPORT_GENERATED_MLCR,
  ActionUploadedPlateDefinitionFile,
  ActionUploadedLightCyclerReportFile,
  RESET_MLCR,

  CREATE_WS,
  START_TASK,
  PROGRESS,
  SERVER_RESULT,
  FINISH_TASK,
  REJECT_TASK,
  ABORT_TASK,
  WS_DISCONNECTED,
  SERVER_MESSAGE,
  SET_WS,
  HEARTBEAT,
  
} from './actions'

const wsURL = `${config.pythonServerURL}/api/ws/mergeLightCycler?token=1234`;

export function* uploadTempFile(action:IFileUploadAction) {
  const {file} = action.data;
  const {name, size} = file;
  try {
    const response = yield call(uploadFile, `${config.backendURL}/api/tempFile/`, file);
    const {id} = response.data;
    yield put({type:'NEW_FILE_UPLOADED', data: {id, name, size}});
    return id;
  } catch (err) {
    yield put({type:'FILE_UPLOADING_FAILED', data: {name, size}});
    throw err;
  }
}

function* uploadPlateDefinitionFile(action:IAction) {
  try {
    const {file} = action.data;
    const {name} = file;
    const id = yield call(uploadTempFile, action);
    const link = `${config.backendURL}/api/tempFile/${id}`
    yield put(ActionUploadedPlateDefinitionFile(id, name, link));
  } catch (err) {
    yield put({type: 'UPLOADED_PLATE_DEFINITION_FILE_FAILED'});
  }
}

function* uploadLightCyclerReportFile(action:IAction) {
  try {
    const {file} = action.data;
    const {name} = file;
    const id = yield call(uploadTempFile, action);
    const link = `${config.backendURL}/api/tempFile/${id}`
    yield put(ActionUploadedLightCyclerReportFile(id, name, link));
  } catch (err) {
    yield put({type: 'UPLOADED_PLATE_DEFINITION_FILE_FAILED'});
  }
}

function* heartBeat(action: IAction) {
  const ws = action.data;
  yield call(delay, 30000);
  if(ws && ws.readyState === 1) {
    ws.send(JSON.stringify({type:'heartbeat'}));
  }
  yield put({type:HEARTBEAT});
}

export function* createWebSocket(action: IAction) {
  const pageState:IMergeLightCyclerReportsStoreState = yield select((state:IStoreState) =>state.mergeLightCyclerReport);
  let ws = pageState.ws;
  const {clientId} = pageState;
  if (!ws || ws.readyState !== 1) {
    ws = new WebSocket(wsURL);  
    console.log('new ws', ws);
    yield put({type:HEARTBEAT, data:ws});
  }  
  yield put({type:SET_WS, data: ws});
  const channel = yield call(initWebSocket, ws, clientId);
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
        const plateDefinitionFileRefs = yield select((state:IStoreState) =>state.mergeLightCyclerReport.plateDefinitionFileRefs)
        const {input:{plateDefinitionId}, output} = res.data;
        const newName = plateDefinitionFileRefs.find(x=>x.id===plateDefinitionId).name;
        yield put({
          type: SERVER_RESULT,
          data: {
            id: output,
            name: newName,
            link:`${config.backendURL}/api/tempFile/${output}/as/${newName}`,
          }
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

function initWebSocket(ws:WebSocket, clientId:string) {
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
  const pageState:IMergeLightCyclerReportsStoreState = yield select((state:IStoreState) =>state.mergeLightCyclerReport)
  const {
    ws,
    clientId,
    plateDefinitionFileRefs,
    lightCyclerReportFileRefs,
    } = pageState;
  if(ws) {
    console.log(ws, ws.readyState);
  }
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify({
      type:'requestToStart', 
      data:{
        clientId,
        params: {
          plateDefinitionIds: plateDefinitionFileRefs.map(x=>x.id),
          lightCyclerReportIds: lightCyclerReportFileRefs.map(x=>x.id),
        }
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

export default function* watchMergeLightCyclerReport() {
  yield takeEvery(UPLOAD_PLATE_DEFINITION_FILE, uploadPlateDefinitionFile);
  yield takeEvery(UPLOAD_LIGHT_CYCLER_REPORT_FILE, uploadLightCyclerReportFile);
  yield takeEvery(CREATE_WS, createWebSocket);
  yield takeLatest(START_TASK, startTask);
  yield takeEvery(REJECT_TASK, rejectTask);
  yield takeEvery(ABORT_TASK, abortTask);
  yield takeLatest(WS_DISCONNECTED, onWebsocketDisconnected);
}
