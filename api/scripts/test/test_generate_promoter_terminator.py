import subprocess
import pytest
import os
import json

def test_call_generate_promoter_terminator():
    print('')
    process_result = subprocess.run(['python', 'generate_promoter_terminator.py', './test/1.gff.json', '500', '200'], \
                    capture_output=True)

    assert process_result.returncode == 0

    result_line = process_result.stdout.decode().splitlines()[-1]
    result_obj = json.loads(result_line)
    assert result_obj['type'] == 'result'
    file_url = result_obj['data']['files'][0]['url']
    assert file_url

    with open(os.path.join('test', '1.gff.json')) as fp:
        src_gff = json.load(fp)
    with open(os.path.join('results', file_url)) as fp:
        dst_gff = json.load(fp)

    assert len(dst_gff['records']) > len(src_gff['records'])

    #all sequence must have hash
    for record in dst_gff['records']:
        assert 'sequenceHash' in record
        assert record['sequenceHash'] == tools.get_sequence_hash(dst_gff, record['chrName'], record['start'], record['end'], record['strand'])

    os.remove(os.path.join('results', file_url))

