/** Real Three.js geometry/raycasting checks; no browser or WebGL is launched. */
import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {readFile} from 'node:fs/promises';

const sourcePath=new URL('../dist/park-scene.js', import.meta.url);
let latest,now=0,nextFrame=0;
const frames=new Map();
class Canvas {
  style={};listeners=new Map();capture=new Set();attributes=new Map();removed=false;
  setAttribute(key,value){this.attributes.set(key,value);}
  getAttribute(key){return this.attributes.get(key);}
  remove(){this.removed=true;}
  getBoundingClientRect(){return {left:0,top:0,width:this.width,height:this.height,right:this.width,bottom:this.height};}
  addEventListener(type,callback){this.listeners.set(type,callback);}
  removeEventListener(type){this.listeners.delete(type);}
  setPointerCapture(id){this.capture.add(id);}
  hasPointerCapture(id){return this.capture.has(id);}
  releasePointerCapture(id){this.capture.delete(id);this.emit('lostpointercapture',{pointerId:id});}
  emit(type,event={}){this.listeners.get(type)?.({pointerId:1,button:0,isPrimary:true,pointerType:'touch',cancelable:true,preventDefault(){},...event});}
}
class FakeRenderer {
  constructor(){this.domElement=new Canvas();this.shadowMap={};this.capabilities={getMaxAnisotropy:()=>4};}
  setSize(width,height){this.domElement.width=width;this.domElement.height=height;}
  setPixelRatio(){}setClearColor(){}dispose(){this.disposed=true;}
  render(scene,camera){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);latest={scene,camera,canvas:this.domElement,renderer:this};}
}
Object.defineProperty(globalThis,'performance',{configurable:true,value:{now:()=>now}});
globalThis.__PARK_THREE={...THREE,WebGLRenderer:FakeRenderer};
globalThis.window={devicePixelRatio:1,addEventListener(){},removeEventListener(){}};
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>new Proxy({measureText:()=>({width:150}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),canvas:{}},{get:(target,key)=>target[key]??(()=>{}),set:(target,key,value)=>{target[key]=value;return true;}})})};
globalThis.ResizeObserver=class {observe(){}disconnect(){}};
globalThis.requestAnimationFrame=callback=>{frames.set(++nextFrame,callback);return nextFrame;};
globalThis.cancelAnimationFrame=id=>frames.delete(id);
function tick(delta=50){now+=delta;for(const [id,callback] of [...frames]){frames.delete(id);callback(now);}}
function settle(limit=7000){let elapsed=0;while(frames.size&&elapsed<limit){tick();elapsed+=50;}assert.equal(frames.size,0,'animation failed to settle / idle RAF remains');}
const source=(await readFile(sourcePath,'utf8')).replace("import * as THREE from './vendor/three.module.js';",'const THREE=globalThis.__PARK_THREE;');
const {createPark}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
function object(name){const result=latest.scene.getObjectByName(name);assert.ok(result,`Missing scene object ${name}`);return result;}
function visible(node){while(node){if(!node.visible)return false;node=node.parent;}return true;}
function rectangle(group){
  const bounds=new THREE.Box2(),p=new THREE.Vector3();
  group.updateWorldMatrix(true,true);
  group.traverse(child=>{
    if(!child.isMesh||!visible(child))return;
    child.geometry.computeBoundingBox();const b=child.geometry.boundingBox;
    for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++){
      p.set(x?b.max.x:b.min.x,y?b.max.y:b.min.y,z?b.max.z:b.min.z).applyMatrix4(child.matrixWorld).project(latest.camera);
      if(p.z>=-1&&p.z<=1)bounds.expandByPoint(new THREE.Vector2((p.x+1)*latest.canvas.width/2,(1-p.y)*latest.canvas.height/2));
    }
  });
  assert.ok(!bounds.isEmpty(),`${group.name} is not in camera depth range`);
  return {left:bounds.min.x,right:bounds.max.x,top:bounds.min.y,bottom:bounds.max.y,width:bounds.max.x-bounds.min.x,height:bounds.max.y-bounds.min.y};
}
function hitPoints(name){
  const target=object(name),r=rectangle(target),ray=new THREE.Raycaster(),result=[];
  const left=Math.max(1,r.left),right=Math.min(latest.canvas.width-1,r.right),top=Math.max(1,r.top),bottom=Math.min(latest.canvas.height-1,r.bottom);
  assert(right>left&&bottom>top,`${name} outside viewport: ${JSON.stringify(r)}`);
  for(let yi=1;yi<16;yi++)for(let xi=1;xi<16;xi++){
    const x=left+(right-left)*xi/16,y=top+(bottom-top)*yi/16;
    ray.setFromCamera(new THREE.Vector2(x/latest.canvas.width*2-1,1-y/latest.canvas.height*2),latest.camera);
    if(ray.intersectObject(target,true).some(hit=>visible(hit.object)))result.push({x,y});
  }
  assert(result.length,`No real geometry hit for ${name}`);return result;
}
function click(p,pointerType='touch'){latest.canvas.emit('pointerdown',{clientX:p.x,clientY:p.y,pointerType});latest.canvas.emit('pointerup',{clientX:p.x,clientY:p.y,pointerType});}
function drag(from,to,pointerType='touch'){
  latest.canvas.emit('pointerdown',{clientX:from.x,clientY:from.y,pointerType});
  assert(latest.canvas.hasPointerCapture(1),'pointer capture missing');
  latest.canvas.emit('pointermove',{clientX:to.x,clientY:to.y,pointerType});
  latest.canvas.emit('pointerup',{clientX:to.x,clientY:to.y,pointerType});
  assert(!latest.canvas.hasPointerCapture(1),'pointer capture leaked');
}
function findClick(name,predicate){
  for(const p of hitPoints(name)){click(p);if(predicate())return p;}
  throw Error(`Visible ${name} failed to activate at any sampled mesh pixel`);
}
function geometrySignature(group){const items=[];group.updateWorldMatrix(true,true);group.traverse(o=>{if(o.isMesh&&visible(o))items.push([o.geometry.type,o.geometry.parameters,o.matrixWorld.elements,o.material?.color?.getHex()]);});return JSON.stringify(items);}


