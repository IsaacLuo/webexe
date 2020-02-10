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
        essential: true,
      }
    ]
  },
  compress_pptx: {
    name: 'compress_pptx',
    description: 'comporess the media files in the pptx',
    params: [
      {
        name: 'srcFileName',
        control: 'file',
        controlSettings: {
          singleFile:true,
          fileLimit: 1024*1024*1024,
        },
        essential: true,
      }
    ]
  },
  generate_promoter_terminator: {
    name: 'generate_promoter_terminator',
    description: 'generate promoters and terminiators automatically in chomsome definition file',
    params: [
      {
        name: 'srcFileName',
        control: 'file',
        controlSettings: {
          singleFile:true,
          fileLimit: 1024*1024*1024,
        },
        essential: true,
      },
      {
        name: 'promoterLength',
        control: 'numeric',
        controlSettings: {
          min: 1,
          max: 1000,
          step: 1,
        },
        default: 500,
        essential: true,
      },
      {
        name: 'terminatorLength',
        control: 'numeric',
        controlSettings: {
          min: 1,
          max: 1000,
          step: 1,
        },
        default: 200,
        essential: true,
      }
    ]
  }
}