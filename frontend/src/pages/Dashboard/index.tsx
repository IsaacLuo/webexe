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
}
interface IState {
}
class Dashboard extends React.Component<IProps, IState> {
  public render () {
    const appBlocks = pageLinks.map(item => <DashboardItem key={item.link}>
          <DashboardItemTitle>{item.title}</DashboardItemTitle>
          <p>{item.discription}</p>
          <Link to={item.link}><RoundButton type="primary">start</RoundButton></Link>
        </DashboardItem>)
    return (
      <DashboardPanel>
        {appBlocks}
      </DashboardPanel>
    )
  }

  
}

const mapStateToProps = (state: IStoreState) => ({

})

const mapDispatchToProps = (dispatch :Dispatch) => ({

})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Dashboard))