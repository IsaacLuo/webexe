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
  UPLOAD_PLATE_DEFINITION_FILE,
  UPLOAD_LIGHT_CYCLER_REPORT_FILE,
  REPORT_GENERATED_MLCR,
  ActionUploadedPlateDefinitionFile,
  ActionUploadedLightCyclerReportFile,
  RESET_MLCR,

  CREATE_WS,
  WS_DISCONNECTED,
  START_TASK,
  PROGRESS,
  FINISH_TASK,
  REJECT_TASK,
  ABORT_TASK,
  
} from './actions'

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

export function* createWs(action) {
  const {ws,taskId} = yield select((state:IStoreState) =>state.testLongTask);
  const plateDefinitionFileRefs = yield select((state:IStoreState) => state.mergeLightCyclerReport.plateDefinitionFileRefs);
  const lightCyclerReportFileRefs = yield select((state:IStoreState) => state.mergeLightCyclerReport.lightCyclerReportFileRefs);

  if (ws && ws.readyState === 1) {
      const channel = yield call(initWebSocketMergeLightCycler, ws, taskId, plateDefinitionFileRefs, lightCyclerReportFileRefs);
    while (true) {
      const newAction = yield take(channel)
      if (newAction.type) {
        yield put(newAction)
      } else if(newAction.exit) {
        break;
      }
    }
  } else {
    yield put({type:RESET_MLCR, data:{message: 'websocket failed'}});
    // try to connect again
    yield put({type:CREATE_WS});
    yield put({type:ABORT_TASK});
  }
}
export function* startTask(action) {
  const {ws} = yield select((state:IStoreState) =>state.testLongTask);
  if (ws && ws.readyState === 1) {
    yield call(ws.send,JSON.stringify({type:'startTask', data:{}}));
  } else {
    yield put({type:WS_DISCONNECTED});
  }
}

function initWebSocketMergeLightCycler(ws:WebSocket, taskId:string, plateDefinitionFileRefs:INamedLink[], lightCyclerReportFileRefs:INamedLink[]) {
  return eventChannel( emitter => {

    ws.onopen = () =>{
      console.log('ws onopen');
    };

    let resultCount = 0;

    /** 
     * @param 
     * {
     *   plateDefinitionIds: string[], 
     *   lightCyclerReportIds: string[],
     * }
     */
    const pythonParams = {
      plateDefinitionIds: plateDefinitionFileRefs.map(v => v.id),
      lightCyclerReportIds: lightCyclerReportFileRefs.map(v => v.id),
    }
    console.warn(pythonParams);

    ws.onmessage = event => {
      console.debug('server ws: '+ event.data);
      try {
        const res = JSON.parse(event.data);
        if(res.prompt === '>>>') {
          ws.send(JSON.stringify(pythonParams))
        } else {
          if(res.result) {
            console.log('got result', res.result);
            const newName = plateDefinitionFileRefs[resultCount++].name;
            emitter({
              type: REPORT_GENERATED_MLCR,
              data: {
                id: res.result,
                name: newName,
                link:`${config.backendURL}/api/tempFile/${res.result}/as/${newName}`}
            })
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

export default function* watchMergeLightCyclerReport() {
  yield takeEvery(UPLOAD_PLATE_DEFINITION_FILE, uploadPlateDefinitionFile);
  yield takeEvery(UPLOAD_LIGHT_CYCLER_REPORT_FILE, uploadLightCyclerReportFile);
  yield takeEvery(CREATE_WS, createWs);
  yield takeLatest(START_TASK, startTask);
}
