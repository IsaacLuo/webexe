# usage:
# python replace_codons.py source.gff.json

import json
import time
import sys
import os
import datetime
import hashlib
import argparse

import webexe
import io

import tools

# sys.argv.append( r'D:\git\webexe\api\uploads\1.gff.json')
# sys.argv.append('gene')
# sys.argv.append('1')
# sys.argv.append('0')
# sys.argv.append('kkkk')
# sys.argv.append('NNNNNN')

parser = argparse.ArgumentParser(description='insert parts after given feature type')
parser.add_argument(dest='input_file_name', help='input filename in gff.json format')
parser.add_argument(dest='feature_type', help="feature type, e.g. gene, termiator")
parser.add_argument(dest='direct', help="0: 5`, 1: 3`", type=int)
parser.add_argument(dest='offset', help="how many byte offset after/before the feature", type=int)
parser.add_argument(dest='sequence_type', help='sequence type to insert')
parser.add_argument(dest='sequence', help="sequence to insert")
parser.add_argument('--output', dest='output_file_name', help='output filename in gff.json format')
parser.add_argument('--log', dest='log_file_name', help='log file name', default=webexe.random_file_name(ext='.log'))
parser.add_argument('--ignore-conflict', dest='ignore_conflict', help='turn on to ignore conflicts (overlapped gene)')

args = parser.parse_args()

ext = os.path.splitext(args.input_file_name)[1]
if args.output_file_name:
    output_file_name = args.output_file_name
else:
    output_file_name = webexe.random_file_name(ext=ext)

webexe.log('start task: insert_parts_after_features {} {} {} {} {}'.format(args.input_file_name, args.feature_type, args.direct, args.offset, args.sequence))

sequence_hash = hashlib.md5(args.sequence.encode()).hexdigest()

def in_order(records):
    i=0
    for record in records:
        if i <= record['start']:
            i = record['start']
        else:
            return False
    return True

def mark_features_as_modified(gff_json, start, end, changelog):
    for record in gff_json['records']:
        if not (record['start'] >= end or record['end'] <= start):
            record['__modified'] = True
            record['__changelog'] = changelog

