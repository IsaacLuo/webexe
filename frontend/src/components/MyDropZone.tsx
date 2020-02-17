import * as React from 'react'
import styled from 'styled-components'
import {Loading} from 'element-react'
import Dropzone, {useDropzone} from 'react-dropzone'
import Axios from 'axios';
import config from 'conf.json';

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
  onChange: (filePath: string[])=>void;
  singleFile?: boolean;
}
interface IState {
  loading: boolean;
  storedFileName: string[];
}

export default class MyDropZone extends React.Component<IProps, IState> {


  constructor(props:IProps){
    super(props);
    this.state = {
      loading: false,
      storedFileName: [],
    }
  }

  render () {
    return <Loading loading={this.state.loading}><Dropzone onDrop={this.onDropFile}>
        {({getRootProps, getInputProps}) => (
          <section>
            <MyDropzoneDiv {...getRootProps()}>
              <input {...getInputProps()} />
              <p>Drag 'n' drop some files here, or click to select files</p>
              {this.state.storedFileName.map((v,i)=><div key={i}>{v}</div>)}
            </MyDropzoneDiv>
          </section>
        )}
      </Dropzone>
      </Loading>
  }

    private onDropFile = async ( files:File[])=>{
      const filePaths:string[] = [];
      try {
        // tslint:disable-next-line: forin
        this.setState({loading: true});
        for (const i in files) {
          if (this.props.singleFile && parseInt(i, 10) > 0) {
            break;
          }
          const file = files[i];
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
          this.setState({storedFileName: [...this.state.storedFileName, file.name]})
        }
        this.props.onChange(filePaths);
      } catch (err) {
        console.error(err);
      } finally {
        this.setState({loading: false});
      }
    }
}