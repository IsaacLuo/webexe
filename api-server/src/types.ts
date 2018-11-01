import { PythonShell } from "python-shell";

export interface ITaskProp {
  taskName:string,
  taskId:string, 
  params:any,
  onAllowToRun?: (taskProp: ITaskProp)=>void,
  onKeepWaiting?: (queueLength:number, taskProp: ITaskProp)=>void,
  pyShell?:PythonShell,
}