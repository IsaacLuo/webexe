import json
import time
import sys
import webexe
import os
import datetime
import tools

if len(sys.argv) < 1:
    webexe.message('input file required')
    exit(1)
filename = sys.argv[1]
promoter_length = int(sys.argv[2])
terminator_length = int(sys.argv[3])

ext = os.path.splitext(filename)[1]
output_filename = webexe.random_string() + ext
webexe.log('start task\npromoter terminator')

def read_gff_json(gff_json):
    if 'seqInfo' not in gff_json and 'fasta' in gff_json:
        # generate seqInfo
        gff_json['seqInfo'] = {}
        for seqName in gff_json['fasta']:
            gff_json['seqInfo'][seqName] = {'length':len(gff_json['fasta'][seqName])}

    if 'records' in gff_json:
        original_records = gff_json['records']
        new_records = []
        records_len = len(original_records)
        last_progress = 0
        for i, record in enumerate(original_records):
            current_progress = 40 * i // records_len
            if current_progress > last_progress:
                webexe.progress(current_progress, 'doing {}/{}'.format(i, records_len))
                last_progress = current_progress

            if record['featureType'] == 'gene':
                start = record['start']
                end = record['end']
                strand = record['strand']
                if strand == -1 or strand == '-':
                    promoter_start = end
                    promoter_end = end + promoter_length
                    terminator_start = start - terminator_length
                    terminator_end = start
                else:
                    promoter_start = start - promoter_length
                    promoter_end = start
                    terminator_start = end
                    terminator_end = end + terminator_length
                if promoter_start < 0:
                    promoter_start = 0
                if promoter_end < 0:
                    promoter_end = 0
                if terminator_start < 0:
                    terminator_start = 0
                if terminator_end < 0:
                    terminator_end = 0
                if 'seqInfo' in gff_json and record['chrName'] in gff_json['seqInfo'] and 'length' in gff_json['seqInfo'][record['chrName']]:
                    max_length = gff_json['seqInfo'][record['chrName']]['length']
                    if promoter_start > max_length:
                        promoter_start = max_length
                    if promoter_end > max_length:
                        promoter_end = max_length
                    if terminator_start > max_length:
                        terminator_start = max_length
                    if terminator_end > max_length:
                        terminator_end = max_length
                # generate some attributes but not all of them
                gene_id = record['attribute']['ID'] if 'ID' in record['attribute'] else ''
                gene_name = record['attribute']['Name'] if 'Name' in record['attribute'] else ''
                name = record['name'] if 'name' in record else ''
                chrId = record['chrId'] if 'chrId' in record else 0
                chrName = record['chrName'] if 'chrName' in record else ''
                if promoter_start <= terminator_start:
                    new_records.append({
                        '__modified': True,
                        '__changelog': 'created promoter in {} bp'.format(promoter_length),
                        'source':'cailab_generate_promoter_terminator',
                        'featureType': 'promoter',
                        'start': promoter_start,
                        'end': promoter_end,
                        'strand': record['strand'],
                        'attribute': {
                            'ID': gene_id+'_promoter',
                            'Name': gene_name+'_promoter',
                        },
                        'name': name + '_P',
                        'chrId': chrId,
                        'chrName': chrName,
                        'tags': {
                            'createdAt': datetime.datetime.now().isoformat(),
                            'createdBy': 'cailab-webexe'
                        },
                        'sequenceHash': tools.get_sequence_hash(gff_json, chrName, promoter_start, promoter_end, record['strand']) if 'sequence' in gff_json else None,
                        })

                    new_records.append({
                        '__modified': True,
                        '__changelog': 'created terminator in {} bp'.format(terminator_length),
                        'source':'cailab_generate_promoter_terminator',
                        'featureType': 'terminator',
                        'start': terminator_start,
                        'end': terminator_end,
                        'strand': record['strand'],
                        'attribute': {
                            'ID': gene_id+'_terminator',
                            'Name': gene_name+'_terminator',
                        },
                        'name': name + '_T',
                        'chrId': chrId,
                        'chrName': chrName,
                        'tags': {
                            'createdAt': datetime.datetime.now().isoformat(),
                            'createdBy': 'cailab-webexe'
                        },
                        'sequenceHash': tools.get_sequence_hash(gff_json, chrName, terminator_start, terminator_end, record['strand']) if 'sequence' in gff_json else None,
                        })
                else:
                    new_records.append({
                        '__modified': True,
                        '__changelog': 'created terminator in {} bp'.format(terminator_length),
                        'source':'cailab_generate_promoter_terminator',
                        'featureType': 'terminator',
                        'start': terminator_start,
                        'end': terminator_end,
                        'strand': record['strand'],
                        'attribute': {
                            'ID': gene_id+'_terminator',
                            'Name': gene_name+'_terminator',
                        },
                        'name': name + '_T',
                        'chrId': chrId,
                        'chrName': chrName,
                        'tags': {
                            'createdAt': datetime.datetime.now().isoformat(),
                            'createdBy': 'cailab-webexe'
                        },
                        'sequenceHash': tools.get_sequence_hash(gff_json, chrName, terminator_start, terminator_end, record['strand']) if 'sequence' in gff_json else None,
                        })
                    new_records.append({
                        '__modified': True,
                        '__changelog': 'created promoter in {} bp'.format(promoter_length),
                        'source':'cailab_generate_promoter_terminator',
                        'featureType': 'promoter',
                        'start': promoter_start,
                        'end': promoter_end,
                        'strand': record['strand'],
                        'attribute': {
                            'ID': gene_id+'_promoter',
                            'Name': gene_name+'_promoter',
                        },
                        'name': name + '_P',
                        'chrId': chrId,
                        'chrName': chrName,
                        'tags': {
                            'createdAt': datetime.datetime.now().isoformat(),
                            'createdBy': 'cailab-webexe'
                        },
                        'sequenceHash': tools.get_sequence_hash(gff_json, chrName, promoter_start, promoter_end, record['strand']) if 'sequence' in gff_json else None,
                        })
        
        webexe.progress(40, 'merging')
        #merge sort
        result = []
        original_record_len = len(original_records)
        new_record_len = len(new_records)
        i = 0
        j = 0
        while i< original_record_len and j < new_record_len:
            if original_records[i]['start'] < new_records[j]['start']:
                result.append(original_records[i])
                i+=1
            else:
                result.append(new_records[j])
                j+=1
        if i < original_record_len:
            result += original_records[i:]
        if j < new_record_len:
            result += new_records[j:]
        result_json = {
            'fileType': 'cailab_gff_json',
            "version": "0.1",
            'records':result,
            }
        if 'seqInfo' in gff_json:
            result_json['seqInfo'] = gff_json['seqInfo']
        
        if 'fasta' in gff_json:
            result_json['fasta'] = gff_json['fasta']

        result_json['__changelog'] = 'created promoter and terminator in {}, {} bp'.format(promoter_length, terminator_length)
        if 'changelog' not in result_json:
            result_json['changelog'] = [result_json['__changelog']]
        else:
            result_json['changelog'] = [result_json['__changelog']] + result_json['changelog']

        #calculate seq md5
        if 'sequence' in result_json:
            for key in result_json['sequence'].keys():
                result_json['seqInfo'][key]['md5'] = tools.md5(result_json['sequence'][key])

        return result_json
    else:
        raise Exception('cannot find records in this file')

webexe.progress(0, 'start')
try:
    if not os.path.exists('results'):
        os.makedirs('results')
    with open(filename, 'r') as f_src, open('results/' + output_filename,'w') as f_dst:
        line_count=0
        src_json = json.load(f_src)
        if 'fileType' in src_json:
            if src_json['fileType'] == 'cailab_gff_json':
                new_json = read_gff_json(src_json)
                webexe.progress(80, 'dumping')
                json.dump(new_json, f_dst)
            else:
                raise Exception('unknown file type')
        else:
            raise Exception('unknown file type')
    webexe.progress(100, 'finish')
    webexe.result({'files':[{'name':'output'+ext, 'url':output_filename}]},'finish')
except Exception as err:
    webexe.abort({}, str(err))
    print(str(err), file=sys.stderr)
    raise err