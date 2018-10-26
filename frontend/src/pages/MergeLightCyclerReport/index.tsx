import * as React from 'react'

// react-redux-router
import { IStoreState, INamedLink } from '../../types'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import {
  START_MERGE_LIGHT_CYCLER_REPORT,
  RESET_MLCR,
} from './actions';

import config from '../../config'

// other tools
import styled from 'styled-components'

import {Upload, Button} from 'element-react'
import Dropzone from 'react-dropzone'
import Axios from 'axios';
import { ActionUploadedPlateDefinitionFile, UPLOAD_PLATE_DEFINITION_FILE, UPLOAD_LIGHT_CYCLER_REPORT_FILE } from './actions';
import { start } from 'repl';

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
  uploadPlateDefinitionFile: (file:File) => void,
  uploadLightCyclerReportFile: (file:File) => void,
  start: ()=>void,
  clear: ()=>void,
}
interface IState {
}



class MergeLightCyclerReport extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      // plateDefinitionIds: [],
      // lightCyclerReportIds: [],
      // taskId: Math.random().toString(36).substring(2),
      // taskId: 'MergeLightCyclerReport',
    };
  }

  public render() {
    const {
      plateDefinitionFileRefs,
      lightCyclerReportFileRefs,
      mergedResultFileRefs,
    } = this.props;


    const results = mergedResultFileRefs.map(
      v=> <p key={Math.random()}>result <a href={v.link} download={true}>result {v.name}</a></p>
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
        <p>step 1: upload plate definition files</p>
        <MyDropzone
          accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          acceptStyle={{borderColor:'#42d885'}}
          rejectStyle={{borderColor:'#ff4949'}}
          onDropAccepted={this.onDropPlateDefinitionFiles}
        >
          <div>drop plate definition files here</div>
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
          <div>drop lightcycler reports here</div>
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
        {results}
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

const mapStateToProps = (state: IStoreState) => ({
  plateDefinitionFileRefs: state.mergeLightCyclerReport.plateDefinitionFileRefs,
  lightCyclerReportFileRefs: state.mergeLightCyclerReport.lightCyclerReportFileRefs,
  mergedResultFileRefs: state.mergeLightCyclerReport.mergedResultFileRefs,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  uploadPlateDefinitionFile: (file:File) => dispatch({type: UPLOAD_PLATE_DEFINITION_FILE, data:{file}}),
  uploadLightCyclerReportFile: (file:File) => dispatch({type: UPLOAD_LIGHT_CYCLER_REPORT_FILE, data:{file}}),
  start: () => dispatch({type: START_MERGE_LIGHT_CYCLER_REPORT}),
  clear: () => dispatch({type: RESET_MLCR})
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(MergeLightCyclerReport))
