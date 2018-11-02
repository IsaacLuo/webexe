import { PythonShell } from "python-shell";
import WebSocket from 'ws'

export interface ITaskProp {
  taskId:string, 
  params:any,
}

export interface IWSClient {
  ws: WebSocket,
  taskName:string,
  status: 'ready'|'queueing'|'running'|'finish'|'aborted',
  taskId?:string, 
  clientId?:string,
  params?:any,
  onAllowToRun?: (IWSClient:IWSClient)=>void,
  onKeepWaiting?: (IWSClient:IWSClient, queueLength:number)=>void,
  pyShell?:PythonShell,
}