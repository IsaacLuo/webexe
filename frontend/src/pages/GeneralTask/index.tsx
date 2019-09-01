import * as React from 'react'

// react-redux-router
import { IStoreState, INamedLink, TaskStatus, TaskDefinition, IServerLog } from '../../types'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import {
  START_TASK,
  ABORT_TASK,
} from './actions';

// other tools
import styled from 'styled-components'
import {Button, Progress, InputNumber} from 'element-react'
import ProgressMonitorPanel from '../../components/ProgressMonitorPanel'

const MyPanel = styled.div`
  // width:800px;
  display:flex;
  flex-direction: column;
  align-items: center;
`;

const CodePanel = styled.div`
  border: solid 1px black;
  background: #ddd;
  width: 400px;
  height: 400px;
  text-align: left;
  padding: 8px;
  display:inline-block;
  word-wrap: break-word;
  overflow-y: scroll;
`

interface IProps {
  availableTasks: {[key:string]:TaskDefinition};
  taskName: string,

  message: string,
  progress: number,
  signalLog: IServerLog[],
  outputLog: IServerLog[],
  processId?: string,
  result: any,

  taskStatus: TaskStatus,
  showProgressBar: boolean,
  ws?: WebSocket,
  enableRunButton: boolean,

  start: (taskName:string, params:any)=>void,
  abort: (processId:string)=>void,
}
interface IState {
  taskDefinition?: TaskDefinition;
  params?:any;
}

const mapStateToProps = (state: IStoreState) => ({
  availableTasks: state.app.availableTasks,
  message: state.generalTask.message,
  progress: state.generalTask.progress,
  signalLog: state.generalTask.signalLog,
  outputLog: state.generalTask.outputLog,
  processId: state.generalTask.processId,
  result: state.generalTask.result,

  taskStatus: state.generalTask.taskStatus,
  showProgressBar: state.generalTask.showProgressBar,
  ws: state.generalTask.ws,
  enableRunButton: state.generalTask.enableRunButton,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  start: (taskName:string, params:any) => dispatch({type: START_TASK, data:{taskName, params}}),
  abort: (processId:string) => dispatch({type: ABORT_TASK, data:processId}),
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
      progress,
      showProgressBar,
      enableRunButton,
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
            onClick={this.startTask}
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
        <div style={{width:'100%'}}>
        <CodePanel>
          {this.props.signalLog.map((v,i)=><div key={i}>{`${v.time.getHours()}:${v.time.getMinutes()}:${v.time.getSeconds()}`}: {v.text}</div>)}
        </CodePanel>
        <CodePanel>
          {this.props.outputLog.map((v,i)=><div key={i}>{v.text}</div>)}
        </CodePanel>
        </div>
        {this.props.result ? <h3>results</h3> : <div>-----</div>}
        {this.generateResults()}
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

  private generateResults = () => {
    const {result} = this.props;
    let comps:any[] = [];
    if (result) {
      if (result.files) {
        comps = [...comps, result.files.map((v,i)=>
        <div key={i}>
          <a href={v.data} download={v.name}>{v.name}</a>
        </div>)]
      }
    }
    return comps;
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

  private startTask = () => {
    console.log(this.state.params);
    this.props.start(this.props.taskName, this.state.params);
  }

  private reset = () => {
    if (this.props.processId) {
      this.props.abort(this.props.processId);
    }
  }
}



export default withRouter(connect(mapStateToProps, mapDispatchToProps)(GeneralTask))
