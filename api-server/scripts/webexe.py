import sys
import json

def log(message):
    print(message, file=sys.stderr, flush=True)

def message(message):
    print(json.dumps({'type':'log', 'message': message}), file=sys.stderr, flush=True)

def progress(progress, message=''):
    print(json.dumps({'type':'progress', 'progress': progress, 'message': message}), file=sys.stdout, flush=True)

def result(data, message=''):
    print(json.dumps({'type':'result', 'data':data, 'message': message}), file=sys.stdout, flush=True)