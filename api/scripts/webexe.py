import sys
import json
import random
import string

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