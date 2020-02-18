/// <reference path="@types/index.d.ts" />
import uuid from 'uuid';
import taskConf from './taskConf';
import redis from 'redis'

class TaskDict {
  private tasks:IProcessDict = {};
  private redisClient:redis.RedisClient;
  
  constructor() {
    // this.redisClient = redis.createClient(6379, '127.0.0.1')
    // this.redisClient.on('error', function (err) {
    //   console.error('Error ' + err);
    // });
  }

  public initialTask(taskName:string, taskParams:any) {
    let processId;
    do {
      processId = uuid.v4();
    } while(this.tasks[processId]!==undefined);
    
    this.tasks[processId] = {
      processId,
      program: taskConf[taskName].program,
      params: taskParams,
      taskName,
      state: 'ready',
      result: undefined,
      createdAt: new Date(),
    }

    // this.redisClient.set(processId, JSON.stringify(this.tasks[processId]))

    return processId;
  }

  public getTask(processId) {
    return this.tasks[processId];
  }

  public getAllTasks() {
    return this.tasks;
  }

  public removeOldTasks() {
    const processIds = Object.keys(this.tasks);
    processIds.forEach(processId => {
      const process = this.tasks[processId];
      if (process && process.createdAt && process.createdAt.getTime() < Date.now() - 3600000) {

        delete this.tasks[processId];
      }
    });
  }

}

export default TaskDict;