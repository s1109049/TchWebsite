'use strict';

const products = [
  { ProductID: 101, ProductName: 'Notebook', SupplierID: 1, CategoryID: 3, Price: 25 },
  { ProductID: 102, ProductName: 'Pencil', SupplierID: 2, CategoryID: 1, Price: 12 },
  { ProductID: 103, ProductName: 'Backpack', SupplierID: 1, CategoryID: 3, Price: 45 },
  { ProductID: 104, ProductName: 'Ruler', SupplierID: 3, CategoryID: 2, Price: 8 },
  { ProductID: 105, ProductName: 'Markers', SupplierID: 1, CategoryID: 2, Price: 18 },
  { ProductID: 106, ProductName: 'Scissors', SupplierID: 2, CategoryID: 3, Price: 30 }
];
const allColumns = ['ProductID','ProductName','SupplierID','CategoryID','Price'];
const project = (rows, columns) => rows.map(row => Object.fromEntries(columns.map(column => [column,row[column]])));
const sumPrice = () => products.reduce((sum,row) => sum + row.Price,0);
const queryExamples = [
 {label:'SELECT',title:'Select columns',description:'Show only product names and prices. SELECT decides which columns appear.',sql:'SELECT ProductName, Price\nFROM Products;',columns:['ProductName','Price'],run:()=>project(products,['ProductName','Price']),note:'All six rows are kept; only the selected columns are shown.'},
 {label:'DISTINCT',title:'Show different values',description:'List each category once, even when several products share it.',sql:'SELECT DISTINCT CategoryID\nFROM Products;',columns:['CategoryID'],run:()=>[...new Set(products.map(row=>row.CategoryID))].map(CategoryID=>({CategoryID})),note:'Without ORDER BY, SQL does not guarantee the order of the result.'},
 {label:'WHERE',title:'Filter records',description:'Keep only products with a price of 25 or more.',sql:'SELECT *\nFROM Products\nWHERE Price >= 25;',columns:allColumns,run:()=>products.filter(row=>row.Price>=25),note:'The condition is checked for each record.'},
 {label:'AND',title:'Both conditions',description:'A product must be in category 3 AND cost more than 25.',sql:'SELECT *\nFROM Products\nWHERE CategoryID = 3 AND Price > 25;',columns:allColumns,run:()=>products.filter(row=>row.CategoryID===3 && row.Price>25),note:'Both parts of the condition must be true.'},
 {label:'OR',title:'Either condition',description:'Keep a product if it is in category 1 OR its price is at least 30.',sql:'SELECT *\nFROM Products\nWHERE CategoryID = 1 OR Price >= 30;',columns:allColumns,run:()=>products.filter(row=>row.CategoryID===1 || row.Price>=30),note:'A row is included when one or both conditions are true.'},
 {label:'NOT',title:'Exclude a condition',description:'Keep products that are not in category 2.',sql:'SELECT *\nFROM Products\nWHERE NOT CategoryID = 2;',columns:allColumns,run:()=>products.filter(row=>row.CategoryID!==2),note:'NOT reverses the condition in this example.'},
 {label:'ORDER BY',title:'Sort the result',description:'Display names and prices with the highest price first.',sql:'SELECT ProductName, Price\nFROM Products\nORDER BY Price DESC;',columns:['ProductName','Price'],run:()=>project([...products].sort((a,b)=>b.Price-a.Price),['ProductName','Price']),note:'DESC means descending. ASC means ascending.'},
 {label:'IN',title:'Choose from a list',description:'Find products supplied by supplier 1 or supplier 3.',sql:'SELECT *\nFROM Products\nWHERE SupplierID IN (1, 3);',columns:allColumns,run:()=>products.filter(row=>[1,3].includes(row.SupplierID)),note:'IN is a shorter way to check several possible values.'},
 {label:'BETWEEN',title:'Select a range',description:'Find products priced from 12 to 30, including both endpoints.',sql:'SELECT *\nFROM Products\nWHERE Price BETWEEN 12 AND 30;',columns:allColumns,run:()=>products.filter(row=>row.Price>=12 && row.Price<=30),note:'12 and 30 are both included in the result.'},
 {label:'MIN / MAX',title:'Find the extremes',description:'Return the smallest and largest price in the table.',sql:'SELECT MIN(Price) AS MinPrice,\n       MAX(Price) AS MaxPrice\nFROM Products;',columns:['MinPrice','MaxPrice'],run:()=>[{MinPrice:Math.min(...products.map(row=>row.Price)),MaxPrice:Math.max(...products.map(row=>row.Price))}],note:'AS provides a name for each result column.'},
 {label:'COUNT',title:'Count matching rows',description:'Count products in category 3.',sql:'SELECT COUNT(*) AS ProductCount\nFROM Products\nWHERE CategoryID = 3;',columns:['ProductCount'],run:()=>[{ProductCount:products.filter(row=>row.CategoryID===3).length}],note:'COUNT(*) counts the matching rows.'},
 {label:'AVG / SUM',title:'Average and total',description:'Calculate the average and total price of all six products.',sql:'SELECT AVG(Price) AS AveragePrice,\n       SUM(Price) AS TotalPrice\nFROM Products;',columns:['AveragePrice','TotalPrice'],run:()=>[{AveragePrice:sumPrice()/products.length,TotalPrice:sumPrice()}],note:'AVG and SUM use numeric values; NULL values are ignored.'}
];

