import subprocess
import pytest
import os
import json
import sys 
sys.path.append(".")
import tools

def test_remove_introns():
    print('')
    process_result = subprocess.run(['python', 'remove_introns.py', './test/1.gff.json','--intron-types', 'intron', 'other_intron', '--output', 'target.json', '--log', 'log.log'], \
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

    assert len(dst_gff['records']) < len(src_gff['records'])

    #all sequence must have hash
    for record in dst_gff['records']:
        # print(record['name'], record['featureType'], record['start'], record['end'])
        assert 'sequenceHash' in record
        assert record['sequenceHash'] != ''
        assert record['sequenceHash'] == tools.get_sequence_hash(dst_gff, record['chrName'], record['start'], record['end'], record['strand'])

    assert dst_gff['records'][0]['start'] == 1000
    assert dst_gff['records'][0]['end'] == 1900
    assert dst_gff['records'][2]['start'] == 1000
    assert dst_gff['records'][2]['end'] == 1300
    assert dst_gff['records'][3]['start'] == 1300
    assert dst_gff['records'][3]['end'] == 1900

    # must not contains intron
    for record in dst_gff['records']:
        assert record['featureType'] != 'intron'
    
    # sequence must shorter
    assert src_gff['seqInfo'][src_gff['defaultChr']]['length'] > dst_gff['seqInfo'][dst_gff['defaultChr']]['length']