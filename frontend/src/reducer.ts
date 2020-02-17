import { combineReducers } from 'redux';

import { IAppStoreState, IAction } from './types';
import config from './conf.json'
import { SET_AVAILABLE_TASKS, SET_LOGGED_IN } from './actions';
import generalTask from './pages/GeneralTask/reducers';

function app(state :IAppStoreState = {
  message: '',
  messageStyle: 'normal',
  availableTasks: {},
  loggedIn: false,
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
    case SET_LOGGED_IN:
      return {
        ...state,
        loggedIn: action.data,
      }
    default:
      return state;
  }
}

export default combineReducers({
  app,
  generalTask,
});