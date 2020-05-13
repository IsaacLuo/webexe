// import * as ws from 'ws';
// import { ChildProcess, ChildProcessWithoutNullStreams } from 'child_process';

declare interface IGLobalConfig {
  maxTubeDeleteLimit: number,
  host: string,
  port: number,
  publicURL?: string,
}

declare interface IUserEssential {
  _id: any,
  email: string,
  name: string, // user's full name
  groups: string[], // array of group name, 'guest', 'users', 'visitors', or 'administrators'
}

declare interface ITokenContent extends IUserEssential{
  iat:number,
  exp:number,
}

declare interface IUser extends IUserEssential {
  createdAt?: Date,
  updatedAt?: Date,
  passwordHash?: string, // empty if user signed up using google account
  passwordSalt?: string, // empty if user signed up using google account
}

declare interface ICustomState {
  user?: ITokenContent,
  data?: any,
}

declare interface IProcess {
  processId: string;
  subProcessInst?: any;
  program: string;
  params: string[];
  comments: any;
  dataIn: any;
  taskName: string;
  state: 'ready'| 'running' | 'done' | 'error' | 'aborted';
  result: any;
  createdAt?: Date;
  startedAt?: Date;
  doneAt?: Date;
}

declare interface IProcessDict {
  [key: string]: IProcess;
}