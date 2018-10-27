import json
import time
import sys

for i in range(60):
    print(json.dumps({"type":"progress", "message":"now doing {}/{}".format(i,60), "progress":i/60}), flush=True)
    time.sleep(1)
print(json.dumps({"type":"progress", "message":"finish", "progress":1.0}), flush=True)
print(json.dumps({"type":"result", "result":"finish"}), flush=True)