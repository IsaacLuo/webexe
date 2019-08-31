import {IStoreState, TaskDefinition} from './types'
// react-redux-router
import * as React from 'react'
import { Dispatch } from 'redux'
import { withRouter, Link } from 'react-router-dom'
import { connect } from 'react-redux'
import {Route} from 'react-router'

// style
import './App.css';

// other tools
import styled from 'styled-components'

// components
import NavBar from './components/NavBar'
import FootBar from './components/FootBar'
import Dashboard from './pages/Dashboard'
import MergeLightCyclerReport from './pages/MergeLightCyclerReport'
import GeneralTask from './pages/GeneralTask'

import config from './config';

import pageLinks from './common/pageLinks'
import {
  TEST_CONNECTION, GET_AVAILABLE_TASKS
} from './actions'
import TaskManager from './pages/TaskManager';

interface IProps {
  message:string,
  messageStyle:string,
  dispatchGetAvailabTasks:()=>void,
  testConnection:()=>void,
  availableTasks: {[key:string]:TaskDefinition},
}

interface IState {

}

const MyPanel = styled.div`
  margin: 50px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

class App extends React.Component<IProps, IState> {
  constructor(props:IProps) {
    super(props);
    this.props.testConnection();
    this.props.dispatchGetAvailabTasks();
  }

  public render() {
    const {message, messageStyle, availableTasks} = this.props;
    return (
      <div className="App">
        <NavBar/>
        <main>
          <MyPanel>
            <Route path='/' exact={true} component={Dashboard} />
            {availableTasks &&
              Object.keys(availableTasks).map(
                (key,i)=>
                  <Route 
                    key={i} 
                    path={`/task/${availableTasks[key].name}`} 
                    exact={true} 
                    component={() => <GeneralTask taskName={availableTasks[key].name} 
                  />} 
                />)
            }
            <p className={`message-bar ${messageStyle}`}>{message}</p>
          </MyPanel>
        </main>
        <FootBar/>
      </div>
    );
  }
}


const mapStateToProps = (state :IStoreState) => ({
  message: state.app.message,
  messageStyle: state.app.messageStyle,
  availableTasks: state.app.availableTasks,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  testConnection: ()=>dispatch({type:TEST_CONNECTION}),
  dispatchGetAvailabTasks: ()=>dispatch({type:GET_AVAILABLE_TASKS})
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App))