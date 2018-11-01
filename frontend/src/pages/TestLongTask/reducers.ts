/**
 * @file MergeLightCyclerReport reducers 
 */

import {
  ITestLongTaskStoreState,
  IAction,
  INamedLink,
  } from '../../types'

import{
  SERVER_MESSAGE,
  PROGRESS,
  FINISH_TASK,
  ABORT_TASK,
  CREATE_WS,
  START_TASK,
  SET_WS,
} from './actions'

import config from '../../config'

export default function reducer(state:ITestLongTaskStoreState  = {
  message: 'no message',
  progress: 0,
  showProgressBar: true,
  ws: undefined,
  enableRunButton: true,
  taskId: '',
}, action: IAction) {
  switch (action.type) {
    case SET_WS:
      return {
        ...state,
        ws: action.data,
      }
    
    case START_TASK:
      return {
        ...state,
        enableRunButton: false,
        taskId: Math.random().toString(36).substr(2),
      }

    case PROGRESS:
      return {
        ...state,
        message: action.data.message,
        progress: action.data.progress,
        
      }
    case SERVER_MESSAGE:
      return {
        ...state,
        message: action.data.message,
      }
    case FINISH_TASK:
      return {
        ...state,
        message:'finish long task',
        enableRunButton: true,
      }
    case ABORT_TASK:
      return {
        ...state,
        message: 'aborted',
        enableRunButton: true,
      }
  }
  return state;
}