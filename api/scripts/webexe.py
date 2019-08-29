import sys
import json

def log(message):
    print(json.dumps({'type':'log', 'message': message}), file=sys.stderr, flush=True)

def stdout(message):
    print(json.dumps({'type':'stdout', 'message': message}), file=sys.stderr, flush=True)

def stderr(message):
    print(json.dumps({'type':'stderr', 'message': message}), file=sys.stderr, flush=True)

def progress(progress, message=''):
    print(json.dumps({'type':'progress', 'progress': progress, 'message': message}), file=sys.stderr, flush=True)

def result(data, message=''):
    print(json.dumps({'type':'result', 'data':data, 'message': message}), file=sys.stderr, flush=True)