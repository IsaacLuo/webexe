import * as React from 'react'

// react-redux-router
import { IStoreState, INamedLink, TaskStatus, TaskDefinition, IServerLog } from '../../types'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import {
  START_TASK,
  ABORT_TASK,
  UPLOAD_FILE_PARAMS,
} from './actions';

// other tools
import styled from 'styled-components'
import {Button, Progress, InputNumber, Loading} from 'element-react'
import ProgressMonitorPanel from '../../components/ProgressMonitorPanel'
import Dropzone, {useDropzone} from 'react-dropzone'
import Axios from 'axios';
import config from 'config';
import MyDropzone from '../../components/MyDropZone'



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


// function MyDropzone() {
//   const onDrop = useCallback(acceptedFiles => {
//     // Do something with the files
//   }, [])
//   const {getRootProps, getInputProps} = useDropzone()

//   return (
//     <MyDropzoneDiv {...getRootProps()}>
//       <input {...getInputProps()} />
//       <p>Drag 'n' drop some files here, or click to select files</p>
//     </MyDropzoneDiv>
//   )
// }

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
  uploadFileParams: (paramsName:string, files:File[]) => void,
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
  uploadFileParams: (paramsName:string, files:File[]) => dispatch({type: UPLOAD_FILE_PARAMS, data:{paramsName: files}}),
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

    const {taskDefinition, params} = this.state;

    if(taskDefinition) {
      const form = this.generateParamsForm(taskDefinition);
      
      const paramMissing = taskDefinition.params.some((v:any)=>v.essential === true && params[v.name] === undefined)
      console.log('testing params', taskDefinition.params, params, paramMissing)
    return (
      <MyPanel>
        <h1>{taskDefinition.name}</h1>
        <p>{taskDefinition.description}</p>
        {form}
        {this.state.params && Object.keys(this.state.params).map((v,i)=><div key={i}>
          {v} : {this.state.params[v]} 
        </div>)}
        <div>
          <Button
            type="primary"
            onClick={this.startTask}
            style={{width:200}}
            disabled={paramMissing || !enableRunButton}
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
          {this.state.params[param.name] ? '✔️':'❌'}
          {param.name}
          {this.generateContol(param.control, param.controlSettings, params[param.name], this.onParamChange.bind(this, param.control, param.name))}
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
          {v.data && <a href={v.data} download={v.name} target="_blank">{v.name}</a> }
          {v.url && <a href={`${config.backendURL}/api/resultFile/${v.url}/as/${v.name}`} download={v.name} target="_blank">{v.name}</a> }
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
      case 'file':
        return <MyDropzone onChange = {onChange}/>
      default:
        return <div>unsupported control</div>
    }
  }

  private onDropFile = async (settings:any, states: any, onChange:(value:any)=>void, files:File[])=>{
          const filePaths:string[] = [];
          try {
            // tslint:disable-next-line: forin
            for (const i in files) {
              if (settings.singleFile && parseInt(i, 10) > 0) {
                break;
              }
              const file = files[i];
              console.log(files);
              const formData = new FormData();
              formData.append('file', file)
              const result = await Axios.post(
                `${config.backendURL}/api/fileParam/`, 
                formData, 
                {headers: {'content-type': 'multipart/form-data'}, withCredentials:true});
              const {filePath} = result.data;
              if (filePath) {
                filePaths.push(filePath);
              }
            }
            onChange(filePaths);
          } catch (err) {
            console.error(err);
          }
        }

  private onParamChange = (controlType:any, paramName:string, value:any) => {
    const {params} = this.state;
    // console.log(controlType);
    this.setState({params: {...params, [paramName]:value}});
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
