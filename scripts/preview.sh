#!/bin/bash
# Build the static preview (sample data) into preview/ for publishing as an artifact.
set -e
cd "$(dirname "$0")/.."
rm -rf out preview
STATIC_EXPORT=1 NEXT_PUBLIC_STATIC=1 npx next build >/dev/null
mkdir -p preview && mv out preview/site
cd preview/site
rm -rf 404 404.html favicon.ico gtadb/tiles/3 gtadb/tiles/4 gtadb/tiles/5; find . -name "*.txt" -delete
mv _next nx
python3 - <<'P'
import os,re,glob
for f in glob.glob('**/*.html',recursive=True):
    depth=f.count('/')
    s=open(f,encoding='utf-8').read()
    base=('<script>(function(){var u=location.href.split(/[?#]/)[0].replace(/[^/]*$/,"");'
          'for(var i=0;i<%d;i++)u=u.replace(/[^/]+\\/$/,"");document.write(\'<base href="\'+u+\'">\')})()</script>')%depth
    s=s.replace('<head>','<head>'+base,1)
    s=s.replace('"/_next/','"nx/').replace('"/media/','"media/')
    open(f,'w',encoding='utf-8').write(s)
for f in glob.glob('nx/**/*.js',recursive=True)+glob.glob('nx/**/*.css',recursive=True):
    s=open(f,encoding='utf-8',errors='strict').read()
    s=s.replace('"/_next/','"nx/').replace('"/media/','"media/').replace('`/media/','`media/').replace('url(/_next/','url(../../')
    s=s.replace('�','\\uFFFD')
    open(f,'w',encoding='utf-8').write(s)
P
# drop media nothing references
for f in $(find media -type f); do grep -rqF "${f#media/}" . --include=*.html --include=*.js || grep -rqF "$(basename ${f%.*})" nx || rm "$f"; done
cd ..
cat > index.html <<'H'
<title>Leonida Live</title>
<style>html,body{height:100%;margin:0;background:#eef0ea}iframe{display:block;width:100%;height:100%;border:0}</style>
<iframe src="site/index.html" title="Leonida Live"></iframe>
H
find site -type f | wc -l
