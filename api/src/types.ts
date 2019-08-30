import * as ws from 'ws';

export interface IGLobalConfig {
  maxTubeDeleteLimit: number,
  host: string,
  port: number,
  publicURL?: string,
}

export interface IUserEssential {
  _id: any,
  email: string,
  name: string, // user's full name
  groups: string[], // array of group name, 'guest', 'users', 'visitors', or 'administrators'
}

export interface ITokenContent extends IUserEssential{
  iat:number,
  exp:number,
}

export interface IUser extends IUserEssential {
  createdAt?: Date,
  updatedAt?: Date,
  passwordHash?: string, // empty if user signed up using google account
  passwordSalt?: string, // empty if user signed up using google account
}

export interface ICustomState {
  user?: ITokenContent,
  data?: any,
}

export interface IProcess {
  processId: string;
  program: string;
  params: string[];
  taskName: string;
  state: 'ready'| 'running' | 'done' | 'error';
  webSockets: Set<ws>;
  result: any;
  createdAt?: Date;
  startedAt?: Date;
  doneAt?: Date;
}

export interface IProcessDict {
  [key: string]: IProcess;
}