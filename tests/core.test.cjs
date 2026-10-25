const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../src/core.js');
test('state round trip preserves empty and partial flow steps',()=>{
 const d=C.createData();d.lesson.flow=[{id:C.uid(),time:'5',title:'',detail:''}];
 assert.deepEqual(C.validate(JSON.parse(C.safeJSON(d))),d);
 d.lesson.flow=[];assert.deepEqual(C.validate(d).lesson.flow,[]);
});
test('duplicate names have independent stable IDs, roster edits retain corresponding records',()=>{
 const d=C.createData();C.replaceRoster(d,['陳同學','陳同學','Alex']);
 const h={id:C.uid(),name:"工作紙 'A'"};d.homework.push(h);
 C.setStatus(d,h.id,d.students[0].id,'submitted');C.setStatus(d,h.id,d.students[1].id,'redo');
 const ids=d.students.map(s=>s.id);C.replaceRoster(d,['Alex','陳同學','陳同學']);
 assert.equal(d.students[1].id,ids[0]);assert.equal(C.getStatus(d,h.id,ids[1]),'redo');
 C.replaceRoster(d,['Alex']);assert.deepEqual(d.records[h.id],{});assert.equal(d.students[0].id,ids[2]);
});
test('legacy conversation format migrates homework, templates and history',()=>{
 const l={title:'舊課',date:'2026/10/20',flow:[{time:'5 分鐘',title:'',detail:'介紹'}]};
 const d=C.migrate({lesson:l,students:["O'Brien",'小明'],homeworks:['工作紙'],submissions:{工作紙:{"O'Brien":'late',小明:'redo'}},historyLessons:[l],flowPresets:[{name:'40分鐘',flow:l.flow}]});
 assert.equal(C.getStatus(d,d.homework[0].id,d.students[0].id),'late');assert.equal(d.presets.length,1);assert.equal(d.history[0].lesson.title,'舊課');
});
test('invalid backups are rejected instead of partially imported',()=>{
 assert.throws(()=>C.migrate({students:[],lesson:{}}));
 const d=C.createData();d.students=[{id:'one',name:'A'},{id:'one',name:'B'}];assert.throws(()=>C.validate(d));
 const e=C.createData();e.students=[{id:'one',name:'A'}];e.homework=[{id:'h',name:'HW'}];e.records={h:{one:'unknown'}};assert.throws(()=>C.validate(e));
});
test('picking without replacement returns no candidate after the round',()=>{
 const d=C.createData();C.replaceRoster(d,['A','B','C']);
 for(let i=0;i<3;i++){const s=C.choose(d,()=>.999);assert.ok(!d.picked.includes(s.id));d.picked.push(s.id);}
 assert.equal(C.choose(d),null);
});
test('deadline based timer accounts for background throttling',()=>{
 assert.equal(C.remaining(10000,1000),9);assert.equal(C.remaining(10000,9001),1);assert.equal(C.remaining(10000,30000),0);
});
test('embedded JSON cannot terminate script or inject HTML',()=>{
 const d=C.createData();d.lesson.title='</script><img src=x onerror=alert(1)>';const json=C.safeJSON(d);
 assert.equal(json.includes('<'),false);assert.equal(JSON.parse(json).lesson.title,d.lesson.title);
});

test('roster handles CSV headers, quotes, BOM and TSV without importing header as student',()=>{
 assert.deepEqual(C.parseRoster('\uFEFF學號,姓名\n1,"Chan, Tai Man"\n2,"Mary ""May"""'),['Chan, Tai Man','Mary "May"']);
 assert.deepEqual(C.parseRoster('1\t小明\n2\tAlex'),['小明','Alex']);
 assert.throws(()=>C.parseRoster('1,"Unclosed'));
});
test('backup validation rejects dictionary prototype IDs',()=>{
 const d=C.createData();d.homework=[{id:'__proto__',name:'HW'}];assert.throws(()=>C.validate(d));
});
