import * as React from 'react'

// react-redux-router
import { IStoreState, INamedLink, TaskStatus, TaskDefinition } from '../../types'
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
import {Button, Progress, InputNumber} from 'element-react'
import ProgressMonitorPanel from '../../components/ProgressMonitorPanel'

const MyPanel = styled.div`
  width:800px;
  display:flex;
  flex-direction: column;
  align-items: center;
`;

interface IProps {
  availableTasks: {[key:string]:TaskDefinition};
  taskName: string,

  message: string,
  progress: number,
  taskStatus: TaskStatus,
  showProgressBar: boolean,
  ws?: WebSocket,
  enableRunButton: boolean,
  clientId: string,
  initialWebSocket: ()=>void,
  finalizeWebSocket: (ws:WebSocket)=>void,
  start: (taskName:string)=>void,
  abort: ()=>void,
}
interface IState {
  taskDefinition?: TaskDefinition;
  params?:any;
}

const mapStateToProps = (state: IStoreState) => ({
  availableTasks: state.app.availableTasks,

  message: state.generalTask.message,
  progress: state.generalTask.progress,
  taskStatus: state.generalTask.taskStatus,
  showProgressBar: state.generalTask.showProgressBar,
  ws: state.generalTask.ws,
  enableRunButton: state.generalTask.enableRunButton,
  clientId: state.generalTask.clientId,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  start: (taskName:string) => dispatch({type: START_TASK, data:taskName}),
  abort: () => dispatch({type: ABORT_TASK, data:{message:''}}),
  initialWebSocket: () => dispatch({type: CREATE_WS}),
  finalizeWebSocket: (ws) => dispatch({type: END_WS}),
})

class GeneralTask extends React.Component<IProps, IState> {
  public static getDerivedStateFromProps(props:IProps, state:IState) {
    return {
      ...state,
      taskDefinition: props.availableTasks[props.taskName],
    };
  }

  constructor(props: IProps) {
    super(props);
    this.state = {
      taskDefinition: props.availableTasks[props.taskName],
      params: this.generateDefaultParams(props.availableTasks[props.taskName]),
    };
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

    const {taskDefinition} = this.state;
    if(taskDefinition) {
      const form = this.generateParamsForm(taskDefinition);
    return (
      <MyPanel>
        <h1>{taskDefinition.name}</h1>
        <p>{taskDefinition.description}</p>
        {form}
        <div>
          <Button
            type="primary"
            onClick={start.bind(this, this.props.taskName)}
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
    } else {
      return <div>loading...</div>
    }
  }

  private generateDefaultParams = (taskDefinition: TaskDefinition) => {
    const params:any = {};
    taskDefinition.params.forEach(v=>{
      params[v.name] = v.default;
    })
    return params;
  }

  private generateParamsForm = (taskDefinition: TaskDefinition) => {
    const {params} = this.state;
    return taskDefinition.params.map( (param, i) =>
      <div key={i}>
        <div>
          {param.name}
          {this.generateContol(param.control, param.controlSettings, params[param.name], (v:any)=>this.setState({params: {...params, [param.name]:v}}))}
        </div>
      </div>
    )
  }

  private generateContol = (type:string, settings:any, value:any, onChange:(value:any)=>void) => {
    switch (type) {
      case 'numeric':
        return <InputNumber
          defaultValue={value} 
          onChange={onChange} 
          min={settings.min} 
          max={settings.max} 
          step={settings.step}
          />
      default:
        return <div>unsupported control</div>
    }
  }

  private reset = () => {
    this.props.abort();
  }
}



export default withRouter(connect(mapStateToProps, mapDispatchToProps)(GeneralTask))
