import express from 'express'
import {Response, NextFunction} from 'express'
import cors from 'cors'
import * as bodyParser from 'body-parser'
import multer from 'multer'
import * as childProcess from 'child_process'
import expressWs from 'express-ws'
import fs from 'fs'
import path from 'path'
import {runPython} from './runPython'

console.log(process.env.NODE_ENV)
const conf = process.env.NODE_ENV === 'production' ? 
  require('../config.dev.json') :
  require('../config.dev.json')

const tempPath = path.resolve(conf.tempPath);
if (!fs.existsSync(tempPath)) {
  fs.mkdir(tempPath, { recursive: true }, (err) => {
    console.log('created folder '+tempPath);
  });
}



const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempPath)
  },
  filename: (req, file, cb) => {
    console.log(file)
    file.originalname.split('.')
    cb(null, `${Date.now()}-${Math.random().toString(36).substring(2)}.${file.originalname}` )
  }
})
const uploadToDisk = multer({ storage: storage })

interface Request extends express.Request {
  isLoggedIn: boolean,
  file: any,
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
app.all('/api/test', userMustLoggedIn, (req :Request, res: Response) => {
  res.json({message:'OK'});
});



/**
 * upload files to the server, 
 */
app.post('/api/tempFile/', userMustLoggedIn,  uploadToDisk.single('file'),  (req :Request, res: Response, next: NextFunction) => {
  res.json({id:req.file.filename,size: req.file.size, filename:req.file.originalname});
  next();
}, () => {
  // remove files older than 1 hour
  console.debug('remove old files ', tempPath)
  fs.readdir(tempPath, (err, files) => {
    files.forEach((file, index) => {
      const filePath = path.join(tempPath, file);
      fs.stat(filePath, (err, stat) => {
        var endTime, now;
        if (err) {
          console.debug(err);
          return err;
        }
        now = new Date().getTime();
        endTime = new Date(stat.ctime).getTime() + 3600000;
        if (now > endTime) {
          fs.unlink(filePath, err=>{
            console.debug(`remove file ${filePath}`);
          })
        }
      });
    });
  });
});

/**
 * upload files to the server, 
 */
app.get([
  '/api/tempFile/:id',
  '/api/tempFile/:id/as/:filename'
  ], (req :Request, res: Response, next: NextFunction) => {
  if (/\//.test(req.params.id)) {
    res.status(404).json({message: 'unable to find the file'})
  }
  res.sendFile(path.join(tempPath, req.params.id));
});


const runningPythonTask = {
  mergeLightCycler:0,
  testLongTask:0,
};

function ableToRunTask(taskName: string, limit:number = 1) {
  return (ws, req, next) => {
    if (runningPythonTask[taskName] === undefined) {
      runningPythonTask[taskName] = 0;
    }
    if (runningPythonTask[taskName] === 0) {
      next();
    } else {
      console.log('already running '+ taskName);
      ws.send(JSON.stringify({type:'abort', message:`another ${taskName} task is running, please try again later`}));
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

// ============================static files===================================
app.use('/public', express.static('public'));

// ----------------------------------------------------------------------------
app.listen(8000, '0.0.0.0', (err) => {
  console.log('api server on 8000');
  if (err) console.log(err);
})