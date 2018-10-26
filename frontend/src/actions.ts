
export const SAY_SOMETHING = 'SAY_SOMETHING';
export function ActionSaySomething (message: string) {
  return {type: SAY_SOMETHING, data: message};
}

export const WAIT_AND_SAY_SOMETHING = 'WAIT_AND_SAY_SOMETHING';
export function ActionWaitAndSaySomething (message: string, time: number) {
  return {type: WAIT_AND_SAY_SOMETHING, data: {message, time}};
}

export const CLEAR_MESSAGE = 'CLEAR_MESSAGE';
export function ActionClearMessage () {
  return {type: CLEAR_MESSAGE};
}
