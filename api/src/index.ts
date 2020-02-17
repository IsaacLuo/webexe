import { ICustomState, IProcessDict, IProcess} from './types';
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
import conf from '../conf';
import path from 'path';
import fs from 'fs';
import mimetype from 'mime-types';
import http from 'http';
import socket from 'socket.io';

const { promisify } = require('util');
const fs_exists = promisify(fs.exists);
const fs_mkdir = promisify(fs.mkdir);

// import redis from 'redis'




// const redisClient = redis.createClient(6379, '127.0.0.1');
// redisClient.on('error', err => {
//   console.log('Error ' + err);
// });

declare global {
  namespace NodeJS {
    interface Global {
      tasks: IProcessDict;
    }
  }
}
// store all tasks in global, maybe redis in the future?
global.tasks = {};  

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
  return ctx.state.user && (ctx.state.user.groups.indexOf('webexe/users')>=0 || ctx.state.user.groups.indexOf('users')>=0);
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
  const {params} = ctx.request.body;
  console.log(params);
  const taskParams = [...taskConf[taskName].params];
  for(const i in taskParams) {
    const p = taskParams[i];
    if(p[0] === '{' && p[p.length-1] === '}') {
      // console.log(p.substr(1,p.length-2), params[p.substr(1,p.length-2)])
      if (params[p.substr(1,p.length-2)]) {
        // console.log(`${taskParams[i]} => ${params[p.substr(1,p.length-2)]}`);
        taskParams[i] = `${params[p.substr(1,p.length-2)]}`
      }
    }
  }
  console.log('taskParams', taskParams);
  let processId;
  do {
    processId = uuid.v4();
  } while(global.tasks[processId]!==undefined);
  
  global.tasks[processId] = {
    processId,
    program: taskConf[taskName].program,
    params: taskParams,
    taskName,
    state: 'ready',
    webSockets:new Set(),
    result: undefined,
    createdAt: new Date(),
  }

  ctx.body = {
    processId,
    taskName,
  }

  next();

},
async (ctx:Ctx, next:Next)=> {
  // kill tasks last 1 hour or more
  const processIds = Object.keys(global.tasks);
  processIds.forEach(processId => {
    const process = global.tasks[processId];
    if (process && process.createdAt && process.createdAt.getTime() < Date.now() - 3600000) {
      sendToAllClient(processId, {type:'', message:'timeout'});
      process.webSockets.forEach(ws => {
        if (ws.readyState === ws.OPEN) {
          ws.close();
        }
      });
      delete global.tasks[processId];
    }
  });
}
);

router.get('/api/processes/',
async (ctx:Ctx, next:Next)=> {
  ctx.body = global.tasks;
}
);

router.get('/api/process/:id/state',
userMust(beUser),
async (ctx:Ctx, next:Next)=> {
  const processId = ctx.params.id;
  const process = global.tasks[processId];
  ctx.body = {state:process.state};
}
);

router.get('/api/process/:id/result',
userMust(beUser),
async (ctx:Ctx, next:Next)=> {
  const processId = ctx.params.id;
  const process = global.tasks[processId];
  if (process.state !== 'done') {
    ctx.throw(404);
  } else {
    ctx.body = {result: process.result};
  }
});

router.delete('/api/process/:id',
userMust(beUser),
async (ctx:Ctx, next:Next)=> {
  const processId = ctx.params.id;
  const process = global.tasks[processId];
  // terminate process
  if(process.subProcessInst) {
    process.subProcessInst.kill();
  }
  sendToAllClient(processId, {type:'signal', message:'process aborted'});
  process.webSockets.forEach(ws => {
    if (ws.readyState === ws.OPEN) {
      ws.close();
    }
  });
  
  delete global.tasks[processId];
});

