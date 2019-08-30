export interface IAction {
  type: string,
  data: any,
}

export interface IFileUploadAction extends IAction{
  type: string,
  data: {
    file: File,
    [index: string]:any,
  }
}

export interface TaskDefinition {
  name:string;
  description: string;
  params: any;
}

export interface IAppStoreState {
  message: string,
  messageStyle: string,
  availableTasks: TaskDefinition[],
}

export interface INamedLink {
  id?:string,
  name:string, 
  link:string,
}

export type TaskStatus = 'init'|'ready'|'queueing'|'running'|'finish'|'aborted';

export interface IMergeLightCyclerReportsStoreState {
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

export interface ITestLongTaskStoreState {
  message: string,
  progress: 0,
  taskStatus: TaskStatus,
  showProgressBar: boolean,
  ws?: WebSocket,
  clientId: string,
  enableRunButton: boolean,
}

export interface ITaskBrief {
  type: string,
  id:string,
  status: string,
  progress: number,
  wsState: number,
  createdAt: Date,
}

export interface ITaskManagerStoreState {
  tasks: {[key:string]:ITaskBrief[]},
  message: string,
  ws?: WebSocket,
}

export interface IStoreState {
  app: IAppStoreState,
  mergeLightCyclerReport:IMergeLightCyclerReportsStoreState,
  testLongTask:ITestLongTaskStoreState,
  taskManager:ITaskManagerStoreState,
}