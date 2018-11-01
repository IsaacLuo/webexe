import expressWs from 'express-ws'
import * as childProcess from 'child_process'
import {runPython} from './runPython'
import {PythonShell} from 'python-shell'

import {ITaskProp} from './types'
import WebSocket from 'ws'
import {IWSClient} from './types'


export default function handleWebSockets(app) {
  const allWebSockets:{[key:string]:IWSClient[]} = {};
  const runningTask:{[key:string]:number} = {};

  expressWs(app);

  function verifyToken(ws, req, next) {
    console.log(req.query.token);
    ws.json = obj=>{ws.send(JSON.stringify(obj))};
    if(req.query.token) {
      
      next();
    }
    else {
      ws.json({err:'no token'});
      ws.close();
    }
  }

  // function getQueueSize(taskName:string) {
  //   if (taskQueue[taskName] === undefined) {
  //     taskQueue[taskName] = [];
  //     runningTask[taskName] = 0;
  //   }
  //   return taskQueue[taskName].length + runningTask[taskName];
  // }

  function getQueueSize(taskName: string) {
    return allWebSockets[taskName].filter(x => x.status==='running' || x.status==='queueing').length;
  }

  function addTaskInQueue(wsClient: IWSClient,
                          taskId:string,
                          params:any,
                          onAllowToRun:(wsClient:IWSClient)=>void,
                          onKeepWaiting:(wsClient:IWSClient, queueLength:number)=>void
                          ) {
    wsClient.taskId = taskId;
    wsClient.params = params;
    wsClient.onAllowToRun = onAllowToRun;
    wsClient.onKeepWaiting = onKeepWaiting;
    wsClient.status = 'queueing';
    const {taskName} = wsClient;
    const queueSize = getQueueSize(wsClient.taskName);

    const clientIndex = allWebSockets[taskName].indexOf(wsClient);
    if(clientIndex>=0) {
      // move  this task to queue end
      allWebSockets[taskName].splice(clientIndex,1);
      allWebSockets[taskName].push(wsClient);
    }
    
    console.log('==============taskQueue==============', queueSize);
    allWebSockets[taskName].forEach(x=>console.log(x.taskId, x.status));
    console.log('=====================================');

    if (queueSize === 1) {
      onAllowToRun(wsClient);
    } else {
      onKeepWaiting(wsClient, queueSize-1);
    }
  }

  function pickTaskAndRun(taskName:string) {
    let queueSize = 0;
    const wsClients = allWebSockets[taskName];
    
    for (const wsClient of wsClients) {
      if (wsClient.status==='queueing') {
        if (queueSize === 0) {
          wsClient.onAllowToRun(wsClient);
        } else {
          wsClient.onKeepWaiting(wsClient, queueSize);
        }
        queueSize++;
      }
    }
    console.log('==============taskQueue==============', queueSize);
    allWebSockets[taskName].forEach(x=>console.log(x.taskId, x.status));
    console.log('=====================================',);
  }

  function abortTask(wsClient: IWSClient) {
    const wsClients = allWebSockets[wsClient.taskName];
    const idx = wsClients.indexOf(wsClient);
    wsClients.splice(idx, 1);
    if(wsClient.pyShell) {
      wsClient.pyShell.terminate();
    }
    // run task with same taskName
    pickTaskAndRun(wsClient.taskName);
  }

  function handleTask(taskName:string, script: string) {
    return async (ws, req) => {
      // save ws instance in array
      if(allWebSockets[taskName]=== undefined) {
        allWebSockets[taskName] = [];
      }
      const allWS = allWebSockets[taskName];
      const wsClient:IWSClient = {ws, taskName, status:'ready'};
      allWS.push(wsClient);
      const queueSize = getQueueSize(taskName);
      ws.json({type:'message', message:`ready, ${queueSize} ${queueSize===1?'task':'tasks'} in queue`});

      ws.on('message', async raw => {
      const msg = JSON.parse(raw);
      console.debug(msg);
      switch (msg.type) {
        case 'heartbeat':
          ws.json({type:'heartbeat'});
          break;
        case 'requestToStart':
          const {taskId, params} = msg.data;
          addTaskInQueue(wsClient, taskId, params, async (wsClient: IWSClient) => {
            if (ws.readyState === 1) {
              console.log(`${taskName}:${taskId} start`);
              ws.json({type:'start'});
              // run python now
              runningTask[taskName]++;
              const pyShell = new PythonShell(script, {
                parser: (data:string)=>JSON.parse(data),
                pythonOptions: ['-u'],
              });
              wsClient.pyShell = pyShell;
              pyShell.on('message', message=>{
                // console.log(message)
                if (ws.readyState === 1) {
                  ws.json(message);
                } else {
                  console.error('ws diconnected, terminating');
                  pyShell.terminate();
                }
              })
              pyShell.on('stderr', message=>{
                // console.log('stderr: ' + message);
                if (ws.readyState === 1) {
                  ws.json({'log':message});
                } else {
                  console.error('ws diconnected, terminating');
                  pyShell.terminate();
                }
              })
              pyShell.on('close', message=>{
                console.log('finish', message);
                wsClient.status = 'finish';
                ws.json({type:'finish'});
                runningTask[taskName]--;
                // finish, pick another task to Run
                pickTaskAndRun(taskName);
              })
              if(wsClient.params) {
                console.log('sending params', wsClient.params)
                pyShell.send(JSON.stringify(wsClient.params));
              }
            }
          }, (wsClient: IWSClient, queueLength:number)=>{
            if (ws.readyState === 1) {
              ws.json({type:'queueing', message: `on hold, ${queueLength} ${queueLength===1?'task':'tasks'} in queue`});
            }
          });
          break;
        case 'abortTask':
          abortTask(wsClient);
          break;
        }
      });
    }
  }
  /**
   * run mergeLightCycler python
   */
  app.ws('/api/ws/mergeLightCycler', verifyToken,
    handleTask('mergeLightCycler', './scripts/merge_light_cycler.py'));

  /**
   * run test long task python
   */
  app.ws('/api/ws/testLongTask',verifyToken, 
    handleTask('testLongTask', './scripts/test_long_task.py')
  );
}