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
import GeneralTask from './pages/GeneralTask'

import {
  TEST_CONNECTION, GET_AVAILABLE_TASKS
} from './actions'
import TaskManager from './pages/TaskManager';
import { Button } from 'element-react'
import conf from './conf.json';
import io from 'socket.io-client';

interface IProps {
  message:string,
  messageStyle:string,
  dispatchGetAvailabTasks:()=>void,
  testConnection:()=>void,
  availableTasks: {[key:string]:TaskDefinition},
  loggedIn: boolean,
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
          {
            !this.props.loggedIn && !conf.localMode
          ?
          <MyPanel>
            <Button type='primary' onClick={this.onClickLogin}>Login to Cailab</Button>
          </MyPanel>
          :
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
          }
        </main>
        <FootBar/>
      </div>
    );
  }

  private onClickLogin = () => {
    const width = 400;
    const height = 560;
    const top = (window.screen.availHeight / 2) - (height / 2);
    const left = (window.screen.availWidth / 2) - (width / 2);

    window.addEventListener('message', this.onLogginWindowClosed, false);
    const subWindow = window.open(
      'https://auth.cailab.org/login',
      'cailablogin',
// tslint:disable-next-line: max-line-length
      `toolbar=no,location=no,status=no,menubar=no,scrollbar=yes,resizable=yes,width=${width},height=${height},top=${top},left=${left}`,
    );
  }

  private onLogginWindowClosed = (messageEvent: MessageEvent) => {
    const {origin, data} = messageEvent;
    console.log(origin, messageEvent);
    if (data.event === 'closed' && data.success === true) {
      console.log('---------------------');  
      this.props.dispatchGetAvailabTasks();
    }
    window.removeEventListener('message', this.onLogginWindowClosed);
  }

}


const mapStateToProps = (state :IStoreState) => ({
  message: state.app.message,
  messageStyle: state.app.messageStyle,
  availableTasks: state.app.availableTasks,
  loggedIn: state.app.loggedIn,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  testConnection: ()=>dispatch({type:TEST_CONNECTION}),
  dispatchGetAvailabTasks: ()=>dispatch({type:GET_AVAILABLE_TASKS})
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App))