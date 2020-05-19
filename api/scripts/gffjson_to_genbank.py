# usage:
# python remove_introns.py source.gff.json
from Bio import SeqIO
from Bio.SeqFeature import SeqFeature, FeatureLocation
from Bio.Seq import Seq
from Bio.SeqRecord import SeqRecord
from Bio.Alphabet import DNAAlphabet
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
parser.add_argument('--output', dest='output_file_name', help='input filename in gff.json format')

args = parser.parse_args()

ext = os.path.splitext(args.input_file_name)[1]
if args.output_file_name:
    output_file_name = args.output_file_name
else:
    output_file_name = webexe.random_file_name(ext='gb')

def read_gff_json(gff_json):

    # can handle only one seq
    if gff_json['mimetype'] != 'application/gffjson':
        raise Exception('application/gffjson')
    
    whole_sequence = gff_json['sequence'][gff_json['defaultChr']]
    whole_sequence = Seq(whole_sequence, DNAAlphabet())

    if 'records' in gff_json:
        original_records = gff_json['records']
        
        # sort original_records
        if not in_order(original_records):
            original_records.sort(key=lambda k:k['start'])
        features = [
            SeqFeature(
                FeatureLocation(
                    x['start'],
                    x['end'],
                    strand=x['strand'],
                ),
            type=x['featureType'],
            id=x['_id'] if '_id' in x else webexe.random_string(),
            qualifiers=x['attribute']
            ) for x in original_records
        ]
        seqRecord = SeqRecord(whole_sequence, features=features)
        return seqRecord
    else:
        raise Exception('cannot find records in this file')

try:
    webexe.progress(0, 'start')
    if not os.path.exists('results'):
        os.makedirs('results')
    with open(args.input_file_name, 'r') as f_src, \
        open('results/' + output_file_name, 'w') as f_dst:

        line_count=0
        webexe.progress(0, 'loading files')
        src_json = json.load(f_src)
        if 'mimetype' in src_json and src_json['mimetype'] == 'application/gffjson':
            seqRecord = read_gff_json(src_json)
            webexe.progress(90, 'dumping')
            SeqIO.write(seqRecord, f_dst, 'genbank')
        else:
            raise Exception('unknown file type')
    webexe.progress(100, 'finish')
    webexe.result({'files':[
        {'name':'output'+ext, 'url':output_file_name},
        ]},'finish')
except Exception as err:
    webexe.abort({}, str(err))
    print(str(err), file=sys.stderr)
    raise err