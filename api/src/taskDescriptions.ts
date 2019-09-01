export default {
  test:{
    name: 'test',
    description: 'test is a test task which last X seconds and output some number',
    params: [
      {
        name: 'duration',
        control: 'numeric',
        controlSettings: {
          min: 1,
          max: 60,
          step: 1,
        },
        default: 10,
        essential: true,
      }
    ]
  },

}