
import React, { useEffect } from 'react';
import styled from 'styled-components';
// import { useMappedState, useDispatch } from 'redux-react-hook';
import conf from 'conf.json';
import io from 'socket.io-client'

let socket;

const MainPage = () => {
  if (!socket) {
    socket = io(conf.backendURL+'/taskMonitor');
  }
  socket.on('clients', (v:any)=>console.log(v))
  return <div>hello</div>
}

export default MainPage;