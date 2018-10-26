export const UPLOADED_PLATE_DEFINITION_FILE = 'UPLOADED_PLATE_DEFINITION_FILE'
export const UPLOADED_LIGHT_CYCLER_REPORT_FILE = 'UPLOADED_LIGHT_CYCLER_REPORT_FILE'
export const REPORT_GENERATED_MLCR = 'REPORT_GENERATED_MLCR'
export const RESET_MLCR = 'RESET_MLCR'
export const UPLOAD_PLATE_DEFINITION_FILE = 'UPLOAD_PLATE_DEFINITION_FILE'
export const UPLOAD_LIGHT_CYCLER_REPORT_FILE = 'UPLOAD_LIGHT_CYCLER_REPORT_FILE'
export const START_MERGE_LIGHT_CYCLER_REPORT = 'START_MERGE_LIGHT_CYCLER_REPORT'


export function ActionUploadedPlateDefinitionFile(id, name, link) {
  return {type: UPLOADED_PLATE_DEFINITION_FILE, data: {id, name, link}};
}

export function ActionUploadedLightCyclerReportFile(id, name, link) {
  return {type: UPLOADED_LIGHT_CYCLER_REPORT_FILE, data: {id, name, link}};
}