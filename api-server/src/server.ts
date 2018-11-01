import express from 'express'
import {Response, NextFunction} from 'express'
import cors from 'cors'
import * as bodyParser from 'body-parser'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import hanldleWebSockets from './websocket';

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
const app:ExpressWS = express();

// hanle websocket api
hanldleWebSockets(app);

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



// ============================static files===================================
app.use('/public', express.static('public'));

// ----------------------------------------------------------------------------
app.listen(8000, '0.0.0.0', (err) => {
  console.log('api server on 8000');
  if (err) console.log(err);
})