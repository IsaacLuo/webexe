import * as React from 'react'

// react-redux-router
import { IStoreState } from '../../types'
import { withRouter, Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import {Button} from 'element-react'

import config from '../../config'

import {Menu} from 'element-react'
import styled from 'styled-components'

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
`;

const DashboardItemTitle = styled.div`
  font-size: 2em;
  color: #44a;
`;

const RoundButton = styled(Button)`
  border-radius: 15px !important;
`

interface IProps {
}
interface IState {
}
class Dashboard extends React.Component<IProps, IState> {
  public render () {
    return (
      <DashboardPanel>
        <DashboardItem>
          <DashboardItemTitle>merge light cycler reports</DashboardItemTitle>
          <p>merge a light cycler report table into the plate map</p>
          <Link to="/tools/MergeLightCyclerReport"><RoundButton type="primary">start</RoundButton></Link>
        </DashboardItem>

        <DashboardItem>
          <DashboardItemTitle>test</DashboardItemTitle>
          <p>test a 60 seconds task</p>
          <Link to="/tools/TestLongTask"><RoundButton type="primary">start</RoundButton></Link>
        </DashboardItem>

      </DashboardPanel>
    )
  }

  
}

const mapStateToProps = (state: IStoreState) => ({

})

const mapDispatchToProps = (dispatch :Dispatch) => ({

})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Dashboard))