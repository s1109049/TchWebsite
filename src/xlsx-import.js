// Local-only reader for standard .xlsx class-list workbooks. No upload, fetch,
// remote spreadsheet service, or third-party runtime is involved.
async function readSchoolExcel(file) {
    const bytes=new Uint8Array(await file.arrayBuffer()),view=new DataView(bytes.buffer);
    if(bytes.length<22||bytes.length>20*1024*1024)throw Error('xlsx size');
    let end=-1;
    for(let p=bytes.length-22;p>=Math.max(0,bytes.length-65557);p--){if(view.getUint32(p,true)===0x06054b50){end=p;break;}}
    if(end<0||view.getUint16(end+4,true)||view.getUint16(end+6,true))throw Error('xlsx zip');
    const count=view.getUint16(end+10,true);let offset=view.getUint32(end+16,true),total=0;
    if(count>10000||count===65535)throw Error('xlsx entries');
    const entries=new Map(),decoder=new TextDecoder();
    for(let i=0;i<count;i++){
        if(offset+46>bytes.length||view.getUint32(offset,true)!==0x02014b50)throw Error('xlsx directory');
        const flags=view.getUint16(offset+8,true),method=view.getUint16(offset+10,true),crc=view.getUint32(offset+16,true);
        const size=view.getUint32(offset+20,true),plain=view.getUint32(offset+24,true);
        const length=view.getUint16(offset+28,true),extra=view.getUint16(offset+30,true),comment=view.getUint16(offset+32,true);
        const local=view.getUint32(offset+42,true),name=decoder.decode(bytes.subarray(offset+46,offset+46+length));
        total+=plain;if(total>64*1024*1024||plain>32*1024*1024||flags&1||![0,8].includes(method)||entries.has(name))throw Error('xlsx unsupported');
        entries.set(name,{method,crc,size,plain,local});offset+=46+length+extra+comment;
    }
    async function xml(name,optional=false){
        const entry=entries.get(name);if(!entry){if(optional)return null;throw Error('xlsx missing '+name);}
        const p=entry.local;if(p+30>bytes.length||view.getUint32(p,true)!==0x04034b50)throw Error('xlsx header');
        const start=p+30+view.getUint16(p+26,true)+view.getUint16(p+28,true);
        if(start+entry.size>bytes.length)throw Error('xlsx bounds');
        const compressed=bytes.subarray(start,start+entry.size);
        let content=compressed;
        if(entry.method===8){
            let stream;try{stream=new DecompressionStream('deflate-raw');}catch{throw Error('請使用新版 Chrome / Edge 匯入 Excel');}
            const reader=new Blob([compressed]).stream().pipeThrough(stream).getReader(),chunks=[];let size=0;
            while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>entry.plain||size>32*1024*1024){await reader.cancel();throw Error('xlsx expanded size');}chunks.push(value);}
            content=new Uint8Array(size);let at=0;for(const chunk of chunks){content.set(chunk,at);at+=chunk.length;}
        }
        if(content.length!==entry.plain||xlsxCRC32(content)!==entry.crc)throw Error('xlsx checksum');
        const text=decoder.decode(content);if(/<!DOCTYPE|<!ENTITY/i.test(text))throw Error('xlsx XML declarations');
        const doc=new DOMParser().parseFromString(text,'application/xml');if(doc.getElementsByTagName('parsererror').length)throw Error('xlsx XML');return doc;
    }
    const tags=(node,name)=>[...node.getElementsByTagNameNS('*',name)];
    const book=await xml('xl/workbook.xml'),relations=await xml('xl/_rels/workbook.xml.rels');
    const targets=new Map(tags(relations,'Relationship').filter(r=>r.getAttribute('TargetMode')!=='External').map(r=>[r.getAttribute('Id'),r.getAttribute('Target')]));
    const sheets=tags(book,'sheet');const all=sheets.find(s=>s.getAttribute('name').trim().toLowerCase()==='all');
    const wanted=new Set(classDefinitions.map(d=>d.className));
    const selected=all?[all]:sheets.filter(s=>wanted.has('S'+s.getAttribute('name').trim().toUpperCase().replace(/^S/,'')));
    if(!selected.length)throw Error('xlsx no matching sheets');
    const shared=await xml('xl/sharedStrings.xml',true);
    const texts=shared?tags(shared,'si').map(si=>tags(si,'t').filter(t=>!t.closest('rPh')).map(t=>t.textContent).join('')):[];
    const rosters={};
    for(const sheet of selected){
        const id=sheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id')||sheet.getAttribute('r:id');
        const target=targets.get(id);if(!target)throw Error('xlsx sheet relation');
        const path=new URL(target,'https://local.invalid/xl/workbook.xml').pathname.slice(1);
        if(!path.startsWith('xl/'))throw Error('xlsx sheet path');
        const doc=await xml(path),rows=tags(doc,'row').map(row=>{
            const cells=[];for(const cell of tags(row,'c')){
                const ref=/^[A-Z]+/.exec(cell.getAttribute('r')||'');if(!ref)continue;
                let index=0;for(const c of ref[0])index=index*26+c.charCodeAt(0)-64;
                const value=tags(cell,'v')[0]?.textContent||'';
                cells[index-1]=cell.getAttribute('t')==='s'?texts[Number(value)]||'':cell.getAttribute('t')==='inlineStr'?tags(cell,'t').map(t=>t.textContent).join(''):value;
            }return cells;
        });
        const normalize=s=>String(s||'').toLowerCase().replace(/\s+/g,'');
        const header=rows.findIndex(row=>row.some(v=>normalize(v)==='class')&&row.some(v=>normalize(v)==='clsno'));
        if(header<0)throw Error('xlsx class/number headers');
        const headings=rows[header],classCol=headings.findIndex(v=>normalize(v)==='class'),numberCol=headings.findIndex(v=>normalize(v)==='clsno');
        const englishCol=headings.findIndex(v=>['engname','englishname'].includes(normalize(v)));
        const namedCol=headings.findIndex(v=>['chinesename','中文姓名','姓名'].includes(normalize(v)));
        const chineseCol=namedCol<0?4:namedCol;
        for(const row of rows.slice(header+1)){
            const cls='S'+String(row[classCol]||'').trim().toUpperCase().replace(/^S/,'');if(!wanted.has(cls))continue;
            const rawNumber=String(row[numberCol]??'').trim(),number=Number(rawNumber);
            if(!rawNumber||!Number.isSafeInteger(number)||number<=0||number>10000)continue;
            const name=String(row[chineseCol]||row[englishCol]||'').trim();if(!name)throw Error('xlsx missing name');
            rosters[cls]||=new Map();if(rosters[cls].has(number))throw Error('xlsx duplicate number');rosters[cls].set(number,name);
        }
    }
    const result={rosterImportVersion:1,rosters:{}};
    for(const [cls,names] of Object.entries(rosters))result.rosters[cls]=[...names].sort((a,b)=>a[0]-b[0]).map(([number,name])=>number+' '+name);
    if(!Object.keys(result.rosters).length)throw Error('xlsx empty matching roster');
    return result;
}
function xlsxCRC32(bytes){
    let crc=0xffffffff;
    for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
    return (crc^0xffffffff)>>>0;
}
