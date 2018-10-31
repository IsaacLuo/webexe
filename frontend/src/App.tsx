import {IStoreState} from './types'
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
import TestLongTask from './pages/TestLongTask'

import config from './config';

import pageLinks from './common/pageLinks'
import {
  TEST_CONNECTION
} from './actions'

interface IProps {
  message:string,
  messageStyle:string,
  testConnection:()=>void,
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
  }

  public render() {
    const {message, messageStyle} = this.props;
    return (
      <div className="App">
        <NavBar/>
        <main>
        <MyPanel>
          <Route path='/' exact={true} component={Dashboard} />
          {
            pageLinks.map(item=><Route key={item.link} path={item.link} exact={true} component={item.component} />)
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
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  testConnection: ()=>dispatch({type:TEST_CONNECTION})
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App))