/// <reference path="@types/index.d.ts" />
import fs from 'fs';
import koa from 'koa';
import conf from './conf.json';

const keepResultTime = conf.keepResultTime ? conf.keepResultTime * 1000: 3600000;
const keepUploadTime = conf.keepUploadTime ? conf.keepUploadTime * 1000: 3600000;

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
          if (stats.ctime.getTime() < Date.now() - keepResultTime) {
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

  const folder2 = 'uploads';
  fs.readdir(folder2, (err, files)=>{
    files.forEach((filename)=>{
      if (filename !== '.gitKeep') {
        const filePath = `${folder2}/${filename}`;
        fs.stat(filePath, (err, stats)=>{
          
          if (stats.ctime.getTime() < Date.now() - keepUploadTime) {
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