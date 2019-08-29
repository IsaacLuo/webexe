import { ICustomState} from './types';
import koa from 'koa';
import koaBody from 'koa-body';
import middleware from './middleware'
import Router from 'koa-router';
import log4js from 'log4js';
import cors from 'koa2-cors';
import taskDescriptions from './taskDescriptions'


const GUEST_ID = '000000000000000000000000';

const app = new koa();
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

router.get('/api/task/:taskName/description',
// userMust(beUser),
async (ctx:Ctx, next:Next)=> {
  if (taskDescriptions[ctx.params.taskName]) {
    ctx.body = taskDescriptions[ctx.params.taskName];
  } else {
    ctx.throw(404, 'no this task');
  }
});

router.post('/api/task/:taskName',
// userMust(beUser),
async (ctx:Ctx, next:Next)=> {
  if (taskDescriptions[ctx.params.taskName]) {
    ctx.body = taskDescriptions[ctx.params.taskName];
  } else {
    ctx.throw(404, 'no this task');
  }
});

// -----------------------------------------------------------------------------------------------

app.use(router.routes());
app.listen(8000, '0.0.0.0');
log4js.getLogger().info('webexe start listening at 8000');
