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
  RESET_MLCR,
} from './actions';

// other tools
import styled from 'styled-components'
import {Button} from 'element-react'
import Dropzone from 'react-dropzone'
import { UPLOAD_PLATE_DEFINITION_FILE, UPLOAD_LIGHT_CYCLER_REPORT_FILE } from './actions';

// components
import ProgressMonitorPanel from '../../components/ProgressMonitorPanel'

const MyPanel = styled.div`
  width:800px;
  display:flex;
  flex-direction: column;
  align-items: center;
`;

const MyDropzone = styled(Dropzone)`
  border-style: solid;
  border-radius: 10px;
  margin: 20px;
  width: 80%;
  padding: 20px;
  min-height: 100px;
`

const FileLink = styled.div`
  margin:10px;
  white-space:nowrap;
  text-overflow:ellipsis;overflow:hidden;
`;

interface IProps {
  plateDefinitionFileRefs: INamedLink[],
  lightCyclerReportFileRefs: INamedLink[],
  mergedResultFileRefs: INamedLink[],
  message: string,
  progress: 0,
  showProgressBar: boolean,
  ws?: WebSocket,
  taskId: string,
  enableRunButton: boolean,
  uploadPlateDefinitionFile: (file:File) => void,
  uploadLightCyclerReportFile: (file:File) => void,
  initialWebSocket:()=>void,
  start: ()=>void,
  abort: ()=>void,
  clear: ()=>void,
}
interface IState {
}



class MergeLightCyclerReport extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
    };
  }

  public componentDidMount() {
    this.props.initialWebSocket();
  }

  public render() {
    const {
      plateDefinitionFileRefs,
      lightCyclerReportFileRefs,
      mergedResultFileRefs,
      message,
      progress,
      showProgressBar,
    } = this.props;

    const results = mergedResultFileRefs.map(
      v=> <p key={Math.random()}>result <a href={v.link} download={true}>{v.name}</a></p>
      );

    const uploadedPlateDefinitions = 
      plateDefinitionFileRefs.map(
        v => <FileLink key={Math.random()}><a href={v.link} download={true}><i className="el-icon-document"/> {v.name}</a></FileLink>
      );

    const uploadedLightCyclerReports =
      lightCyclerReportFileRefs.map(
        v => <FileLink key={Math.random()}><a href={v.link} download={true}><i className="el-icon-document"/> {v.name}</a></FileLink>
      )

    return (
      <MyPanel>
        <MyDropzone
          accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          acceptStyle={{borderColor:'#42d885'}}
          rejectStyle={{borderColor:'#ff4949'}}
          onDropAccepted={this.onDropPlateDefinitionFiles}
        >
          <div>drag and drop plate definition files here, or click to upload</div>
          <div>
            {uploadedPlateDefinitions}
          </div>
        </MyDropzone>
        <MyDropzone
          accept="text/plain"
          acceptStyle={{borderColor:'#42d885'}}
          rejectStyle={{borderColor:'#ff4949'}}
          onDropAccepted={this.onDropLightCyclerFiles}
        >
          <div>drag and drop lightcycler reports here, or click to upload</div>
          <div>
            {uploadedLightCyclerReports}
          </div>
        </MyDropzone>
        
        <div>
          <Button
            type="primary"
            onClick={this.onClickRun}
            style={{width:200}}
            disabled={plateDefinitionFileRefs.length === 0 || plateDefinitionFileRefs.length !== lightCyclerReportFileRefs.length}
            >
            Run
          </Button>
        </div>

        <div>
          <Button
            onClick={this.onClickClear}
            style={{width:200}}
            >
            clear
          </Button>
        </div>

        <ProgressMonitorPanel
          progress={progress}
          showProgressBar={showProgressBar}
          message={message}
        />
        {results.length > 0 &&
          <div>
            <p> results </p>
            {results}
          </div>
        }
      </MyPanel>
    );
  }
  private onDropPlateDefinitionFiles = (acceptedFiles: File[]) => {
    console.log(acceptedFiles)
    acceptedFiles.forEach(file=> {
      this.props.uploadPlateDefinitionFile(file);
    });
  }

  private onDropLightCyclerFiles = (acceptedFiles: File[]) => {
    console.log(acceptedFiles)
    acceptedFiles.forEach(file=> {
      this.props.uploadLightCyclerReportFile(file);
    });
  }

  private onClickRun = () => {
    this.props.start();
  }
  private onClickClear = () => {
    this.props.clear();
  }
}

const mapStateToProps = (state: IStoreState) => {
  const {
    message,
    progress,
    ws,
    enableRunButton,
    plateDefinitionFileRefs,
    lightCyclerReportFileRefs,
    mergedResultFileRefs,
    showProgressBar,
  } = state.mergeLightCyclerReport;
  return {
    message,
    progress,
    ws,
    enableRunButton,
    plateDefinitionFileRefs,
    lightCyclerReportFileRefs,
    mergedResultFileRefs,
    showProgressBar,
  }
}

const mapDispatchToProps = (dispatch :Dispatch) => ({
  uploadPlateDefinitionFile: (file:File) => dispatch({type: UPLOAD_PLATE_DEFINITION_FILE, data:{file}}),
  uploadLightCyclerReportFile: (file:File) => dispatch({type: UPLOAD_LIGHT_CYCLER_REPORT_FILE, data:{file}}),
  initialWebSocket: ()=>dispatch({type:CREATE_WS}),
  start: () => dispatch({type: START_TASK}),
  clear: () => dispatch({type: RESET_MLCR})
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(MergeLightCyclerReport))
