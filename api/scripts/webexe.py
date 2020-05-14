import sys
import json
import random
import string
import datetime

# message types to stdout
# log, any string message to tell client
# progress, show the percentage, 0-100
# result, put any object in data
# abort, exit code

def log(message):
    print(message, file=sys.stderr, flush=True)

def message(message):
    print(json.dumps({'type':'message', 'data': message}), file=sys.stdout, flush=True)

def progress(progress, message=''):
    print(json.dumps({'type':'progress', 'data': progress, 'message': message}), file=sys.stdout, flush=True)

def result(data, message=''):
    print(json.dumps({'type':'result', 'data':data, 'message': message}), file=sys.stdout, flush=True)

def abort(data, message=''):
    print(json.dumps({'type':'abort', 'data':data, 'message': message}), file=sys.stdout, flush=True)

def random_string(stringLength=10):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(stringLength))

def random_file_name(**kwargs):
    file_name = '{}_{}'.format(datetime.datetime.now().strftime('%Y_%m_%d_%H_%M_%S'), random_string(5))
    if 'ext' in kwargs:
        if kwargs['ext'][0] == '.':
            return file_name + kwargs['ext']
        else:
            return file_name + ('.' + kwargs['ext'])

class ProgressCounter:
    def __init__(self, min_val, max_val, total, step=1):
        self.min_val = min_val
        self.max_val = max_val
        self.step = step
        self.count_times = 0
        self.total = total
        self.last_count = min_val
    
    def count(self, message, progress_step=1):
        self.count_times += progress_step
        current_count = self.count_times * (self.max_val - self.min_val) // self.total + self.min_val
        if current_count >= self.last_count + self.step:
            self.last_count = current_count
            progress(current_count, message)
            
