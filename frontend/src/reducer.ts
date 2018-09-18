import {IStoreState} from './store'
import {
  IAction,
  SAY_SOMETHING,
  CLEAR_MESSAGE,
} from './actions'

function myReducer(state :IStoreState = {
  message: '',
}, action: IAction) {
  switch (action.type) {
    case SAY_SOMETHING:
      return {...state, message: action.data};

    case CLEAR_MESSAGE:
      return {...state, message: ''};
  }
  return state;
}

export default myReducer