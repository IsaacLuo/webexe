import {createStore, applyMiddleware} from 'redux'
import reducer from './reducer'
import saga from './saga'
import createSagaMiddleware from 'redux-saga'

export interface IAppStoreState {
  message: string,
}

export interface ITaskStoreState {
  mergeLightCyclerReports: any[],
  uploadedFiles: any[],
}

export interface IStoreState {
  app: IAppStoreState,
  tasks: ITaskStoreState,
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