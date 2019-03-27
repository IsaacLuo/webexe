/**
 * @file test long task reducers
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
  SET_CLIENT_ID,
} from './actions'

import config from '../../config'

export default function reducer(state:ITestLongTaskStoreState  = {
  message: 'no message',
  progress: 0,
  taskStatus: 'init',
  showProgressBar: true,
  ws: undefined,
  enableRunButton: true,
  clientId: 'no task ID',
}, action: IAction) {
  switch (action.type) {
    case SET_WS:
      return {
        ...state,
        taskStatus: 'ready',
        ws: action.data,
      }
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
      }
    case PROGRESS:
      return {
        ...state,
        taskStatus: 'running',
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
  }
  return state;
}