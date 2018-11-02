import * as React from 'react'

// react-redux-router
import { IStoreState, INamedLink, TaskStatus } from '../../types'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import {
  START_TASK,
  ABORT_TASK,
  CREATE_WS,
  END_WS,
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
  taskStatus: TaskStatus,
  showProgressBar: boolean,
  ws?: WebSocket,
  enableRunButton: boolean,
  clientId: string,
  initialWebSocket: ()=>void,
  finalizeWebSocket: (ws:WebSocket)=>void,
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
    const {ws} = this.props;
    if(!ws || ws.readyState !== 1) {
      this.props.initialWebSocket();
    } else {
      console.debug('continue use ', ws);
    }
  }
  public componentWillUnmount() {
    console.debug('TestLongTask unmounting');
    const {ws, taskStatus} = this.props;
    if(ws && ws.readyState === 1 && taskStatus === 'finish' || taskStatus === 'ready') {
      console.debug('finalizing websocket');
      this.props.finalizeWebSocket(ws!);
    }
    
  }

  public render() {
    const {
      message,
      start,
      progress,
      showProgressBar,
      enableRunButton,
      clientId,
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
        <div>{clientId}</div>
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
  taskStatus: state.testLongTask.taskStatus,
  showProgressBar: state.testLongTask.showProgressBar,
  ws: state.testLongTask.ws,
  enableRunButton: state.testLongTask.enableRunButton,
  clientId: state.testLongTask.clientId,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  start: () => dispatch({type: START_TASK}),
  abort: () => dispatch({type: ABORT_TASK, data:{message:''}}),
  initialWebSocket: () => dispatch({type: CREATE_WS}),
  finalizeWebSocket: (ws) => dispatch({type: END_WS}),
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(TestLongTask))
