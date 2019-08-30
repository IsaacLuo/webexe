import MergeLightCyclerReport from "../pages/MergeLightCyclerReport";
import TestLongTask from "../pages/TestLongTask";
import TaskManager from '../pages/TaskManager';

export default [
  {
    title: 'merge light cycler reports',
    discription: 'merge a light cycler report table into the plate map',
    link: '/tools/MergeLightCyclerReport',
    component: MergeLightCyclerReport,
  },
  {
    title: 'test task',
    discription: 'test a 60 seconds task',
    link: '/tools/TestLongTask',
    component: TestLongTask,
  },
  {
    title: 'task manager',
    discription: 'task manager',
    link: '/tools/TaskManager',
    component: TaskManager,
  },
]