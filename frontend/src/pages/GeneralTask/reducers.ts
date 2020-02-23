/**
 * @file test long task reducers
 */

import{
  SERVER_MESSAGE,
  PROGRESS,
  FINISH_TASK,
  ABORT_TASK,
  START_TASK,
  SET_CLIENT_ID,
  SET_PROCESS_ID,
  SET_PROCESS_SIGNAL,
  SET_PROCESS_LOG,
  SERVER_RESULT,
  SERVER_LOG,
  SET_PROCESS_STATE,
} from './actions'

export default function reducer(state:IGeneralTaskState  = {
  message: 'no message',
  progress: 0,
  taskStatus: 'init',
  showProgressBar: true,
  ws: undefined,
  enableRunButton: true,
  clientId: 'no task ID',
  signalLog: [],
  outputLog: [],
  result: undefined,
  socket: undefined,
}, action: IAction) {
  switch (action.type) {
    
    case SET_CLIENT_ID:
      return {
        ...state,
        clientId: action.data,
      }
    case START_TASK:
      return {
        ...state,
        taskStatus: 'queueing',
        enableRunButton: false,
        signalLog: [],
        outputLog: [],
      }
      
    case PROGRESS:
      return {
        ...state,
        taskStatus: 'running',
        progress: action.data,
        message: action.message,
      }

    case SET_PROCESS_STATE:
      return {
        ...state,
        message: action.data,
      }
    case SERVER_RESULT:
      return {
        ...state,
        result: action.data,
        message: action.message,
      }
    
    case FINISH_TASK:
      return {
        ...state,
        taskStatus: 'finish',
        message:'finish long task',
        enableRunButton: true,
      }
    case ABORT_TASK:
      return {
        ...state,
        taskStatus: 'aborted',
        message: 'aborted',
        enableRunButton: true,
      }
    

    case SET_PROCESS_ID:
      return {
        ...state,
        processId: action.data,
      }
    case SERVER_LOG:
      return {
        ...state,
        signalLog: [...state.signalLog, {time: new Date(), text: action.data}],
      }
  
    case SERVER_MESSAGE:
      return {
        ...state,
        outputLog: [...state.outputLog, {time: new Date(), text: action.data}],
      }

  }
  return state;
}