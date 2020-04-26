/// <reference path="@types/index.d.ts" />
import fs from 'fs';
import koa from 'koa';

type Ctx = koa.ParameterizedContext<ICustomState>;

const cleanResult = async (ctx:Ctx)=> {
  // clean results
  console.log('cleanning');
  const folder = 'results';
  fs.readdir(folder, (err, files)=>{
    files.forEach((filename)=>{
      if (filename !== '.gitKeep') {
        const filePath = `${folder}/${filename}`;
        fs.stat(filePath, (err, stats)=>{
          const oneHour = 3600000;
          if (stats.ctime.getTime() < Date.now() - oneHour) {
            fs.unlink(filePath, (err)=>{
              if (err) {
                console.error(`unable to remove file ${filePath}: ${err.message}`)
              }
            });
          }
        })
      }
    });
  });
};

export default cleanResult;