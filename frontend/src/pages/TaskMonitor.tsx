
import React, { useEffect } from 'react';
import styled from 'styled-components';
// import { useMappedState, useDispatch } from 'redux-react-hook';
import conf from 'conf.json';
import io from 'socket.io-client'



const TaskMonitor = () => {
  let socket;
  useEffect(()=>{
    socket = io(conf.backendURL+'/taskMonitor');
    socket.emit('getTasks', (v:any)=>console.log(v));
    socket.on('taskUpdate', (v:any)=>console.log(v));
    
  },[]);

  return <div>hello</div>
}

export default TaskMonitor;