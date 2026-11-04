#!/usr/bin/env python3
"""Bundle the teacher-authorized English POR curriculum, excluding all student data.
The source library remains in private-input/. Only passages and exact blank student
pages are emitted. Original booklets are never modified or copied into runtime.
"""
import argparse,hashlib,json,re
from pathlib import Path
from pypdf import PdfReader
from PIL import Image

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('booklets',type=Path);p.add_argument('--library',type=Path,default=Path('private-input/star-cbm-english-library.json'));a=p.parse_args()
 source=json.loads(a.library.read_text());out=Path('assets/reading-fluency');out.mkdir(parents=True,exist_ok=True)
 readers={g:PdfReader(next(a.booklets.glob(f'POR-G{g}-S*.pdf'))) for g in range(1,7)}
 rows=[]
 for passage in source['passages']:
  page=readers[passage['grade']].pages[passage['sourcePage']-1].images[0].image.convert('RGB')
  path=out/(passage['id']+'.webp');page.save(path,format='WEBP',lossless=True,method=6)
  with Image.open(path) as readback:
   if readback.convert('RGB').tobytes()!=page.tobytes():raise ValueError('Page pixels differ')
  rows.append({k:passage[k] for k in ['id','grade','form','title','text','sourcePage','sourceLabel','sourceHash']}|dict(language='en',imagePath=path.as_posix(),pageWidth=page.width,pageHeight=page.height,verified=True,builtin=True,edition='20261103-pdf-2'))
 manifest=dict(edition='20261103-pdf-2',passages=rows)
 Path('reading-fluency-library.js').write_text('/* Built-in English passage curriculum. No student records. */\nglobalThis.TeachTodayFluencyLibrary = '+json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+';\n')
 worker=Path('service-worker.js');section='// BEGIN BUILTIN FLUENCY PAGES\nconst FLUENCY_PAGES = '+json.dumps(['./'+r['imagePath'] for r in rows],indent=2)+';\n// END BUILTIN FLUENCY PAGES'
 worker.write_text(re.sub(r'// BEGIN BUILTIN FLUENCY PAGES.*?// END BUILTIN FLUENCY PAGES',lambda _:section,worker.read_text(),flags=re.S))
 print(json.dumps(dict(passages=len(rows),grades={g:sum(r['grade']==g for r in rows) for g in range(1,7)},imageBytes=sum(f.stat().st_size for f in out.glob('*.webp')),allPagesPixelVerified=True)))
if __name__=='__main__':main()
