/** Geometry, pointer flow and lifecycle checks. No browser or WebGL is launched. */
import assert from 'node:assert/strict';
import * as RealThree from '../dist/vendor/three.module.js';
import { readFile } from 'node:fs/promises';
let latest;
class Canvas {
  style={}; listeners=new Map(); capture=new Set();
  setAttribute(){} remove(){} getBoundingClientRect(){return {left:0,top:0,width:this.width,height:this.height};}
  addEventListener(name,fn){this.listeners.set(name,fn);}
  removeEventListener(name){this.listeners.delete(name);}
  setPointerCapture(id){this.capture.add(id);}
  hasPointerCapture(id){return this.capture.has(id);}
  releasePointerCapture(id){this.capture.delete(id);this.emit('lostpointercapture',{pointerId:id});}
  emit(type,event){this.listeners.get(type)?.({pointerId:1,button:0,isPrimary:true,pointerType:'touch',cancelable:true,preventDefault(){},...event});}
}
class FakeRenderer {
  constructor(){this.domElement=new Canvas();this.shadowMap={};this.capabilities={getMaxAnisotropy:()=>4};}
  setPixelRatio(){} setClearColor(){} dispose(){}
  setSize(width,height){this.domElement.width=width;this.domElement.height=height;}
  render(scene,camera){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);latest={scene,camera,canvas:this.domElement};}
}
globalThis.__THREE={...RealThree,WebGLRenderer:FakeRenderer};
globalThis.window={devicePixelRatio:1};
globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:()=>()=>{},set:()=>true})})};
globalThis.ResizeObserver=class{observe(){}disconnect(){}};
let frames=new Map(),frameId=0;
globalThis.requestAnimationFrame=fn=>{frames.set(++frameId,fn);return frameId;};
globalThis.cancelAnimationFrame=id=>frames.delete(id);
function tick(milliseconds){for(const [id,callback] of [...frames]){frames.delete(id);callback(performance.now()+milliseconds);}}
const source=(await readFile(new URL('../dist/scene.js', import.meta.url),'utf8')).replace("import * as THREE from './vendor/three.module.js';",'const THREE=globalThis.__THREE;');
const {createGarden}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const vector=new RealThree.Vector3();
function object(key){return latest.scene.getObjectByName(key);}
function rectangle(group){
  const {camera,canvas}=latest;const b=new RealThree.Box2();
  group.updateWorldMatrix(true,true);
  group.traverse(child=>{if(!child.isMesh)return;child.geometry.computeBoundingBox();const a=child.geometry.boundingBox;
    for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++){
      vector.set(x?a.max.x:a.min.x,y?a.max.y:a.min.y,z?a.max.z:a.min.z).applyMatrix4(child.matrixWorld).project(camera);
      b.expandByPoint(new RealThree.Vector2((vector.x+1)*canvas.width/2,(1-vector.y)*canvas.height/2));
    }
  });
  return {left:b.min.x,right:b.max.x,top:b.min.y,bottom:b.max.y,width:b.max.x-b.min.x,height:b.max.y-b.min.y};
}
function assertFits(group){const r=rectangle(group),{canvas}=latest;assert(r.left>=-0.1&&r.right<=canvas.width+.1&&r.top>=-.1&&r.bottom<=canvas.height+.1,`${group.name} clipped: ${JSON.stringify(r)}`);return r;}
function screenPoint(key,local){const {camera,canvas}=latest;const o=object(key);o.updateWorldMatrix(true,true);vector.copy(local).applyMatrix4(o.matrixWorld).project(camera);return{x:(vector.x+1)*canvas.width/2,y:(1-vector.y)*canvas.height/2};}
function hitPoint(key){
  const r=rectangle(object(key)),{camera,canvas}=latest,ray=new RealThree.Raycaster();
  for(let yi=1;yi<12;yi++)for(let xi=1;xi<12;xi++){
    const x=r.left+r.width*xi/12,y=r.top+r.height*yi/12;
    ray.setFromCamera(new RealThree.Vector2(x/canvas.width*2-1,1-y/canvas.height*2),camera);
    const hits=ray.intersectObject(object(key),true);if(hits.length)return {x,y};
  }
  throw Error('No real geometry hit: '+key);
}
function click(p){const {canvas}=latest;canvas.emit('pointerdown',{clientX:p.x,clientY:p.y});canvas.emit('pointerup',{clientX:p.x,clientY:p.y});}
function beginDrag(p){latest.canvas.emit('pointerdown',{clientX:p.x,clientY:p.y});assert(latest.canvas.hasPointerCapture(1),'capture missing');}
function move(p){latest.canvas.emit('pointermove',{clientX:p.x,clientY:p.y});}
function end(p){latest.canvas.emit('pointerup',{clientX:p.x,clientY:p.y});assert(!latest.canvas.hasPointerCapture(1),'capture leaked');}
for(const [width,height] of [[850,520],[600,460],[343,400]]){
  const selected=[],dropped=[];
  const garden=createGarden({clientWidth:width,clientHeight:height,appendChild(){}},{onSelect:key=>selected.push(key),onDrop:key=>dropped.push(key)});
  assert.equal(frames.size,0,'idle animation');
  assert.equal(object('recycling-lesson').visible,false);
  const natureSizes={};
  for(const key of ['flower','tree','grass']){const r=assertFits(object(key));natureSizes[key]=[Math.round(r.width),Math.round(r.height)];click(hitPoint(key));assert.equal(selected.at(-1),key);}
  const flower=object('flower'),start=flower.position.clone(),startScreen=hitPoint('flower');beginDrag(startScreen);move({x:startScreen.x+25,y:startScreen.y-8});end({x:startScreen.x+25,y:startScreen.y-8});assert(flower.position.distanceTo(start)>.05,'plant did not move');assert.equal(selected.at(-1),'flower');
  const after=flower.position.clone();beginDrag(hitPoint('flower'));move({x:startScreen.x-30,y:startScreen.y+20});latest.canvas.emit('pointercancel',{pointerId:1});assert(flower.position.distanceTo(after)<.001,'cancel changed plant placement');
  garden.resetLayout();assert(flower.position.distanceTo(start)<.001,'reset did not restore plant');
  garden.setMode('recycle');assert.equal(object('nature-lesson').visible,false);assert.equal(object('recycling-lesson').visible,true);
  const binSizes={};for(const key of ['paper','metal','plastic']){const r=assertFits(object(key));binSizes[key]=[Math.round(r.width),Math.round(r.height)];assert(r.width>=60&&r.height>=90,'bin too small');}
  const itemSizes={};
  for(const kind of ['newspaper','can','bottle','box','tin','container']){garden.showItem(kind);const r=assertFits(object('item'));itemSizes[kind]=[Math.round(r.width),Math.round(r.height)];assert(r.width>=70&&r.height>=70,kind+' too small');click(hitPoint('item'));assert.equal(selected.at(-1),'item');}
  for(const key of ['paper','metal','plastic']){garden.takeItem();click(hitPoint(key));assert.equal(selected.at(-1),key,'two-click bin selection obstructed');garden.returnItem();}
  garden.showItem('bottle');garden.takeItem();assert(object('item').visible);
  for(const key of ['paper','metal','plastic']){
    garden.returnItem();const before=object('item').position.clone();beginDrag(hitPoint('item'));
    const r=rectangle(object(key)),p={x:(r.left+r.right)/2,y:(r.top+r.bottom)/2};move(p);assert(object('item').position.distanceTo(before)>.5,'item did not follow drag');end(p);assert.equal(dropped.at(-1),key);
  }
  garden.returnItem();const mouseStart=hitPoint('item'),mouseBin=rectangle(object('metal')),mouseEnd={x:(mouseBin.left+mouseBin.right)/2,y:(mouseBin.top+mouseBin.bottom)/2};
  latest.canvas.emit('pointerdown',{pointerType:'mouse',clientX:mouseStart.x,clientY:mouseStart.y});latest.canvas.emit('pointermove',{pointerType:'mouse',clientX:mouseEnd.x,clientY:mouseEnd.y});latest.canvas.emit('pointerup',{pointerType:'mouse',clientX:mouseEnd.x,clientY:mouseEnd.y});assert.equal(dropped.at(-1),'metal','mouse drag failed');
  garden.returnItem();beginDrag(hitPoint('item'));const empty={x:width+30,y:height+30};move(empty);end(empty);assert.equal(dropped.at(-1),null);assert(object('item').position.distanceTo(new RealThree.Vector3(0,.2,8.3))<.001,'blank drop did not return item');
  const home=object('item').position.clone();beginDrag(hitPoint('item'));move({x:20,y:20});latest.canvas.emit('lostpointercapture',{pointerId:1});assert(object('item').position.distanceTo(home)<.001,'lost capture did not return item');assert.equal(dropped.at(-1),null,'capture loss did not clear app selection');
  garden.takeItem();beginDrag(hitPoint('item'));move({x:30,y:30});latest.canvas.emit('pointercancel',{pointerId:1});assert.equal(dropped.at(-1),null,'pointer cancellation did not clear app selection');
  const dropCount=dropped.length;beginDrag(hitPoint('item'));move({x:30,y:40});garden.setInteraction({enabled:false,completed:true});assert(!latest.canvas.hasPointerCapture(1));assert.equal(latest.canvas.style.touchAction,'pan-y');assert.equal(dropped.length,dropCount,'locking caused callback re-entry');const calls=selected.length;click(hitPoint('item'));assert.equal(selected.length,calls,'locked item reacted');
  garden.putItem('plastic');garden.celebrate('plastic');assert(frames.size>0);tick(1100);assert.equal(object('item').visible,false,'put did not hide item');assert.equal(frames.size,0,'animation did not stop');
  garden.setInteraction({enabled:true,completed:false});garden.showItem('bottle');assert.equal(latest.canvas.style.touchAction,'none');assert(object('item').visible,'new question invisible');
  garden.setMotion(false);garden.putItem('plastic');assert.equal(object('item').visible,false);assert.equal(frames.size,0);
  garden.showItem('newspaper');const map=object('item').children[0].children.find(child=>child.material?.map)?.material.map;let disposed=0;map.addEventListener('dispose',()=>disposed++);garden.showItem('bottle');assert.equal(disposed,1,'old texture not released');
  const oldBounds=rectangle(object('paper'));garden.setZoom(1.25);assert(rectangle(object('paper')).width>oldBounds.width*1.2,'zoom ineffective');garden.setZoom(1);
  beginDrag(hitPoint('item'));move({x:100,y:100});garden.setMode('nature');assert(!latest.canvas.hasPointerCapture(1));assert.equal(frames.size,0);
  garden.dispose();assert.equal(frames.size,0);assert.equal(latest.canvas.listeners.size,0,'listeners leaked');assert.equal(latest.canvas.style.touchAction,'pan-y');
  console.log(JSON.stringify({viewport:[width,height],natureSizes,binSizes,itemSizes,status:'passed'}));
}
console.log('All geometry, touch-pointer, cancellation, locking, animation and resource checks passed.');
