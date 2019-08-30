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

type Ctx = koa.ParameterizedContext<ICustomState, {}>;
type Next = ()=>Promise<any>;

app.use(cors({credentials: true}));
app.use(koaBody());
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
  const taskKeys = Object.keys(taskDescriptions);
  ctx.body = taskKeys.map(key=>taskDescriptions[key]);
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
  if (taskDescriptions[taskName]) {
    ctx.body = taskDescriptions[taskName];
  } else {
    ctx.throw(404, 'no this task');
  }
  let processId;
  do {
    processId = uuid.v4();
  } while(global.tasks[processId]!==undefined);
  // redisClient.sadd(taskName, taskId);
  // redisClient.hmset(taskId, {
  //   state: 'running',
  // });
  
  global.tasks[processId] = {
    processId,
    program: taskConf[taskName],
    params: taskConf[taskName],
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
      sendToAllClient(processId, {type:'singnal', message:'timeout'});
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
}
);

//====================== websocket =======================

app.ws.use(Route.all('/ws/test', (ctx)=>{
  ctx.websocket.send('test');
  ctx.websocket.on('message', function (message) {
    // 返回给前端的数据
    ctx.websocket.send(message)
})
}));

const process:IProcess = {
  processId: '123',
  program: taskConf['test'].program,
  params: taskConf['test'].params,
  taskName: 'test',
  state: 'ready',
  webSockets:new Set(),
  result: undefined,
}
global.tasks['123'] = process;

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
      ctx.websocket.send(JSON.stringify({type:'singnal', message:`socket open for task ${process.taskName}`}));
    } else {
      console.debug('no process');
      ctx.websocket.send(JSON.stringify({type:'singnal', message:'process does not exist'}));
      ctx.websocket.close();
    }
    if (process.state === 'done') {
      ctx.websocket.send(JSON.stringify({type:'singnal', message:'process already done'}));
      ctx.websocket.send(JSON.stringify({type:'processState', message:'done'}));
      ctx.websocket.close();
    } else if (process.state === 'error') {
      ctx.websocket.send(JSON.stringify({type:'singnal', message:'process exited with an error'}));
      ctx.websocket.send(JSON.stringify({type:'processState', message:'error'}));
      ctx.websocket.close();
    } else if (process.state === 'running') {
      ctx.websocket.send(JSON.stringify({type:'singnal', message:'attached to socket'}));
      ctx.websocket.send(JSON.stringify({type:'processState', message:'running'}));
      process.webSockets.add(ctx.websocket);
    } else {
      process.webSockets.add(ctx.websocket);
      // run task
      try {
        process.state = 'running';
        sendToAllClient(id, {type:'processState', message:'running'});
        process.startedAt = new Date();
        const result = await runExe(
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
          }
        );
        process.state = 'done';
        process.doneAt = new Date();
        sendToAllClient(id, {type:'processState', message:'done'});
        ctx.websocket.close();
        process.webSockets.forEach(ws => {if (ws.readyState === ws.CLOSED) process.webSockets.delete(ws)});
      } catch (err) {
        process.state = 'error';
        sendToAllClient(id, {type:'processState', message:'error'});
        ctx.websocket.close();
        process.doneAt = new Date();
      }
    }
}))



// -----------------------------------------------------------------------------------------------

app.use(router.routes());
app.listen(8000, '0.0.0.0');
log4js.getLogger().info('webexe start listening at 8000');
