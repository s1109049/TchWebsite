import * as THREE from './vendor/three.module.js';

/** A continuous, accessible science park. All artwork and interaction run locally. */
export function createPark(container, {
  onNavigate = () => {}, onSelect = () => {}, onAction = () => {}, onArrive = () => {},
  onReady = () => {}, onError = () => {}, reducedMotion = false
} = {}) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' }); }
  catch (error) { onError(error); throw error; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor('#dcebe5', 1);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;';
  container.appendChild(canvas);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#dcebe5'); scene.fog = new THREE.Fog('#dcebe5', 34, 90);
  const world = new THREE.Group(); world.name = 'science-park'; scene.add(world);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 130);
  const hemi = new THREE.HemisphereLight('#fff8e5', '#a9b98c', 2.3); scene.add(hemi);
  const light = new THREE.DirectionalLight('#fff1ce', 3.0); light.position.set(-12, 23, 14);
  light.castShadow = true; light.shadow.mapSize.set(2048, 2048);
  Object.assign(light.shadow.camera, { left: -28, right: 28, top: 30, bottom: -28, near: 1, far: 70 });
  light.shadow.normalBias = 0.045; light.shadow.bias = -0.0001; light.shadow.radius = 4; scene.add(light);
  const materials = new Map(), textures = new Set();
  function material(color, extra = {}) {
    const key = color + JSON.stringify(extra);
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...extra }));
    return materials.get(key);
  }
  function mesh(parent, geometry, mat, x = 0, y = 0, z = 0) {
    const object = new THREE.Mesh(geometry, mat); object.position.set(x, y, z);
    object.castShadow = true; object.receiveShadow = true; parent.add(object); return object;
  }
  function box(parent,x,y,z,w,h,d,color) { return mesh(parent,new THREE.BoxGeometry(w,h,d),material(color),x,y,z); }
  function sphere(parent,x,y,z,sx,sy,sz,color) {
    const object=mesh(parent,new THREE.SphereGeometry(1,16,12),material(color),x,y,z);object.scale.set(sx,sy,sz);return object;
  }
  function cylinder(parent,x,y,z,r1,r2,h,color,sides=16) { return mesh(parent,new THREE.CylinderGeometry(r1,r2,h,sides),material(color),x,y,z); }
  function link(parent,a,b,radius,color) {
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);
    const part=cylinder(parent,0,0,0,radius,radius*1.13,delta.length(),color,10);
    part.position.copy(start.add(end).multiplyScalar(.5));part.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return part;
  }
  function group(parent,name,x=0,y=0,z=0) {const result=new THREE.Group();result.name=name;result.position.set(x,y,z);parent.add(result);return result;}
  function plaque(parent,text,x,y,z,width=2.8,height=.7,bg='#fff9e5',ink='#365541') {
    const image=document.createElement('canvas'); image.width=768; image.height=192;
    const ctx=image.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,image.width,image.height);
    ctx.fillStyle=ink;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 82px "Noto Sans CJK TC", "Microsoft JhengHei", sans-serif';ctx.fillText(text,384,100,720);
    const texture=new THREE.CanvasTexture(image);texture.colorSpace=THREE.SRGBColorSpace;textures.add(texture);
    const sign=mesh(parent,new THREE.PlaneGeometry(width,height),new THREE.MeshStandardMaterial({map:texture,roughness:1,side:THREE.DoubleSide}),x,y,z);sign.castShadow=false;return sign;
  }
  function raisedBed(parent,x,z,w,d,color='#8e6d4d') {
    box(parent,x,.17,z,w,.34,d,'#c6af85');return box(parent,x,.36,z,w-.2,.12,d-.2,color);
  }
  function foliage(parent,x,y,z,scale=1) {
    const result=sphere(parent,x,y,z,1.3*scale,1.05*scale,1.1*scale,'#6f995b');
    sphere(parent,x-.7*scale,y-.15*scale,z+.2*scale,.8*scale,.8*scale,.8*scale,'#89aa6b');
    sphere(parent,x+.65*scale,y-.2*scale,z+.1*scale,.85*scale,.8*scale,.8*scale,'#7ca15f');return result;
  }
  // A wide ground, connected paths, perimeter shrubs and furniture establish a real park.
  const ground=mesh(world,new THREE.PlaneGeometry(120,120),material('#a9c58a'),0,-.02,0);ground.rotation.x=-Math.PI/2;ground.castShadow=false;
  const lawn=mesh(world,new THREE.PlaneGeometry(34,44),material('#b9cf96'),0,0,3);lawn.rotation.x=-Math.PI/2;lawn.castShadow=false;
  function path(points,width=2.4) {
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],.035,p[1]))),position=[],indices=[];
    const segments=70;
    for(let i=0;i<=segments;i++){
      const p=curve.getPoint(i/segments),t=curve.getTangent(i/segments),normal=new THREE.Vector3(t.z,0,-t.x).multiplyScalar(width/2);
      position.push(p.x+normal.x,p.y,p.z+normal.z,p.x-normal.x,p.y,p.z-normal.z);
      if(i<segments){const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(position,3));geo.setIndex(indices);geo.computeVertexNormals();
    const result=mesh(world,geo,material('#e4d8b9'));result.castShadow=false;return result;
  }
  path([[0,24],[0,18],[0,12],[-7,12],[-10,5],[-6,0],[0,-1],[7,0],[10,5],[7,12],[0,12]],2.7);
  path([[0,21],[3,21],[6,21]],2.7);
  path([[-7,12],[-7,10],[-7,8.6]],1.9);path([[7,12],[7,10],[7,8.4]],1.9);
  path([[7,0],[7,-1],[7,-3.5]],1.9);path([[-6,0],[-6,-1],[-6,-3.6]],1.9);
  // Distant shrubs are scenery, not new choices for the learner.
  for(let i=0;i<13;i++)foliage(world,-17+i*2.8,.6,-16,.72+(i%3)*.06);
  for(let i=0;i<9;i++){foliage(world,-18,.6,-12+i*4,.65);foliage(world,18,.6,-12+i*4,.65);}
  for(const side of [-1,1]){
    for(let i=0;i<8;i++){box(world,side*14,.55,-13+i*4,.13,1.1,.13,'#d6c39b');}
    box(world,side*14,.78,1,.1,.12,29,'#e8d8b3');
  }
  function bench(x,z,rotation=0){
    const b=group(world,'park-bench',x,0,z);b.rotation.y=rotation;
    for(const px of [-.9,.9]){box(b,px,.45,0,.15,.9,.8,'#526c58');box(b,px,1.06,-.32,.13,1.1,.13,'#526c58');}
    for(let i=0;i<3;i++)box(b,0,.93,-.26+i*.27,2.35,.13,.21,'#bc9260');
    for(let i=0;i<3;i++)box(b,0,1.22+i*.25,-.4,2.35,.17,.12,'#c49c6c');
  }
  bench(-11,15,.2);bench(11,-8,-.3);
  const pond=mesh(world,new THREE.CircleGeometry(2.4,48),material('#a9cfcd',{roughness:.3}),0,.04,-11);pond.rotation.x=-Math.PI/2;pond.scale.set(1.5,.8,1);pond.castShadow=false;
  for(let i=0;i<13;i++){const a=i/13*Math.PI*2;sphere(world,Math.cos(a)*3.65,.12,-11+Math.sin(a)*1.95,.42,.23,.32,'#d1c6a8');}
  const sunModel=group(world,'park-sun',-18,22,-28);sphere(sunModel,0,0,0,2,2,2,'#f4d17e');
  const clouds=group(world,'park-clouds',-12,15,-21);for(let i=0;i<4;i++)sphere(clouds,i*1.2,Math.sin(i)*.25,0,1.3,.7,.7,'#f1f4e9');clouds.visible=false;
  const gate=group(world,'park-gate',0,0,19);
  box(gate,-3.1,1.8,0,.26,3.6,.26,'#819c6b');box(gate,3.1,1.8,0,.26,3.6,.26,'#819c6b');
  box(gate,0,3.48,0,6.5,.25,.34,'#819c6b');plaque(gate,'綠意科學公園',0,3.62,.21,5.5,.72);
  const stations={},parts={},markers={};
  const stationInfo={
    entrance:{label:'公園入口',target:[0,1,-2],anchor:[0,21],width:14,height:8,distance:24},
    flower:{label:'花圃',target:[-7,1.65,7],anchor:[-7,12],width:4.9,height:4.0,distance:6.8},
    tree:{label:'大樹',target:[7,2.7,5],anchor:[7,12],width:6.6,height:6.1,distance:9.4},
    grass:{label:'草地',target:[7,1,-6],anchor:[7,0],width:5.0,height:3.1,distance:6.8},
    growth:{label:'育苗區',target:[-6,1.5,-6],anchor:[-6,0],width:5.4,height:4.3,distance:7.3},
    recycle:{label:'回收站',target:[6,1.7,15],anchor:[6,21],width:7.8,height:4,distance:9.0}
  };
  for(const key of ['flower','tree','grass','growth','recycle']){
    const info=stationInfo[key];stations[key]=group(world,'station-'+key,info.target[0],0,info.target[2]);
    stations[key].userData={kind:'destination',key};
  }
  function part(parent,key){const result=group(parent,key);result.userData={kind:'part',key};parts[key]=result;return result;}
  function makeFlower(parent,{height=2.7,size=1,color='#e5a1a9',interactive=false}={}) {
    const stem=interactive?part(parent,'flower.stem'):group(parent,'flower-stem');
    cylinder(stem,0,height/2,0,.075*size,.09*size,height,'#6c9752',10);
    const leaves=interactive?part(parent,'flower.leaf'):group(parent,'flower-leaves');
    const l=sphere(leaves,-.42*size,height*.39,0,.64*size,.17*size,.23*size,'#7ea55a');l.rotation.z=-.38;
    const r=sphere(leaves,.42*size,height*.59,.03,.63*size,.17*size,.23*size,'#92b46a');r.rotation.z=.38;
    const petals=interactive?part(parent,'flower.petals'):group(parent,'flower-petals');
    const head=group(petals,'blossom',0,height,0);head.rotation.x=-.08;
    for(let i=0;i<6;i++){const angle=i*Math.PI/3;const p=sphere(head,Math.sin(angle)*.4*size,Math.cos(angle)*.4*size,0,.28*size,.4*size,.15*size,color);p.rotation.z=-angle;}
    sphere(head,0,0,.14,.27*size,.27*size,.17*size,'#ebbf55');
  }
  const flower=stations.flower;raisedBed(flower,0,0,4.4,2.7);const mainFlower=group(flower,'main-flower',-.45,.4,0);makeFlower(mainFlower,{interactive:true,height:2.7,size:1.05});
  for(const [x,z,h,s,c]of [[-1.4,.5,1.1,.55,'#f0d59a'],[1,.25,1.4,.65,'#e9afbc'],[1.35,-.75,1.1,.48,'#efdcac']]){const f=group(flower,'bed-flower',x,.4,z);makeFlower(f,{height:h,size:s,color:c});}
  const flowerWaterZone=box(flower,0,1.6,0,4.5,3.3,2.7,'#b2d49c');flowerWaterZone.name='water-target-flower';flowerWaterZone.material=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});flowerWaterZone.castShadow=false;
  const tree=stations.tree;
  const trunk=part(tree,'tree.trunk');cylinder(trunk,0,2,0,.36,.53,4,'#96714f',14);
  link(trunk,[0,2.4,0],[-1.25,4,0],.19,'#96714f');link(trunk,[0,2.6,0],[1.1,4.15,.05],.19,'#96714f');
  const canopy=part(tree,'tree.leaf');
  sphere(canopy,0,4.65,0,1.85,1.5,1.3,'#638b55');sphere(canopy,-1.2,4.2,.15,1.25,1.2,1.05,'#80a366');sphere(canopy,1.2,4.25,.1,1.2,1.18,1,'#71995a');sphere(canopy,-.2,5.4,.05,1.3,1.0,1.1,'#91af71');
  cylinder(tree,0,.04,0,2.1,2.1,.08,'#a4bf7d',40);
  const roots=part(tree,'tree.root');roots.position.set(-2.05,.1,1.1);
  box(roots,0,.69,0,2.8,1.36,.38,'#98734e');box(roots,0,1.39,0,2.9,.13,.55,'#9fb778');
  link(roots,[.15,1.3,.23],[0,.65,.24],.095,'#e1c28c');
  for(const [ax,ay,bx,by]of [[0,.9,-.9,.38],[0,.7,.8,.15],[-.4,.65,-1.05,.14],[.4,.4,1.1,.22],[0,.6,-.15,.05]])link(roots,[ax,ay,.24],[bx,by,.24],.06,'#e1c28c');
  plaque(roots,'地下剖面',0,1.76,.27,2.7,.57);
  const grass=stations.grass;raisedBed(grass,0,0,4.8,3.0,'#a0b978');
  const grassLeaves=part(grass,'grass.leaf');
  for(let tuft=0;tuft<8;tuft++){
    const x=(tuft%4)*1.05-1.58,z=Math.floor(tuft/4)*1.25-.6;
    for(let i=0;i<6;i++){
      const blade=mesh(grassLeaves,new THREE.ConeGeometry(.13,.95+(i%3)*.2,5),material(i%2?'#77a052':'#88ac5d'),x+Math.cos(i)*.18,.9,z+Math.sin(i)*.18);
      blade.rotation.x=Math.sin(i)*.22;blade.rotation.z=Math.cos(i)*.25;
    }
  }
  const nursery=stations.growth;const soil=raisedBed(nursery,0,0,4.4,2.8,'#9e7b55');soil.material=material('#9e7b55').clone();
  plaque(nursery,'生長示意',-.15,3.9,-.6,3.4,.6);
  const growing=group(nursery,'growth-plant',-.45,.44,0),growthStages=[];
  for(let index=0;index<5;index++)growthStages.push(group(growing,'growth-stage-'+index));
  sphere(growthStages[0],0,.12,.4,.38,.2,.25,'#a37b45');
  sphere(growthStages[1],0,.12,.2,.26,.15,.18,'#b79362');link(growthStages[1],[0,.12,.2],[0,.65,.2],.07,'#92a85b');
  const firstLeaf=sphere(growthStages[1],.24,.57,.2,.35,.12,.18,'#91b467');firstLeaf.rotation.z=.35;
  link(growthStages[1],[0,.1,.22],[-.08,-.22,.23],.045,'#dfd1a4');
  cylinder(growthStages[2],0,.53,0,.06,.07,1.06,'#70934e');
  for(const side of [-1,1]){const leaf=sphere(growthStages[2],side*.35,.82,0,.5,.16,.23,'#87aa61');leaf.rotation.z=side*.3;}
  for(const index of [3,4]){
    cylinder(growthStages[index],0,1.3,0,.075,.09,2.6,'#71974f');
    for(let j=0;j<4;j++){const side=j%2?-1:1;const leaf=sphere(growthStages[index],side*.4,.55+j*.45,0,.62,.17,.25,j%2?'#82a35d':'#91ae67');leaf.rotation.z=side*.35;}
  }
  const growthHead=group(growthStages[4],'growth-flower',0,2.6,0);
  for(let i=0;i<6;i++){const a=i*Math.PI/3;const petal=sphere(growthHead,Math.sin(a)*.4,Math.cos(a)*.4,0,.27,.4,.15,'#e9a7af');petal.rotation.z=-a;}
  sphere(growthHead,0,0,.14,.26,.26,.17,'#e9be55');
  const growthWaterZone=box(nursery,0,1.65,0,4.5,3.4,2.8,'#9fc68b');growthWaterZone.name='water-target-growth';growthWaterZone.material=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});growthWaterZone.castShadow=false;
  const moisture=group(nursery,'moisture',-.45,.47,.1);
  for(let i=0;i<3;i++){const d=sphere(moisture,-.6+i*.55,.06,.8,.1,.16,.09,'#85bdcb');d.castShadow=false;}
  const airflow=group(nursery,'air-flow',1.2,1.5,-.2);
  plaque(nursery,'空氣（示意）',1.3,2.7,-.25,1.8,.4);
  const nurserySun=group(nursery,'nursery-sun',-1.7,3.0,-.3);
  sphere(nurserySun,0,0,0,.32,.32,.16,'#edc363');
  for(let i=0;i<8;i++){const a=i*Math.PI/4;const ray=box(nurserySun,Math.sin(a)*.5,Math.cos(a)*.5,0,.07,.19,.05,'#edc363');ray.rotation.z=-a;}
  for(let i=0;i<3;i++){
    const points=[new THREE.Vector3(-.5,i*.35,0),new THREE.Vector3(0,i*.35+.12,0),new THREE.Vector3(.6,i*.35+.05,0)];
    const line=mesh(airflow,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),16,.035,6,false),material('#b6d4cf'));line.castShadow=false;
    const tip=mesh(airflow,new THREE.ConeGeometry(.12,.22,8),material('#b6d4cf'),.63,i*.35+.05,0);tip.rotation.z=-Math.PI/2;
  }
  const recycle=stations.recycle;
  for(const [i,color,label]of [[-1,'#4d91c5','廢紙'],[0,'#ecc44e','金屬'],[1,'#a57a56','塑膠']]){
    const bin=group(recycle,'park-bin-'+label,i*2.2,.1,0);
    const key=i===-1?'paper':i===0?'metal':'plastic';bin.userData={kind:'bin',key};parts[key]=bin;
    box(bin,0,1.25,0,1.8,2.4,1.5,color);box(bin,0,2.52,0,1.95,.18,1.65,color);box(bin,0,2.12,.77,.9,.22,.04,'#304b43');
    plaque(bin,'♻ '+label,0,1.2,.79,1.5,.9);for(const side of [-1,1]){const wheel=cylinder(bin,side*.66,.1,-.55,.2,.2,.15,'#4c5d50');wheel.rotation.z=Math.PI/2;}
  }
  // Destination signs remain in the landscape; HTML controls offer the same navigation.
  for(const [key,index]of [['flower',1],['tree',2],['grass',3],['growth',4],['recycle',5]]){
    const info=stationInfo[key],m=group(world,'marker-'+key,info.target[0],0,info.target[2]+1.9);
    cylinder(m,0,1,0,.07,.07,2,'#8ba36d');const sign=plaque(m,`${index}  ${info.label}`,0,2.2,0,2.6,.64);sign.userData={kind:'navigate',key};m.userData={kind:'navigate',key};markers[key]=m;
  }
  // The watering can is a real draggable model shared by the two plant-care stops.
  const can=group(world,'watering-can');can.userData={kind:'action',key:'water'};
  cylinder(can,0,.55,0,.4,.5,.85,'#8ab4ab',24);cylinder(can,0,1.0,0,.42,.42,.08,'#a8c9b8',24);
  const handle=mesh(can,new THREE.TorusGeometry(.45,.09,8,24),material('#699a91'),.42,.65,0);handle.rotation.y=Math.PI/2;
  link(can,[-.2,.55,.05],[-.9,1.05,.05],.13,'#8ab4ab');const rose=cylinder(can,-.97,1.11,.05,.25,.16,.2,'#b0d2c5',16);rose.rotation.z=-.85;
  can.scale.setScalar(1.25);can.visible=false;
  const drops=group(world,'watering-drops');drops.visible=false;
  for(let i=0;i<14;i++)sphere(drops,(i%4-.5)*.18,(i%5)*.22,(Math.floor(i/4)-1)*.15,.055,.12,.055,'#8ec4d0');
  const highlight=new THREE.Box3Helper(new THREE.Box3(),new THREE.Color('#e9bc45'));highlight.visible=false;highlight.material.depthTest=false;highlight.renderOrder=5;scene.add(highlight);

  let station='entrance',growthStage=0,conditions={sun:true,water:true,air:true};
  let interactive=true,motion=!reducedMotion,disposed=false,transition=null,watering=null,conditionPulse=null,drag=null,raf=0;
  let currentLook=new THREE.Vector3(),homePosition=new THREE.Vector3(),homeLook=new THREE.Vector3(),canHome=new THREE.Vector3();
  let yaw=0,pitch=0,selectedPart=null,frameStamp=0;
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),point=new THREE.Vector3();
  const routes={entrance:['hub','recycle'],hub:['entrance','flower','tree'],flower:['hub','left'],left:['flower','growth'],growth:['left','far'],far:['growth','grass'],grass:['far','right'],right:['grass','tree'],tree:['right','hub'],recycle:['entrance']};
  const anchors={entrance:[0,21],hub:[0,12],flower:[-7,12],left:[-10,5],growth:[-6,0],far:[0,-1],grass:[7,0],right:[10,5],tree:[7,12],recycle:[6,21]};
  function active(){return interactive&&!disposed&&!transition;}
  function render(){if(disposed)return;world.updateMatrixWorld(true);camera.updateMatrixWorld(true);renderer.render(scene,camera);}
  function touch(){canvas.style.touchAction=active()?'none':'pan-y';canvas.style.cursor=active()?'grab':'default';}
  function applyView(){
    const direction=currentLook.clone().sub(camera.position),length=direction.length();
    const horizontal=Math.atan2(direction.x,direction.z)+yaw,vertical=Math.asin(THREE.MathUtils.clamp(direction.y/length,-1,1))+pitch;
    const adjusted=new THREE.Vector3(Math.sin(horizontal)*Math.cos(vertical),Math.sin(vertical),Math.cos(horizontal)*Math.cos(vertical)).multiplyScalar(length).add(camera.position);
    camera.lookAt(adjusted);camera.updateMatrixWorld(true);
  }
  function pose(key){
    const info=stationInfo[key],target=new THREE.Vector3(...info.target),aspect=(container.clientWidth||850)/(container.clientHeight||570),tan=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
    const distance=key==='entrance'?Math.max(info.distance,20+16/aspect):Math.max(info.distance,info.width/(2*tan*aspect)*1.12,info.height/(2*tan)*1.08);
    const position=target.clone().add(new THREE.Vector3(0,key==='entrance'?3.1:1.05,distance));return {position,target};
  }
  function waterHome(){
    const info=stationInfo[station];canHome.set(info.target[0]+1.85,.4,info.target[2]+1.5);can.position.copy(canHome);can.rotation.set(0,0,0);can.visible=station==='flower'||station==='growth';
  }
  function release(){const previous=drag;drag=null;if(previous){try{if(canvas.hasPointerCapture(previous.id))canvas.releasePointerCapture(previous.id);}catch{}}touch();return previous;}
  function cancelPointer(){const previous=release();if(previous?.kind==='water')can.position.copy(canHome);render();}
  function stopWater(){watering=null;drops.visible=false;can.rotation.z=0;can.position.copy(canHome);if(!transition&&!conditionPulse&&raf){cancelAnimationFrame(raf);raf=0;}}
  function routeBetween(from,to){
    const queue=[[from]],seen=new Set([from]);
    while(queue.length){const route=queue.shift(),node=route.at(-1);if(node===to)return route;for(const next of routes[node]||[]){if(!seen.has(next)){seen.add(next);queue.push([...route,next]);}}}return [from,to];
  }
  function ensureFrame(){if(!raf&&!disposed&&(transition||watering||conditionPulse))raf=requestAnimationFrame(animate);}
  function finishTransition(arrive=true){if(!transition)return;camera.position.copy(transition.endPosition);currentLook.copy(transition.endLook);transition=null;applyView();touch();render();if(arrive)onArrive(station);}
  function animate(time){
    raf=0;if(disposed)return;
    if(time-frameStamp<25){ensureFrame();return;}frameStamp=time;
    if(transition){
      const t=Math.min(1,Math.max(0,(time-transition.start)/transition.duration)),eased=t*t*(3-2*t);
      if(transition.curve)camera.position.copy(transition.curve.getPointAt(eased));else camera.position.lerpVectors(transition.from,transition.endPosition,eased);
      currentLook.lerpVectors(transition.fromLook,transition.endLook,eased);applyView();if(t>=1)finishTransition();
    }
    if(watering){
      const t=Math.min(1,Math.max(0,(time-watering.start)/1100));
      can.position.lerpVectors(canHome,watering.pourTo,Math.sin(t*Math.PI));
      can.rotation.z=Math.sin(t*Math.PI)*.38;drops.visible=t>.12&&t<.9;
      for(let i=0;i<drops.children.length;i++){const d=drops.children[i];d.position.y=1.8-((t*2.1+i*.09)%1)*1.7;}
      if(t>=1)stopWater();
    }
    if(conditionPulse){
      const t=Math.min(1,Math.max(0,(time-conditionPulse.start)/1000)),amount=Math.sin(t*Math.PI);
      if(conditionPulse.key==='air'){airflow.position.x=1.2+amount*.28;growing.rotation.z=Math.sin(t*Math.PI*2)*.035;}
      else if(conditionPulse.key==='sun'){hemi.intensity=2.3+amount*.3;nurserySun.scale.setScalar(1+amount*.18);}
      if(t>=1){conditionPulse=null;airflow.position.x=1.2;growing.rotation.z=0;hemi.intensity=2.3;nurserySun.scale.setScalar(1);}
    }
    render();ensureFrame();
  }
  function goTo(key){
    if(!stationInfo[key]||disposed)return;
    cancelPointer();stopWater();conditionPulse=null;airflow.position.x=1.2;growing.rotation.z=0;hemi.intensity=2.3;nurserySun.scale.setScalar(1);if(transition)finishTransition(false);
    const fromStation=station;station=key;yaw=0;pitch=0;selectedPart=null;highlight.visible=false;
    const destination=pose(key);homePosition.copy(destination.position);homeLook.copy(destination.target);waterHome();
    if(!motion||!interactive||fromStation===key){camera.position.copy(destination.position);currentLook.copy(destination.target);applyView();touch();render();onArrive(key);return;}
    const waypoints=[camera.position.clone()];
    for(const node of routeBetween(fromStation,key)){
      const p=anchors[node],v=new THREE.Vector3(p[0],2.8,p[1]);if(v.distanceTo(waypoints.at(-1))>.2)waypoints.push(v);
    }
    if(destination.position.distanceTo(waypoints.at(-1))>.1)waypoints.push(destination.position.clone());
    const curve=new THREE.CatmullRomCurve3(waypoints,false,'centripetal');
    transition={from:camera.position.clone(),fromLook:currentLook.clone(),endPosition:destination.position,endLook:destination.target,curve,start:performance.now(),duration:Math.min(2300,950+waypoints.length*160)};
    touch();ensureFrame();render();
  }
  function focusPart(key){
    selectedPart=parts[key]?key:null;
    if(selectedPart){parts[key].updateWorldMatrix(true,true);highlight.box.setFromObject(parts[key]);highlight.box.expandByScalar(.1);highlight.visible=true;}else highlight.visible=false;
    render();
  }
  function setGrowthStage(value){
    const next=Number(value);growthStage=Number.isFinite(next)?THREE.MathUtils.clamp(Math.round(next),0,4):0;
    growthStages.forEach((object,index)=>object.visible=index===growthStage);render();
  }
  function setConditions(value={}){
    for(const key of ['sun','water','air'])if(typeof value[key]==='boolean')conditions[key]=value[key];
    sunModel.visible=conditions.sun;nurserySun.visible=conditions.sun;clouds.visible=!conditions.sun;light.intensity=conditions.sun?3:.9;
    moisture.visible=conditions.water;soil.material.color.set(conditions.water?'#846749':'#ae936b');airflow.visible=conditions.air;
    if(motion&&interactive&&station==='growth'&&!transition&&(value.sun===true||value.air===true)){
      conditionPulse={key:value.air===true?'air':'sun',start:performance.now()};ensureFrame();
    }
    render();
  }
  function water(){
    if(disposed||!interactive||transition||!['flower','growth'].includes(station))return;
    cancelPointer();stopWater();can.position.copy(canHome);
    if(!motion){soil.material.color.set('#846749');render();return;}
    const info=stationInfo[station];drops.position.set(info.target[0]-.4,.4,info.target[2]+.1);
    watering={start:performance.now(),pourTo:new THREE.Vector3(info.target[0]+.7,1.3,info.target[2]+.6)};ensureFrame();render();
  }
  function move(direction){
    if(!active()||!['forward','back','left','right'].includes(direction))return;
    cancelPointer();stopWater();
    const forward=currentLook.clone().sub(camera.position);forward.y=0;forward.normalize();
    const right=new THREE.Vector3(-forward.z,0,forward.x),delta=(direction==='left'||direction==='right'?right:forward).multiplyScalar(direction==='back'||direction==='left'?-.55:.55);
    const next=camera.position.clone().add(delta);next.x=THREE.MathUtils.clamp(next.x,homePosition.x-1.35,homePosition.x+1.35);next.z=THREE.MathUtils.clamp(next.z,homePosition.z-1.35,homePosition.z+1.35);
    const actual=next.clone().sub(camera.position),look=currentLook.clone().add(actual);yaw=0;pitch=0;
    if(motion){transition={from:camera.position.clone(),fromLook:currentLook.clone(),endPosition:next,endLook:look,curve:null,start:performance.now(),duration:220};touch();ensureFrame();}
    else{camera.position.copy(next);currentLook.copy(look);applyView();render();}
  }
  function resetView(){const wasTraveling=!!transition;cancelPointer();stopWater();transition=null;conditionPulse=null;if(raf){cancelAnimationFrame(raf);raf=0;}yaw=0;pitch=0;airflow.position.x=1.2;growing.rotation.z=0;hemi.intensity=2.3;nurserySun.scale.setScalar(1);camera.position.copy(homePosition);currentLook.copy(homeLook);applyView();touch();render();if(wasTraveling)onArrive(station);}
  function setMotion(value){motion=!!value;if(!motion){cancelPointer();if(transition)finishTransition();stopWater();conditionPulse=null;airflow.position.x=1.2;growing.rotation.z=0;hemi.intensity=2.3;nurserySun.scale.setScalar(1);if(raf){cancelAnimationFrame(raf);raf=0;}}touch();render();}
  function setInteractive(value){interactive=!!value;if(!interactive){cancelPointer();stopWater();if(transition)finishTransition(false);conditionPulse=null;airflow.position.x=1.2;growing.rotation.z=0;hemi.intensity=2.3;nurserySun.scale.setScalar(1);if(raf){cancelAnimationFrame(raf);raf=0;}}touch();render();}
  function ray(event){const rect=canvas.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);camera.updateMatrixWorld(true);world.updateMatrixWorld(true);raycaster.setFromCamera(pointer,camera);}
  function isVisible(object){for(let node=object;node;node=node.parent)if(!node.visible)return false;return true;}
  function hit(event){
    ray(event);
    const choices=station==='entrance'?Object.values(stations):stations[station]?[stations[station]]:[];
    const objects=[...choices,...Object.values(markers),...(can.visible?[can]:[])];
    let candidate=null;
    for(const result of raycaster.intersectObjects(objects,true)){
      if(!isVisible(result.object)||result.object===flowerWaterZone||result.object===growthWaterZone)continue;
      let node=result.object;while(node&&!node.userData.kind)node=node.parent;
      if(node){candidate={node,point:result.point};break;}
    }
    // A thin stem remains scientifically recognisable while its touch target is forgiving.
    // Existing leaf/petal/watering-can hits retain priority, so nearby choices do not change.
    if(station==='flower'&&event.pointerType==='touch'&&(!candidate||candidate.node.userData.kind==='destination')){
      const bounds=projected(parts['flower.stem']);
      if(event.clientX>=bounds.min.x-17&&event.clientX<=bounds.max.x+17&&event.clientY>=bounds.min.y&&event.clientY<=bounds.max.y){
        return{node:parts['flower.stem'],point:parts['flower.stem'].getWorldPosition(new THREE.Vector3())};
      }
    }
    return candidate;
  }
  function projected(object){
    const rect=canvas.getBoundingClientRect(),bounds=new THREE.Box2(),v=new THREE.Vector3();object.updateWorldMatrix(true,true);
    object.traverse(child=>{if(!child.isMesh)return;child.geometry.computeBoundingBox();const b=child.geometry.boundingBox;
      for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++){v.set(x?b.max.x:b.min.x,y?b.max.y:b.min.y,z?b.max.z:b.min.z).applyMatrix4(child.matrixWorld).project(camera);bounds.expandByPoint(new THREE.Vector2(rect.left+(v.x+1)*rect.width/2,rect.top+(1-v.y)*rect.height/2));}
    });return bounds;
  }
  function waterHit(event){const target=station==='flower'?flowerWaterZone:growthWaterZone,b=projected(target),pad=event.pointerType==='touch'?24:16;return event.clientX>=b.min.x-pad&&event.clientX<=b.max.x+pad&&event.clientY>=b.min.y-pad&&event.clientY<=b.max.y+pad;}
  function pointerDown(event){
    if(!active()||drag||event.isPrimary===false||(event.button!==undefined&&event.button!==0))return;
    stopWater();const picked=hit(event),kind=picked?.node.userData.kind==='action'&&picked.node.userData.key==='water'?'water':'look';
    const plane=new THREE.Plane();if(kind==='water')plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()),picked.point);
    const intersection=kind==='water'?raycaster.ray.intersectPlane(plane,point):null;
    drag={id:event.pointerId,kind,picked,startX:event.clientX,startY:event.clientY,moved:false,plane,offset:intersection?can.position.clone().sub(intersection):new THREE.Vector3(),yaw,pitch};
    try{canvas.setPointerCapture(event.pointerId);}catch{}canvas.style.cursor='grabbing';if(event.cancelable)event.preventDefault();
  }
  function pointerMove(event){
    if(!drag){if(active()){const picked=hit(event);canvas.style.cursor=picked?'pointer':'grab';}return;}
    if(event.pointerId!==drag.id||!active())return;
    const dx=event.clientX-drag.startX,dy=event.clientY-drag.startY;if(Math.hypot(dx,dy)>6)drag.moved=true;
    if(drag.moved){
      if(drag.kind==='water'){
        ray(event);const intersection=raycaster.ray.intersectPlane(drag.plane,point);if(intersection){can.position.copy(intersection.add(drag.offset));can.position.x=THREE.MathUtils.clamp(can.position.x,canHome.x-4,canHome.x+2);can.position.y=THREE.MathUtils.clamp(can.position.y,.2,4.6);can.position.z=THREE.MathUtils.clamp(can.position.z,canHome.z-4,canHome.z+3);}
      }else{yaw=THREE.MathUtils.clamp(drag.yaw-dx*.0025,-.4,.4);pitch=THREE.MathUtils.clamp(drag.pitch+dy*.002,-.18,.18);applyView();}
      render();
    }if(event.cancelable)event.preventDefault();
  }
  function pointerUp(event){
    if(!drag||event.pointerId!==drag.id)return;if(!active()){cancelPointer();return;}
    pointerMove(event);const previous=release();
    if(previous.kind==='water'){
      can.position.copy(canHome);
      if(!previous.moved||waterHit(event)){water();onAction('water');}else onAction('water-miss');
    }else if(!previous.moved&&previous.picked){
      const data=previous.picked.node.userData;
      if(data.kind==='navigate'||data.kind==='destination')onNavigate(data.key);
      else if(data.kind==='bin'){if(station==='recycle'){focusPart(data.key);onSelect({kind:'bin',key:data.key});}else onNavigate('recycle');}
      else if(data.kind==='part'){
        const destination=data.key.split('.')[0];
        if(station!==destination)onNavigate(destination);else{focusPart(data.key);onSelect({kind:'part',key:data.key});}
      }
    }render();
  }
  function pointerCancel(event){if(drag&&event.pointerId===drag.id){const wasWater=drag.kind==='water';cancelPointer();if(wasWater)onAction('water-miss');}}
  canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerCancel);canvas.addEventListener('lostpointercapture',pointerCancel);
  function resize(){
    cancelPointer();if(transition)finishTransition();camera.aspect=(container.clientWidth||850)/(container.clientHeight||570);camera.updateProjectionMatrix();renderer.setSize(container.clientWidth||850,container.clientHeight||570,false);
    const destination=pose(station);homePosition.copy(destination.position);homeLook.copy(destination.target);camera.position.copy(homePosition);currentLook.copy(homeLook);yaw=0;pitch=0;applyView();render();
  }
  const observer=new ResizeObserver(resize);observer.observe(container);
  function contextLost(event){event.preventDefault();interactive=false;cancelPointer();transition=null;conditionPulse=null;stopWater();if(raf){cancelAnimationFrame(raf);raf=0;}touch();onError(new Error('WebGL context lost'));}
  canvas.addEventListener('webglcontextlost',contextLost);
  setGrowthStage(0);setConditions(conditions);waterHome();resize();touch();
  queueMicrotask(()=>{if(!disposed)onReady();});
  return {
    goTo,focusPart,setMotion,setGrowthStage,setConditions,water,move,resetView,setInteractive,
    getState(){return{station,growthStage,conditions:{...conditions},interactive,transitioning:!!transition,cameraPosition:camera.position.toArray(),canPosition:can.position.toArray()};},
    dispose(){
      cancelPointer();stopWater();disposed=true;transition=null;if(raf)cancelAnimationFrame(raf);observer.disconnect();
      canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointercancel',pointerCancel);canvas.removeEventListener('lostpointercapture',pointerCancel);canvas.removeEventListener('webglcontextlost',contextLost);canvas.style.touchAction='pan-y';
      const geos=new Set(),mats=new Set(materials.values());
      scene.traverse(object=>{if(object.geometry)geos.add(object.geometry);if(object.material)for(const m of Array.isArray(object.material)?object.material:[object.material]){mats.add(m);if(m.map)textures.add(m.map);}});
      for(const geo of geos)geo.dispose();for(const texture of textures)texture.dispose();for(const mat of mats)mat.dispose();renderer.dispose();canvas.remove();
    }
  };
}
