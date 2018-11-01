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
  CREATE_WS,
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
    
    case REPORT_GENERATED_MLCR:
      return {
        ...state,
        mergedResultFileRefs: [...state.mergedResultFileRefs, action.data],
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