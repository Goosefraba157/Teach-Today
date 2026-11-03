#!/usr/bin/env python3
"""Prepare a device-import library from privately held English POR booklets.
Requires pypdf, Pillow, and tesseract. Never writes source text to tracked paths.
"""
import argparse, base64, concurrent.futures, difflib, hashlib, io, json, os, re, subprocess
from pathlib import Path
from pypdf import PdfReader


def ocr(image):
    data = io.BytesIO(); image.save(data, format='PNG')
    result = subprocess.run(['tesseract', 'stdin', 'stdout', '--psm', '6'], input=data.getvalue(), stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, check=True, env={**os.environ, 'OMP_THREAD_LIMIT':'1'})
    return result.stdout.decode().strip()


def norm(text):
    return re.findall(r"[a-z0-9]+(?:['’][a-z0-9]+)*", text.lower().replace('’', "'"))


def extract(job):
    grade, page_number, student, teacher, output = job
    # These scan crops retain title and passage, excluding form header/footer,
    # administration directions, and the teacher's blank recording fields.
    def crop(im, box): return im.crop(tuple(round(v * (im.width if i%2==0 else im.height)) for i,v in enumerate(box)))
    header = ocr(crop(student, (.70,.052,.92,.083)))
    match = re.search(r'Form\s*(\d+)', header, re.I)
    if not match: raise ValueError(f'Could not identify form on grade {grade}, page {page_number}: {header}')
    form = int(match.group(1))
    sim = crop(student, (.095,.092,.91,.922))
    tim = crop(teacher, (.10,.423,.56,.918))
    st, tt = ocr(sim), ocr(tim)
    lines = st.splitlines(); title = lines.pop(0).strip()
    body = '\n'.join(lines).strip()
    safe_id = f'star-por-en-g{grade}-f{form:02}'
    # Keep a private facsimile for the teacher to verify OCR before assessment.
    image = io.BytesIO(); preview=sim.copy(); preview.thumbnail((1100,1800)); preview.save(image, format='JPEG', quality=65, optimize=True)
    row = dict(id=safe_id, grade=grade, form=form, title=title, text=body, language='en',
        sourcePage=page_number, sourceLabel=f'POR-G{grade}: Form {form:02}',
        sourceImage='data:image/jpeg;base64,'+base64.b64encode(image.getvalue()).decode(),
        crossCheck=norm(st)==norm(tt), verified=False,
        sourceHash=hashlib.sha256(sim.tobytes()).hexdigest())
    (output / (safe_id+'.json')).write_text(json.dumps(dict(student=st,teacher=tt,diff=list(difflib.unified_diff(norm(tt),norm(st),n=2))),ensure_ascii=False))
    return row


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source',type=Path)
    parser.add_argument('--output',type=Path,default=Path('private-input/star-cbm-english-library.json'))
    parser.add_argument('--corrections',type=Path,help='Optional private, source-hash-matched text corrections')
    args=parser.parse_args()
    if 'private-input' not in args.output.resolve().parts:
        parser.error('Output must be under ignored private-input/.')
    work=args.output.parent/'star-cbm-work'; work.mkdir(parents=True,exist_ok=True)
    jobs=[]
    for grade in range(1,7):
        s=PdfReader(next(args.source.glob(f'POR-G{grade}-S*.pdf')))
        t=PdfReader(next(args.source.glob(f'POR-G{grade}-T*.pdf')))
        if len(s.pages)!=22 or len(t.pages)!=22: raise ValueError('Expected cover, blank, and 20 matching forms')
        for form in range(1,21):
            jobs.append((grade,form+2,s.pages[form+1].images[0].image.copy(),t.pages[form+1].images[0].image.copy(),work))
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        passages=list(pool.map(extract,jobs))
    if len({p['id'] for p in passages}) != len(passages): raise ValueError('Duplicate printed form IDs; inspect booklets before import')
    if args.corrections:
        corrections=json.loads(args.corrections.read_text())
        for p in passages:
            fix=corrections.get(p['id'])
            if fix:
                if fix['sourceHash'] != p['sourceHash']: raise ValueError('Correction source hash differs')
                p['title'],p['text']=fix['title'],fix['text']
                p['crossCheck']=False
    args.output.write_text(json.dumps(dict(format='teach-today-fluency-library-v1',language='en',passages=passages),ensure_ascii=False))
    print(json.dumps(dict(passages=len(passages),crossChecked=sum(p['crossCheck'] for p in passages),output=str(args.output))))

if __name__=='__main__':main()
