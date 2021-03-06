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
  },
  generate_promoter_terminator: {
    program: 'python3',
    params: ['scripts/generate_promoter_terminator.py', '{srcFileName}', '{promoterLength}', '{terminatorLength}'],
  },
  replace_codons: {
    program: 'python3',
    params: ['scripts/replace_codons.py', '{srcFileName}', '{rules}'],
  },
  insert_parts_after_features: {
    program: 'python3',
    params: ['scripts/insert_parts_after_features.py', '{srcFileName}', '{featureType}', '{direct}', '{offset}', '{sequenceType}', '{sequence}'],
  },
  remove_introns: {
    program: 'python3',
    params: ['scripts/remove_introns.py', '{srcFileName}'],
    optParams: {
      intronTypes: ['--intron-types', '{intronTypes}'],
    }
  },
  global_alignment: {
    program: 'python3',
    params: ['scripts/global_alignment.py'],
    dataIn: ['sequence1', 'sequence2'],
  },

  gffjson_to_genbank: {
    program: 'python3',
    params: ['scripts/gffjson_to_genbank.py', '{srcFileName}'],
  }
}