function opaque(node){
  if(!node.isMesh||!visible(node))return false;
  const materials=Array.isArray(node.material)?node.material:[node.material];
  return materials.some(m=>m?.visible!==false&&(m?.opacity??1)>.05);
}
function belongs(node,target){for(let n=node;n;n=n.parent)if(n===target)return true;return false;}
function visibilitySamples(name){
  const target=object(name),r=rectangle(target),ray=new THREE.Raycaster(),meshList=[];
  latest.scene.traverse(node=>{if(opaque(node))meshList.push(node);});
  const points=[],obstructions=new Map();let targetPixels=0;
  const left=Math.max(1,r.left),right=Math.min(latest.canvas.width-1,r.right),top=Math.max(1,r.top),bottom=Math.min(latest.canvas.height-1,r.bottom);
  for(let yi=1;yi<21;yi++)for(let xi=1;xi<21;xi++){
    const x=left+(right-left)*xi/21,y=top+(bottom-top)*yi/21;
    ray.setFromCamera(new THREE.Vector2(x/latest.canvas.width*2-1,1-y/latest.canvas.height*2),latest.camera);
    const own=ray.intersectObject(target,true).find(h=>opaque(h.object));if(!own)continue;targetPixels++;
    const first=ray.intersectObjects(meshList,false)[0];
    if(!first||belongs(first.object,target)||first.distance>=own.distance-.025)points.push({x,y});
    else {let n=first.object;while(n.parent&&!n.name)n=n.parent;obstructions.set(n.name||n.type,(obstructions.get(n.name||n.type)||0)+1);}
  }
  assert(targetPixels>0,`No target pixels for ${name}`);
  return {points,fraction:points.length/targetPixels,targetPixels,blocked:Object.fromEntries(obstructions)};
}
function clearClick(name,predicate){
  const sampled=visibilitySamples(name);
  assert(sampled.points.length,`No actually visible pixels for ${name}: ${JSON.stringify(sampled.blocked)}`);
  for(const point of sampled.points){click(point);if(predicate())return point;}
  throw Error(`Visible ${name} did not respond to pointer input`);
}
function assertFramed(name,padding=3){
  const r=rectangle(object(name));
  assert(r.left>=-padding&&r.right<=latest.canvas.width+padding&&r.top>=-padding&&r.bottom<=latest.canvas.height+padding,`${name} clipped by fixed camera: ${JSON.stringify(r)}`);
  return r;
}
for(const [width,height] of [[850,570],[700,500],[343,430],[364,338]]){
  const selected=[],actions=[],arrived=[];
  const park=createPark({clientWidth:width,clientHeight:height,appendChild(){}},{onSelect:value=>selected.push(value),onAction:value=>actions.push(value),onArrive:value=>arrived.push(value)});
  await Promise.resolve();
  assert.equal(park.getState().station,'entrance');assert.equal(frames.size,0,'idle park schedules frames');
  latest.scene.traverse(node=>{
    assert(!/marker-|park-bin-|station-recycle|plaque|billboard/i.test(node.name),'removed signs/recycling remain in park');
    if(node.isMesh)for(const m of Array.isArray(node.material)?node.material:[node.material])assert(!m?.map?.isCanvasTexture,'3D text billboard remains');
  });
  const start=latest.camera.position.clone(),arrivalBefore=arrived.length;
  park.goTo('flower');assert.equal(arrived.length,arrivalBefore,'arrived callback before guided travel finished');settle();assert.equal(arrived.at(-1),'flower');assert(start.distanceTo(latest.camera.position)>2);
  const partSizes={},partVisibility={};
  for(const [station,keys]of [['flower',['flower.petals','flower.leaf','flower.stem']],['tree',['tree.leaf','tree.trunk','tree.root']],['grass',['grass.leaf']]]){
    park.goTo(station);settle();
    for(const key of keys){
      const bounds=assertFramed(key),sampled=visibilitySamples(key);
      partSizes[key]=[Math.round(bounds.width),Math.round(bounds.height)];partVisibility[key]=Number(sampled.fraction.toFixed(3));
      assert(sampled.fraction>=.5,`${key} is substantially occluded: ${JSON.stringify({fraction:sampled.fraction,blocked:sampled.blocked})}`);
      const count=selected.length;clearClick(key,()=>selected.length>count&&selected.at(-1)?.key===key);assert.equal(selected.at(-1).kind,'part');
      park.focusPart(key);assert.equal(frames.size,0,'selection animates indefinitely');
    }
  }
  park.goTo('tree');settle();object('tree.root.traces');assert(visibilitySamples('tree.root.traces').fraction>.65,'visible root lines are hidden by cross-section soil');
  park.setMotion(false);const positions=new Set();
  for(const station of ['entrance','flower','tree','grass','growth','conditions']){
    park.goTo(station);assert.equal(park.getState().station,station);assert.equal(park.getState().transitioning,false);positions.add(latest.camera.position.toArray().map(n=>n.toFixed(2)).join(','));assert.equal(frames.size,0);
  }
  assert.equal(positions.size,6,'guided observation stops share the same camera');
  park.goTo('flower');const cameraPosition=latest.camera.position.clone(),cameraOrientation=latest.camera.quaternion.clone();
  latest.canvas.emit('pointerdown',{clientX:2,clientY:2});latest.canvas.emit('pointermove',{clientX:100,clientY:60});latest.canvas.emit('pointerup',{clientX:100,clientY:60});
  assert(latest.camera.quaternion.angleTo(cameraOrientation)<.000001,'background drag changes fixed guided camera');park.move?.('forward');assert(latest.camera.position.distanceTo(cameraPosition)<.000001,'manual movement remains available');
  const can=object('watering-can');
  for(const [station,targetName]of [['flower','water-target-flower'],['conditions','water-target-conditions']]){
    park.goTo(station);assertFramed('watering-can');const home=can.position.clone(),before=actions.filter(x=>x==='water').length;
    const canPoint=clearClick('watering-can',()=>actions.filter(x=>x==='water').length>before),target=rectangle(object(targetName));
    const destination={x:(target.left+target.right)/2,y:(target.top+target.bottom)/2};
    drag(canPoint,destination);assert.equal(actions.filter(x=>x==='water').length,before+2,'true watering-can drag did not water');assert(can.position.distanceTo(home)<.001,'water can did not return home');
    const count=actions.filter(x=>x==='water').length;
    drag(canPoint,{x:width+50,y:height+50},'mouse');assert.equal(actions.filter(x=>x==='water').length,count,'off-target drag incorrectly watered');assert(can.position.distanceTo(home)<.001);
    latest.canvas.emit('pointerdown',{clientX:canPoint.x,clientY:canPoint.y});latest.canvas.emit('pointermove',{clientX:10,clientY:20});latest.canvas.emit('pointercancel',{pointerId:1});
    assert.equal(latest.canvas.capture.size,0,'cancel leaves pointer captured');assert(can.position.distanceTo(home)<.001);assert.equal(actions.filter(x=>x==='water').length,count,'canceled drag watered');
  }
  park.goTo('growth');assert.equal(can.visible,false,'watering can hides growth model');assert.equal(object('station-conditions').visible,false,'later flowering example distracts from early growth stages');const signatures=[];
  for(let stage=0;stage<5;stage++){
    park.setGrowthStage(stage);assert.equal(park.getState().growthStage,stage);const bounds=assertFramed('growth-plant');assert(bounds.width>=25,'growth model too small');
    const sampled=visibilitySamples('growth-plant');assert(sampled.fraction>.8,`growth stage ${stage} occluded: ${JSON.stringify(sampled.blocked)}`);signatures.push(geometrySignature(object('growth-plant')));
  }
  assert.equal(new Set(signatures).size,5,'growth stages do not change geometry');
  park.setGrowthStage(1);object('growth-root');assert(visibilitySamples('growth-root').fraction>.6,'germination root is buried/occluded');
  park.goTo('conditions');assert.equal(object('station-conditions').visible,true,'conditions teaching bed not restored at its own stop');assert(can.visible,'conditions watering can missing');assertFramed('watering-can');
  park.goTo('growth');assert.equal(object('station-conditions').visible,false);park.goTo('entrance');assert.equal(object('station-conditions').visible,true,'conditions bed not restored for park overview');park.goTo('conditions');
  park.setConditions({sun:false,water:false,air:false});assert.deepEqual(park.getState().conditions,{sun:false,water:false,air:false});assert.equal(object('moisture').visible,false);assert.equal(object('air-flow').visible,false);
  park.setConditions({sun:true,water:true,air:true});assert.deepEqual(park.getState().conditions,{sun:true,water:true,air:true});assert.equal(object('moisture').visible,true);assert.equal(object('air-flow').visible,true);
  park.setMotion(true);park.setConditions({sun:true});settle();park.setConditions({air:true});settle();park.water();settle();
  const completion=arrived.length;park.goTo('tree');assert(frames.size>0);park.setMotion(false);assert.equal(frames.size,0);assert.equal(arrived.at(-1),'tree');assert.equal(arrived.length,completion+1);
  park.setMotion(true);const retarget=arrived.length;park.goTo('grass');park.goTo('conditions');settle();assert.deepEqual(arrived.slice(retarget),['conditions'],'canceled destination announced arrival');park.setMotion(false);
  park.goTo('flower');const locked=clearClick('watering-can',()=>actions.at(-1)==='water');latest.canvas.emit('pointerdown',{clientX:locked.x,clientY:locked.y});park.setInteractive(false);assert.equal(latest.canvas.capture.size,0);
  const counts=[actions.length,selected.length];click(locked);assert.deepEqual([actions.length,selected.length],counts,'locked scene responds to input');park.setInteractive(true);
  let material;object('flower.petals').traverse(o=>{if(o.isMesh&&!material)material=o.material;});let disposed=0;material?.addEventListener('dispose',()=>disposed++);
  park.dispose();assert.equal(frames.size,0);assert.equal(latest.canvas.listeners.size,0);assert.equal(latest.canvas.capture.size,0);assert(latest.renderer.disposed);assert(disposed>0,'material leak');
  console.log(JSON.stringify({viewport:[width,height],partSizes,partVisibility,status:'passed'}));
}
console.log('PASS: fixed guided tour, no 3D signs/recycling, first-hit plant visibility, watering drag/cancel, five visible growth stages, conditions, arrival/reduced-motion, locks and disposal.');
