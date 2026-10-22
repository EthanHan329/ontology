from pathlib import Path
from html.parser import HTMLParser
import re
import json
import sqlite3
root=Path(__file__).resolve().parents[1]
class Check(HTMLParser):
 def handle_starttag(self,tag,attrs):
  attrs=dict(attrs)
  for key in ('href','src'):
   value=attrs.get(key,'')
   if value and not value.startswith(('http','#','mailto:')):
    assert (root/'dist'/value).is_file(),value
Check().feed((root/'dist/index.html').read_text())
app='\n'.join(f.read_text() for f in (root/'dist').glob('*.js'))
for ref in re.findall(r'href="(docs/[^"#]+)"',app):
 assert (root/'dist'/ref).is_file(),ref
for f in (root/'dist/docs').glob('*.md'):
 for label,path in re.findall(r'\[([^\]]+)\]\(([^)]+)\)',f.read_text()):
  if not path.startswith(('http','#')):
   assert (f.parent/path).is_file(),(f.name,path)
assert {f.name for f in (root/'dist/docs').glob('*.md')}=={'AGENTIC_BANKING.md','DEMO_SCRIPT.md','IMPLEMENTATION.md','RESEARCH.md','STUDY_GUIDE.md','ONTOLOGY_ENGINEERING_HANDBOOK.md'}
handbook=(root/'dist/docs/ONTOLOGY_ENGINEERING_HANDBOOK.md').read_text()
assert len(re.findall(r'^~~~',handbook,re.M))%2==0
for block in re.findall(r'~~~json\n(.*?)\n~~~',handbook,re.S):
 json.loads(block)
sql_blocks=re.findall(r'~~~sql\n(.*?)\n~~~',handbook,re.S)
assert len(sql_blocks)==5
with sqlite3.connect(':memory:') as db:
 db.executescript(sql_blocks[0])
 assert db.execute(sql_blocks[1]).fetchall()==[(160000,11500,90000,58500,8500,1)]
 assert db.execute(sql_blocks[2]).fetchall()==[]
 db.executescript(sql_blocks[3])
 assert db.execute(sql_blocks[4]).fetchall()==[(150000,48500,-1500,0)]
 assert db.execute('PRAGMA foreign_key_check').fetchall()==[]
retired=re.compile(r'supply.chain|shipment|inventory|Rotterdam|Meridian|ORD-104|reallocat|\b(?:ERP|WMS|TMS)\b',re.I)
learning_files=[root/'README.md',root/'dist/index.html',*list((root/'dist').glob('*.js')),*list((root/'dist/docs').glob('*.md'))]
for f in learning_files:
 assert not retired.search(f.read_text()),('Retired domain remains',f.name)
assert 'connect-src \'none\'' in (root/'dist/index.html').read_text()
assert not re.search(r'\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(',app)
assert not re.search(r'@import|url\(\s*[\'\"]?https?://',(root/'dist/style.css').read_text())
assert not (root/'.openai/hosting.json').exists()
assert 'art_v2_' not in ''.join(f.read_text() for f in (root/'dist').rglob('*') if f.is_file())
print('Artifact checks passed: local assets, Markdown links, six banking documents, handbook SQL/JSON examples, banking-only content, offline runtime restrictions and credential exclusion.')