// Give the same SQL words the same colour in every example. Preserve text as text nodes.
function paintSQL(target, sql) {
 const tokenPattern=/'(?:''|[^'])*'|\bORDER\s+BY\b|\b(?:SELECT|FROM|WHERE|AND|OR|NOT|DISTINCT|IN|BETWEEN|ASC|DESC|AS|MIN|MAX|COUNT|AVG|SUM|LIKE)\b|;/gi;
 let last=0; target.replaceChildren();
 for (const match of sql.matchAll(tokenPattern)) {
  target.append(document.createTextNode(sql.slice(last,match.index)));
  const word=match[0], upper=word.toUpperCase().replace(/\s+/g,' ');
  let group=word.startsWith("'")?'':upper==='SELECT'?'select':upper==='FROM'?'from':upper==='WHERE'?'where':upper==='ORDER BY'?'order':['AND','OR','NOT'].includes(upper)?'condition':upper===';'?'end':'other';
  if(group){const span=document.createElement('span');span.className='syntax-'+group;span.textContent=word;target.appendChild(span)} else target.append(document.createTextNode(word));
  last=match.index+word.length;
 }
 target.append(document.createTextNode(sql.slice(last)));
}
document.querySelectorAll('code:not(#query-code)').forEach(node=>paintSQL(node,node.textContent));
const sourceRowMatches=[
 ()=>products,()=>products,()=>products.filter(r=>r.Price>=25),
 ()=>products.filter(r=>r.CategoryID===3&&r.Price>25),
 ()=>products.filter(r=>r.CategoryID===1||r.Price>=30),
 ()=>products.filter(r=>r.CategoryID!==2),()=>products,
 ()=>products.filter(r=>[1,3].includes(r.SupplierID)),
 ()=>products.filter(r=>r.Price>=12&&r.Price<=30),()=>products,
 ()=>products.filter(r=>r.CategoryID===3),()=>products
];
function markSourceRows(index) {
 const ids=new Set(sourceRowMatches[index]().map(row=>row.ProductID));
 document.querySelectorAll('#source-body tr').forEach((tr,i)=>tr.classList.toggle('is-contributing',ids.has(products[i].ProductID)));
 document.getElementById('source-note').textContent='Green rows are used to produce this result. These six rows are fictional, not the W3Schools data.';
}
function clearSourceRows() {
 document.querySelectorAll('#source-body tr').forEach(tr=>tr.classList.remove('is-contributing'));
 document.getElementById('source-note').textContent='Run an example to highlight the rows used in the result. These are not the W3Schools data.';
}

function el(tag, className, text) {
  const node=document.createElement(tag);
  if(className) node.className=className;
  if(text!==undefined) node.textContent=String(text);
  return node;
}
function fillRows(tbody, rows, columns) {
  tbody.replaceChildren();
  rows.forEach(row => {
    const tr=el('tr');
    columns.forEach(column=>tr.appendChild(el('td','',row[column])));
    tbody.appendChild(tr);
  });
}
fillRows(document.getElementById('source-body'),products,allColumns);

let activeIndex=0;
const tabs=document.getElementById('query-tabs');
const title=document.getElementById('query-title');
const unit=document.getElementById('query-unit');
const code=document.getElementById('query-code');
const description=document.getElementById('query-description');
const resultArea=document.getElementById('result-area');
const runButton=document.getElementById('run-query');
const placeholder=()=>{resultArea.replaceChildren();const p=el('p','result-placeholder');p.append('Choose an example and press ');const strong=el('strong','','Run example');p.append(strong,' to see its result.');resultArea.appendChild(p)};
queryExamples.forEach((item,index)=>{
  const button=el('button','query-tab',item.label);
  button.type='button';button.dataset.index=String(index);button.setAttribute('aria-pressed','false');
  button.addEventListener('click',()=>setExample(index));
  tabs.appendChild(button);
});
function setExample(index) {
 activeIndex=index;
 const item=queryExamples[index];
 tabs.querySelectorAll('button').forEach((b,i)=>{b.classList.toggle('is-active',i===index);b.setAttribute('aria-pressed',String(i===index))});
 title.textContent=item.title;unit.textContent='EXAMPLE '+String(index+1).padStart(2,'0');
 description.textContent=item.description;paintSQL(code,item.sql);clearSourceRows();placeholder();
}
function showResult() {
 const example=queryExamples[activeIndex],rows=example.run();
 markSourceRows(activeIndex);resultArea.replaceChildren();
 const meta=el('div','result-meta');
 meta.append(el('strong','','Result'),el('span','',rows.length+' '+(rows.length===1?'row':'rows')));
 resultArea.appendChild(meta);
 const wrap=el('div','table-wrapper'),table=el('table','data-table');
 const thead=el('thead'),header=el('tr');
 example.columns.forEach(column=>{const th=el('th','',column);th.scope='col';header.appendChild(th)});
 thead.appendChild(header);table.appendChild(thead);
 const tbody=el('tbody');fillRows(tbody,rows,example.columns);table.appendChild(tbody);wrap.appendChild(table);resultArea.appendChild(wrap);
 resultArea.appendChild(el('p','result-note',example.note));
}
runButton.addEventListener('click',showResult);
setExample(0);

