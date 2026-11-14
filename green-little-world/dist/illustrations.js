const paths = {
 volume:'<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
 muted:'<path d="M11 5 6 9H3v6h3l5 4zM16 9l5 6m0-6-5 6"/>',
 sliders:'<path d="M4 7h7m4 0h5M4 17h3m4 0h9"/><circle cx="13" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4m0-15.6-1.4 1.4M5.6 18.4l-1.4 1.4"/>',
 sprout:'<path d="M12 21v-9M12 15C5 15 3 11 3 6c6 0 9 3 9 9Zm0-3c0-6 3-9 9-9 0 6-3 9-9 9Z"/>',
 recycle:'<path d="m8 6 2-3a2 2 0 0 1 3.5 0l3 5m-1-4 1 4-4 .3M18 11l3 5a2 2 0 0 1-1.7 3H14m3-3-3 3 3 3M10 19H4.7A2 2 0 0 1 3 16l3-5m-4 1 4-1 1 4"/>',
 rotate:'<path d="M3 10a9 9 0 1 1 1 7M3 4v6h6"/>',
 hand:'<path d="M8 13V5a2 2 0 0 1 4 0v6-1a2 2 0 0 1 4 0v1a2 2 0 0 1 4 0v6c0 4-3 5-6 5h-2c-2 0-3-1-4-3l-3-5a2 2 0 0 1 3-2l2 2"/>',
 sparkle:'<path d="m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3Z"/>',
 arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
 heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
 leaf:'<path d="M20 3C6 2 1 9 6 16s17 4 14-13ZM4 22 17 7"/>',
 smile:'<circle cx="12" cy="12" r="9"/><path d="M8 14c1 3 7 3 8 0M8 9h.01M16 9h.01"/>',
 check:'<path d="m5 12 4 4L19 6"/>'
};
const icon = key => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[key] || paths.sparkle}</svg>`;
const art = key => {
 const flower = '<path d="M50 86V44" stroke="#6b9251" stroke-width="5" stroke-linecap="round"/><path d="M48 72C27 74 26 59 27 59c17-2 21 13 21 13M52 63c19-2 22-15 22-15-18-1-22 15-22 15" fill="#91ad67"/><g fill="#e8a1a7"><ellipse cx="50" cy="25" rx="10" ry="17"/><ellipse cx="50" cy="25" rx="10" ry="17" transform="rotate(60 50 40)"/><ellipse cx="50" cy="25" rx="10" ry="17" transform="rotate(120 50 40)"/><ellipse cx="50" cy="25" rx="10" ry="17" transform="rotate(180 50 40)"/><ellipse cx="50" cy="25" rx="10" ry="17" transform="rotate(240 50 40)"/><ellipse cx="50" cy="25" rx="10" ry="17" transform="rotate(300 50 40)"/></g><circle cx="50" cy="40" r="12" fill="#edbf57"/><ellipse cx="50" cy="89" rx="19" ry="4" fill="#aebd8c" opacity=".35"/>';
 const tree = '<ellipse cx="50" cy="90" rx="27" ry="5" fill="#b4c499" opacity=".4"/><path d="M44 88V39h12v49z" fill="#a67c54"/><path d="m50 64-14-14m15 6 13-15" stroke="#a67c54" stroke-width="7" stroke-linecap="round"/><circle cx="31" cy="40" r="20" fill="#76995e"/><circle cx="67" cy="39" r="22" fill="#6c9056"/><circle cx="49" cy="25" r="24" fill="#89aa6c"/><circle cx="41" cy="39" r="20" fill="#85a567"/>';
 const grass = '<ellipse cx="50" cy="87" rx="36" ry="6" fill="#b4c499" opacity=".4"/><path d="M19 86c0-14-4-31-9-40 17 5 22 20 23 35-1-24-5-39-10-50 19 9 23 28 22 50 1-40 7-55 16-62-4 28-6 43-5 64 5-31 15-45 28-51-8 17-14 34-15 52 8-17 17-25 23-27-7 11-9 22-10 29Z" fill="#7a9e55"/><path d="M34 86c-1-17-5-28-7-34 14 8 17 19 17 31 2-21 6-32 10-42 3 17 3 29 2 44 8-18 14-27 19-31-1 13-4 22-7 32Z" fill="#91b46d"/>';
 const newspaper = '<g transform="rotate(-9 50 50)"><rect x="15" y="18" width="70" height="67" rx="5" fill="#dedbc7"/><rect x="12" y="14" width="70" height="67" rx="4" fill="#fff9df" stroke="#b4b79b" stroke-width="1.7"/><path d="M22 27h49" stroke="#506951" stroke-width="6"/><rect x="22" y="38" width="22" height="20" rx="1" fill="#a2ba8d"/><path d="M51 40h20m-20 8h20m-20 8h20M22 65h49m-49 7h49" stroke="#a3ad95" stroke-width="3"/></g>';
 const can = '<ellipse cx="50" cy="86" rx="22" ry="5" fill="#9cae9b" opacity=".3"/><path d="M31 22h38v57c0 10-38 10-38 0z" fill="#bdcdd0" stroke="#8da4a5" stroke-width="1.3"/><path d="M31 36h38v33H31z" fill="#e5bc59"/><path d="m46 42 12 9-12 12" stroke="#fff3c9" stroke-width="3" fill="none"/><ellipse cx="50" cy="22" rx="19" ry="7" fill="#e5e7dd" stroke="#8da4a5" stroke-width="1.5"/><ellipse cx="50" cy="22" rx="6" ry="2" fill="none" stroke="#93a6a4" stroke-width="2"/>';
 const bottle = '<ellipse cx="50" cy="89" rx="20" ry="5" fill="#9cae9b" opacity=".3"/><path d="M42 22v9c0 6-10 10-10 19v30c0 11 36 11 36 0V50c0-9-10-13-10-19v-9" fill="#a5cfc4" stroke="#83b0a5" stroke-width="1.5"/><rect x="40" y="13" width="20" height="12" rx="3" fill="#e6bd57"/><path d="M33 51h34v22H33z" fill="#fff6db"/><path d="m45 58 5-3 5 3v6l-5 3-5-3z" fill="none" stroke="#84a779" stroke-width="2"/><path d="M39 39v8m0 29v4" stroke="#d5e9dc" stroke-width="3" stroke-linecap="round"/>';
 const box = '<path d="m17 33 30-17 36 18-32 18Z" fill="#d9bc86"/><path d="m17 33 34 19v36L17 68Z" fill="#c5a172"/><path d="m51 52 32-18v36L51 88Z" fill="#e3c995"/><path d="m31 25 36 19v15l-10 5V49L23 30" fill="#f1d9a4"/><path d="m60 67 7-4 7 4m-7-4v12" fill="none" stroke="#8e8e5f" stroke-width="3"/>';
 const tin = '<path d="M26 27h48v49c0 12-48 12-48 0z" fill="#b7c5b9" stroke="#8e9f94" stroke-width="1.5"/><ellipse cx="50" cy="27" rx="24" ry="8" fill="#dde2d4" stroke="#8e9f94" stroke-width="1.5"/><path d="M27 42q23 10 46 0M27 52q23 10 46 0M27 62q23 10 46 0M27 72q23 10 46 0" stroke="#8e9f94" fill="none" stroke-width="2"/>';
 const container = '<path d="m18 39 5 39c2 11 52 11 54 0l5-39" fill="#b8d1c2" stroke="#8aab96" stroke-width="1.5"/><ellipse cx="50" cy="39" rx="33" ry="12" fill="#7da48b"/><ellipse cx="50" cy="35" rx="33" ry="12" fill="#95b49c" stroke="#6f957f" stroke-width="1.5"/><path d="M31 53v23" stroke="#d8e8d9" stroke-width="3" stroke-linecap="round"/>';
 const trophy = '<circle cx="50" cy="46" r="31" fill="#e5e9bb"/><path d="m50 23 7 14 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2Z" fill="#d7b85a"/><path d="m35 70-5 20 20-9 20 9-5-20" fill="#8ba36b"/>';
 const map={flower,tree,grass,newspaper,can,bottle,box,tin,container,trophy};
 if (['paper','metal','plastic'].includes(key)) {
   const color={paper:'#5c92c2',metal:'#e7bd55',plastic:'#a47a58'}[key];
   return `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M24 24h52v59c0 5-52 5-52 0z" fill="${color}"/><rect x="21" y="18" width="58" height="12" rx="4" fill="${color}"/><path d="M38 35h24" stroke="#415447" stroke-width="5" stroke-linecap="round"/><rect x="32" y="45" width="36" height="29" rx="3" fill="#fffbed"/><path d="m44 54 6-4 6 4m-6-4v12m-6 1-3-6 3-6m-3 6h13m5-3 3 6-3 6m3-6H49" fill="none" stroke="${color}" stroke-width="2.5"/><circle cx="32" cy="88" r="4" fill="#637162"/><circle cx="68" cy="88" r="4" fill="#637162"/></svg>`;
 }
 return `<svg viewBox="0 0 100 100" aria-hidden="true">${map[key] || flower}</svg>`;
};

