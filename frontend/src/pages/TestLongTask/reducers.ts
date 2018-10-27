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
} from './actions'

export default function reducer(state:ITestLongTaskStoreState  = {
  message: 'no message',
  progress: 0,
}, action: IAction) {
  switch (action.type) {
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