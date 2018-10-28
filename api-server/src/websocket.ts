import expressWs from 'express-ws'
import * as childProcess from 'child_process'
import {runPython} from './runPython'


export default function handleWebSockets(app) {
  const runningPythonTask = {};

  const ws = expressWs(app);

  function ableToRunTask(taskName: string, limit:number = 1) {
    return (ws, req, next) => {
      if (runningPythonTask[taskName] === undefined) {
        runningPythonTask[taskName] = 0;
      }
      if (runningPythonTask[taskName] === 0) {
        next();
      } else {
        console.log('already running '+ taskName);
        ws.send(JSON.stringify({type:'rejected', message:`another ${taskName} task is running, please try again later`}));
        ws.close();
      }
    }
  }

  function verifyToken(ws, req, next) {
    console.log(req.query.token);
    ws.json = obj=>{ws.send(JSON.stringify(obj))};
    if(req.query.token) {
      ws.json({prompt:'>>>'});
      next();
    }
    else {
      ws.json({err:'no token'});
      ws.close();
    }
  }

  /**
   * run mergeLightCycler python
   */
  app.ws('/api/ws/mergeLightCycler',ableToRunTask('mergeLightCycler'), verifyToken, function(ws, req) {

    ws.on('message', raw => {
      const msg = JSON.parse(raw);
      ws.json({finish:false, message:'accepted', ref: msg});

      // run python now
      runPython('./scripts/merge_light_cycler.py',
      raw+'\n',
      obj => {
        console.log(obj);
        ws.json(obj);
      }, errMsg => {
        console.log(errMsg);
        ws.json({type:'log', message: errMsg});
      });

    });
  });

  /**
   * run test long task python
   */
  app.ws('/api/ws/testLongTask', ableToRunTask('testLongTask'), verifyToken, async (ws, req) => {
    
      ws.on('message', async raw => {
        const msg = JSON.parse(raw);
        ws.json({finish:false, message:'accepted', ref: msg});

        // run python now
        runningPythonTask['testLongTask']++;
        await runPython('./scripts/test_long_task.py', null,
        obj => {
          console.log(obj);
          ws.json(obj);
        }, errMsg => {
          console.log(errMsg);
          ws.json({type:'log', message: errMsg});
        });
        runningPythonTask['testLongTask']--;
      });
  });
}