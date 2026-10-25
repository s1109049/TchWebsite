const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {createHash}=require('node:crypto');
const contract=require('./layout-contract.json');
test('uploaded baseline CSS, five-section order and original card structure are retained',()=>{
 const css=readFileSync('src/style.css','utf8').split('/* Only new picker modes')[0].trim();
 assert.equal(createHash('sha256').update(css).digest('hex'),contract.originalCssSha256);
 const shell=readFileSync('src/shell.html','utf8');
 assert.deepEqual([...shell.matchAll(/<section\b[^>]*\bid="([^"]+)"/g)].map(m=>m[1]),contract.sectionIds);
 assert.equal((shell.match(/\bclass="card"/g)||[]).length,contract.cardCount);
});
