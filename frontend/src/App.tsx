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
import Dashboard from './pages/Dashboard'
import MergeLightCyclerReport from './pages/MergeLightCyclerReport'
import config from './config';
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
        <MyPanel>
          <Route path='/' exact={true} component={Dashboard} />
          <Route path='/tools/MergeLightCyclerReport' exact={true} component={MergeLightCyclerReport} />
          <p className={`message-bar ${messageStyle}`}>{message}</p>
          <p>{process.env.NODE_ENV} version 0.1.0</p>
          <p>{JSON.stringify(process.env)} {JSON.stringify(config)}</p>
        </MyPanel>
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