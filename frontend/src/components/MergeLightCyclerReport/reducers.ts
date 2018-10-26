
function taskReducer(state :ITaskStoreState = {
  mergeLightCyclerReports:[],
  uploadedFiles: [],
}, action: IAction) {
  switch (action.type) {
    case 'addTaskResult':
      const newState = {
        ...state,
      };
      if (!newState[action.data.taskId]) {
        newState[action.data.taskId] = []
      }
      const arr = [...newState[action.data.taskId], {link:action.data.link, name: action.data.name}]
      newState[action.data.taskId] = arr;
      return newState;
    
    case 'NEW_FILE_UPLOADED':
      const {id, name} = action.data
      return {
        ...state,
        uploadedFiles: [...state.uploadedFiles,
          {id, name}
        ]
      }
  }
  return state;
}