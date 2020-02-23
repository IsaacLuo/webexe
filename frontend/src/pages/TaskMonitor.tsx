
import React, { useEffect, useState, useReducer } from 'react';
import { withRouter, Link } from 'react-router-dom'
import styled from 'styled-components';
// import { useMappedState, useDispatch } from 'redux-react-hook';
import conf from 'conf.json';
import io from 'socket.io-client'

function reducer(state, action) {
  switch (action.type) {
    case 'taskUpdate':
      const task = action.data;
      return {...state, taskDict:{...state.taskDict, [task.processId]:task}};
    default:
      throw new Error();
  }
}

const TaskMonitor = () => {
  let socket;
  const [state, dispatch] = useReducer(reducer, {taskDict:{}}, v=>v);

  const onTaskUpdate = (v:any)=>{
    dispatch({type:'taskUpdate', data:v})
  }

  useEffect(()=>{
    console.log('taskMonitor created');
    socket = io(conf.backendURL+'/taskMonitor');
    socket.emit('getTasks', (v:any)=>console.log(v));
    socket.on('taskUpdate', onTaskUpdate);
  },[]);

  return <div>
    {Object.keys(state.taskDict).map((processId,i)=>
    <div key={i}>
      {processId} {state.taskDict[processId].taskName} {state.taskDict[processId].state} {state.taskDict[processId].createdAt} {state.taskDict[processId].startedAt}
    </div>)}
  </div>
}

export default withRouter(TaskMonitor);