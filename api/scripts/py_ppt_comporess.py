import json
import time
import webexe

import sys
import zipfile
from py_ppt_comporess import conf
import os
import datetime
import re
import subprocess
import shutil

if len(sys.argv) > 1:
    ppt_file_name = sys.argv[1]
else:
    webexe.log('usage: python3 main.py your_slides.pptx')

def main(ppt_file_name, output_filename):
    webexe.log('prara {} {}'.format(ppt_file_name, output_filename))
    tmp_dir = os.path.abspath(conf.TMP_DIR)
    tmp_dir = os.path.join(tmp_dir, os.path.split(ppt_file_name)[1]+'_'+datetime.datetime.now().strftime('%Y%m%d%H%M%S.%f'))
    os.mkdir(tmp_dir)
    webexe.progress(message = 'extracting files', progress=0.1)
    with zipfile.ZipFile(ppt_file_name, 'r') as zip_ref:
        zip_ref.extractall(tmp_dir)
    webexe.progress(message = 'converting pictures', progress=0.2)
    media_folder = os.path.join(tmp_dir,'ppt','media')
    media_files = os.listdir(media_folder)

    target_media_file_name_re = re.compile(r'\.(emf|tiff)$')

    media_files = [x for x in media_files if target_media_file_name_re.findall(x) != []]

    converted_file_names = []
    
    total_files = len(media_files)
    file_count=0

    for media_file_name in media_files:
        file_count+=1
        webexe.progress(message = 'converting {}'.format(media_file_name), progress=0.2+file_count/total_files*0.6)
        webexe.log(media_file_name)
        fn1, fn2 = os.path.splitext(media_file_name)
        # fn2_dst = '.jpg' if fn2 == '.emf' else '.png'
        # fn2_dst = '.png'
        fn2_dst = '.jpg'
        if fn2 == '.emf':

            convert_result = subprocess.call([
                os.path.join(conf.IMAGE_MAGIC_DIR, 'unoconv'),
                '-f',
                'pdf',
                '-o',
                os.path.join(media_folder, fn1 + '.pdf'),
                os.path.join(media_folder, media_file_name),
                ])
            
            if convert_result == 0:
                convert_result = subprocess.call([
                    os.path.join(conf.IMAGE_MAGIC_DIR, 'pdfimages'),
                    os.path.join(media_folder, fn1 + '.pdf'),
                    os.path.join(media_folder, fn1 + '-ppm'),
                    ])
            if convert_result == 0:
                convert_result = subprocess.call([
                    os.path.join(conf.IMAGE_MAGIC_DIR, 'convert'),
                    os.path.join(media_folder, fn1 + '-ppm-000.ppm'),
                    os.path.join(media_folder, fn1+fn2_dst),
                    ])

            subprocess.call('rm {}'.format(os.path.join(media_folder, fn1 + '-ppm-*').replace(' ', '\ ')), shell=True)
            subprocess.call('rm {}'.format(os.path.join(media_folder, fn1 + '.pdf').replace(' ', '\ ')), shell=True)

        else:
            webexe.log('"{}" "{}" "{}"'.format(
                os.path.join(conf.IMAGE_MAGIC_DIR, 'convert'),
                os.path.join(media_folder, media_file_name),
                os.path.join(media_folder, fn1+fn2_dst)))

            convert_result = subprocess.call('"{}" "{}" "{}"'.format(
                os.path.join(conf.IMAGE_MAGIC_DIR, 'convert'),
                os.path.join(media_folder, media_file_name),
                os.path.join(media_folder, fn1+fn2_dst)))
        if convert_result == 0:
            os.remove(os.path.join(media_folder, media_file_name))
            converted_file_names.append((media_file_name, fn1+fn2_dst, re.compile('media/'+media_file_name), 'media/'+fn1+fn2_dst))

    # search xml to change all pictures path
    res_folder = os.path.join(tmp_dir,'ppt','slides', '_rels')

    webexe.progress(message = 'rewriting index', progress=0.8)
    total_files = len(os.listdir(res_folder))
    file_count=0

    for file_name in os.listdir(res_folder):
        text = ''
        webexe.progress(message = 'rewriting {}'.format(file_name), progress=0.8+file_count/total_files*0.09)
        webexe.log(file_name)
        with open(os.path.join(res_folder, file_name), 'r+', encoding='utf-8') as f:
            text = f.read()
            for item in converted_file_names:
                text = item[2].sub(item[3], text)
            f.seek(0)
            f.truncate()
            f.write(text)


    def dfs_get_zip_file(input_path,result):
        files = os.listdir(input_path)
        for file in files:
            if os.path.isdir(input_path+'/'+file):
                dfs_get_zip_file(input_path+'/'+file,result)
            else:
                result.append(input_path+'/'+file)

    def zip_path(input_path,output_path,output_name):
        f = zipfile.ZipFile(output_path+'/'+output_name,'w',zipfile.ZIP_DEFLATED)
        filelists = []
        dfs_get_zip_file(input_path,filelists)
        for file in filelists:
            f.write(file)
        f.close()
        return output_path+r"/"+output_name

    webexe.progress(message = 'creating files', progress=0.9)
    # ppt_path, ppt_name = os.path.split(ppt_file_name)
    ori_dir = os.path.abspath(os.curdir)
    os.chdir(tmp_dir)
    zip_path('.',os.path.join(ori_dir, 'results/') , output_filename)
    os.chdir(ori_dir)
    webexe.progress(message = 'cleaning', progress=0.95)
    shutil.rmtree(tmp_dir)

if len(sys.argv) < 1:
    webexe.message('input file required');
    exit(1)

filename = sys.argv[1]
ext = os.path.splitext(filename)[1]
output_filename = webexe.random_string() + ext
webexe.log('start task')
main(filename, output_filename)
webexe.progress(1.0, 'finish')
webexe.result({'files':[{'name':'output'+ext, 'url':output_filename}]},'finish')
