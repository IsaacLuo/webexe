import sys
import json
import os
import os.path
from read_plate_definition import read_plate_definition, well_name_to_id
from write_plate_definition import write_plate_definition
import string
import random
import posixpath
import time
import webexe

current_dir = os.getcwd()
conf_file_path = os.path.realpath(posixpath.join(current_dir, 'config.dev.json'))
webexe.log(conf_file_path)

with open(conf_file_path) as f:
    temp_path = json.load(f)['tempPath']

params = json.loads(sys.stdin.readline())
webexe.log('now start')
progress = 0.0
webexe.progress(progress)

tasks_count = min(len(params['plateDefinitionIds']), len(params['lightCyclerReportIds']))
progress_step = 1.0/tasks_count/2.0

for i in range(tasks_count):
    pd_id = params['plateDefinitionIds'][i]
    lc_id = params['lightCyclerReportIds'][i]
    # with open() as fpd, open(os.path.join(temp_path, lc_id)) as flc:
    webexe.log('reading {}'.format(posixpath.join(temp_path, pd_id)))
    plate = read_plate_definition(posixpath.join(temp_path, pd_id))
    webexe.log('loading {}'.format(posixpath.join(temp_path, lc_id)))
    # print(json.dumps(plate), file=sys.stderr, flush=True)
    with open(posixpath.join(temp_path, lc_id)) as f:
        lines = f.readlines()[2:]
        lines = [x[:-1].split('\t') for x in lines]
    cols = plate['cols']
    for line in lines:
        well_name = line[2]
        cp = line[4]
        try:
            cp = float(cp)
        except:
            cp = None
        well_id = well_name_to_id(well_name, cols)
        # print(well_id, well_name, file=sys.stderr)
        if plate['content'][well_id]:
            plate['content'][well_id]['cp'] = cp
            if cp:
                plate['content'][well_id]['text'] += ' CP={}'.format(cp)
                plate['content'][well_id]['fill'] = "B0FBB5"
            else:
                plate['content'][well_id]['fill'] = "FBBDB0"
    progress += progress_step
    webexe.progress(progress)
    target_filename = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8)) + '.xlsx'
    webexe.log('writing {}'.format(target_filename))
    write_plate_definition(posixpath.join(temp_path, target_filename), plate)
    progress+=progress_step
    webexe.progress(progress)
    webexe.result({'input':{'plateDefinitionId': pd_id, 'lightCyclerReportId': lc_id}, 'output':target_filename})
    


