/**
 * @file MergeLightCyclerReport reducers 
 */

import {
  ITaskManagerStoreState,
  IAction,
  INamedLink,
  } from '../../types'

import{
  SERVER_MESSAGE,
  SET_WS,
  SET_MESSAGE,
} from './actions'

import config from '../../config'

export default function reducer(state:ITaskManagerStoreState  = {
  tasks: {},
  ws: undefined,
  message:'',
}, action: IAction) {
  switch (action.type) {
    case SET_WS:
      return {
        ...state,
        ws: action.data,
      }
    case SERVER_MESSAGE:
      return {
        ...state,
        tasks: action.data.tasks,
      }
    case SET_MESSAGE:
      return {
        ...state,
        message: action.data,
      }
  }
  return state;
}