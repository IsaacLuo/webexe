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

import tools

# sys.argv.append( r'C:\Users\luoyi\Desktop\chr4.json')
# sys.argv.append('TAG:TAA')
# sys.argv.append('TGA:TAA')

parser = argparse.ArgumentParser(description='replace codons from one to another by giving rules')
parser.add_argument(dest='input_file_name', help='input filename in gff.json format')
parser.add_argument(dest='convert_rules', help="convert rules, in abc:xyz format", nargs='+')
parser.add_argument('--output', dest='output_file_name', help='input filename in gff.json format')
parser.add_argument('--log', dest='log_file_name', help='log file name', default=webexe.random_file_name(ext='.log'))
parser.add_argument('--ignore-conflict', dest='ignore_conflict', help='turn on to ignore conflicts (overlapped gene)')

args = parser.parse_args()

ext = os.path.splitext(args.input_file_name)[1]
if args.output_file_name:
    output_file_name = args.output_file_name
else:
    output_file_name = webexe.random_file_name(ext=ext)

# webexe.log('start task\nreplace codons\n {} {} {}'.format())

if len(args.convert_rules) == 1 and args.convert_rules[0].find(' ')>0:
    args.convert_rules = args.convert_rules[0].split(' ')

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

        # sort original_records
        if not in_order(original_records):
            original_records.sort(key=lambda k:k['start'])

        # find all gene and CDS and if any other annotations overlapping gene
        webexe.progress(10, 'looking for genes')
        genes = [x for x in original_records if x['featureType'] == 'gene']
        cdses = [x for x in original_records if x['featureType'] == 'CDS']
        overlapped_genes = []

        # find conflicts
        # low effecient, need to be improved
        white_list = ['CDS', 'unknown', 'mRNA', 'intron']
        webexe.progress(15, 'finding overlapping genes')
        if not args.ignore_conflict:
            for gene in genes:
                for record in original_records:
                    if record != gene and not (record['start'] >= gene['end'] or record['end'] <= gene['start']):
                        # overlapping
                        if record['featureType'] in white_list:
                            if '__subRecord' not in gene:
                                gene['__subRecord'] = [record]
                            else:
                                gene['__subRecord'].append(record)
                        else:
                            overlapped_genes.append(gene)
                            break
            # remove opverlapped genes from the list
            for gene in overlapped_genes:
                genes.remove(gene)

        # find cds of each gene
        # low effecient, need to be improved
        
        for gene in genes:
            for cds in cdses:
                if cds['start'] >= gene['start'] and cds['end']<=gene['end']:
                    if '__cds' not in gene:
                        gene['__cds'] = [cds]
                    else:
                        gene['__cds'].append(cds)
        
        # replace codons
        rules = {k:v for k,v in [x.upper().split(':') for x in args.convert_rules]}

        len_genes = len(genes)
        progress_counter = webexe.ProgressCounter(20, 60, len_genes)
        for i, gene in enumerate(genes):
            progress_counter.count('converting cds %s/%s'%(i, len_genes))
            if len(gene['__cds']) == 0:
                # no cds? trade gene as cds
                sequence = gff_json['sequence'][gene['chrName']][gene['start']:gene['end']]
            elif len(gene['__cds']) == 1:
                # only one cds
                cds = gene['__cds'][0]
                sequence = gff_json['sequence'][cds['chrName']][cds['start']:cds['end']]
            else:
                # multiple cds
                seqs = []
                for cds in gene['__cds']:
                    seqs.append(gff_json['sequence'][cds['chrName']][cds['start']:cds['end']])
                sequence = ''.join(seqs)
            if gene['strand'] < 0:
                sequence = tools.rc(sequence)
            # now replace codon using rules
            final_sequence = []
            modified = False
            for i in range(0,len(sequence),3):
                codon = sequence[i:i+3].upper()
                if codon in rules:
                    modified = True
                    codon = rules[codon]
                final_sequence.append(codon)

            if modified:
                final_sequence = ''.join(final_sequence)
                # gene['sequence'] = sequence
                gene['__modified'] = True
                if gene['strand'] < 0:
                    gene['__sequence'] = tools.rc(final_sequence)
                else:
                    gene['__sequence'] = final_sequence

        # write back sequence
        pointer = 0
        sequence_fragements = []
        progress_counter = webexe.ProgressCounter(60, 80, len_genes)
        for i,gene in enumerate(genes):
            progress_counter.count('writing sequence %s/%s'%(i,len_genes))
            # gene must in order
            if pointer < gene['start']:
                sequence_fragements.append(whole_sequence[pointer:gene['start']])
                pointer = gene['start']
            if pointer == gene['start']:
                if '__modified' in gene:
                    if '__cds' in gene and len(gene['__cds']) > 1:
                        base_pair_used = 0
                        for cds in gene['__cds']:
                            if pointer < cds['start']:
                                sequence_fragements.append(whole_sequence[pointer : cds['start']])
                                pointer = cds['start']
                            if pointer == cds['start']:
                                base_pair_to_use = cds['end'] - cds['start']
                                cds_seq = gene['__sequence'][base_pair_used:base_pair_used + base_pair_to_use]
                                ori_seq = whole_sequence[cds['start'] : cds['end']]
                                if cds_seq != ori_seq:
                                    cds['__modified'] = True
                                    # mark all overlapped features as "modified"
                                    mark_features_as_modified(gff_json, cds['start'], cds['end'], 'codon replaced {}'.format(rules))
                                sequence_fragements.append(cds_seq)
                                base_pair_used += base_pair_to_use
                                pointer = cds['end']
                    else:
                        sequence_fragements.append(gene['__sequence'])
                        if '__cds' in gene:
                            gene['__cds'][0]['__modified'] = True
                            gene['__cds'][0]['__changelog'] = 'codon replaced {}'.format(rules)
                            gene['__changelog'] = 'codon replaced {}'.format(rules)
                else:
                    sequence_fragements.append(whole_sequence[gene['start']:gene['end']])
                pointer = gene['end']
        else:
            #write rest part into sequence
            sequence_fragements.append(whole_sequence[pointer:])


        seqKey = list(gff_json['sequence'].keys())[0]
        gff_json['sequence'][seqKey] = ''.join(sequence_fragements)

        count=0
        for i in range(len(gff_json['sequence'][seqKey])):
            if whole_sequence[i] != gff_json['sequence'][seqKey][i]:
                count+=1

        gff_json['__changelog'] = 'codon replaced {}'.format(rules)
        if 'changelog' not in gff_json:
            gff_json['changelog'] = []
        gff_json['changelog'].insert(0, gff_json['__changelog'])

        # clean unnecesary attributes
        webexe.progress(85, 'cleaning')
        updatedAt = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
        for record in gff_json['records']:
            if '__modified' in record and record['__modified'] == True:
                record.pop('sequenceHash', None)
                record.pop('sequenceRef', None)
                record.pop('original', None)
            record.pop('__sequence', None)
            record.pop('__cds', None)
            record.pop('__subRecord', None)
            record['updatedAt'] = updatedAt
            record['sequenceHash'] = tools.get_sequence_hash(gff_json, record['chrName'], record['start'], record['end'], record['strand'])

        return (gff_json, genes, overlapped_genes, )
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
            new_json, modified_genes, ignored_genes = read_gff_json(src_json)
            webexe.progress(90, 'dumping')
            json.dump(new_json, f_dst)
            webexe.progress(95, 'generating report')
            f_log.write('modified genes\n')
            for gene in modified_genes:
                f_log.write('{}\t{}\t{}\n'.format(gene['name'],gene['start'],gene['end']))
            f_log.write('\n\nignored genes\n')
            for gene in ignored_genes:
                f_log.write('{}\t{}\t{}\n'.format(gene['name'],gene['start'],gene['end']))
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