import * as React from 'react'

// react-redux-router
import { IStoreState } from '../../types'
import { withRouter, Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import {Menu, Button} from 'element-react'
import styled from 'styled-components';
import { LOG_OUT, GET_AVAILABLE_TASKS } from 'actions'

const PortraitImg = styled.img`
  margin:5px;
  margin-right:15px;
  border-radius: 50px;
  border: solid 1px #77f;
  display:inline-block;
  width:50px;
`;

interface IProps {
  loggedIn: boolean;
  getAllTasks: ()=>void;
  logout: () => void;
}
interface IState {
}
class NavBar extends React.Component<IProps, IState> {
  public render () {
    return (
    <header>
      <Menu theme="dark" defaultActive="1" mode="horizontal">
        {this.props.loggedIn && <Menu.Item index="1"><PortraitImg src='https://api.auth.cailab.org/api/user/current/portrait/s/profile.jpg'/></Menu.Item>}
        
        <Link to='/'><Menu.Item index="2">Home</Menu.Item></Link>
        <Menu.SubMenu index="2" title="other links">
          <a href='http://res.cailab.org/svg/assemble_chromosome/'><Menu.Item index="3.1">svg_asm</Menu.Item></a>
          <a href='http://lims.cailab.org/'><Menu.Item index="3.2">lims</Menu.Item></a>
          <a href='http://wiki.cailab.org/'><Menu.Item index="3.3">wiki</Menu.Item></a>
          <a href='http://yeastfab.cailab.org/'><Menu.Item index="3.4">yeastfab</Menu.Item></a>
        </Menu.SubMenu>
        <Menu.Item index="2">
        {
          !this.props.loggedIn ?
          <Button type='primary' onClick={this.onClickLogin}>login</Button>
          :
          <Button type='text' onClick={this.onClickLogout}>logout</Button>
        }
        </Menu.Item>
      </Menu>
    </header>
    )
  }

    private onClickLogout = (evnet: any) => {
    this.props.logout();
    // this.props.history.push('/');
    window.location.href = '/';
  }

  private onClickLogin = (event: any) => {
    const width = 400;
    const height = 600;
    const top = (window.screen.availHeight / 2) - (height / 2);
    const left = (window.screen.availWidth / 2) - (width / 2);

    window.addEventListener('message', this.onLogginWindowClosed, false);
    const subWindow = window.open(
      'https://auth.cailab.org/login',
      'cailablogin',
// tslint:disable-next-line: max-line-length
      `toolbar=no,location=no,status=no,menubar=no,scrollbar=yes,resizable=yes,width=${width},height=${height},top=${top},left=${left}`,
    );
  }

  private onLogginWindowClosed = (messageEvent: MessageEvent) => {
    const {origin, data} = messageEvent;
    if (data.event === 'closed' && data.success === true) {
      console.log('login');
      this.props.getAllTasks();
    }
    window.removeEventListener('message', this.onLogginWindowClosed);
  }
  
}

const mapStateToProps = (state: IStoreState) => ({
  loggedIn: state.app.loggedIn,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  logout: () => dispatch({type: LOG_OUT}),
  getAllTasks: () => dispatch({type: GET_AVAILABLE_TASKS}),
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(NavBar))
