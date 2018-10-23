import express from 'express'
import {Response, NextFunction} from 'express'
import cors from 'cors'
import * as bodyParser from 'body-parser'
import multer from 'multer'
import * as childProcess from 'child_process'
import expressWs from 'express-ws'



var upload = multer();

interface Request extends express.Request {
  isLoggedIn: boolean,
  files: any[],
}

interface ExpressWS extends express.Express {
  ws?: any
}

// express instance
const app:ExpressWS = express()

const ws = expressWs(app);

// allow cors call
app.use(cors())

// set max body size
app.use(bodyParser.json({ type: 'application/json' , limit:'10MB'}))

// disable cache
app.use((req :Request, res :Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`)
  res.set('Cache-Control', 'public, max-age=1');
  next();
});

// check user login information
app.use((req :Request, res :Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  // if (.....)
  req.isLoggedIn = true;
  next();
})

// middleware to check if user is logged in
function userMustLoggedIn (req :Request, res :Response, next: NextFunction) {
  if (req.isLoggedIn) {
    console.log('user looged in');
    next();
  } else {
    res.status(401).json({message: 'require log in'})
  }
}

// ============================API============================================
app.get('/api/message', userMustLoggedIn, (req :Request, res: Response) => {
  res.json({message:'hello from server'});
});

function verifyToken(ws, req, next) {
  console.log(req.query.token);
  ws.json = obj=>{ws.send(JSON.stringify(obj))};
  if(req.query.token) {
    ws.json({prompt:'>>>'});
    next();
  }
  else {
    ws.json({err:'no token'})
    ws.close();
  }
}

app.ws('/api/mergeLightCycler', verifyToken, function(ws, req) {
  ws.on('message', raw => {
    const msg = JSON.parse(raw);
    ws.json({finish:false, message:'accepted', ref: msg});
    
    const process = childProcess.spawn('python', ['./scripts/merge_light_cycler.py']);
    process.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
      ws.json({finish:false, message:`${data}`})
    });
  
    process.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    });
  
    process.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
      ws.json({finish:true, code});
      ws.close();
    });
  });
});

// ============================static files===================================
app.use('/public', express.static('public'));

// ----------------------------------------------------------------------------
app.listen(8000, (err) => {
  console.log('api server on 8000');
  if (err) console.log(err);
})