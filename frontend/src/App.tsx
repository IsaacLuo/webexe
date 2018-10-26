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
import MergeLightCyclerReport from './pages/MergeLightCyclerReport'

interface IProps {
  message: string,  
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
  }

  public render() {
    const {message} = this.props;
    return (
      <div className="App">
        <MyPanel>
          <Link to='/tools/MergeLightCyclerReport'>'/tools/MergeLightCyclerReport'</Link>
          <p>{process.env.NODE_ENV}</p>
          <Route path='/tools/MergeLightCyclerReport' exact={true} component={MergeLightCyclerReport} />
          <div>{message}</div>
        </MyPanel>
      </div>
    );
  }
}


const mapStateToProps = (state :IStoreState) => ({
  
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App))