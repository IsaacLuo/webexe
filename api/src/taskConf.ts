export default {
  test: {
    program: 'python3',
    params: ['scripts/test_long_task.py', '{duration}'],
  },
  crlf_to_lf: {
    program: 'python3',
    params: ['scripts/crlf_to_lf.py', '{srcFileName}'],
  },
  compress_pptx: {
    program: 'python3',
    params: ['scripts/py_ppt_comporess.py', '{srcFileName}'],
  }
}