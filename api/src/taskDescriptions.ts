export default {
  test:{
    name: 'test',
    description: 'test is a test task which last X seconds and output some number',
    params: [
      {
        name: 'durantion',
        control: 'numeric',
        controlSettings: {
          min: 1000,
          max: 60000,
          step: 1000,
        },
        default: 10000,
        essential: true,
      }
    ]
  },

}