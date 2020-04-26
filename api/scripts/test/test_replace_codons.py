import subprocess
import pytest
import os
import json
import sys 
sys.path.append(".")
import tools

def test_call_replace_codons():
    print('')
    process_result = subprocess.run(['python', 'replace_codons.py', './test/1.gff.json', 'TAG:TAA TGA:TAA', '--output', 'target.json', '--log', 'log.log'], \
                    capture_output=True)

    print(process_result.stderr.decode())
    assert process_result.returncode == 0

    result_line = process_result.stdout.decode().splitlines()[-1]
    print(result_line)
    result_obj = json.loads(result_line)
    assert result_obj['type'] == 'result'
    file_url = result_obj['data']['files'][0]['url']
    assert file_url

    with open(os.path.join('test', '1.gff.json')) as fp:
        src_gff = json.load(fp)
    with open(os.path.join('results', file_url)) as fp:
        dst_gff = json.load(fp)

    assert len(dst_gff['records']) == len(src_gff['records'])

    #all sequence must have hash
    for record in dst_gff['records']:
        assert 'sequenceHash' in record
        assert record['sequenceHash'] != ''
        assert record['sequenceHash'] == tools.get_sequence_hash(dst_gff, record['chrName'], record['start'], record['end'], record['strand'])
        if record['featureType'] == 'gene':
            assert tools.get_sequence(dst_gff, record['chrName'], record['start'], record['end'], record['strand'])[-3:] == 'TAA'
            assert tools.get_sequence(src_gff, record['chrName'], record['start'], record['end'], record['strand'])[-3:] != 'TAA'
            print(record['sequenceHash'])
            hash1 = record['sequenceHash']

    for record in src_gff['records']:
        if record['featureType'] == 'gene':
            print(record['sequenceHash'])
            assert hash1 != record['sequenceHash']

    # for file_name in [x['url'] for x in result_obj['data']['files']]:
        # os.remove(os.path.join('results', file_name))
        
