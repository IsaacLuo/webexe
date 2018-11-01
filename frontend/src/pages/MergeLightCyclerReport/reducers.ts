/**
 * @file MergeLightCyclerReport reducers 
 */

import {
  IMergeLightCyclerReportsStoreState,
  IAction,
  INamedLink,
  } from '../../types'

import{
  UPLOADED_PLATE_DEFINITION_FILE,
  UPLOADED_LIGHT_CYCLER_REPORT_FILE,
  REPORT_GENERATED_MLCR,
  RESET_MLCR,
  SERVER_MESSAGE,
  PROGRESS,
  FINISH_TASK,
  ABORT_TASK,
  CREATE_WS,
  START_TASK,
  SET_WS,
  SERVER_RESULT,
} from './actions'

import config from '../../config'

export default function reducer(state:IMergeLightCyclerReportsStoreState  = {
  plateDefinitionFileRefs: [],
  lightCyclerReportFileRefs: [],
  mergedResultFileRefs: [],
  message: '',
  progress: 0,
  showProgressBar: false,
  taskId: '',
  enableRunButton: true,
}, action: IAction) {
  switch (action.type) {
    case SET_WS:
      return {
        ...state,
        ws: action.data,
      }
    
    case START_TASK:
      return {
        ...state,
        enableRunButton: false,
        taskId: Math.random().toString(36).substr(2),
        progress:0,
        showProgressBar:true,
      }

    case PROGRESS:
      return {
        ...state,
        message: action.data.message,
        progress: action.data.progress,
        showProgressBar: true,
      }
    case SERVER_MESSAGE:
      return {
        ...state,
        message: action.data.message,
      }
    case SERVER_RESULT:
      return {
        ...state,
        enableRunButton: true,
        mergedResultFileRefs: [...state.mergedResultFileRefs, action.data],
      }
    case FINISH_TASK:
      return {
        ...state,
        message:'finish',
        enableRunButton: true,
        progress: 100,
      }
    case ABORT_TASK:
      return {
        ...state,
        message: 'aborted',
        enableRunButton: true,
      }
    case UPLOADED_PLATE_DEFINITION_FILE:
      const plateDefinitionFileRefs:INamedLink[] = [...state.plateDefinitionFileRefs, action.data];
      plateDefinitionFileRefs.sort((a:INamedLink,b:INamedLink) => a.name < b.name ? -1: 1);
      return {
        ...state,
        plateDefinitionFileRefs,
      }

    case UPLOADED_LIGHT_CYCLER_REPORT_FILE:
      const lightCyclerReportFileRefs = [...state.lightCyclerReportFileRefs, action.data];
      lightCyclerReportFileRefs.sort((a:INamedLink,b:INamedLink) => a.name < b.name ? -1: 1);
      return {
        ...state,
        lightCyclerReportFileRefs,
      }
  
    case RESET_MLCR:
      return {
        ...state,
        plateDefinitionFileRefs: [],
        lightCyclerReportFileRefs: [],
        mergedResultFileRefs: [],
      }

  }
  return state;
}