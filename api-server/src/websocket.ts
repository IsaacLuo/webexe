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
  const taskManagerWebSockets = new Set<WebSocket>();
  // const serverId = Math.random().toString(36).substr(2);
  const serverId = 'C';
  let globalClientId = 0;

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

  function broadcastTaskStatus() {
    const re:any = {
      type:'tasks',
      data:{
        tasks: {},
      }
    }
    for(const taskName in allWebSockets) {
      re.data.tasks[taskName] = allWebSockets[taskName].map(
        (x:IWSClient) => ({
          type: x.taskName,
          id: x.clientId,
          status: x.status,
          wsState: x.ws.readyState,
        })
      )
    }

    // console.log('==============taskQueue==============', queueSize);
    // allWebSockets[taskName].forEach(x=>console.log(x.clientId, x.status));
    // console.log('=====================================');

    taskManagerWebSockets.forEach(ws => {
      if(ws.readyState === 1) {
        ws.send(JSON.stringify(re));
      } else if (ws.readyState === 3) {
        taskManagerWebSockets.delete(ws);
      }
    });
  }

  function getQueueSize(taskName: string) {
    return allWebSockets[taskName].filter(x => x.status==='running' || x.status==='queueing').length;
  }

  function addTaskInQueue(wsClient: IWSClient,
                          clientId:string,
                          params:any,
                          onAllowToRun:(wsClient:IWSClient)=>void,
                          onKeepWaiting:(wsClient:IWSClient, queueLength:number)=>void
                          ) {
    wsClient.clientId = clientId;
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

    if (queueSize === 1) {
      wsClient.status = 'running';
      onAllowToRun(wsClient);
    } else {
      onKeepWaiting(wsClient, queueSize-1);
    }
    broadcastTaskStatus();
  }

  function pickTaskAndRun(taskName:string) {
    let queueSize = 0;
    const wsClients = allWebSockets[taskName];
    
    for (const wsClient of wsClients) {
      if (wsClient.status==='queueing') {
        if (queueSize === 0) {
          wsClient.status= 'running';
          wsClient.onAllowToRun(wsClient);
        } else {
          wsClient.onKeepWaiting(wsClient, queueSize);
        }
        queueSize++;
      }
    }
    broadcastTaskStatus();
  }

  function handleTask(taskName:string, script: string) {
    return async (ws, req) => {
      // save ws instance in array
      if(allWebSockets[taskName]=== undefined) {
        allWebSockets[taskName] = [];
      }
      const allWS = allWebSockets[taskName];
      const clientId = `${serverId}${globalClientId++}`;
      const wsClient:IWSClient = {ws, taskName, clientId, status:'ready'};

      allWS.push(wsClient);
      const queueSize = getQueueSize(taskName);
      ws.json({type:'initialize', data: {taskName, clientId, status:'ready'}});
      ws.json({type:'message', message:`ready, ${queueSize} ${queueSize===1?'task':'tasks'} in queue`});
      broadcastTaskStatus();
      ws.on('message', async raw => {
      const msg = JSON.parse(raw);
      console.debug(msg);
      switch (msg.type) {
        case 'heartbeat':
          ws.json({type:'heartbeat'});
          break;
        case 'requestToStart':
          const {clientId, params} = msg.data;
          addTaskInQueue(wsClient, clientId, params,
            // allowToRun
            async (wsClient: IWSClient) => {
              if (ws.readyState === 1) {
                console.log(`${taskName}:${clientId} start`);
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
                pyShell.on('close', ()=> {
                  if (wsClient.status === 'running') {
                    console.log('finish');
                    wsClient.status = 'finish';
                    ws.json({type:'finish'});
                  }
                  runningTask[taskName]--;
                  // finish, pick another task to Run
                  pickTaskAndRun(taskName);
                })
                if(wsClient.params) {
                  console.log('sending params', wsClient.params)
                  pyShell.send(JSON.stringify(wsClient.params));
                }
              }
            }, 
          // onKeepWaiting
          (wsClient: IWSClient, queueLength:number)=>{
            if (ws.readyState === 1) {
              ws.json({type:'queueing', message: `on hold, ${queueLength} ${queueLength===1?'task':'tasks'} in queue`});
            }
          });
          break;
        case 'abortTask':
          if(wsClient.status === 'running' || wsClient.status === 'queueing') {
            if(wsClient.pyShell) {
              wsClient.pyShell.terminate();
            } 
            wsClient.status = 'aborted';
            pickTaskAndRun(wsClient.taskName);
          }
          break;
        }
      });

      ws.on('close', () => {
        allWS.splice(allWS.indexOf(ws), 1);
        broadcastTaskStatus();
      })
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



  /**
   * receive task status in task manager
   */
  app.ws('/api/ws/taskManager',verifyToken, 
    async (ws, req) => {
      console.log('/api/ws/taskManager')
      taskManagerWebSockets.add(ws);
      ws.json({type:'heartbeat'});
      ws.on('open', raw => {
        broadcastTaskStatus();
      });
      // save ws instance in array
      ws.on('message', async raw => {
        const msg = JSON.parse(raw);
        switch (msg.type) {
          case 'heartbeat':
            broadcastTaskStatus();
            break;
        }
      });

      ws.on('close', (code:number, reason:string)=>{
        taskManagerWebSockets.delete(ws);
      });
    }
  );
}