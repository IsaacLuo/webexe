import * as React from 'react'

// react-redux-router
import { IStoreState, INamedLink } from '../../types'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import {
  START_TEST_LONG_TASK,
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
  start: ()=>void,
}
interface IState {
}



class TestLongTask extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
    };
  }

  public render() {
    const {
      message,
      start,
      progress,
      showProgressBar,
    } = this.props;
    return (
      <MyPanel>
        <div>
          <Button
            type="primary"
            onClick={start}
            style={{width:200}}
            >
            Run
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
}

const mapStateToProps = (state: IStoreState) => ({
  message: state.testLongTask.message,
  progress: state.testLongTask.progress,
  showProgressBar: state.testLongTask.showProgressBar,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  start: () => dispatch({type: START_TEST_LONG_TASK}),
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(TestLongTask))
