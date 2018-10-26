export interface IAction {
  type: string,
  data: any,
}

export interface IFileUploadAction extends IAction{
  type: string,
  data: {
    taskId?: string,
    file: File,
    [index: string]:any,
  }
}

export interface IAppStoreState {
  message: string,
}

export interface IMergeLightCyclerReportsStoreState {
  plateDefinitionFileRefs: {
    name:string, 
    link:string,
  },
  lightCyclerReportFileRefs: {
    name:string,
    link:string,
  }
}

export interface ITaskStoreState {
  mergeLightCyclerReports: any[],
  uploadedFiles: any[],
}

export interface IStoreState {
  app: IAppStoreState,
  tasks: ITaskStoreState,
}