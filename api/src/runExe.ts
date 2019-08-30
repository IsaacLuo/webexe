import * as childProcess from 'child_process'
import { IProcess } from './types';

const readline = require('readline');

export function runExe (process: IProcess, dataIn?: any, onOutput?: (outputObj:any, stdin?:any)=>void, onStdErr?: (message: string)=>void) {
  return new Promise((resolve, reject)=>{
    console.debug('start python', process.params);
    const subProcess = childProcess.spawn(process.program, process.params);
    const rl = readline.createInterface({
      input: subProcess.stdout,
    });

    // const allObjects:any[] = [];
    
    rl.on('line', input => {
      // console.debug('debug: ', input);
      const messageObj = JSON.parse(input.toString());
      if(onOutput) {
        onOutput(messageObj, subProcess.stdin);
      }
    })

    subProcess.stderr.on('data', (data) => {
      if (onStdErr) {
        onStdErr(data.toString());
      }
    });
    
    subProcess.on('close', (code) => {
      // console.debug('finish python', code);
      if (code === 0) {
        // resolve(allObjects);
        resolve(0);
      } else {
        // reject({code, output:allObjects});
        reject(code);
      }
    });

    if (dataIn) {
      subProcess.stdin.write(JSON.stringify(dataIn));
    }

  });
}