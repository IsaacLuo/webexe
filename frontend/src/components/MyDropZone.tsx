import * as React from 'react'
import styled from 'styled-components'
import {Loading} from 'element-react'
import Dropzone, {useDropzone} from 'react-dropzone'
import Axios from 'axios';
import config from 'config';

const MyDropzoneDiv = styled.div`
  border-style: solid;
  border-radius: 10px;
  margin: 20px;
  width: 80%;
  padding: 20px;
  min-height: 100px;
  background: #dff;
`

interface IProps {
  onChange: (filePath: string)=>void;
  singleFile?: boolean;
}
interface IState {
  loading: boolean;
}

export default class MyDropZone extends React.Component<IProps, IState> {
  constructor(props:IProps){
    super(props);
    this.state = {
      loading: false,
    }
  }

  render () {
    return <Loading loading={this.state.loading}><Dropzone onDrop={this.onDropFile.bind(this, settings, states, onChange)}>
        {({getRootProps, getInputProps}) => (
          <section>
            <MyDropzoneDiv {...getRootProps()}>
              <input {...getInputProps()} />
              <p>Drag 'n' drop some files here, or click to select files</p>
            </MyDropzoneDiv>
          </section>
        )}
      </Dropzone>
      </Loading>
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
}