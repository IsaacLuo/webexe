import * as childProcess from 'child_process'

const readline = require('readline');

export function runPython (params: string, dataIn?: any, onOutput?: (outputObj:any, stdin?:any)=>void, onStdErr?: (message: string)=>void) {
  return new Promise((resolve, reject)=>{
    console.debug('start python', params.split(' '));
    const subProcess = childProcess.spawn('python', params.split(' '), );
    const rl = readline.createInterface({
      input: subProcess.stdout,
    });

    const allObjects:any[] = [];
    
    rl.on('line', input => {
      // console.debug('debug: ', input);
      const messageObj = JSON.parse(input.toString());
      if(onOutput) {
        onOutput(messageObj, subProcess.stdin);
      }
      allObjects.push(messageObj);
    })

    subProcess.stderr.on('data', (data) => {
      if (onStdErr) {
        onStdErr(data.toString());
      }
    });
    
    subProcess.on('close', (code) => {
      // console.debug('finish python', code);
      if (code === 0) {
        resolve(allObjects);
      } else {
        reject({code, output:allObjects});
      }
    });

    if (dataIn) {
      subProcess.stdin.write(JSON.stringify(dataIn));
    }

  });
}