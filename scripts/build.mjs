import {readFileSync,writeFileSync} from 'node:fs';
let html=readFileSync('src/shell.html','utf8');
for (const [marker,file] of [['CSS','style.css'],['CORE','core.js'],['APP','app.js']]) {
  const source=readFileSync(`src/${file}`,'utf8');
  if (marker!=='CSS' && /<\/script/i.test(source)) throw new Error('Unsafe inline script terminator');
  html=html.replace(`/*__${marker}__*/`,()=>source);
}
writeFileSync('index.html',html);
console.log('Built standalone offline index.html');
