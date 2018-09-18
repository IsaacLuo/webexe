import express from 'express'
import {Response, NextFunction} from 'express'
import cors from 'cors'
import * as bodyParser from 'body-parser'

interface Request extends express.Request {
  isLoggedIn: boolean,
}

// express instance
const app = express()

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
    next();
  } else {
    res.status(401).json({message: 'require log in'})
  }
}

// ============================API============================================
app.get('/api/message', userMustLoggedIn, (req :Request, res: Response) => {
  res.json({message:'hello from server'});
});

// ============================static files===================================
app.use('/public', express.static('public'));

// ----------------------------------------------------------------------------
app.listen(8000, (err) => {
  console.log('api server on 8000');
  if (err) console.log(err);
})