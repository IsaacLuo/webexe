import json
import time
import sys
import webexe
import os
import datetime

if len(sys.argv) < 1:
    webexe.message('input file required')
    exit(1)
filename = sys.argv[1]
promoter_length = int(sys.argv[2])
terminator_length = int(sys.argv[3])

ext = os.path.splitext(filename)[1]
output_filename = webexe.random_string() + ext
webexe.log('start task')

def read_gff_json(gff_json):
    if 'seqInfos' not in gff_json and 'fasta' in gff_json:
        # generate seqInfos
        gff_json['seqInfos'] = {}
        for seqName in gff_json['fasta']:
            gff_json['seqInfos'][seqName] = {'length':len(gff_json['fasta'][seqName])}

    if 'records' in gff_json:
        original_records = gff_json['records']
        new_records = []
        records_len = len(original_records)
        for i, record in enumerate(original_records):
            webexe.progress(0.4 * i/records_len, 'doing {}/{}'.format(i, records_len))
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
                if 'seqInfos' in gff_json and record['seqName'] in gff_json['seqInfos'] and 'length' in gff_json['seqInfos'][record['seqName']]:
                    max_length = gff_json['seqInfos'][record['seqName']]['length']
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
                if promoter_start <= terminator_start:
                    new_records.append({
                        'seqName':record['seqName'],
                        'source':'cailab_generate_promoter_terminator',
                        'featureType': 'promoter',
                        'start': promoter_start,
                        'end': promoter_end,
                        'strand': record['strand'],
                        'attribute': {
                            'ID': gene_id+'_promoter',
                            'Name': gene_name+'_promoter',
                        },
                        'chrId': record['chrId'],
                        'chrName': record['chrName'],
                        'chrFileName': record['chrFileName'],
                        'tags': {
                            'createdAt': datetime.datetime.now().isoformat(),
                            'createdBy': 'cailab-webexe'
                        }
                        })

                    new_records.append({
                        'seqName':record['seqName'],
                        'source':'cailab_generate_promoter_terminator',
                        'featureType': 'terminator',
                        'start': terminator_start,
                        'end': terminator_end,
                        'strand': record['strand'],
                        'attribute': {
                            'ID': gene_id+'_terminator',
                            'Name': gene_name+'_terminator',
                        },
                        'chrId': record['chrId'],
                        'chrName': record['chrName'],
                        'chrFileName': record['chrFileName'],
                        'tags': {
                            'createdAt': datetime.datetime.now().isoformat(),
                            'createdBy': 'cailab-webexe'
                        }
                        })
                else:
                    new_records.append({
                        'seqName':record['seqName'],
                        'source':'cailab_generate_promoter_terminator',
                        'featureType': 'terminator',
                        'start': terminator_start,
                        'end': terminator_end,
                        'strand': record['strand'],
                        'attribute': {
                            'ID': gene_id+'_terminator',
                            'Name': gene_name+'_terminator',
                        },
                        'chrId': record['chrId'],
                        'chrName': record['chrName'],
                        'chrFileName': record['chrFileName'],
                        'tags': {
                            'createdAt': datetime.datetime.now().isoformat(),
                            'createdBy': 'cailab-webexe'
                        }
                        })
                    new_records.append({
                        'seqName':record['seqName'],
                        'source':'cailab_generate_promoter_terminator',
                        'featureType': 'promoter',
                        'start': promoter_start,
                        'end': promoter_end,
                        'strand': record['strand'],
                        'attribute': {
                            'ID': gene_id+'_promoter',
                            'Name': gene_name+'_promoter',
                        },
                        'chrId': record['chrId'],
                        'chrName': record['chrName'],
                        'chrFileName': record['chrFileName'],
                        'tags': {
                            'createdAt': datetime.datetime.now().isoformat(),
                            'createdBy': 'cailab-webexe'
                        }
                        })
        webexe.progress(0.4, 'merging')
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
        if 'seqInfos' in gff_json:
            result_json['seqInfos'] = gff_json['seqInfos']
        if 'fasta' in gff_json:
            result_json['fasta'] = gff_json['fasta']
        return result_json
    else:
        raise Exception('cannot find records in this file')

webexe.progress(0.0, 'start')
try:
    with open(filename, 'r') as f_src, open('results/' + output_filename,'w') as f_dst:
        line_count=0
        src_json = json.load(f_src)
        if 'fileType' in src_json:
            if src_json['fileType'] == 'cailab_gff_json':
                new_json = read_gff_json(src_json)
                webexe.progress(0.8, 'dumping')
                json.dump(new_json, f_dst)
            else:
                raise Exception('unkown file type')
        else:
            raise Exception('unkown file type')
    webexe.progress(1.0, 'finish')
    webexe.result({'files':[{'name':'output'+ext, 'url':output_filename}]},'finish')
except Exception as err:
    webexe.abort({}, str(err))
    print(err, file=sys.stderr)