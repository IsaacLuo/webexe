import {createStore, applyMiddleware} from 'redux'
import reducer from './reducer'
import saga from './saga'
import createSagaMiddleware from 'redux-saga'

export interface IStoreState {
  message: string,
}

/* tslint-disable no-underscore-dangle */

const sagaMiddleware = createSagaMiddleware();
const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ;
const store = createStore(
    reducer,
    composeEnhancers(applyMiddleware(sagaMiddleware)),
  );
sagaMiddleware.run(saga);

export default store;

/* tslint-enable */