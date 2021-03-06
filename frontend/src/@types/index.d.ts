declare interface IAction {
  type: string,
  data: any,
  [index: string]: string,
}

declare interface IFileUploadAction extends IAction{
  type: string,
  data: {
    file: File,
    [index: string]:any,
  }
}

declare interface TaskDefinition {
  name:string;
  description: string;
  params: any;
}

declare interface IAppStoreState {
  message: string,
  messageStyle: string,
  availableTasks: {[key:string]:TaskDefinition},
  loggedIn: boolean,
}

declare interface INamedLink {
  id?:string,
  name:string, 
  link:string,
}

// declare type TaskStatus = 'init'|'ready'|'queueing'|'running'|'finish'|'aborted';
declare type TaskStatus = string;

declare interface IServerLog {
  time: Date,
  text: string,
}

declare interface IGeneralTaskState {
  message: string,
  progress: 0,
  taskStatus: TaskStatus,
  showProgressBar: boolean,
  ws?: WebSocket,
  socket?: SocketIOClient.Socket,
  clientId: string,
  enableRunButton: boolean,

  processId?: string;
  signalLog: IServerLog[];
  outputLog: IServerLog[];
  result: any;
}

declare interface IMergeLightCyclerReportsStoreState {
  message: string,
  progress: 0,
  taskStatus: TaskStatus,
  showProgressBar: boolean,
  ws?: WebSocket,
  clientId: string,
  enableRunButton: boolean,
  
  plateDefinitionFileRefs: INamedLink[],
  lightCyclerReportFileRefs: INamedLink[],
  mergedResultFileRefs: INamedLink[],
}

declare interface ITestLongTaskStoreState {
  message: string,
  progress: 0,
  taskStatus: TaskStatus,
  showProgressBar: boolean,
  ws?: WebSocket,
  clientId: string,
  enableRunButton: boolean,
}

declare interface ITaskBrief {
  type: string,
  id:string,
  status: string,
  progress: number,
  wsState: number,
  createdAt: Date,
}

declare interface ITaskManagerStoreState {
  tasks: {[key:string]:ITaskBrief[]},
  message: string,
  ws?: WebSocket,
}

declare interface IStoreState {
  app: IAppStoreState,
  generalTask: IGeneralTaskState,
  mergeLightCyclerReport:IMergeLightCyclerReportsStoreState,
  testLongTask:ITestLongTaskStoreState,
  taskManager:ITaskManagerStoreState,
}