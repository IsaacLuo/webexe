import expressWs from 'express-ws'
import * as childProcess from 'child_process'
import {runPython} from './runPython'
import {PythonShell} from 'python-shell'


export default function handleWebSockets(app) {
  const runningTask = {};
  const taskQueue = {};

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

  function addTaskInQueue(taskName: string, onAllowToRun:()=>void, onKeepWaiting:(queueLength:number)=>void){
    if (taskQueue[taskName] === undefined) {
      taskQueue[taskName] = [];
      runningTask[taskName] = 0;
    }
    console.log('==============taskQueue=====', taskQueue[taskName].length);
    taskQueue[taskName].push({onAllowToRun, onKeepWaiting});
    if (taskQueue[taskName].length === 1 && runningTask[taskName] === 0) {
      pickTaskAndRun(taskName);
    }
  }

  function pickTaskAndRun(taskName: string) {
    const queue = taskQueue[taskName];
    const len = queue.length;
    if (len > 0 ) {
      const task = queue.shift();
      task.onAllowToRun();
      for (const otherTask of queue) {
        otherTask.onKeepWaiting(len);
      }
    }
  }

  function handleTask(taskName:string, script: string) {
    return async (ws, req) => {
      let params:any = null;
        ws.on('message', async raw => {
        const msg = JSON.parse(raw);
        switch (msg.type) {
          case 'requestToStart':
            addTaskInQueue(taskName, async () => {
              if (ws.readyState === 1) {
                console.log(`${taskName} start`);
                ws.json({type:'start'});
                // run python now
                runningTask[taskName]++;
                const pyShell = new PythonShell(script, {
                  parser: (data:string)=>JSON.parse(data),
                  pythonOptions: ['-u'],
                });
                pyShell.on('message', message=>{
                  console.log({xxx: message})
                })
                pyShell.on('stderr', message=>{
                  console.log('stderr: ' + message);
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
                ws.json({type:'queueing', message: `queueing, ${queueLength} tasks in queue`});
              }
            });
            break;
          case 'params':
            params = msg;
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