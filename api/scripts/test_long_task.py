import json
import time
import sys
import webexe

seconds = 10
webexe.log('start task')
for i in range(seconds):
    webexe.progress(message = 'now doing {}/{}'.format(i,seconds), progress=i/seconds)
    time.sleep(1)
webexe.progress(1.0, 'finish')
webexe.result('finish')
