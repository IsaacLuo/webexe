const TASK_APPENDIX = '_TASK_MANAGER'

// user starts the task
export const CREATE_WS = 'CREATE_WS' + TASK_APPENDIX;
export const SET_WS = 'SET_WS' + TASK_APPENDIX;

// websocket disconnected
export const WS_DISCONNECTED = 'WS_DISCONNECTED' + TASK_APPENDIX;

// server sents a message to client
export const SERVER_MESSAGE = 'SERVER_MESSAGE' + TASK_APPENDIX;

export const HEARTBEAT='HEARTBEAT' + TASK_APPENDIX;

export const SET_MESSAGE = 'SET_MESSAGE' + TASK_APPENDIX;