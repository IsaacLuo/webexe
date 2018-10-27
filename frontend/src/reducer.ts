import { combineReducers } from 'redux';
import mergeLightCyclerReport from './pages/MergeLightCyclerReport/reducers'
import testLongTask from './pages/TestLongTask/reducers'
import { IAppStoreState, IAction } from './types';
import config from './config'

function app(state :IAppStoreState = {
  message: '',
  messageStyle: 'normal',
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
    default:
      return state;
  }
  return state;
}

export default combineReducers({
  app,
  mergeLightCyclerReport,
  testLongTask,
});