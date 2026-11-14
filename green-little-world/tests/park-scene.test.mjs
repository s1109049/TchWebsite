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

for(const [width,height] of [[850,570],[700,500],[343,430]]){
  const navigated=[],selected=[],actions=[],arrived=[];
  const park=createPark({clientWidth:width,clientHeight:height,appendChild(){}},{onNavigate:station=>navigated.push(station),onSelect:value=>selected.push(value),onAction:action=>actions.push(action),onArrive:station=>arrived.push(station)});
  await Promise.resolve();
  assert.equal(park.getState().station,'entrance');assert.equal(frames.size,0,'park animates at idle');
  const cameraStart=latest.camera.position.clone();
  const arrivalBefore=arrived.length;park.goTo('flower');assert.equal(park.getState().station,'flower');assert.equal(arrived.length,arrivalBefore,'arrived before travelling finished');settle();assert.equal(arrived.at(-1),'flower');
  assert(cameraStart.distanceTo(latest.camera.position)>2,'tour did not actually move through park');
  const partSizes={};
  for(const [station,keys] of [['flower',['flower.petals','flower.leaf','flower.stem']],['tree',['tree.leaf','tree.trunk','tree.root']],['grass',['grass.leaf']]]){
    park.goTo(station);settle();
    for(const key of keys){
      const r=rectangle(object(key));partSizes[key]=[Math.round(r.width),Math.round(r.height)];
      findClick(key,()=>selected.at(-1)?.key===key);
      assert.equal(selected.at(-1).kind,'part');
      park.focusPart(key);assert.equal(frames.size,0,'selection caused an indefinite animation');
    }
  }
  // Each camera destination must be a real viewpoint inside the same environment.
  const viewpointPositions=new Set();
  park.setMotion(false);
  for(const station of ['entrance','flower','tree','grass','growth','recycle']){
    park.goTo(station);assert.equal(park.getState().station,station);assert.equal(park.getState().transitioning,false);
    viewpointPositions.add(latest.camera.position.toArray().map(n=>n.toFixed(2)).join(','));
    assert.equal(frames.size,0,'reduced-motion navigation scheduled frames');
  }
  assert.equal(viewpointPositions.size,6,'camera destinations are not distinct');
  for(const [key,label] of [['paper','廢紙'],['metal','金屬'],['plastic','塑膠']])findClick('park-bin-'+label,()=>selected.at(-1)?.kind==='bin'&&selected.at(-1)?.key===key);
  park.goTo('entrance');findClick('marker-flower',()=>navigated.at(-1)==='flower');
  park.goTo('flower');
  const can=object('watering-can'),canHome=can.position.clone();
  const canTap=findClick('watering-can',()=>actions.at(-1)==='water');
  const target=rectangle(object('water-target-flower'));
  const destination={x:Math.max(2,Math.min(width-2,(target.left+target.right)/2)),y:Math.max(2,Math.min(height-2,(target.top+target.bottom)/2))};
  const waterBefore=actions.filter(x=>x==='water').length;
  drag(canTap,destination);
  assert.equal(actions.filter(x=>x==='water').length,waterBefore+1,'dragging the watering can onto flower bed did not water');
  assert(can.position.distanceTo(canHome)<.001,'watering can did not return after use');
  drag(canTap,{x:width+50,y:height+50},'mouse');
  assert(can.position.distanceTo(canHome)<.001,'empty-ground drop did not return watering can');
  const actionCount=actions.length,begin=canTap;
  latest.canvas.emit('pointerdown',{clientX:begin.x,clientY:begin.y});latest.canvas.emit('pointermove',{clientX:20,clientY:20});latest.canvas.emit('pointercancel',{pointerId:1});
  assert(!latest.canvas.hasPointerCapture(1),'cancel leaked pointer capture');assert(can.position.distanceTo(canHome)<.001,'cancel did not restore can');assert.equal(actions.filter(x=>x==='water').length,waterBefore+1,'cancel incorrectly watered');
  const homeView=latest.camera.position.clone();
  park.move('forward');assert(latest.camera.position.distanceTo(homeView)>.05,'walk control does not move camera');
  for(let i=0;i<100;i++)park.move('forward');
  assert(latest.camera.position.distanceTo(homeView)<12,'walk escaped the station boundary');
  park.resetView();assert(latest.camera.position.distanceTo(homeView)<.001,'reset view failed');
  const viewOrientation=latest.camera.quaternion.clone();drag({x:width/2,y:10},{x:width/2+40,y:30});assert(latest.camera.quaternion.angleTo(viewOrientation)>.01,'looking around did not rotate the view');park.resetView();assert(latest.camera.quaternion.angleTo(viewOrientation)<.001,'reset view did not restore look direction');
  park.goTo('growth');const signatures=[];
  for(let stage=0;stage<5;stage++){
    park.setGrowthStage(stage);assert.equal(park.getState().growthStage,stage);
    signatures.push(geometrySignature(object('growth-plant')));
  }
  assert.equal(new Set(signatures).size,5,'growth stages do not change 3D geometry');
  const nurseryBefore=actions.filter(action=>action==='water').length;
  const nurseryTap=findClick('watering-can',()=>actions.filter(action=>action==='water').length>nurseryBefore),nurseryTarget=rectangle(object('water-target-growth'));
  drag(nurseryTap,{x:(nurseryTarget.left+nurseryTarget.right)/2,y:(nurseryTarget.top+nurseryTarget.bottom)/2});assert.equal(actions.filter(action=>action==='water').length,nurseryBefore+2,'watering nursery by dragging failed');
  park.setConditions({sun:false,water:false,air:false});assert.deepEqual(park.getState().conditions,{sun:false,water:false,air:false});assert.equal(object('park-sun').visible,false);assert.equal(object('park-clouds').visible,true);assert.equal(object('moisture').visible,false);assert.equal(object('air-flow').visible,false);
  park.setConditions({sun:true,water:true,air:true});assert.deepEqual(park.getState().conditions,{sun:true,water:true,air:true});assert.equal(object('park-sun').visible,true);assert.equal(object('moisture').visible,true);assert.equal(object('air-flow').visible,true);
  park.water();assert.equal(frames.size,0,'reduced-motion watering animates');
  park.setMotion(true);park.setConditions({sun:true});settle();park.setConditions({air:true});settle();park.water();settle();
  park.goTo('tree');assert.ok(frames.size,'guided travel does not animate when enabled');
  park.setMotion(false);assert.equal(frames.size,0,'motion preference does not stop travel');
  assert.equal(park.getState().transitioning,false);
  assert.equal(arrived.at(-1),'tree','reduced motion did not complete arrival');
  park.setMotion(true);const retargetBefore=arrived.length;park.goTo('grass');park.goTo('growth');settle();assert.deepEqual(arrived.slice(retargetBefore),['growth'],'retargeting announced canceled destination');park.setMotion(false);
  park.goTo('flower');const lockedStart=findClick('watering-can',()=>actions.at(-1)==='water');latest.canvas.emit('pointerdown',{clientX:lockedStart.x,clientY:lockedStart.y});
  park.setInteractive(false);assert(!latest.canvas.hasPointerCapture(1),'locking left pointer captured');
  const lockedActions=actions.length,lockedSelections=selected.length;
  const lockedView=latest.camera.position.clone();click(lockedStart);park.move('forward');assert.equal(actions.length,lockedActions);assert.equal(selected.length,lockedSelections);assert(latest.camera.position.distanceTo(lockedView)<.001,'locked walk controls changed camera');
  park.setInteractive(true);findClick('watering-can',()=>actions.length>lockedActions);
  const material=object('flower.petals').children.find(o=>o.isMesh)?.material??object('flower.petals').material;
  let disposedMaterials=0;if(material)material.addEventListener('dispose',()=>disposedMaterials++);
  park.dispose();assert.equal(frames.size,0,'dispose left RAF scheduled');assert.equal(latest.canvas.listeners.size,0,'dispose left pointer listeners');assert.equal(latest.canvas.capture.size,0,'dispose left pointer capture');assert(latest.renderer.disposed);if(material)assert(disposedMaterials>0,'materials not disposed');
  console.log(JSON.stringify({viewport:[width,height],partSizes,status:'passed'}));
}
console.log('PASS: guided 3D tour, real part picking, route markers, watering click/drag/cancel, bounded walking, five distinct growth stages, conditions, reduced motion, locks and disposal.');
