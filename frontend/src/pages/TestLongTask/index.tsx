import * as React from 'react'

// react-redux-router
import { IStoreState, INamedLink } from '../../types'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import {
  START_TASK,
  ABORT_TASK,
  CREATE_WS,
} from './actions';

// other tools
import styled from 'styled-components'
import {Button, Progress} from 'element-react'
import ProgressMonitorPanel from '../../components/ProgressMonitorPanel'

const MyPanel = styled.div`
  width:800px;
  display:flex;
  flex-direction: column;
  align-items: center;
`;

interface IProps {
  message: string,
  progress: number,
  showProgressBar: boolean,
  ws?: WebSocket,
  enableRunButton: boolean,
  initialWebSocket: ()=>void,
  start: ()=>void,
  abort: ()=>void,
}
interface IState {
}



class TestLongTask extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
    };
  }

  public componentDidMount() {
    console.debug('TestLongTask mounted');
    this.props.initialWebSocket();
    
  }
  public componentWillUnmount() {
    console.debug('TestLongTask unmounting');
  }

  public render() {
    const {
      message,
      start,
      progress,
      showProgressBar,
      enableRunButton,
    } = this.props;
    return (
      <MyPanel>
        <div>
          <Button
            type="primary"
            onClick={start}
            style={{width:200}}
            disabled={!enableRunButton}
            >
            Run
          </Button>
          <Button
            onClick={this.reset}
            style={{width:200}}
            >
            Reset
          </Button>
        </div>
        <ProgressMonitorPanel
          progress={progress}
          showProgressBar={showProgressBar}
          message={message}
        />
      </MyPanel>
    );
  }

  private reset = () => {
    this.props.abort();
  }
}

const mapStateToProps = (state: IStoreState) => ({
  message: state.testLongTask.message,
  progress: state.testLongTask.progress,
  showProgressBar: state.testLongTask.showProgressBar,
  ws: state.testLongTask.ws,
  enableRunButton: state.testLongTask.enableRunButton,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  start: () => dispatch({type: START_TASK}),
  abort: () => dispatch({type: ABORT_TASK, data:{message:''}}),
  initialWebSocket: () => dispatch({type: CREATE_WS}),
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(TestLongTask))
