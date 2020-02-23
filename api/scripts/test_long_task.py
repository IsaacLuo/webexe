import json
import time
import sys
import webexe

seconds = 10
if len(sys.argv) > 1:
    seconds = int(sys.argv[1])
webexe.log('start task')
for i in range(seconds):
    webexe.progress(message = 'now doing {}/{}'.format(i,seconds), progress=100*i/seconds)
    webexe.message('counting {}'.format(i) )
    time.sleep(1)
webexe.progress(100, 'finish')
webexe.result({'files':[{'name':'result.txt', 'data':'data:text/html,HelloWorld!'}]},'finished after {} seconds'.format(seconds))
