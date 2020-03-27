import json

def rc(seq):
    d = {'a':'t', 't':'a', 'c':'g', 'g':'c', 'A':'T', 'T':'A', 'C':'G', 'G':'C', 'n':'n', 'N':'N'}
    return ''.join([d[x] for x in list(seq[::-1])])

class GffJson:
    def __init__(self, gff_json):
        if type(gff_json) == str:
            self.gff = json.loads(gff_json)
        else:
            self.gff = gff_json

    def get_seqeunce(self, record):
        start = record['start']
        end = record['end']
        strand = record['strand']
        chr_name = record['chrName']
        sequence = self.gff['seqeunce'][chr_name][start:end]
        if strand < 0:
            sequence = rc(sequence)