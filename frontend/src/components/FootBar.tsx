import * as React from 'react'

// react-redux-router
import { IStoreState } from '../types'
import { withRouter, Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import config from '../config'

import {Menu} from 'element-react'
import styled from 'styled-components'

const FootBarPanel = styled.footer`
  background-color:#324157;
  color:#fff;
  padding-top: 20px;
  padding-bottom: 20px;
`;


interface IProps {
}
interface IState {
}
class FootBar extends React.Component<IProps, IState> {
  public render () {
    return (
    <FootBarPanel>
      <p>{process.env.NODE_ENV} version 0.1.0</p>
      <p>{JSON.stringify(process.env)} {JSON.stringify(config)}</p>
    </FootBarPanel>
    )
  }

  
}

const mapStateToProps = (state: IStoreState) => ({

})

const mapDispatchToProps = (dispatch :Dispatch) => ({

})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(FootBar))
