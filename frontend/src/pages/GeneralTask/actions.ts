const TASK_APPENDIX = '_GT';

// received progress information from server
export const PROGRESS = 'PROGRESS' + TASK_APPENDIX;


export const SET_PROCESS_STATE = 'SET_PROCESS_STATE' + TASK_APPENDIX;

// user starts the task
export const START_TASK = 'START' + TASK_APPENDIX;

// server sents a message to client
export const SERVER_MESSAGE = 'SERVER_MESSAGE' + TASK_APPENDIX;
// server sents a message to client
export const SERVER_LOG = 'SERVER_LOG' + TASK_APPENDIX;

// server sents a result to client
export const SERVER_RESULT = 'SERVER_RESULT' + TASK_APPENDIX;

// show finish information
export const FINISH_TASK = 'FINISH' + TASK_APPENDIX;

// task was rejected by the server
export const REJECT_TASK = 'REJECT' + TASK_APPENDIX;

// user abort the task
export const ABORT_TASK= 'ABORT' + TASK_APPENDIX;

export const SET_CLIENT_ID = 'SET_CLIENT_ID' + TASK_APPENDIX;

export const SET_PROCESS_ID = 'SET_PROCESS_ID'+ TASK_APPENDIX;

export const SET_PROCESS_SIGNAL = 'SET_PROCESS_SIGNAL' + TASK_APPENDIX;

export const SET_PROCESS_LOG = 'SET_PROCESS_LOG' + TASK_APPENDIX;

export const UPLOAD_FILE_PARAMS = 'UPLOAD_FILE_PARAMS' + TASK_APPENDIX;