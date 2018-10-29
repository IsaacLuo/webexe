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
} from './actions'

import config from '../../config'

export default function reducer(state:ITestLongTaskStoreState  = {
  message: 'no message',
  progress: 0,
  showProgressBar: true,
  ws: undefined,
}, action: IAction) {
  switch (action.type) {
    case CREATE_WS_TEST_LONG_TASK:
      return {
        ...state,
        ws: new WebSocket(`${config.pythonServerURL}/api/ws/testLongTask?token=1234`),
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
      }
  }
  return state;
}