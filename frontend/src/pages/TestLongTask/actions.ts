const TASK_APPENDIX = '_TEST_LONG_TASK';

// user starts the task
export const CREATE_WS = 'CREATE_WS' + TASK_APPENDIX;

export const SET_WS = 'SET_WS' + TASK_APPENDIX;

// websocket disconnected
export const WS_DISCONNECTED = 'WS_DISCONNECTED' + TASK_APPENDIX;

// user starts the task
export const START_TASK = 'START' + TASK_APPENDIX;

// received progress information from server
export const PROGRESS = 'PROGRESS' + TASK_APPENDIX;

export const SERVER_MESSAGE = 'SERVER_MESSAGE' + TASK_APPENDIX;

// server sents a result to client
export const SERVER_RESULT = 'SERVER_RESULT' + TASK_APPENDIX;

// show finish information
export const FINISH_TASK = 'FINISH' + TASK_APPENDIX;

// task was rejected by the server
export const REJECT_TASK = 'REJECT' + TASK_APPENDIX;

// user abort the task
export const ABORT_TASK= 'ABORT' + TASK_APPENDIX;

export const HEARTBEAT = 'HEARTBEAT' + TASK_APPENDIX;