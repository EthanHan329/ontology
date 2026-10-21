from pathlib import Path
from html.parser import HTMLParser
import re
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
assert len(list((root/'dist/docs').glob('*.md')))==5
retired=re.compile(r'supply.chain|shipment|inventory|Rotterdam|Meridian|ORD-104|reallocat|\b(?:ERP|WMS|TMS)\b',re.I)
learning_files=[root/'README.md',root/'dist/index.html',*list((root/'dist').glob('*.js')),*list((root/'dist/docs').glob('*.md'))]
for f in learning_files:
 assert not retired.search(f.read_text()),('Retired domain remains',f.name)
assert 'connect-src \'none\'' in (root/'dist/index.html').read_text()
assert not re.search(r'\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(',app)
assert not re.search(r'@import|url\(\s*[\'\"]?https?://',(root/'dist/style.css').read_text())
assert not (root/'.openai/hosting.json').exists()
assert 'art_v2_' not in ''.join(f.read_text() for f in (root/'dist').rglob('*') if f.is_file())
print('Artifact checks passed: local assets, Markdown links, five banking documents, banking-only content, offline runtime restrictions and credential exclusion.')
