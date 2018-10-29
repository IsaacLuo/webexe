import expressWs from 'express-ws'
import * as childProcess from 'child_process'
import {runPython} from './runPython'
import {PythonShell} from 'python-shell'


export default function handleWebSockets(app) {
  const runningTask = {};
  const taskQueue = {};
  const currentTask = {};

  const ws = expressWs(app);

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

  function addTaskInQueue(taskProp:{taskName:string, taskId:string}, onAllowToRun:()=>void, onKeepWaiting:(queueLength:number)=>void){
    const {taskName, taskId} = taskProp;
    if (taskQueue[taskName] === undefined) {
      taskQueue[taskName] = [];
      runningTask[taskName] = 0;
    }
    console.log('==============taskQueue=====', taskQueue[taskName].length);
    taskQueue[taskName].push({taskId, onAllowToRun, onKeepWaiting});
    console.log('taskQueue=', taskQueue[taskName].length, ' running =', runningTask[taskName] );
    if (taskQueue[taskName].length === 1 && runningTask[taskName] === 0) {
      pickTaskAndRun(taskName);
    } else {
      onKeepWaiting(taskQueue[taskName].length);
    }
  }

  function pickTaskAndRun(taskName: string) {
    const queue = taskQueue[taskName];
    const len = queue.length;
    if (len > 0 ) {
      const task = queue.shift();
      currentTask[taskName] = task;
      task.onAllowToRun();
      for(let i=0;i<queue.length;i++) {
        queue[i].onKeepWaiting(i+1)
      }
    }
  }

  function abortTask(taskName: string, taskId: string) {
    if (taskQueue[taskName] === undefined) {
      return;
    }
    for (let i=0;i<taskQueue[taskName].length; i++) {
      if (taskQueue[taskName][i].taskId === taskId) {
        taskQueue[taskName].splice(i, 1);
        break;
      }
    }
    for (let i=0;i<taskQueue[taskName].length; i++) {
      taskQueue[taskName][i].onKeepWaiting(i+1);
    }
    if (currentTask[taskName].taskId === taskId) {
      currentTask[taskName].pyShell.terminate();
      pickTaskAndRun(taskName);
    }
  }

  function handleTask(taskName:string, script: string) {
    return async (ws, req) => {
      let params:any = null;
        ws.on('message', async raw => {
        const msg = JSON.parse(raw);
        switch (msg.type) {
          case 'requestToStart':
            const taskId = msg.data.taskId;
            addTaskInQueue({taskName, taskId:msg.data.taskId}, async () => {
              if (ws.readyState === 1) {
                console.log(`${taskName}:${taskId} start`);
                ws.json({type:'start'});
                // run python now
                runningTask[taskName]++;
                const pyShell = new PythonShell(script, {
                  parser: (data:string)=>JSON.parse(data),
                  pythonOptions: ['-u'],
                });
                currentTask[taskName].pyShell = pyShell;
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
                    ws.json(message);
                  } else {
                    console.error('ws diconnected, terminating');
                    pyShell.terminate();
                  }
                })
                pyShell.on('close', message=>{
                  console.log('finish', message);
                  runningTask[taskName]--;
                  // finish, pick another task to Run
                  pickTaskAndRun(taskName);
                })
                // await runPython(script, params,
                // obj => {
                //   console.log(obj);
                //   ws.json(obj);
                // }, errMsg => {
                //   console.log(errMsg);
                //   ws.json({type:'log', message: errMsg});
                // });
                // runningTask[taskName]--;
                // // finish, pick another task to Run
                // pickTaskAndRun(taskName);
              }
            }, (queueLength)=>{
              if (ws.readyState === 1) {
                ws.json({type:'queueing', message: `on hold, ${queueLength} ${queueLength===1?'task':'tasks'} in queue`});
              }
            });
            break;
          case 'params':
            params = msg;
            break;
          case 'abortTask':
            console.log(msg);
            abortTask(taskName, msg.data.taskId);
            break;
        }
      });
    }
  }


  /**
   * run mergeLightCycler python
   */
  app.ws('/api/ws/mergeLightCycler', verifyToken, handleTask('mergeLightCycler', './scripts/merge_light_cycler.py'));
  // app.ws('/api/ws/mergeLightCycler', verifyToken, function(ws, req) {

  //   ws.on('message', raw => {
  //     const msg = JSON.parse(raw);
  //     ws.json({finish:false, message:'accepted', ref: msg});

  //     // run python now
  //     runPython('./scripts/merge_light_cycler.py',
  //     raw+'\n',
  //     obj => {
  //       console.log(obj);
  //       ws.json(obj);
  //     }, errMsg => {
  //       console.log(errMsg);
  //       ws.json({type:'log', message: errMsg});
  //     });

  //   });
  // });

  /**
   * run test long task python
   */
  app.ws('/api/ws/testLongTask',verifyToken, 
    handleTask('testLongTask', './scripts/test_long_task.py')
  );
}