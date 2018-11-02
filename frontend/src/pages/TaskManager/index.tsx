import * as React from 'react'

// react-redux-router
import { IStoreState, ITaskBrief, TaskStatus } from '../../types'
import { withRouter, Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import {CREATE_WS} from './actions'
import styled from 'styled-components'

const TaskQueue = styled.div`
display:flex;
align-items:center;
`

const TaskBlock = styled.div`
width:50px;
height:50px;
border-radius:25px;
border: solid 1px #000;
margin: 5px;
line-height:50px;
text-align:middle;
`

const QueueingTaskBlock = styled(TaskBlock)`
background-color: yellow;
`
const RunningTaskBlock = styled(TaskBlock)`
background-color: #00ff00;
`
const FinishTaskBlock = styled(TaskBlock)`
background-color: #0088ff;
`
const AbortedTaskBlock = styled(TaskBlock)`
background-color: red;
`


interface IProps {
  initialWebSocket: ()=>void,
  tasks: {[key:string]:ITaskBrief[]},
  message: string,
}
interface IState {
}
class TaskManager extends React.Component<IProps, IState> {

  public componentDidMount() {
    console.debug('TestLongTask mounted');
    this.props.initialWebSocket();
  }

  public render () {
    const {tasks, message} = this.props;

    return (
      <div>
        <p>task manager</p>
        {Object.keys(tasks).map(x=>this.generateTaskQueueView(x))}
        {JSON.stringify(tasks)}
        <p>{message}</p>
      </div>
    )
  }

  private generateTaskQueueView (taskType:string) {
    const tasks = this.props.tasks[taskType];
    return <TaskQueue key={taskType}>
      {taskType}
      {tasks.map(v=>this.generateTaskBlock(v))}
    </TaskQueue>
  }
  private generateTaskBlock (taskBrief: ITaskBrief) {
    switch (taskBrief.status) {
      case 'running':
        return <RunningTaskBlock key={taskBrief.id}>{taskBrief.id}</RunningTaskBlock>
      case 'finish':
        return <FinishTaskBlock key={taskBrief.id}>{taskBrief.id}</FinishTaskBlock>
      case 'queueing':
        return <QueueingTaskBlock key={taskBrief.id}>{taskBrief.id}</QueueingTaskBlock>
      case 'aborted':
        return <AbortedTaskBlock key={taskBrief.id}>{taskBrief.id}</AbortedTaskBlock>
      default:
        return <TaskBlock key={taskBrief.id}>{taskBrief.id}</TaskBlock>
    }
  }
}

const mapStateToProps = (state: IStoreState) => ({
  tasks: state.taskManager.tasks,
  message: state.taskManager.message,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  initialWebSocket: () => dispatch({type: CREATE_WS}),
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(TaskManager))
