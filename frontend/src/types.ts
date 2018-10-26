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

export interface IAppStoreState {
  message: string,
}

export interface INamedLink {
  id?:string,
  name:string, 
  link:string,
}

export interface IMergeLightCyclerReportsStoreState {
  plateDefinitionFileRefs: INamedLink[],
  lightCyclerReportFileRefs: INamedLink[],
  mergedResultFileRefs: INamedLink[],
}

export interface IStoreState {
  app: IAppStoreState,
  mergeLightCyclerReport:IMergeLightCyclerReportsStoreState,
}