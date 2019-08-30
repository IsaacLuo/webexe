import * as React from 'react'

// react-redux-router
import { IStoreState, TaskDefinition } from '../../types'
import { withRouter, Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import {Button} from 'element-react'

import config from '../../config'

import {Menu} from 'element-react'
import styled from 'styled-components'

import pageLinks from '../../common/pageLinks'

const DashboardPanel = styled.div`
  width: 90%;
  display: flex;
  padding: 30px;
  justify-content: center;
`;

const DashboardItem = styled.div`
  border: solid 1px #777;
  border-radius: 25px;
  padding: 20px;
  margin: 20px;
  display:flex;
  flex-direction:column;
  justify-content:space-between;
`;

const DashboardItemTitle = styled.div`
  font-size: 2em;
  color: #44a;
`;

const RoundButton = styled(Button)`
  border-radius: 15px !important;
`

interface IProps {
  availableTasks: TaskDefinition[],
}
interface IState {
}
class Dashboard extends React.Component<IProps, IState> {
  public render () {
    
    const appBlocks = this.props.availableTasks.map(item => <DashboardItem key={item.name}>
          <DashboardItemTitle>{item.name}</DashboardItemTitle>
          <p>{item.description}</p>
          <Link to={`/task/${item.name}`}><RoundButton type="primary">start</RoundButton></Link>
        </DashboardItem>)
    return (
      <DashboardPanel>
        {appBlocks}
      </DashboardPanel>
    )
  }

  
}

const mapStateToProps = (state: IStoreState) => ({
  availableTasks: state.app.availableTasks,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({

})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Dashboard))