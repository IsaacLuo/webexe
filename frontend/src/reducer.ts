import {IAppStoreState, ITaskStoreState} from './store'
import {
  IAction,
  SAY_SOMETHING,
  CLEAR_MESSAGE,
} from './actions'
import { combineReducers } from 'redux';

function myReducer(state :IAppStoreState = {
  message: '',
}, action: IAction) {
  switch (action.type) {
    case SAY_SOMETHING:
      return {...state, message: action.data};

    case CLEAR_MESSAGE:
      return {...state, message: ''};
    
    case 'addTaskResult':
      return state;
  }
  return state;
}

function taskReducer(state :ITaskStoreState = {
  mergeLightCyclerReports:[],
  uploadedFiles: [],
}, action: IAction) {
  switch (action.type) {
    case 'addTaskResult':
      const newState = {
        ...state,
      };
      if (!newState[action.data.taskId]) {
        newState[action.data.taskId] = []
      }
      const arr = [...newState[action.data.taskId], {link:action.data.link, name: action.data.name}]
      newState[action.data.taskId] = arr;
      return newState;
    
    case 'NEW_FILE_UPLOADED':
      const {id, name} = action.data
      return {
        ...state,
        uploadedFiles: [...state.uploadedFiles,
          {id, name}
        ]
      }
  }
  return state;
}

export default combineReducers({
  app: myReducer,
  tasks: taskReducer,
});