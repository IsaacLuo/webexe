import * as React from 'react'
import styled from 'styled-components'
import {Progress} from 'element-react'

const Panel = styled.div`
  width:800px;
  padding:50px;
  display:flex;
  flex-direction: column;
  align-items: center;
`;

interface IProps {
  progress: number
  message: string
}

class ProgressMonitorPanel extends React.Component<IProps, any> {
  public render () {
    const {progress, message} = this.props;
    return (
      <Panel>
        <div style={{margin:10, width:400}}>
          <Progress 
            strokeWidth={20}
            status={progress === 100 ? "success": undefined} percentage={progress} 
            textInside={true}
            />
        </div>
        {message}
      </Panel>
    )
  }
}

export default ProgressMonitorPanel
