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
  crlf_to_lf: {
    name: 'crlf_to_lf',
    description: 'convert text files from CRLF to LF',
    params: [
      {
        name: 'srcFileName',
        control: 'file',
        controlSettings: {
          singleFile:true,
          fileLimit: 100*1024*1024,
        },
        default: '',
        essential: true,
      }
    ]
  },
}