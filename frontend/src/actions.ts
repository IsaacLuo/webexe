import { string } from "prop-types";

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
