import json
import time
import sys
import webexe
import os

seconds = 10

if len(sys.argv) < 1:
    webexe.message('input file required');
    exit(1)
filename = sys.argv[1]
ext = os.path.splitext(filename)[1]
output_filename = webexe.random_string() + ext
webexe.log('start task')

with open(filename, 'r') as f_src, open('results/' + output_filename,'wb') as f_dst:
    line_count=0
    while True:
        line = f_src.readline()
        if not line:
            break
        webexe.progress(message = 'now doing line {}'.format(line_count), progress=min((line_count/100),0.99))
        f_dst.write(line.replace('\r\n', '\n').encode('utf-8'))
webexe.progress(1.0, 'finish')
webexe.result({'files':[{'name':'output'+ext, 'url':output_filename}]},'finish')
