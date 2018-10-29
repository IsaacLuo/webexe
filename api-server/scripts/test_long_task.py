import json
import time
import sys

seconds = 10
print(json.dumps({'x':'hello world'}), file=sys.stderr)
for i in range(seconds):
    print(json.dumps({"type":"progress", "message":"now doing {}/{}".format(i,seconds), "progress":i/seconds}), flush=True)
    time.sleep(1)
print(json.dumps({"type":"progress", "message":"finish", "progress":1.0}), flush=True)
print(json.dumps({"type":"result", "result":"finish"}), flush=True)