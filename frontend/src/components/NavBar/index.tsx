import * as React from 'react'

// react-redux-router
import { IStoreState } from '../../types'
import { withRouter, Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import config from '../../config'

import {Menu} from 'element-react'
import pageLinks from '../../common/pageLinks'


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
          {pageLinks.map(item=><Link to={item.link} key={item.link}><Menu.Item index={item.link}>{item.title}</Menu.Item></Link>)}
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
