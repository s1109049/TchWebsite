import {readFileSync,writeFileSync} from 'node:fs';
let html=readFileSync('src/shell.html','utf8');
const fontFaces = [['Regular',400],['ExtraBold',800]].map(([name,weight]) => {
  const font=readFileSync(`src/fonts/MPLUSRounded1c-${name}.woff`).toString('base64');
  return `@font-face{font-family:'M PLUS Rounded 1c';font-style:normal;font-weight:${weight};font-display:swap;src:url(data:font/woff;base64,${font}) format('woff');}`;
}).join('\n');
html=html.replace('/*__FONTS__*/',()=>fontFaces+'\n/* M PLUS Rounded 1c · Copyright 2016 The Rounded M+ Project Authors. SIL Open Font License 1.1. See font-license below. */');
// The complete license travels with every self-contained HTML export.
html=html.replace('</head>',()=>`<script type="text/plain" id="font-license">${readFileSync('src/fonts/OFL.txt','utf8')}</script>\n</head>`);
for (const [marker,file] of [['CSS','style.css'],['CORE','core.js'],['APP','app.js']]) {
  const source=readFileSync(`src/${file}`,'utf8');
  if (marker!=='CSS' && /<\/script/i.test(source)) throw new Error('Unsafe inline script terminator');
  html=html.replace(`/*__${marker}__*/`,()=>source);
}
writeFileSync('index.html',html);
console.log('Built standalone offline index.html');
