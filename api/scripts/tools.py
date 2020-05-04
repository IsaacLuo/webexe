import hashlib

def md5(seq):
    return hashlib.md5(seq.encode()).hexdigest()

def rc(seq):
    d = {'a':'t', 't':'a', 'c':'g', 'g':'c', 'A':'T', 'T':'A', 'C':'G', 'G':'C', 'n':'n', 'N':'N'}
    return ''.join([d[x] for x in list(seq[::-1])])

def get_sequence(gff_json, chr_name, start, end, strand):
    seq = gff_json['sequence'][chr_name][start:end]
    if strand == -1 or strand == '-':
        seq = rc(seq)
    return seq

def get_sequence_hash(gff_json, chr_name, start, end, strand):
    return md5(get_sequence(gff_json, chr_name, start, end, strand))

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