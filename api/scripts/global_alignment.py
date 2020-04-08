import json
import time
import sys
import webexe
import os

from Bio import pairwise2

# Import format_alignment method
from Bio.pairwise2 import format_alignment

# Define two sequences to be aligned
data = input()
webexe.log(data)
data = json.loads(data)


# Get a list of the global alignments between the two sequences ACGGGT and ACG
# No parameters. Identical characters have score of 1, else 0.
# No gap penalties.
alignments = pairwise2.align.globalxx(data['sequence1'], data['sequence2'])

# Use format_alignment method to format the alignments in the list
result = []
for alignment in alignments:
    result.append({
        'align1': alignment[0],
        'align2': alignment[1],
        'score': alignment[2],
        'begin': alignment[3],
        'end': alignment[4],
    })
    break

webexe.result(result)
for a in alignments:
    webexe.log(format_alignment(*a))