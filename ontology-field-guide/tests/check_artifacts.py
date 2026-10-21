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
app=(root/'dist/app.js').read_text()
for ref in re.findall(r'href="(docs/[^"#]+)"',app):
 assert (root/'dist'/ref).is_file(),ref
for f in (root/'dist/docs').glob('*.md'):
 for label,path in re.findall(r'\[([^\]]+)\]\(([^)]+)\)',f.read_text()):
  if not path.startswith(('http','#')):
   assert (f.parent/path).is_file(),(f.name,path)
assert len(list((root/'dist/docs').glob('*.md')))==4
assert 'art_v2_' not in ''.join(f.read_text() for f in (root/'dist').rglob('*') if f.is_file())
print('Artifact checks passed: local assets, Markdown links, document set, credential exclusion.')
