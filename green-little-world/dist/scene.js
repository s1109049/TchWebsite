import * as THREE from './vendor/three.module.js';

/** A small, touch-friendly Three.js learning garden. All artwork is built locally. */
export function createGarden(container, { onSelect = () => {}, onDrop = () => {}, onReady = () => {}, onError = () => {}, reducedMotion = false } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch (error) { onError(error); throw error; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;';
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-10, 10, 7, -7, 0.1, 120);
  camera.position.set(0, 9, 20);
  camera.lookAt(0, 1.4, 0);
  const world = new THREE.Group();
  scene.add(world);
  scene.add(new THREE.HemisphereLight(0xfffbef, 0xa1aa83, 2.9));
  const sun = new THREE.DirectionalLight(0xfff6dc, 4.0);
  sun.position.set(-7, 14, 9);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 13, bottom: -13, near: 1, far: 40 });
  sun.shadow.normalBias = 0.035;
  sun.shadow.bias = -0.0001;
  sun.shadow.radius = 4;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xe2f1e8, 0.8);
  fill.position.set(8, 6, -9);
  scene.add(fill);

  const materials = new Map();
  function mat(color, extra = {}) {
    const key = color + JSON.stringify(extra);
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.86, ...extra }));
    return materials.get(key);
  }
  function mesh(geometry, material, parent, x = 0, y = 0, z = 0) {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(x, y, z);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function sphere(parent, x, y, z, sx, sy, sz, color) {
    const object = mesh(new THREE.SphereGeometry(1, 20, 14), mat(color), parent, x, y, z);
    object.scale.set(sx, sy, sz);
    return object;
  }
  function box(parent, x, y, z, w, h, d, color) {
    return mesh(new THREE.BoxGeometry(w, h, d), mat(color), parent, x, y, z);
  }
  function cylinder(parent, x, y, z, top, bottom, height, color, sides = 24) {
    return mesh(new THREE.CylinderGeometry(top, bottom, height, sides), mat(color), parent, x, y, z);
  }
  function capsuleBox(parent, x, y, z, width, height, depth, color, radius = 0.15) {
    const shape = new THREE.Shape();
    const w = width / 2, h = height / 2, r = Math.min(radius, w, h);
    shape.moveTo(-w + r, -h); shape.lineTo(w - r, -h); shape.quadraticCurveTo(w, -h, w, -h + r);
    shape.lineTo(w, h - r); shape.quadraticCurveTo(w, h, w - r, h); shape.lineTo(-w + r, h);
    shape.quadraticCurveTo(-w, h, -w, h - r); shape.lineTo(-w, -h + r); shape.quadraticCurveTo(-w, -h, -w + r, -h);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.02, depth - r * 0.7), bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: r * 0.35, bevelThickness: r * 0.35, curveSegments: 8 });
    geo.translate(0, 0, -depth / 2 + r * 0.35);
    return mesh(geo, mat(color), parent, x, y, z);
  }

  // Separate lessons keep every object large and remove irrelevant scenery.
  const natureKeys = ['flower', 'tree', 'grass'];
  const binKeys = ['paper', 'metal', 'plastic'];
  const natureGroup = new THREE.Group(), recycleGroup = new THREE.Group();
  natureGroup.name = 'nature-lesson'; recycleGroup.name = 'recycling-lesson';
  world.add(natureGroup, recycleGroup);
  recycleGroup.visible = false;

  const targets = {}, rings = {}, baseline = new Map();
  function target(key, x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0.15, z);
    group.userData.key = key;
    const parent = natureKeys.includes(key) ? natureGroup : recycleGroup;
    group.name = key;
    parent.add(group);
    targets[key] = group;
    baseline.set(group, group.position.y);
    const ring = mesh(new THREE.TorusGeometry(key === 'tree' ? 1.35 : key === 'grass' ? 1.6 : 1.4, 0.065, 8, 64), mat('#f9fcde', { emissive: '#b4ce62', emissiveIntensity: 0.35 }), parent, x, 0.18, z);
    ring.rotation.x = -Math.PI / 2;
    ring.visible = false;
    rings[key] = ring;
    return group;
  }

  const tree = target('tree', -4.8, -1.5);
  cylinder(tree, 0, 1.8, 0, 0.32, 0.51, 3.5, '#927051', 12);
  const branchA = cylinder(tree, -0.36, 2.7, 0, 0.13, 0.2, 1.6, '#927051', 10); branchA.rotation.z = 0.55;
  const branchB = cylinder(tree, 0.4, 2.9, 0, 0.14, 0.22, 1.4, '#927051', 10); branchB.rotation.z = -0.6;
  sphere(tree, 0, 4.05, 0.0, 1.9, 1.75, 1.65, '#548b58');
  sphere(tree, -1.15, 3.95, 0.15, 1.25, 1.3, 1.16, '#729e61');
  sphere(tree, 0.95, 4.0, 0.2, 1.2, 1.35, 1.2, '#699952');
  sphere(tree, -0.3, 5.2, -0.1, 1.28, 1.2, 1.18, '#80a969');
  sphere(tree, -0.72, 4.8, 0.95, 1.03, 0.95, 0.83, '#8bb473');
  sphere(tree, 0.69, 4.7, 0.95, 0.91, 0.95, 0.85, '#7da85f');
  // A few visible roots anchor the tree.
  for (let i = 0; i < 5; i++) {
    const root = sphere(tree, Math.cos(i * 1.25) * 0.32, 0.13, Math.sin(i * 1.25) * 0.32, 0.62, 0.17, 0.2, '#927051');
    root.rotation.y = -i * 1.25;
  }

  const flower = target('flower', -2.35, 2.65);
  function blossom(parent, x, z, height, petalColor, size = 1) {
    cylinder(parent, x, height / 2, z, 0.045, 0.055, height, '#5c8542', 8);
    const leaf1 = sphere(parent, x - 0.17, height * 0.42, z, 0.29, 0.105, 0.13, '#739b48'); leaf1.rotation.z = -0.45;
    const leaf2 = sphere(parent, x + 0.18, height * 0.58, z, 0.28, 0.1, 0.13, '#82a752'); leaf2.rotation.z = 0.45;
    const head = new THREE.Group(); head.position.set(x, height, z); head.rotation.x = -0.18; parent.add(head);
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3;
      const petal = sphere(head, Math.sin(angle) * 0.3 * size, Math.cos(angle) * 0.3 * size, 0, 0.21 * size, 0.31 * size, 0.115 * size, petalColor);
      petal.rotation.z = -angle;
    }
    sphere(head, 0, 0, 0.105, 0.21 * size, 0.21 * size, 0.14 * size, '#f7c75a');
  }
  blossom(flower, 0, 0, 1.5, '#e9949b', 1.05);
  blossom(flower, -0.65, 0.13, 1.1, '#f7dfab', 0.76);
  blossom(flower, 0.67, -0.03, 1.12, '#e8adbc', 0.82);
  const flowerBed = cylinder(flower, 0, 0.035, 0, 1.05, 1.05, 0.06, '#9baf65', 32); flowerBed.scale.z = 0.7;

  const grass = target('grass', -5.3, 2.75);
  for (let k = 0; k < 4; k++) {
    const ox = (k % 2) * 0.8 - 0.4, oz = Math.floor(k / 2) * 0.55 - 0.25;
    for (let i = 0; i < 7; i++) {
      const ang = i * 0.9 + k;
      const blade = mesh(new THREE.ConeGeometry(0.1, 0.6 + (i % 3) * 0.18, 5), mat(i % 2 ? '#5d8e4d' : '#779f51'), grass, ox + Math.cos(ang) * 0.14, 0.34, oz + Math.sin(ang) * 0.14);
      blade.rotation.z = Math.cos(ang) * 0.36; blade.rotation.x = Math.sin(ang) * 0.34;
    }
  }
  cylinder(tree, 0, 0.035, 0, 1.5, 1.5, 0.07, '#b8cc8e', 40);
  const grassBed = cylinder(grass, 0, 0.02, 0, 0.76, 0.78, 0.04, '#c1d39a', 32);
  grassBed.scale.z = 0.7;
  tree.scale.setScalar(0.55);
  flower.scale.setScalar(1.65);
  grass.scale.set(2.45, 2.8, 2.45);

  function labelTexture(name, english, color, icon) {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fffdf3'; ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = color; ctx.textAlign = 'center';
    ctx.font = 'bold 160px sans-serif'; ctx.fillText('♻', 256, 181);
    ctx.fillStyle = '#273b34'; ctx.font = 'bold 140px "Noto Sans CJK TC", "Microsoft JhengHei", sans-serif'; ctx.fillText(name, 256, 312);
    ctx.font = 'bold 39px sans-serif'; ctx.fillText(english, 256, 376);
    ctx.font = '42px sans-serif'; ctx.fillText(icon, 256, 451);
    const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
    return tex;
  }
  const binData = [
    ['paper', -2.7, '#398bc5', '#2475aa', '廢紙', 'PAPER', '▤'],
    ['metal', 0, '#f5c64b', '#c8a12c', '金屬', 'METAL', '▥'],
    ['plastic', 2.7, '#a77653', '#845b3b', '塑膠', 'PLASTIC', '♧']
  ];
  const lidGroups = {};
  binData.forEach(([key, x, color, dark, name, english, icon]) => {
    const bin = target(key, x, -1.2); bin.scale.setScalar(1.15);
    // Wheelie-bin silhouette with softly beveled body, shoulders, lid and handles.
    capsuleBox(bin, 0, 1.35, 0, 1.94, 2.35, 1.48, color, 0.2);
    const foot = capsuleBox(bin, 0, 0.27, 0.01, 1.78, 0.15, 1.35, dark, 0.07);
    const lid = new THREE.Group(); lid.position.y = 2.58; bin.add(lid); lidGroups[key] = lid;
    capsuleBox(lid, 0, 0.02, 0, 2.12, 0.22, 1.65, dark, 0.16);
    capsuleBox(lid, 0, 0.18, 0, 2.00, 0.22, 1.52, color, 0.14);
    // Dark opening on front upper face is broad enough to identify as a recycling bin.
    capsuleBox(bin, 0, 2.25, 0.777, key === 'paper' ? 1.1 : 0.74, key === 'paper' ? 0.21 : 0.35, 0.045, '#263a39', 0.1);
    const texture = labelTexture(name, english, dark, icon);
    const panel = mesh(new THREE.PlaneGeometry(1.48, 1.45), new THREE.MeshStandardMaterial({map:texture,roughness:1}), bin, 0, 1.25, 0.792);
    panel.castShadow = false;
    for (const side of [-1, 1]) {
      const wheel = cylinder(bin, side * 0.72, 0.18, -0.52, 0.22, 0.22, 0.18, '#384945', 16); wheel.rotation.z = Math.PI / 2;
      const hub = cylinder(bin, side * 0.82, 0.18, -0.52, 0.085, 0.085, 0.025, '#b9beb4', 12); hub.rotation.z = Math.PI / 2;
      capsuleBox(bin, side * 1.01, 2.27, -0.22, 0.13, 0.21, 0.52, dark, 0.06);
    }
  });

  // The object under discussion sits on its own quiet foreground plinth.
  const itemHome = new THREE.Vector3(0, 0.2, 8.3);
  const itemScale = 2.2;
  const itemStage = new THREE.Group(); itemStage.position.copy(itemHome); recycleGroup.add(itemStage);
  const stageBase = cylinder(itemStage, 0, 0.11, 0, 1.35, 1.3, 0.2, '#f4ecd5', 48);
  stageBase.scale.z = 0.8;
  const itemHolder = new THREE.Group(); itemHolder.name = 'item'; itemHolder.userData.key = 'item';
  itemHolder.position.copy(itemHome); itemHolder.scale.setScalar(itemScale); recycleGroup.add(itemHolder);
  targets.item = itemHolder;
  const itemRing = mesh(new THREE.TorusGeometry(1.35, 0.075, 8, 64), mat('#fff6a5', { emissive: '#d3bc55', emissiveIntensity: 0.3 }), recycleGroup, itemHome.x, 0.32, itemHome.z);
  itemRing.rotation.x = -Math.PI / 2; itemRing.visible = false; rings.item = itemRing;
  itemStage.visible = false;
  function simplePaperTexture(isBox = false) {
    const cvs = document.createElement('canvas'); cvs.width=512; cvs.height=512;
    const ctx=cvs.getContext('2d');ctx.fillStyle=isBox?'#d5b989':'#fff8df';ctx.fillRect(0,0,512,512);
    ctx.fillStyle='#516456';ctx.textAlign='center';ctx.font='bold 76px "Noto Sans CJK TC", sans-serif';ctx.fillText(isBox?'紙盒':'報紙',256,115);
    if(!isBox){ctx.fillStyle='#8da68a';ctx.fillRect(40,150,190,145);ctx.fillStyle='#aab4a0';for(let y=160;y<450;y+=28){ctx.fillRect(270,y,195,9);if(y>315)ctx.fillRect(40,y,190,9);}}
    else {ctx.strokeStyle='#a58c62';ctx.lineWidth=18;ctx.beginPath();ctx.moveTo(256,160);ctx.lineTo(256,512);ctx.stroke();ctx.fillStyle='#405844';ctx.font='bold 150px sans-serif';ctx.fillText('♻',256,370);}
    const tex=new THREE.CanvasTexture(cvs);tex.colorSpace=THREE.SRGBColorSpace;return tex;
  }
  function clearItem() {
    const sharedMaterials = new Set(materials.values());
    const geometries = new Set(), localMaterials = new Set(), textures = new Set();
    while (itemHolder.children.length) {
      const child = itemHolder.children[0];
      itemHolder.remove(child);
      child.traverse(object => {
        if (!object.isMesh) return;
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
          if (!sharedMaterials.has(material)) localMaterials.add(material);
          if (material.map) textures.add(material.map);
        }
      });
    }
    for (const geometry of geometries) geometry.dispose();
    for (const texture of textures) texture.dispose();
    for (const material of localMaterials) material.dispose();
  }
  function showItem(kind) {
    cancelPointer(true); cancelPut(); currentKind=kind||null; itemTaken=false;
    itemHolder.position.copy(itemHome); itemHolder.scale.setScalar(itemScale);
    clearItem();itemHolder.visible=!!kind;itemStage.visible=!!kind;
    if(selected==='item')selected=null;updateRings();
    if(!kind){render();return;}
    if(kind==='newspaper'){
      const paper=box(itemHolder,0,0.87,0,1.65,1.6,0.13,'#f9f0d4');paper.rotation.set(0,-0.1,-0.06);
      const face=mesh(new THREE.PlaneGeometry(1.64,1.56),new THREE.MeshStandardMaterial({map:simplePaperTexture(),roughness:1}),paper,0,0,0.075);face.castShadow=false;
      box(paper,-0.73,0,0.02,0.045,1.59,0.14,'#e6d9b9');
    }else if(kind==='box'){
      const object=box(itemHolder,0,0.65,0,1.25,1.25,1.05,'#c9a775');object.rotation.y=-0.16;
      mesh(new THREE.PlaneGeometry(1.2,1.2),new THREE.MeshStandardMaterial({map:simplePaperTexture(true),roughness:1}),object,0,0,0.53);
      box(object,0,0.63,0,0.15,0.015,1.04,'#e7ce9c');
    }else if(kind==='can'||kind==='tin'){
      const isCan=kind==='can';const h=isCan?1.58:1.2,r=isCan?0.43:0.56;
      cylinder(itemHolder,0,h/2+0.05,0,r,r,h,isCan?'#b9cfd1':'#bcc4b6',32);
      cylinder(itemHolder,0,h+0.05,0,r*1.03,r*1.03,0.06,'#dce1d7',32);
      cylinder(itemHolder,0,0.07,0,r*1.03,r*1.03,0.07,'#8fa4a3',32);
      if(isCan){cylinder(itemHolder,0,h/2,0,r*1.007,r*1.007,0.72,'#e9bb51',32);const tab=mesh(new THREE.TorusGeometry(.1,.025,6,16),mat('#6e8685'),itemHolder,0,h+0.1,0);tab.rotation.x=-Math.PI/2;}
      else{for(let i=0;i<4;i++)cylinder(itemHolder,0,0.3+i*0.24,0,r*1.01,r*1.01,0.025,'#8d9f97',32);}
    }else if(kind==='bottle'){
      cylinder(itemHolder,0,0.72,0,.4,.4,1.12,'#9dc9c2',24);
      const shoulder=cylinder(itemHolder,0,1.36,0,.16,.4,.3,'#9dc9c2',24);
      cylinder(itemHolder,0,1.6,0,.16,.16,.26,'#9dc9c2',20);
      cylinder(itemHolder,0,1.79,0,.19,.19,.15,'#e9cf7b',20);
      cylinder(itemHolder,0,.76,0,.408,.408,.4,'#f5efd9',24);
      for(let i=0;i<3;i++)cylinder(itemHolder,0,.23+i*.14,0,.407,.407,.025,'#79aca5',24);
    }else if(kind==='container'){
      capsuleBox(itemHolder,0,.48,0,1.4,.8,1.05,'#c7dcd1',.2);
      capsuleBox(itemHolder,0,.92,0,1.5,.13,1.15,'#77a88e',.13);
    }
    render();
  }

  let selected=null, mode='nature', motion=!reducedMotion, disposed=false;
  let enabled=true, completed=false, currentKind=null, itemTaken=false, drag=null, dropHighlight=null;
  let raf=0, pulse=null, putTween=null, lastFrame=0, zoom=1, compact=null;
  let fittedBounds=new THREE.Box2();
  const homes = new Map();
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  const point = new THREE.Vector3(), viewDirection = new THREE.Vector3();
  const canvas = renderer.domElement;
  function active(){return enabled&&!completed&&!disposed;}
  function render(){if(!disposed){world.updateMatrixWorld(true);renderer.render(scene,camera);}}
  function updateTouch(){canvas.style.touchAction=active()?'none':'pan-y';canvas.style.cursor=active()?'grab':'default';}
  function updateRings(){
    for(const [key,ring] of Object.entries(rings)){
      const object=targets[key];
      ring.position.x=object.position.x;ring.position.z=object.position.z;
      ring.visible=(key===dropHighlight||(!dropHighlight&&key===selected))&&(key!=='item'||itemHolder.visible);
    }
  }
  function pointerRay(event){
    const rect=canvas.getBoundingClientRect();
    pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
    camera.updateMatrixWorld(true);world.updateMatrixWorld(true);raycaster.setFromCamera(pointer,camera);
  }
  function visible(object){let node=object;while(node){if(!node.visible)return false;node=node.parent;}return true;}
  function hitTarget(event){
    pointerRay(event);
    const objects=mode==='nature'?natureKeys.map(key=>targets[key]):[...(itemHolder.visible?[itemHolder]:[]),...binKeys.map(key=>targets[key])];
    for(const hit of raycaster.intersectObjects(objects,true)){
      if(!visible(hit.object))continue;
      let node=hit.object;while(node&&!node.userData.key)node=node.parent;
      if(node)return {key:node.userData.key,point:hit.point};
    }
    return null;
  }
  function projectedRect(object){
    const rect=canvas.getBoundingClientRect(),bounds=new THREE.Box2(),vector=new THREE.Vector3();
    object.updateWorldMatrix(true,true);
    object.traverse(child=>{
      if(!child.isMesh)return;
      child.geometry.computeBoundingBox();const b=child.geometry.boundingBox;
      for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++){
        vector.set(x?b.max.x:b.min.x,y?b.max.y:b.min.y,z?b.max.z:b.min.z).applyMatrix4(child.matrixWorld).project(camera);
        bounds.expandByPoint(new THREE.Vector2(rect.left+(vector.x+1)*rect.width/2,rect.top+(1-vector.y)*rect.height/2));
      }
    });
    return {left:bounds.min.x,right:bounds.max.x,top:bounds.min.y,bottom:bounds.max.y};
  }
  function dropTarget(event){
    if(mode!=='recycle')return null;
    let best=null,bestDistance=Infinity;
    for(const key of binKeys){
      const r=projectedRect(targets[key]),width=r.right-r.left;
      const pad=Math.max(event.pointerType==='touch'?22:15,width*0.12);
      const centerX=(r.left+r.right)/2,centerY=(r.top+r.bottom)/2;
      const halfWidth=Math.max(28,width/2+pad),halfHeight=Math.max(28,(r.bottom-r.top)/2+pad);
      if(Math.abs(event.clientX-centerX)<=halfWidth&&Math.abs(event.clientY-centerY)<=halfHeight){
        const distance=Math.abs(event.clientX-centerX)/halfWidth;
        if(distance<bestDistance){best=key;bestDistance=distance;}
      }
    }
    return best;
  }
  function releasePointer(){
    const previous=drag;drag=null;dropHighlight=null;updateRings();updateTouch();
    if(previous){try{if(canvas.hasPointerCapture(previous.id))canvas.releasePointerCapture(previous.id);}catch{}}
    return previous;
  }
  function cancelPointer(restore=true){
    const previous=releasePointer();
    if(previous&&restore){
      if(previous.key==='item'){
        itemTaken=false;itemHolder.position.copy(itemHome);itemHolder.scale.setScalar(itemScale);itemHolder.visible=!!currentKind;
        if(selected==='item')selected=null;
      }else if(natureKeys.includes(previous.key))previous.target.position.copy(previous.startPosition);
    }
    updateRings();
  }
  function onPointerDown(event){
    if(!active()||drag||(event.button!==undefined&&event.button!==0)||event.isPrimary===false)return;
    const hit=hitTarget(event);if(!hit)return;
    resetPulse();
    const target=targets[hit.key],draggable=hit.key==='item'||natureKeys.includes(hit.key);
    const plane=new THREE.Plane();
    if(hit.key==='item')plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(viewDirection),hit.point);
    else plane.set(new THREE.Vector3(0,1,0),-target.position.y);
    const intersection=raycaster.ray.intersectPlane(plane,point);
    drag={id:event.pointerId,key:hit.key,target,draggable,startX:event.clientX,startY:event.clientY,moved:false,startPosition:target.position.clone(),plane,offset:intersection?target.position.clone().sub(intersection):new THREE.Vector3()};
    try{canvas.setPointerCapture(event.pointerId);}catch{}
    canvas.style.cursor=draggable?'grabbing':'pointer';
    if(event.cancelable)event.preventDefault();
  }
  function applyDrag(event){
    if(!drag?.draggable)return;
    pointerRay(event);const intersection=raycaster.ray.intersectPlane(drag.plane,point);if(!intersection)return;
    const next=intersection.clone().add(drag.offset);
    if(drag.key==='item'){
      next.x=THREE.MathUtils.clamp(next.x,-5.2,5.2);next.y=THREE.MathUtils.clamp(next.y,-0.2,6.5);next.z=THREE.MathUtils.clamp(next.z,-2,10.5);
      itemHolder.position.copy(next);itemTaken=true;selected='item';dropHighlight=dropTarget(event);
    }else{
      const home=homes.get(drag.key);
      next.x=THREE.MathUtils.clamp(next.x,home.x-0.65,home.x+0.65);
      next.z=THREE.MathUtils.clamp(next.z,home.z-0.65,home.z+0.65);
      next.y=home.y;drag.target.position.copy(next);selected=drag.key;
    }
    updateRings();render();
  }
  function onPointerMove(event){
    if(drag){
      if(event.pointerId!==drag.id||!active())return;
      if(Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>6)drag.moved=true;
      if(drag.moved)applyDrag(event);
      if(event.cancelable)event.preventDefault();
    }else if(active()){
      const hit=hitTarget(event);canvas.style.cursor=hit?(hit.key==='item'||natureKeys.includes(hit.key)?'grab':'pointer'):'default';
    }
  }
  function onPointerUp(event){
    if(!drag||event.pointerId!==drag.id)return;
    if(!active()){cancelPointer(true);render();return;}
    if(Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>6)drag.moved=true;
    if(drag.moved)applyDrag(event);
    const previous=releasePointer();
    if(previous.key==='item'&&previous.moved){
      const bin=dropTarget(event);
      if(!bin)returnItem();
      onDrop(bin);
    }else if(!previous.moved||natureKeys.includes(previous.key))onSelect(previous.key);
    render();
  }
  function onPointerCancel(event){
    if(!drag||event.pointerId!==drag.id)return;
    const wasItem=drag.key==='item';cancelPointer(true);render();
    // Only an external pointer interruption notifies the app. Internal mode or
    // lock cleanup calls cancelPointer directly, avoiding callback re-entry.
    if(wasItem)onDrop(null);
  }
  canvas.addEventListener('pointerdown',onPointerDown);
  canvas.addEventListener('pointermove',onPointerMove);
  canvas.addEventListener('pointerup',onPointerUp);
  canvas.addEventListener('pointercancel',onPointerCancel);
  canvas.addEventListener('lostpointercapture',onPointerCancel);
  function arrange(){
    const useCompact=(container.clientWidth||800)/(container.clientHeight||500)<1.15;
    if(compact===useCompact)return;
    compact=useCompact;
    const positions=compact?{flower:[-2.25,0.15,2.5],tree:[0,0.15,-2.6],grass:[2.25,0.15,2.5]}:{flower:[-3.65,0.15,0],tree:[0,0.15,-0.3],grass:[3.6,0.15,0]};
    for(const key of natureKeys){const position=new THREE.Vector3(...positions[key]);homes.set(key,position);targets[key].position.copy(position);}
    for(const key of binKeys)homes.set(key,targets[key].position.clone());
    updateRings();
  }
  function computeFit(){
    const bounds=new THREE.Box2(),corner=new THREE.Vector3(),transform=new THREE.Matrix4();
    world.updateMatrixWorld(true);camera.updateMatrixWorld(true);
    const objects=(mode==='nature'?natureKeys:binKeys).map(key=>targets[key]);
    for(const object of objects)object.traverse(child=>{
      if(!child.isMesh)return;
      child.geometry.computeBoundingBox();const b=child.geometry.boundingBox;
      transform.multiplyMatrices(camera.matrixWorldInverse,child.matrixWorld);
      for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++){
        corner.set(x?b.max.x:b.min.x,y?b.max.y:b.min.y,z?b.max.z:b.min.z).applyMatrix4(transform);
        bounds.expandByPoint(new THREE.Vector2(corner.x,corner.y));
      }
    });
    if(mode==='recycle'){
      // Fixed guide fits all six objects, so a new question never shifts the view.
      for(const x of [-1.95,1.95])for(const y of [0.2,4.45])for(const z of [6.8,9.8]){
        corner.set(x,y,z).applyMatrix4(camera.matrixWorldInverse);bounds.expandByPoint(new THREE.Vector2(corner.x,corner.y));
      }
    }else{bounds.min.x-=0.45;bounds.max.x+=0.45;bounds.min.y-=0.25;}
    bounds.max.y+=0.24;fittedBounds=bounds;
  }
  function updateCamera(){
    const width=container.clientWidth||800,height=container.clientHeight||500,aspect=width/height;
    const size=fittedBounds.getSize(new THREE.Vector2()),center=fittedBounds.getCenter(new THREE.Vector2());
    const halfHeight=Math.max(size.y/2,size.x/(2*aspect))*1.055/zoom,halfWidth=halfHeight*aspect;
    camera.left=center.x-halfWidth;camera.right=center.x+halfWidth;camera.top=center.y+halfHeight;camera.bottom=center.y-halfHeight;
    camera.updateProjectionMatrix();renderer.setSize(width,height,false);render();
  }
  function resize(){cancelPointer(true);arrange();computeFit();updateCamera();}
  const observer=new ResizeObserver(resize);observer.observe(container);
  function resetPulse(){
    if(pulse){const object=targets[pulse.key];if(object)object.position.y=pulse.baseY;if(lidGroups[pulse.key])lidGroups[pulse.key].rotation.x=0;}
    pulse=null;
    if(!putTween&&raf){cancelAnimationFrame(raf);raf=0;}
  }
  function cancelPut(){
    putTween=null;
    if(!pulse&&raf){cancelAnimationFrame(raf);raf=0;}
    itemHolder.scale.setScalar(itemScale);
  }
  function ensureAnimation(){if(!raf&&!disposed&&(pulse||putTween)){raf=requestAnimationFrame(animate);}}
  function animate(time){
    raf=0;if(disposed||(!pulse&&!putTween))return;
    if(time-lastFrame<30){raf=requestAnimationFrame(animate);return;}lastFrame=time;
    if(pulse){
      const progress=Math.min(1,(time-pulse.start)/850),object=targets[pulse.key];
      if(object)object.position.y=pulse.baseY+Math.sin(progress*Math.PI)*0.18;
      if(lidGroups[pulse.key])lidGroups[pulse.key].rotation.x=-Math.sin(progress*Math.PI)*0.2;
      if(progress>=1)resetPulse();
    }
    if(putTween){
      const progress=Math.min(1,(time-putTween.start)/700),eased=progress*progress*(3-2*progress);
      itemHolder.position.lerpVectors(putTween.from,putTween.to,eased);itemHolder.position.y+=Math.sin(progress*Math.PI)*0.6;
      itemHolder.scale.setScalar(itemScale*(1-eased*0.68));
      if(progress>=1){itemHolder.visible=false;putTween=null;itemHolder.scale.setScalar(itemScale);}
    }
    updateRings();render();ensureAnimation();
  }
  function focus(key){selected=targets[key]?key:null;updateRings();render();}
  function setMode(value){
    const next=value==='recycle'?'recycle':'nature';if(next===mode)return;
    cancelPointer(true);resetPulse();cancelPut();mode=next;selected=null;dropHighlight=null;
    natureGroup.visible=mode==='nature';recycleGroup.visible=mode==='recycle';
    itemTaken=false;itemHolder.position.copy(itemHome);itemHolder.visible=!!currentKind;itemStage.visible=!!currentKind;
    updateRings();updateTouch();arrange();computeFit();updateCamera();
  }
  function celebrate(key){resetPulse();focus(key);if(motion&&targets[key]){pulse={key,start:performance.now(),baseY:targets[key].position.y};ensureAnimation();}}
  function setMotion(value){
    motion=!!value;
    if(!motion){resetPulse();if(putTween){putTween=null;itemHolder.visible=false;itemHolder.scale.setScalar(itemScale);}if(raf){cancelAnimationFrame(raf);raf=0;}render();}
  }
  function setInteraction(value={}){
    const wasActive=active();if(typeof value.enabled==='boolean')enabled=value.enabled;if(typeof value.completed==='boolean')completed=value.completed;
    if(wasActive&&!active())cancelPointer(true);
    updateTouch();render();
  }
  function takeItem(){
    if(mode!=='recycle'||!currentKind||!active())return;
    cancelPut();itemTaken=true;itemHolder.visible=true;itemHolder.position.copy(itemHome);itemHolder.position.y+=0.25;focus('item');
  }
  function returnItem(){
    cancelPointer(false);cancelPut();itemTaken=false;itemHolder.position.copy(itemHome);itemHolder.visible=!!currentKind;
    if(selected==='item')selected=null;dropHighlight=null;updateRings();updateTouch();render();
  }
  function putItem(binKey){
    if(!binKeys.includes(binKey)||!currentKind)return;
    cancelPointer(false);cancelPut();itemTaken=false;selected=binKey;
    const bin=targets[binKey];
    if(motion){itemHolder.visible=true;putTween={from:itemHolder.position.clone(),to:new THREE.Vector3(bin.position.x,bin.position.y+2.3,bin.position.z+0.2),start:performance.now()};ensureAnimation();}
    else itemHolder.visible=false;
    updateRings();render();
  }
  function resetLayout(){
    cancelPointer(true);resetPulse();cancelPut();for(const key of natureKeys)targets[key].position.copy(homes.get(key));
    selected=null;returnItem();computeFit();updateCamera();
  }
  function setZoom(value){const next=Number(value);zoom=Number.isFinite(next)?THREE.MathUtils.clamp(next,1,1.35):1;updateCamera();}
  function contextLost(event){event.preventDefault();cancelPointer(true);onError(new Error('WebGL context lost'));}
  canvas.addEventListener('webglcontextlost',contextLost);
  updateTouch();resize();
  queueMicrotask(()=>{if(!disposed)onReady();});
  return {setMode,focus,setMotion,celebrate,showItem,setInteraction,takeItem,returnItem,putItem,resetLayout,setZoom,dispose(){
    cancelPointer(true);disposed=true;if(raf)cancelAnimationFrame(raf);observer.disconnect();
    canvas.removeEventListener('pointerdown',onPointerDown);canvas.removeEventListener('pointermove',onPointerMove);canvas.removeEventListener('pointerup',onPointerUp);canvas.removeEventListener('pointercancel',onPointerCancel);canvas.removeEventListener('lostpointercapture',onPointerCancel);canvas.removeEventListener('webglcontextlost',contextLost);
    canvas.style.touchAction='pan-y';clearItem();
    const geometries=new Set(),allMaterials=new Set(materials.values()),textures=new Set();
    scene.traverse(object=>{if(object.isMesh){geometries.add(object.geometry);for(const material of Array.isArray(object.material)?object.material:[object.material]){allMaterials.add(material);if(material.map)textures.add(material.map);}}});
    for(const geometry of geometries)geometry.dispose();for(const texture of textures)texture.dispose();for(const material of allMaterials)material.dispose();
    renderer.dispose();canvas.remove();
  }};
}
