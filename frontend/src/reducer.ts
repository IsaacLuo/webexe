import { combineReducers } from 'redux';

import { IAppStoreState, IAction } from './types';
import config from './config'
import { SET_AVAILABLE_TASKS } from './actions';

function app(state :IAppStoreState = {
  message: '',
  messageStyle: 'normal',
  availableTasks: [],
}, action: IAction) {
  switch (action.type) {
    case 'SHOW_CONNECTED':
      return {
        ...state,
        message: `connected to ${config.backendURL}`,
        messageStyle: 'normal',
      }
    case 'SHOW_DISCONNECTED':
      return {
        ...state,
        message: `failed to connect ${config.backendURL}, please try again later`,
        messageStyle: 'error',
      }
    case SET_AVAILABLE_TASKS:
      return {
        ...state,
        availableTasks: action.data,
      }
    default:
      return state;
  }
}

export default combineReducers({
  app,
});