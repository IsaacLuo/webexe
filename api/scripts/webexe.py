import sys
import json
import random
import string

# message types to stdout
# log, any string message to tell client
# progress, show the percentage, 0-100
# result, put any object in data
# abort, exit code

def log(message):
    print(message, file=sys.stderr, flush=True)

def message(message):
    print(json.dumps({'type':'log', 'message': message}), file=sys.stdout, flush=True)

def progress(progress, message=''):
    print(json.dumps({'type':'progress', 'progress': progress, 'message': message}), file=sys.stdout, flush=True)

def result(data, message=''):
    print(json.dumps({'type':'result', 'data':data, 'message': message}), file=sys.stdout, flush=True)

def abort(data, message=''):
    print(json.dumps({'type':'abort', 'data':data, 'message': message}), file=sys.stdout, flush=True)

def random_string(stringLength=10):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(stringLength))