const keyMessages={
 Student_ID:['Student_ID is suitable.','Each record has a different ID; it can identify one student precisely.'],
 Student_Name:['Student_Name is not suitable.','The first two records share the same name. Different people can have the same name.'],
 Class:['Class is not suitable.','Several students can belong to the same class, so the value is repeated.'],
 Gender:['Gender is not suitable.','Many students can share the same gender value; it cannot identify one record.'],
 Is_Member:['Is_Member is not suitable.','Several records can have the same Yes/No value.']
};
function chooseField(field) {
 document.querySelectorAll('.field-button').forEach(button=>{const on=button.dataset.field===field;button.classList.toggle('is-selected',on);button.setAttribute('aria-pressed',String(on))});
 document.querySelectorAll('.member-table [data-column]').forEach(cell=>cell.classList.toggle('is-active',cell.dataset.column===field));
 const [heading,explanation]=keyMessages[field],valid=field==='Student_ID';
 const target=document.getElementById('key-feedback');
 target.classList.toggle('is-warning',!valid);
 const icon=el('span','feedback-icon',valid?'✓':'!');
 const paragraph=el('p');paragraph.append(el('strong','',heading),' '+explanation);
 target.replaceChildren(icon,paragraph);
}
document.querySelectorAll('.field-button').forEach(button=>button.addEventListener('click',()=>chooseField(button.dataset.field)));
chooseField('Student_ID');

const quiz=[
 {question:'Which name follows the WS1 underscore convention?',options:['DateofBirth','Date_of_Birth','Date of Birth'],answer:1,explain:'WS1 uses Date_of_Birth. Other conventions may be valid elsewhere, but match the field name used in this worksheet.'},
 {question:'What is the suitable data type for Gender in WS1?',options:['Text','Yes/No','Number'],answer:0,explain:'The worksheet stores a category such as M or F as Text; Is_Member is the Yes/No field.'},
 {question:'Which field is the best primary key for Library_Members?',options:['Student_Name','Class','Student_ID'],answer:2,explain:'Student_ID uniquely identifies each student record. Names and classes can repeat.'},
 {question:'Does BETWEEN 12 AND 30 include the value 30?',options:['Yes','No'],answer:0,explain:'BETWEEN includes both endpoints: 12 and 30.'},
 {question:'When conditions are joined with AND, what must be true?',options:['Both conditions','At least one condition'],answer:0,explain:'AND requires both conditions to be true; OR requires at least one.'},
 {question:'Which clause filters rows based on a condition?',options:['ORDER BY','WHERE','FROM'],answer:1,explain:'WHERE filters records. ORDER BY sorts the returned result.'}
];
const quizList=document.getElementById('quiz-list');
quiz.forEach((q,index)=>{
 const card=el('article','quiz-item'),label=el('span','mini-label','CHECK '+String(index+1).padStart(2,'0')),heading=el('h3','',q.question);
 card.append(label,heading);
 const group=el('div','quiz-options');group.setAttribute('role','group');group.setAttribute('aria-label',q.question);
 const feedback=el('p','quiz-feedback','Choose an answer.');feedback.setAttribute('aria-live','polite');
 q.options.forEach((option,j)=>{
  const b=el('button','quiz-option',option);b.type='button';b.setAttribute('aria-pressed','false');
  b.addEventListener('click',()=>{
   group.querySelectorAll('button').forEach((other,k)=>{other.classList.toggle('is-chosen',k===j);other.setAttribute('aria-pressed',String(k===j))});
   feedback.classList.toggle('correct',j===q.answer);feedback.classList.toggle('incorrect',j!==q.answer);
   feedback.textContent=(j===q.answer?'Correct. ':'Not quite. ')+q.explain;
  });group.appendChild(b);
 });
 card.append(group,feedback);quizList.appendChild(card);
});

let scale=1;
try { const previous=Number(localStorage.getItem('s3-notebook-text-scale'));if(previous>=0.9&&previous<=1.2)scale=previous; } catch {}
function setScale(next){scale=Math.max(.9,Math.min(1.2,Math.round(next*10)/10));document.documentElement.style.setProperty('--scale',String(scale));try{localStorage.setItem('s3-notebook-text-scale',String(scale))}catch{}}
document.getElementById('font-up').addEventListener('click',()=>setScale(scale+.1));
document.getElementById('font-down').addEventListener('click',()=>setScale(scale-.1));setScale(scale);
const navLinks=[...document.querySelectorAll('.lesson-nav a')];
if('IntersectionObserver' in window){
 const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){navLinks.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+entry.target.id))}})},{rootMargin:'-20% 0px -65% 0px',threshold:0});
 document.querySelectorAll('#review,#key,#sql,#practice').forEach(s=>observer.observe(s));
}

