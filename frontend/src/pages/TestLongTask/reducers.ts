/**
 * @file MergeLightCyclerReport reducers 
 */

import {
  ITestLongTaskStoreState,
  IAction,
  INamedLink,
  } from '../../types'

import{
  PROGRESS_TEST_LONG_TASK,
  FINISH_TEST_LONG_TASK,
  ABORT_TEST_LONG_TASK,
  CREATE_WS_TEST_LONG_TASK,
  START_TEST_LONG_TASK,
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
    case CREATE_WS_TEST_LONG_TASK:
      return {
        ...state,
        ws: new WebSocket(`${config.pythonServerURL}/api/ws/testLongTask?token=1234`),
      }
    
    case START_TEST_LONG_TASK:
      return {
        ...state,
        enableRunButton: false,
        taskId: Math.random().toString(36).substr(2),
      }

    case PROGRESS_TEST_LONG_TASK:
      return {
        ...state,
        message: action.data.message,
        progress: action.data.progress,
        
      }
    case FINISH_TEST_LONG_TASK:
      return {
        ...state,
        message:'finish long task',
        enableRunButton: true,
      }
    case ABORT_TEST_LONG_TASK:
      return {
        ...state,
        message: 'aborted',
        enableRunButton: true,
      }
  }
  return state;
}