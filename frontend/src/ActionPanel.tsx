import * as React from 'react'

// react-redux-router
import { IStoreState } from './store';
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import { ActionSaySomething, ActionClearMessage, ActionWaitAndSaySomething } from './actions';

// other tools
import styled from 'styled-components'

interface IProps {
  dispatchSayHelloWorld: () => void,
  dispatchClearMessage: () => void,
  dispatchAsyncSayHelloWorld: () => void,
}
interface IState {
  
}

const MyPanel = styled.div`
  background: #aaa;
`;

class ActionPanel extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {message: ''};
  }

  public render() {
    const {
      dispatchSayHelloWorld,
      dispatchClearMessage,
      dispatchAsyncSayHelloWorld
    } = this.props;

    return (
      <MyPanel>
        <button onClick = {dispatchSayHelloWorld}>say hello</button>
        <button onClick = {dispatchAsyncSayHelloWorld}>say hello after 1 second</button>
        <button onClick = {dispatchClearMessage}>clear</button>
      </MyPanel>
    );
  }
}

const mapStateToProps = (state: IStoreState) => ({
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  dispatchSayHelloWorld: () => dispatch(ActionSaySomething('hello world')),
  dispatchClearMessage: () => dispatch(ActionClearMessage()),
  dispatchAsyncSayHelloWorld: () => dispatch(ActionWaitAndSaySomething('hello world', 1000)),
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(ActionPanel))
