import subprocess
import pytest
import os
import json
import sys 
sys.path.append(".")
import tools

def test_call_generate_promoter_terminator():
    print('')
    process_result = subprocess.run(['python', 'insert_parts_after_features.py', './test/1.gff.json', 'gene', '1', '1', 'xxxP', 'TTTAACTTT', '--output', 'target.json', '--log', 'log.log'], \
                    capture_output=True)

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

    assert len(dst_gff['records']) > len(src_gff['records'])

    #all sequence must have hash
    for record in dst_gff['records']:
        assert 'sequenceHash' in record
        assert record['sequenceHash'] == tools.get_sequence_hash(dst_gff, record['chrName'], record['start'], record['end'], record['strand'])
        if record['featureType'] == 'xxxP':
            assert 'TTTAACTTT' == tools.get_sequence(dst_gff, record['chrName'], record['start'], record['end'], record['strand'])
            assert record['start'] == 2001
        elif record['featureType'] == 'gene':
            assert record['start'] == 1000

    for file_name in [x['url'] for x in result_obj['data']['files']]:
        os.remove(os.path.join('results', file_name))

def test_call_generate_promoter_terminator_befoore():
    process_result = subprocess.run(['python', 'insert_parts_after_features.py', './test/1.gff.json', 'gene', '-1', '3', 'xxxP', 'TTTAACTTT', '--output', 'target.json', '--log', 'log.log'], \
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
        if record['featureType'] == 'xxxP':
            assert 'TTTAACTTT' == tools.get_sequence(dst_gff, record['chrName'], record['start'], record['end'], record['strand'])
            assert record['start'] == 997
            assert record['strand'] == 1
        elif record['featureType'] == 'gene':
            assert record['start'] == 1009

    for file_name in [x['url'] for x in result_obj['data']['files']]:
        os.remove(os.path.join('results', file_name))
    
def test_call_generate_promoter_terminator_reverse():
    process_result = subprocess.run(['python', 'insert_parts_after_features.py', './test/1rev.gff.json', 'gene', '1', '3', 'xxxP', 'TTTAACTTT', '--output', 'target.json', '--log', 'log.log'], \
                    capture_output=True)
    assert process_result.returncode == 0

    result_line = process_result.stdout.decode().splitlines()[-1]
    
    result_obj = json.loads(result_line)
    assert result_obj['type'] == 'result'
    file_url = result_obj['data']['files'][0]['url']
    assert file_url

    if not os.path.exists('results'):
        os.makedirs('results')
    with open(os.path.join('test', '1.gff.json')) as fp:
        src_gff = json.load(fp)
    with open(os.path.join('results', file_url)) as fp:
        dst_gff = json.load(fp)

    assert len(dst_gff['records']) > len(src_gff['records'])

    #all sequence must have hash
    for record in dst_gff['records']:
        assert 'sequenceHash' in record
        assert record['sequenceHash'] == tools.get_sequence_hash(dst_gff, record['chrName'], record['start'], record['end'], record['strand'])
        if record['featureType'] == 'xxxP':
            assert 'TTTAACTTT' == tools.get_sequence(dst_gff, record['chrName'], record['start'], record['end'], record['strand'])
            assert record['start'] == 997
            assert record['strand'] == -1
        elif record['featureType'] == 'gene':
            assert record['start'] == 1009

    for file_name in [x['url'] for x in result_obj['data']['files']]:
        os.remove(os.path.join('results', file_name))