router.post('/api/fileParam/',
userMust(beUser),
async (ctx:Ctx, next:Next)=> {
  if (ctx.request.files === undefined) {
    ctx.throw(404, 'no files');
  }
  const {file} = ctx.request.files;
  const reader = fs.createReadStream(file.path);
  const now = new Date();
  const todayStr = `${now.getFullYear()}_${now.getMonth()}_${now.getDate()}`
  const exists = await fs_exists(`${conf.attachmentPath}/${todayStr}`);
  const filePath = `${conf.attachmentPath}/${todayStr}/${Math.random().toString(36).substring(2)}_${file.name}`;
  if (!exists) {
    await fs_mkdir(`${conf.attachmentPath}/${todayStr}`);
  }
  const upStream = fs.createWriteStream(filePath);
  reader.pipe(upStream);
  ctx.body = {filePath,};
});

// router.get(/api\/fileParam\/(.+)\/as\/(.+)/,
// userMust(beUser),
// async (ctx:Ctx, next:Next)=> {
//   const match = /api\/fileParam\/(.+)\/as\/(.+)/.exec(ctx.request.url);
//   const filePath = match[1];
//   const rename = match[2];
//   if (await fs_exists(filePath)) {

//   }
//   ctx.body = {message:match};
// });

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
  
});

//====================== websocket =======================

function sendToAllClient(processId:string, object:any) {
  const process = global.tasks[processId];
  process.webSockets.forEach(ws => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(object));
    }
  })
}

app.ws.use(Route.all('/ws/process/:id', async (ctx, id:string)=>{
  console.debug('processid=', id);
  const process = global.tasks[id];
    if (process){
      ctx.websocket.send(JSON.stringify({type:'signal', message:`socket open for task ${process.taskName}`}));
    } else {
      console.debug('no process');
      ctx.websocket.send(JSON.stringify({type:'signal', message:'process does not exist'}));
      ctx.websocket.close();
    }
    if (process.state === 'done') {
      ctx.websocket.send(JSON.stringify({type:'signal', message:'process already done'}));
      ctx.websocket.send(JSON.stringify({type:'processState', message:'done'}));
      ctx.websocket.close();
    } else if (process.state === 'error') {
      ctx.websocket.send(JSON.stringify({type:'signal', message:'process exited with an error'}));
      ctx.websocket.send(JSON.stringify({type:'processState', message:'error'}));
      ctx.websocket.close();
    } else if (process.state === 'running') {
      ctx.websocket.send(JSON.stringify({type:'signal', message:'attached to socket'}));
      ctx.websocket.send(JSON.stringify({type:'processState', message:'running'}));
      process.webSockets.add(ctx.websocket as any);
    } else {
      process.webSockets.add(ctx.websocket as any);
      // run task
      try {
        process.state = 'running';
        sendToAllClient(id, {type:'processState', message:'running'});
        process.startedAt = new Date();

        const result = await runExe( //===================== run exe here
          process,
          null,
          (outputObj) => {
            if (outputObj && outputObj.type) {
              process.result = outputObj.data;
            }
            let count = 0;
            process.webSockets.forEach(ws => {
              if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify(outputObj));
                count++;
              }
            })
            console.debug(`sent to ${count} client`);
          },
          (errMsg)=>{
            sendToAllClient(id, {type:'log', message:errMsg});
            console.error(errMsg);
            
          },
          (subProcessInst)=>{
            process.subProcessInst = subProcessInst;
          }
        );
        process.state = 'done';
        process.doneAt = new Date();
        sendToAllClient(id, {type:'processState', message:'done'});
        process.webSockets.forEach(ws => {if (ws.readyState === ws.OPEN) ws.close()});
        process.webSockets.forEach(ws => {if (ws.readyState === ws.CLOSED) process.webSockets.delete(ws)});
      } catch (err) {
        process.state = 'error';
        console.error(err);
        sendToAllClient(id, {type:'processState', message:'error'});
        ctx.websocket.close();
        process.doneAt = new Date();
      }
    }
}))


// ----------------------------------socket.io part----------------------------------------------
const server = http.createServer(app.callback());
const io = socket(server);



// -----------------------------------------------------------------------------------------------

app.use(router.routes());
// app.listen(conf.port, '0.0.0.0');
server.listen(conf.port);

log4js.getLogger().info(`webexe start listening at ${conf.port}`);
