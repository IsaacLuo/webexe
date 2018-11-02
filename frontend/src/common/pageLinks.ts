import MergeLightCyclerReport from "src/pages/MergeLightCyclerReport";
import TestLongTask from "src/pages/TestLongTask";
import TaskManager from 'src/pages/TaskManager';

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