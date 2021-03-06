/// <reference path="@types/index.d.ts" />
// import { ICustomState, IProcessDict, IProcess} from './types';
import koa from 'koa';
import koaBody from 'koa-body';
import websockify from 'koa-websocket';
import middleware from './middleware'
import Router from 'koa-router';
import Route from 'koa-route';
import log4js from 'log4js';
import cors from 'koa2-cors';
import taskDescriptions from './taskDescriptions'
import uuid from 'uuid'
import { runExe } from './runExe';
import taskConf from './taskConf';
import conf from './conf.json';
import path from 'path';
import fs from 'fs';
import mimetype from 'mime-types';
import http from 'http';
import socket from 'socket.io';
import TaskDict from './TaskDict';
import cookie from 'cookie'
import cleanResult from './cleanResult';

const { promisify } = require('util');
const fs_exists = promisify(fs.exists);
const fsPromises = fs.promises;

require('dotenv').config();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// import redis from 'redis'

// let client = redis.createClient(6379, '127.0.0.1')
// client.on('error', function (err) {
//   console.log('Error ' + err);
// });

// 1 键值对
// client.set('color', 'red', redis.print);
// client.get('color', function(err, value) {
//   if (err) throw err;
//   console.log('Got: ' + value)
//   client.quit();
// })




// const redisClient = redis.createClient(6379, '127.0.0.1');
// redisClient.on('error', err => {
//   console.log('Error ' + err);
// });

declare global {
  namespace NodeJS {
    interface Global {
      taskDict: TaskDict;
    }
  }
}
// store all tasks in global, maybe redis in the future?
global.taskDict = new TaskDict();  

const app = websockify(new koa());
const router = new Router();

type Ctx = koa.ParameterizedContext<ICustomState>;
type Next = ()=>Promise<any>;

app.use(cors({credentials: true}));
app.use(koaBody({multipart:true}));
middleware(app);

function userMust (...args: Array<(ctx:koa.ParameterizedContext<any, {}>, next:()=>Promise<any>)=>boolean>) {
  const arg = arguments;
  return async (ctx:koa.ParameterizedContext<any, {}>, next:Next)=> {
    if (Array.prototype.some.call(arg, f=>f(ctx))) {
      await next();
    } else {
      ctx.throw(401);
    }
  };
}

function beUser (ctx:Ctx, next?:Next) {
  // console.log(ctx.state.user.groups);
  return conf.localMode || ctx.state.user && (ctx.state.user.groups.indexOf('webexe/users')>=0 || ctx.state.user.groups.indexOf('users')>=0);
  // return ctx.state.user!== undefined;
}

function beAnyOne (ctx:Ctx, next?:Next) {
  return ctx.state.user!== undefined;
}

function beAdmin (ctx:Ctx, next?:Next) {
  return ctx.state.user && (ctx.state.user.groups.indexOf('administrators')>=0 || ctx.state.user.groups.indexOf('webexe/administrators')>=0);
}

function beGuest (ctx:Ctx, next?:Next) {
  return ctx.state.user === undefined || ctx.state.user._id === '000000000000000000000000';
}

// -----------------------------------------------------------------------------------------------

router.get('/', async (ctx:Ctx)=> {
  ctx.body={message:'server: webexe'};
})

router.get('/api/user/current', async (ctx:Ctx, next:Next)=> {
  const user = ctx.state.user;
  ctx.body = {message:'OK', user,};
  if (user) {
    const now = Math.floor(Date.now() / 1000);
    const eta = ctx.state.user.exp - now;
    ctx.body.eta = eta;
  }
});

// -----------------------------------------------------------------------------------------------

router.get('/api/tasks/',
userMust(beUser),
async (ctx:Ctx, next:Next)=> {
  // const taskKeys = Object.keys(taskDescriptions);
  // ctx.body = taskKeys.map(key=>taskDescriptions[key]);
  ctx.body = taskDescriptions;
});


router.get('/api/task/:taskName/description',
userMust(beUser),
async (ctx:Ctx, next:Next)=> {
  if (taskDescriptions[ctx.params.taskName]) {
    ctx.body = taskDescriptions[ctx.params.taskName];
  } else {
    ctx.throw(404, 'no this task');
  }
});

router.post('/api/task/:taskName',
userMust(beUser),
async (ctx:Ctx, next:Next)=> {
  const taskName = ctx.params.taskName;
  if (!taskDescriptions[taskName]) {
    ctx.throw(404, 'no this task');
  }
  const {params, comments} = ctx.request.body;
  console.log('taskparams= ', params);
  let taskParams = [...taskConf[taskName].params];

  for(const optParamsKey in taskConf[taskName].optParams) {
    if (params[optParamsKey]) {
      taskParams = taskParams.concat(taskConf[taskName].optParams[optParamsKey]);
    }
  }

  for(const i in taskParams) {
    const p = taskParams[i];
    if(p[0] === '{' && p[p.length-1] === '}') {
      // console.log(p.substr(1,p.length-2), params[p.substr(1,p.length-2)])
      if (params[p.substr(1,p.length-2)] !== undefined) {
        // console.log(`${taskParams[i]} => ${params[p.substr(1,p.length-2)]}`);
        taskParams[i] = `${params[p.substr(1,p.length-2)]}`
      }
    }
  }
  console.log('taskParams', taskParams);

  let dataIn:any = undefined;
  if (taskConf[taskName].dataIn) {
    const taskDataInKeys = [...taskConf[taskName].dataIn];
    dataIn = {};
    for (const key of taskDataInKeys) {
      dataIn[key] = params[key];
    }
  }
  let processId = global.taskDict.initialTask(taskName, taskParams, comments, dataIn);

  ctx.body = {
    processId,
    taskName,
  }
  io.in(processId).emit('state', 'ready');
  next(); // do not await;
},
async (ctx:Ctx, next:Next)=> {
  // kill tasks last 1 hour or more
  global.taskDict.removeOldTasks();
  await next();
},
cleanResult,
);

