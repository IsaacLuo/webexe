import * as React from 'react'

// react-redux-router
import { IStoreState, ITaskStoreState } from './store';
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import { 
  ActionSaySomething, 
  ActionClearMessage, 
  ActionWaitAndSaySomething,
} from './actions';

import config from './config'

// other tools
import styled from 'styled-components'

import {Upload, Button} from 'element-react'
import Dropzone from 'react-dropzone'
import Axios from 'axios';

interface IProps {
  dispatchSayHelloWorld: () => void,
  dispatchClearMessage: () => void,
  dispatchAsyncSayHelloWorld: () => void,
  dispatchTestWS: ()=>void,
  dispatchRunTask: (data:any)=>void,
  dispatchUploadFile: (taskId:string, file:File) => void,
  reports: any,
  uploadedFiles: any,
  // x:ITaskStoreState,
}
interface IState {
  plateDefinitionIds: string[],
  lightCyclerReportIds: string[],
  taskId: string,
}

const MyPanel = styled.div`
  background: #eee;
`;

class MergeLightCyclerReport extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      plateDefinitionIds: [],
      lightCyclerReportIds: [],
      // taskId: Math.random().toString(36).substring(2),
      taskId: 'MergeLightCyclerReport',
    };
  }

  public render() {
    const {
      dispatchSayHelloWorld,
      dispatchClearMessage,
      dispatchAsyncSayHelloWorld,
      dispatchTestWS,
    } = this.props;

    const links:any[] = [];
    const len = this.props.reports.length;
    for (let i=0;i<len;i++) {
      const report = this.props.reports[i];
      links.push(<p key={Math.random()}>result <a href={`${report.link}/as/${this.state.plateDefinitionIds[i]}`} download={true}>result {report.name}</a></p>);
    }

    return (
      <MyPanel>
        {this.props.uploadedFiles.map(x => <div key={Math.random()}>{x.id}</div>)}
        <button onClick = {dispatchSayHelloWorld}>say hello</button>
        <button onClick = {dispatchAsyncSayHelloWorld}>say hello after 1 second</button>
        <button onClick = {dispatchClearMessage}>clear</button>
        <button onClick = {dispatchTestWS}>test ws</button>
        <p>step 1: upload plate definition files</p>
        <Dropzone
          accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onDropAccepted={this.onDropPlateDefinitionFiles}
        >
          <div>drop plate definition files here</div>
        </Dropzone>
        <Dropzone
          accept="text/plain"
          onDropAccepted={this.onDropLightCyclerFiles}
        >
          <div>drop lightcycler reports here</div>
        </Dropzone>
        <Upload
          drag = {true}
          action={`${config.backendURL}/api/tempFile`}
          multiple= {true}
          onSuccess={this.onPlateDefinitionFilesUploaded}
        >
          <i className="el-icon-upload"/>
          <div className="el-upload__text">plate definition files</div>
        </Upload>
        <p>step 2: upload lightcycler reports</p>
        <Upload
          drag = {true}
          action={`${config.backendURL}/api/tempFile`}
          multiple= {true}
          onSuccess={this.onLightCyclerReportFilesUploaded}
        >
          <i className="el-icon-upload"/>
          <div className="el-upload__text">lightcycler report files</div>
        </Upload>
        <Button
          type="primary"
          onClick={this.onClickRun}
          >Run</Button>
        {links}
      </MyPanel>
    );
  }
  private onDropPlateDefinitionFiles = (acceptedFiles) => {
    console.log(acceptedFiles)
    acceptedFiles.forEach(file=> {
      this.props.dispatchUploadFile(this.state.taskId, file);
    });
  }

  private onDropLightCyclerFiles = (acceptedFiles) => {
    console.log(acceptedFiles)
  }

  private onPlateDefinitionFilesUploaded = (response, file, fileList) => {
    console.log(response.id);
    const {plateDefinitionIds} = this.state;
    plateDefinitionIds.push(response.id);
    this.setState({plateDefinitionIds});
  }

  private onLightCyclerReportFilesUploaded = (response, file, fileList) => {
    console.log(response.id);
    const {lightCyclerReportIds} = this.state;
    lightCyclerReportIds.push(response.id);
    this.setState({lightCyclerReportIds});
  }

  private onClickRun = () => {
    const {plateDefinitionIds, lightCyclerReportIds} = this.state;
    console.debug(this.state);
    this.props.dispatchRunTask(this.state);
  }
}

const mapStateToProps = (state: IStoreState) => ({
  reports: state.tasks.mergeLightCyclerReports,
  x: state.tasks,
  uploadedFiles: state.tasks.uploadedFiles,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  dispatchSayHelloWorld: () => dispatch(ActionSaySomething('hello world')),
  dispatchClearMessage: () => dispatch(ActionClearMessage()),
  dispatchAsyncSayHelloWorld: () => dispatch(ActionWaitAndSaySomething('hello world', 1000)),
  dispatchTestWS: () => dispatch({type:'testWS', data:{msg:'hello'}}),
  dispatchRunTask: (data)=>dispatch({type:'MergeLightCyclerReport', data}),
  dispatchUploadFile: (taskId:string, file:File) => dispatch({type:'UPLOAD_TEMP_FILE', data:{taskId, file}})
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(MergeLightCyclerReport))