Object.assign(paths,{
 map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15m6-12v15"/>',
 water:'<path d="M12 2C8 8 5 11 5 15a7 7 0 0 0 14 0c0-4-3-7-7-13Z"/><path d="M9 16a3 3 0 0 0 3 3"/>',
 air:'<path d="M3 8h12a3 3 0 1 0-3-3M2 12h16a3 3 0 1 1-3 3M5 17h5"/>',
 arrowleft:'<path d="M20 12H4m6-6-6 6 6 6"/>'
});
const partBodies={
 'flower.petals':'<g fill="#e69aa5"><ellipse cx="50" cy="28" rx="13" ry="20"/><ellipse cx="50" cy="28" rx="13" ry="20" transform="rotate(72 50 50)"/><ellipse cx="50" cy="28" rx="13" ry="20" transform="rotate(144 50 50)"/><ellipse cx="50" cy="28" rx="13" ry="20" transform="rotate(216 50 50)"/><ellipse cx="50" cy="28" rx="13" ry="20" transform="rotate(288 50 50)"/></g><circle cx="50" cy="50" r="17" fill="#edc264"/>',
 leaf:'<path d="M77 17C34 12 10 36 27 67s57 9 50-50Z" fill="#8bab64"/><path d="m22 87 47-58m-24 29-12-9m24-6 11 3" stroke="#587f41" stroke-width="4" stroke-linecap="round" fill="none"/>',
 'flower.stem':'<path d="M50 12v77" stroke="#71994f" stroke-width="9" stroke-linecap="round"/><path d="M46 49C19 51 20 29 20 29c22-2 26 20 26 20M54 68c27-1 26-23 26-23-21-1-26 23-26 23" fill="#8aac62"/>',
 'tree.trunk':'<path d="M40 91V39L23 20l8-9 19 21 18-19 10 8-20 23v47" fill="#a47b52"/><path d="M46 47v35m8-22v20" stroke="#c39a6c" stroke-width="3" stroke-linecap="round"/>',
 'tree.root':'<rect x="9" y="37" width="82" height="53" rx="7" fill="#d5b78b"/><path d="M49 13v32m0-3L30 57l-11 23m30-38 17 16 15 19M48 53l-3 29m-13-23 9 9m25-10-5 24" stroke="#946c48" stroke-width="6" stroke-linecap="round" fill="none"/>',
 stone:'<path d="m14 70 7-27 27-19 31 15 8 28-13 17H29Z" fill="#a7b1a1"/><path d="m21 43 24 12 34-16m-34 16-3 28" fill="none" stroke="#c6cdbf" stroke-width="3"/>',
 bench:'<path d="M19 31h62v31H19zM13 64h74v10H13z" fill="#c5a375"/><path d="M19 42h62m-62 10h62" stroke="#a27d54" stroke-width="3"/><path d="M24 74v16m52-16v16" stroke="#698068" stroke-width="7"/>',
 toy:'<circle cx="50" cy="50" r="33" fill="#dda376"/><path d="m50 17 9 23 24 10-24 9-9 24-10-24-23-9 23-10Z" fill="#efca91"/>',
 candy:'<path d="m20 38-15-8v36l15-9m60-19 15-8v36l-15-9" fill="#c5a4ca"/><rect x="19" y="30" width="62" height="38" rx="15" fill="#dba7bd"/><path d="m42 31-8 35m26-35-8 35" stroke="#f2d4dd" stroke-width="7"/>'
};
function parkArt(key){
 if(key==='flower.leaf'||key==='tree.leaf')key='leaf';
 if(key==='grass.leaf')return art('grass');
 if(key==='water'||key==='sun'||key==='air'||key==='entrance')return icon(key==='entrance'?'map':key);
 if(key==='growth')return art('flower');
 if(key==='recycle')return art('bottle');
 if(partBodies[key])return `<svg viewBox="0 0 100 100" aria-hidden="true">${partBodies[key]}</svg>`;
 return art(key);
}
export {icon,art,parkArt};