// router.get('/api/process/:id/state',
// userMust(beUser),
// async (ctx:Ctx, next:Next)=> {
//   const processId = ctx.params.id;
//   const process = global.tasks[processId];
//   ctx.body = {state:process.state};
// }
// );

// router.get('/api/process/:id/result',
// userMust(beUser),
// async (ctx:Ctx, next:Next)=> {
//   const processId = ctx.params.id;
//   const process = global.tasks[processId];
//   if (process.state !== 'done') {
//     ctx.throw(404);
//   } else {
//     ctx.body = {result: process.result};
//   }
// });

// router.delete('/api/process/:id',
// userMust(beUser),
// async (ctx:Ctx, next:Next)=> {
//   const processId = ctx.params.id;
//   const process = global.tasks[processId];
//   // terminate process
//   if(process.subProcessInst) {
//     process.subProcessInst.kill();
//   }
//   sendToAllClient(processId, {type:'signal', message:'process aborted'});
//   process.webSockets.forEach(ws => {
//     if (ws.readyState === ws.OPEN) {
//       ws.close();
//     }
//   });
  
//   delete global.tasks[processId];
// });

router.post('/api/fileParam/',
userMust(beUser),
async (ctx:Ctx, next:Next)=> {
  if (ctx.request.files === undefined) {
    ctx.throw(404, 'no files');
  }
  const {file} = ctx.request.files;
  const reader = fs.createReadStream(file.path);
  const now = new Date();
  const todayStr = `${now.getFullYear()}_${now.getMonth()}_${now.getDate()}_${now.getHours()}_${now.getMinutes()}_${now.getSeconds()}`
  const exists = await fs_exists(`${conf.attachmentPath}`);
  if (!exists) {
    await fsPromises.mkdir(`${conf.attachmentPath}`, { recursive: true })
  }
  const filePath = `${conf.attachmentPath}/${todayStr}_${Math.random().toString(36).substring(2)}_${file.name}`;
  
  const upStream = fs.createWriteStream(filePath);
  reader.pipe(upStream);
  ctx.body = {filePath,};
});

router.get('/api/resultFile/:fileName/as/:desiredName',
userMust(beUser),
async (ctx:Ctx, next:Next)=> {
  const {fileName, desiredName} = ctx.params;
  if (await fs_exists(`results/${fileName}`)) {
    const mimeType = mimetype.lookup(fileName) || 'application/octet-stream';
    ctx.set('Content-disposition', 'attachment; filename=' + desiredName);
    ctx.set('Content-type', mimeType);
    ctx.body = fs.createReadStream(`results/${fileName}`);
  } else {
    ctx.throw(404, 'no such result file');
  }
  next();
},
);


// ----------------------------------socket.io part----------------------------------------------
const server = http.createServer(app.callback());
const io = socket(server);

io.on('connection', async (socket)=>{
  console.log('connected /tasks');
  socket.on('startTask', async (id, callback)=>{
    console.log('startTask', id);
    socket.join(id);
    const task = global.taskDict.getTask(id);
    if(!task) {
      socket.disconnect();
      return;
    }

    task.state = 'running';
    task.startedAt = new Date();
    io.in(id).emit('state', task.state);
    io.of('/taskMonitor').emit('taskUpdate', task);
    try {
      const result = await runExe( //===================== run exe here
            task,
            task.dataIn,
            (outputObj) => {
              io.in(id).emit(outputObj.type, outputObj.data);
              if(outputObj.message) {
                io.in(id).emit('stderr', outputObj.message);
              }
            },
            (errMsg)=>{
              io.in(id).emit('stderr', errMsg);
              
            }
          );
      task.state = 'done';
      task.doneAt = new Date();
      io.in(id).emit('progress', 100);
      io.in(id).emit('state', task.state);

      io.of('/taskMonitor').emit('taskUpdate', task);
      callback(result);
    } catch (err) {
      task.state = 'aborted';
      io.in(id).emit('abort', task.state);
    }
    socket.disconnect();
  });

  socket.on('abort', async(processId)=>{
    const task = global.taskDict.getTask(processId);
    if(!task) {
      socket.disconnect();
      return;
    }
    task.state='aborted';
    io.of('/taskMonitor').emit('taskUpdate', task);
    socket.leave(processId);
  })

  socket.on('disconnect', async (reason)=>{
    console.log('socket disconnected');
  });

  socket.on('attachProcess', async (processId)=>{
    socket.join(processId);
  });

})

io.of('/taskMonitor').on('connection', async (socket)=>{
  socket.on('getTasks', async (callback)=>{
    const tasks = global.taskDict.getAllTasks();
    callback(tasks);
  });

  socket.on('attachProcess', async (processId)=>{
    socket.join(processId);
  });

})

// -----------------------------------------------------------------------------------------------


app.use(router.routes());

console.log('process.env.PORT = ', process.env.PORT);
server.listen(process.env.PORT);
log4js.getLogger().info(`webexe start listening at ${process.env.PORT}`);