def read_gff_json(gff_json):

    # can handle only one seq
    if len(gff_json['sequence']) > 1:
        raise Exception('can handle only one seq')
    
    whole_sequence = list(gff_json['sequence'].values())[0]

    if 'seqInfos' not in gff_json and 'fasta' in gff_json:
        # generate seqInfos
        gff_json['seqInfos'] = {}
        for seqName in gff_json['fasta']:
            gff_json['seqInfos'][seqName] = {'length':len(gff_json['fasta'][seqName])}

    if 'records' in gff_json:
        original_records = gff_json['records']
        seqKey = list(gff_json['sequence'].keys())[0]

        # sort original_records
        if not in_order(original_records):
            original_records.sort(key=lambda k:k['start'])

        # find all gene and CDS and if any other annotations overlapping gene
        webexe.progress(10, 'looking for target features')
        target_features = [x for x in original_records if x['featureType'] == args.feature_type]
        overlapped_features = []
        insert_poses = []
        new_features = []
        # find conflicts
        webexe.progress(15, 'locating insert poses')

        for feature in target_features:
            if feature['strand'] < 0 and args.direct >=0 or feature['strand'] >=0 and args.direct < 0:
                insert_pos = feature['start'] - args.offset
            else:
                insert_pos = feature['end'] + args.offset
            
            for record in original_records:
                if record['featureType'] != 'unknown' and record['start'] < insert_pos and record['end'] > insert_pos:
                    # overlapping
                    overlapped_features.append((insert_pos, feature,))
                    if args.ignore_conflict:
                        insert_poses.append((insert_pos, feature['strand'],))
                    else:
                        break
            else:
                insert_poses.append((insert_pos, feature['strand'],))

        if len(insert_poses) == 0:
            return (gff_json, insert_poses, overlapped_features, )
        
        insert_poses.sort()
        output_sequence = io.StringIO()
        write_start_pos = 0
        new_feature_offset = 0

        sequence_fragment_len = len(args.sequence)
        len_insert_pos = len(insert_poses)
        progress_counter = webexe.ProgressCounter(60, 85, len_insert_pos)
        for insert_pos, strand in insert_poses:
            progress_counter.count('processing %s'%(insert_pos))

            calibrated_insert_pos = insert_pos + new_feature_offset
            # write original sequence until insert pos
            output_sequence.write(whole_sequence[write_start_pos:insert_pos])
            # write insert sequence
            if strand == -1:
                output_sequence.write(tools.rc(args.sequence))
            else:
                output_sequence.write(args.sequence)

            # generate new features for this
            now_str = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
            new_feature = {          
                "featureType": args.sequence_type,
                "chrName": seqKey,
                "chrId": 0,
                "start": calibrated_insert_pos,
                "end": calibrated_insert_pos + sequence_fragment_len,
                "strand": strand,
                "name": args.sequence_type,
                "original": False,
                "sequenceHash": sequence_hash,
                "__changelog": "inserted {}".format(args.sequence_type),
                "createdAt": now_str,
                "updatedAt": now_str,
                "history": []
            }
            new_features.append(new_feature)
            

            write_start_pos = insert_pos
            # move all features
            for record in original_records:
                if record['start'] < calibrated_insert_pos and record['end'] > calibrated_insert_pos:
                    record['__changelog'] = 'inserted sequence'
                    record['__modified'] = True
                    record['end'] += sequence_fragment_len
                else:
                    if record['start'] >= calibrated_insert_pos:
                        record['start'] += sequence_fragment_len
                        record['__modified'] = True
                        record['__changelog'] = 'moved by inserting sequence'
                    if record['end'] > calibrated_insert_pos:
                        record['end'] += sequence_fragment_len
                        record['__modified'] = True
                        record['__changelog'] = 'moved by inserting sequence'
                if '__modified' in record:
                    record['updatedAt'] = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'

            new_feature_offset += sequence_fragment_len
        output_sequence.write(whole_sequence[write_start_pos:])
        # write back sequence
        
        gff_json['sequence'][seqKey] = output_sequence.getvalue()
        output_sequence.close()

        webexe.progress(85, 'finishing')

        gff_json['__changelog'] = 'inserted sequence after {}'.format(args.feature_type)
        if 'changelog' not in gff_json:
            gff_json['changelog'] = [gff_json['__changelog']]
        else:
            gff_json['changelog'] = [gff_json['__changelog']] + gff_json['changelog']

        gff_json['records'] += new_features
        gff_json['records'].sort(key=lambda x:x['start'])

        return (gff_json, insert_poses, overlapped_features, )
    else:
        raise Exception('cannot find records in this file')

try:
    webexe.progress(0, 'start')
    with open(args.input_file_name, 'r') as f_src, \
        open('results/' + output_file_name, 'w') as f_dst, \
        open('results/' + args.log_file_name,'w') as f_log:
        line_count=0
        webexe.progress(0, 'loading files')
        src_json = json.load(f_src)
        if 'mimetype' in src_json and src_json['mimetype'] == 'application/gffjson':
            new_json, insert_poses, ignored_genes = read_gff_json(src_json)
            webexe.progress(90, 'dumping')
            json.dump(new_json, f_dst)
            webexe.progress(95, 'generating report')
            f_log.write('\n\ninserted pos\n')
            for pos in insert_poses:
                f_log.write('{}\n'.format(pos[0]))
            f_log.write('\n\noverlapping features\n')
            for gene in ignored_genes:
                f_log.write('{}\t{}\t{}\n'.format(gene[1]['name'],gene[1]['start'],gene[1]['end']))
        else:
            raise Exception('unknown file type')
    webexe.progress(100, 'finish')
    webexe.result({'files':[
        {'name':'output'+ext, 'url':output_file_name},
        {'name':'log.txt', 'url':args.log_file_name},
        ]},'finish')
except Exception as err:
    webexe.abort({}, str(err))
    print(str(err), file=sys.stderr)
    raise err