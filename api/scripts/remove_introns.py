# usage:
# python remove_introns.py source.gff.json

import json
import time
import sys
import os
import datetime
import hashlib
import argparse
import webexe
import tools
import functools

from tools import in_order, mark_features_as_modified

parser = argparse.ArgumentParser(description='replace codons from one to another by giving rules')
parser.add_argument(dest='input_file_name', help='input filename in gff.json format')
parser.add_argument('--intron-types', dest='intron_types', help="feature types of introns", nargs='+')
parser.add_argument('--output', dest='output_file_name', help='input filename in gff.json format')
parser.add_argument('--log', dest='log_file_name', help='log file name', default=webexe.random_string() + '.log')
parser.add_argument('--ignore-conflict', dest='ignore_conflict', help='turn on to ignore conflicts (overlapped gene)')

args = parser.parse_args()

ext = os.path.splitext(args.input_file_name)[1]
if args.output_file_name:
    output_file_name = args.output_file_name
else:
    output_file_name = webexe.random_string() + ext

# in case the array parameter parsed as one string
if not args.intron_types or len(args.intron_types) == 0:
    args.intron_types = ['intron']
if len(args.intron_types) == 1 and args.intron_types[0].find(' ')>0:
    args.intron_types = args.intron_types[0].split(' ')

def read_gff_json(gff_json):

    # can handle only one seq
    if gff_json['mimetype'] != 'application/gffjson':
        raise Exception('application/gffjson')
    
    whole_sequence = gff_json['sequence'][gff_json['defaultChr']]

    if 'records' in gff_json:
        original_records = gff_json['records']
        
        # sort original_records
        if not in_order(original_records):
            original_records.sort(key=lambda k:k['start'])

        new_records = [x for x in original_records if x['featureType'] not in args.intron_types]

        # locate introns
        webexe.progress(10, 'looking for introns')
        introns = [x for x in original_records if x['featureType'] in args.intron_types]

        # build new sequence
        webexe.progress(20, 'building new sequence')
        new_sequence = list(whole_sequence)
        for intron in introns:
            for i in range(intron['start'], intron['end']):
                new_sequence[i] = None
        new_sequence = ''.join([x for x in new_sequence if x != None])
        gff_json['sequence'][gff_json['defaultChr']] = new_sequence
        gff_json['seqInfo'][gff_json['defaultChr']]['length'] = len(new_sequence)

        # calculate how many bp need to be subtracted
        # start, end, length, accumlate_offset
        intron_table = [(x['start'], x['end'], x['end']-x['start']) for x in introns]
        # for i in range(1, len(intron_table)):
        #     intron_table[i][3] = intron_table[i-1][3] + intron_table[i-1][2]

        def search_intron_table(start, end):
            # last_i = 0
            moved = False
            for intron in intron_table:
                # just in case a feature start end in intron
                if start > intron[0] and start < intron[1]:
                    start = intron[0]
                if end > intron[0] and end < intron[1]:
                    end = intron[0]
            
            start_offset = 0
            end_offset = 0
            for intron in intron_table:
                if start >= intron[1]:
                    start_offset -= intron[2]
                if end >= intron[1]:
                    end_offset -= intron[2]
            ret_start = start + start_offset
            ret_end = end + end_offset

            if start_offset != 0 or end_offset!= 0:
                moved = True
            return ret_start, ret_end, moved

        # move each record
        webexe.progress(50, 'modifying records')
        for record in new_records:
            new_start, new_end, moved = search_intron_table(record['start'], record['end'])
            if moved:
                record['start'] = new_start
                record['end'] = new_end
                record['__modified'] = True
                record.pop('sequenceHash', None)
                record.pop('sequenceRef', None)
                record.pop('original', None)
                record['sequenceHash'] = tools.get_sequence_hash(gff_json, gff_json['defaultChr'], new_start, new_end, record['strand'])
                record['__changelog'] = 'moved/resized by removing intron'
        
        gff_json['records'] = new_records

        record['__changelog'] = 'removed intron'
        if 'changelog' not in gff_json:
            gff_json['changelog'] = [record['__changelog']]
        else:
            gff_json['changelog'] = [record['__changelog']] + gff_json['changelog']
        
        
        return (gff_json, introns, )
    else:
        raise Exception('cannot find records in this file')

try:
    webexe.progress(0, 'start')
    if not os.path.exists('results'):
        os.makedirs('results')
    with open(args.input_file_name, 'r') as f_src, \
        open('results/' + output_file_name, 'w') as f_dst, \
        open('results/' + args.log_file_name,'w') as f_log:
        line_count=0
        webexe.progress(0, 'loading files')
        src_json = json.load(f_src)
        if 'mimetype' in src_json and src_json['mimetype'] == 'application/gffjson':
            new_json, removed_introns = read_gff_json(src_json)
            webexe.progress(90, 'dumping')
            json.dump(new_json, f_dst)
            webexe.progress(95, 'generating report')
            f_log.write('\n\nremoved_introns\n')
            for intron in removed_introns:
                f_log.write('{}\t{}\t{}\n'.format(intron['name'],intron['start'],intron['end']))
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