const TASK_APPENDIX = '_MLCR'

// user starts the task
export const CREATE_WS = 'CREATE_WS' + TASK_APPENDIX;

// websocket disconnected
export const WS_DISCONNECTED = 'WS_DISCONNECTED' + TASK_APPENDIX;

// user starts the task
export const START_TASK = 'START' + TASK_APPENDIX;

// received progress information from server
export const PROGRESS = 'PROGRESS' + TASK_APPENDIX;

// show finish information
export const FINISH_TASK = 'FINISH' + TASK_APPENDIX;

// task was rejected by the server
export const REJECT_TASK = 'REJECT' + TASK_APPENDIX;

// user abort the task
export const ABORT_TASK= 'ABORT' + TASK_APPENDIX;

export const UPLOADED_PLATE_DEFINITION_FILE = 'UPLOADED_PLATE_DEFINITION_FILE'
export const UPLOADED_LIGHT_CYCLER_REPORT_FILE = 'UPLOADED_LIGHT_CYCLER_REPORT_FILE'
export const REPORT_GENERATED_MLCR = 'REPORT_GENERATED_MLCR'
export const RESET_MLCR = 'RESET_MLCR'
export const UPLOAD_PLATE_DEFINITION_FILE = 'UPLOAD_PLATE_DEFINITION_FILE'
export const UPLOAD_LIGHT_CYCLER_REPORT_FILE = 'UPLOAD_LIGHT_CYCLER_REPORT_FILE'

export function ActionUploadedPlateDefinitionFile(id, name, link) {
  return {type: UPLOADED_PLATE_DEFINITION_FILE, data: {id, name, link}};
}

export function ActionUploadedLightCyclerReportFile(id, name, link) {
  return {type: UPLOADED_LIGHT_CYCLER_REPORT_FILE, data: {id, name, link}};
}