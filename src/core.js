/* Shared, DOM-independent data model. Every edit updates this model first. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Classroom = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = 4;
  const statuses = ['missing', 'submitted', 'late', 'redo'];
  const uid = () => globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const clone = value => JSON.parse(JSON.stringify(value));
  const date = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  function emptyLesson() {
    return {title: '', date: date(), objectives: '', flow: [], announcement: '', materials: '', showAnnouncement: false, showMaterials: false};
  }
  function createData() {
    return {schemaVersion: VERSION, id: uid(), revision: 0, updatedAt: 0, lang: 'zh', lesson: emptyLesson(), history: [], presets: [], students: [], homework: [], records: {}, picked: []};
  }
  const text = (v, fallback = '') => typeof v === 'string' ? v : fallback;
  const isObject = v => !!v && typeof v === 'object' && !Array.isArray(v);
  function normalizeLesson(raw) {
    if (!isObject(raw) || !Array.isArray(raw.flow)) throw new Error('Invalid lesson');
    if (raw.flow.length > 300) throw new Error('Too many steps');
    return {title:text(raw.title), date:text(raw.date), objectives:text(raw.objectives),
      flow:raw.flow.map(step => {if(!isObject(step)) throw new Error('Invalid step'); return {id:text(step.id, uid()),time:text(step.time),title:text(step.title),detail:text(step.detail)};}),
      announcement:text(raw.announcement), materials:text(raw.materials),showAnnouncement:raw.showAnnouncement===true,showMaterials:raw.showMaterials===true};
  }
  function validate(raw) {
    if (!isObject(raw) || raw.schemaVersion !== VERSION || !text(raw.id) || !Array.isArray(raw.students) || !Array.isArray(raw.homework) || !Array.isArray(raw.history) || !Array.isArray(raw.presets) || !Array.isArray(raw.picked) || !isObject(raw.records)) throw new Error('Invalid backup format');
    if (raw.students.length > 1000 || raw.homework.length > 500 || raw.history.length > 500 || raw.presets.length > 500) throw new Error('Backup too large');
    function entries(list) {
      const seen = new Set();
      return list.map(item => {
        if (!isObject(item) || !text(item.id) || ['__proto__','prototype','constructor'].includes(item.id) || !text(item.name).trim() || seen.has(item.id)) throw new Error('Invalid or duplicate entry');
        seen.add(item.id); return {id:item.id,name:item.name.trim()};
      });
    }
    const data = {schemaVersion:VERSION,id:raw.id,revision:Number.isSafeInteger(raw.revision)&&raw.revision>=0?raw.revision:0,updatedAt:Number.isFinite(raw.updatedAt)?raw.updatedAt:0,
      lang:['zh','en','bi'].includes(raw.lang)?raw.lang:'zh', lesson:normalizeLesson(raw.lesson),students:entries(raw.students),homework:entries(raw.homework),records:{},
      history:raw.history.map(h => ({id:text(h.id,uid()),lesson:normalizeLesson(h.lesson)})),
      presets:raw.presets.map(p => {if(!isObject(p)||!text(p.name)||!Array.isArray(p.flow)) throw new Error('Invalid preset');return {id:text(p.id,uid()),name:p.name,flow:normalizeLesson({...emptyLesson(),flow:p.flow}).flow};}),picked:[]};
    for (const hw of data.homework) {
      data.records[hw.id] = {};
      for (const st of data.students) {
        const value = raw.records[hw.id]?.[st.id];
        if (value !== undefined && !statuses.includes(value)) throw new Error('Invalid status');
        if (value) data.records[hw.id][st.id] = value;
      }
    }
    data.picked = [...new Set(raw.picked.filter(id => data.students.some(s=>s.id===id)))];
    return data;
  }
  function migrate(raw) {
    if (raw?.schemaVersion === VERSION) return validate(raw);
    // The conversation's v3 JSON format: names keyed records; no code is imported.
    if (!isObject(raw) || !isObject(raw.lesson) || !Array.isArray(raw.lesson.flow) || !Array.isArray(raw.students) || !Array.isArray(raw.homeworks || raw.homework)) throw new Error('Unrecognised backup');
    const data = createData();
    data.lesson = normalizeLesson(raw.lesson);
    data.lang = ['zh','en','bi'].includes(raw.lang)?raw.lang:'zh';
    data.students = raw.students.map(name => ({id:uid(),name:text(name).trim()}));
    data.homework = (raw.homeworks || raw.homework).map(name => ({id:uid(),name:text(name).trim()}));
    const map = {0:'missing',1:'submitted',2:'late',3:'redo',missing:'missing',submitted:'submitted',late:'late',redo:'redo'};
    for (const hw of data.homework) {
      data.records[hw.id]={};
      for(const st of data.students) {
        const value=(raw.records || raw.hwRecords || raw.submissions || {})[hw.name]?.[st.name];
        if(value!==undefined) { if(!Object.hasOwn(map,value)) throw new Error('Unknown legacy status');data.records[hw.id][st.id]=map[value]; }
      }
    }
    data.history=(raw.historyLessons || raw.history || []).map(lesson=>({id:uid(),lesson:normalizeLesson(lesson)})).reverse();
    data.presets=(raw.flowPresets || []).map(p=>({id:uid(),name:p.name,flow:p.flow}));
    return validate(data);
  }
  function touch(data) {data.revision++;data.updatedAt=Date.now();return data;}
  function setStatus(data,hwId,studentId,status) {
    if(!data.homework.some(h=>h.id===hwId)||!data.students.some(s=>s.id===studentId)||!statuses.includes(status)) throw new Error('Invalid status target');
    data.records[hwId] ||= {};data.records[hwId][studentId]=status;
  }
  const getStatus = (data,hwId,studentId) => data.records[hwId]?.[studentId] || 'missing';
  function parseRoster(input) {
    // CSV/TSV and one-name-per-line input, including BOM and common headers.
    const lines=input.replace(/^\uFEFF/,'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    const rows=lines.map((line,i)=>{
      const delimiter=line.includes('\t')?'\t':',';
      const fields=[];let value='',quoted=false;
      for(let j=0;j<line.length;j++) {
        const ch=line[j];
        if(ch==='"') {
          if(quoted && line[j+1]==='"'){value+='"';j++;}
          else if(quoted || !value.trim())quoted=!quoted;
          else value+=ch;
        } else if(ch===delimiter&&!quoted){fields.push(value.trim());value='';}
        else value+=ch;
      }
      if(quoted)throw new Error(`Unclosed quote on line ${i+1}`);
      fields.push(value.trim());return fields;
    });
    if(rows.length && (rows[0].length===1 ? /^(姓名|學生姓名|name|student name)$/i.test(rows[0][0]) : /^(學號|班號|編號|class number|number|no\.?|id)$/i.test(rows[0][0]) && /^(姓名|學生姓名|name|student name)$/i.test(rows[0][1])))rows.shift();
    return rows.map((parts,i)=>{
      const name=parts.length>1 && /^\d+$/.test(parts[0]) ? parts.slice(1).join(' ') : parts.join(' ');
      if(!name || name.length>100) throw new Error(`Invalid name on line ${i+1}`);
      return name;
    });
  }
  function replaceRoster(data,names) {
    if(names.length>1000) throw new Error('Too many students');
    // Preserve IDs/records by name occurrence, including duplicate names.
    const queues=new Map();data.students.forEach(s=>{if(!queues.has(s.name))queues.set(s.name,[]);queues.get(s.name).push(s);});
    data.students=names.map(name=>queues.get(name)?.shift() || {id:uid(),name});
    const ids=new Set(data.students.map(s=>s.id));
    for(const hw of data.homework) for(const id of Object.keys(data.records[hw.id] || {})) if(!ids.has(id))delete data.records[hw.id][id];
    data.picked=data.picked.filter(id=>ids.has(id));
  }
  function choose(data, random = Math.random) {
    const candidates=data.students.filter(s=>!data.picked.includes(s.id));
    return candidates.length?candidates[Math.min(candidates.length-1,Math.floor(random()*candidates.length))]:null;
  }
  const remaining = (deadline,now) => Math.max(0,Math.ceil((deadline-now)/1000));
  const safeJSON = value => JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  return {VERSION,statuses,uid,clone,date,emptyLesson,createData,validate,migrate,touch,setStatus,getStatus,parseRoster,replaceRoster,choose,remaining,safeJSON};
});
