import * as React from 'react'

// react-redux-router
import { IStoreState } from '../../types'
import { withRouter, Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import config from '../../config'

import {Menu} from 'element-react'


interface IProps {
}
interface IState {
}
class NavBar extends React.Component<IProps, IState> {
  public render () {
    return (
    <header>
      <Menu theme="dark" defaultActive="1" mode="horizontal">
        <Link to='/'><Menu.Item index="1">Home</Menu.Item></Link>
        <Menu.SubMenu index="2" title="tools">
          <Link to='/tools/MergeLightCyclerReport'><Menu.Item index="2-1">Merge Light Cycler Report</Menu.Item></Link>
        </Menu.SubMenu>
      </Menu>
    </header>
    )
  }

  
}

const mapStateToProps = (state: IStoreState) => ({

})

const mapDispatchToProps = (dispatch :Dispatch) => ({

})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(NavBar))
