import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
const asset='./assets/blender-2026-11-02/';
const progress=document.querySelector('#progress');
const loading=document.querySelector('#loading');
const controlsMode=location.pathname.endsWith('/renderer.html');
document.querySelector('#settings').hidden=!controlsMode;
let renderer,composer,controls,camera,scene;
try {await start();} catch(error) {
 console.error(error);progress.textContent='Die neue Ansicht konnte nicht geladen werden.';
 const a=document.createElement('a');a.href='Viewer-previous.html';a.textContent='Vorherige Version öffnen';document.querySelector('#error').replaceChildren(a);
}
async function start(){
 renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.AgXToneMapping??THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.7;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 document.body.prepend(renderer.domElement);RectAreaLightUniformsLib.init();
 scene=new THREE.Scene();scene.background=new THREE.Color('#babcbc');
 camera=new THREE.PerspectiveCamera(30,innerWidth/innerHeight,.01,1000);
 controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.autoRotateSpeed=.35;controls.minPolarAngle=Math.PI/2-.65;controls.maxPolarAngle=Math.PI/2-.02;
 const draco=new DRACOLoader();draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/');
 const loader=new GLTFLoader();loader.setDRACOLoader(draco);
 const [gltf,rig]=await Promise.all([loader.loadAsync(asset+'J5MOC.glb',e=>{if(e.total)progress.textContent=`J5MOC wird geladen … ${Math.round(e.loaded/e.total*100)} %`;}),fetch(asset+'studio.json').then(r=>{if(!r.ok)throw Error('Studio settings unavailable');return r.json();})]);
 draco.dispose();
 const model=gltf.scene;scene.add(model);model.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(model,true),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3()),extent=Math.max(size.x,size.y,size.z);
 // Imported glTF materials remain intact, including transmission and emissive lenses.
 model.position.sub(center);model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;for(const material of (Array.isArray(o.material)?o.material:[o.material])){if(material.name==='Web_transparent_7'){material.emissive.set(0x000000);material.emissiveIntensity=0;}}}});
 const studio=new THREE.Group();scene.add(studio);
 const baseLights=[];
 for(const entry of rig.lights){
  const color=new THREE.Color().fromArray(entry.color),pos=new THREE.Vector3().fromArray(entry.position).sub(center),direction=new THREE.Vector3().fromArray(entry.direction);
  let light;
  if(entry.type==='AREA'){
   const width=entry.size||1,height=entry.shape==='RECTANGLE'||entry.shape==='ELLIPSE'?entry.sizeY:width;
   light=new THREE.RectAreaLight(color,entry.energy/(width*height*Math.PI),width,height);
   light.position.copy(pos);light.up.fromArray(entry.up);light.lookAt(pos.clone().add(direction));
  }else if(entry.type==='SPOT'){
   light=new THREE.SpotLight(color,entry.energy/(4*Math.PI),0,entry.angle/2,entry.blend,2);
   light.position.copy(pos);light.target.position.copy(pos).add(direction);studio.add(light.target);
   light.castShadow=false;light.shadow.mapSize.set(1024,1024);light.shadow.bias=-.00005;light.shadow.normalBias=extent*.0002;light.shadow.camera.near=extent/100;light.shadow.camera.far=extent*100;
  }else if(entry.type==='SUN'){
   light=new THREE.DirectionalLight(color,entry.energy);light.position.copy(pos);light.target.position.copy(pos).add(direction);studio.add(light.target);
  }else{light=new THREE.PointLight(color,entry.energy/(4*Math.PI),0,2);light.position.copy(pos);}
  light.name=entry.name;studio.add(light);baseLights.push([light,light.intensity]);
 }
 // Reflections come from the exported studio's area emitters and world color.
 const envScene=new THREE.Scene();envScene.background=new THREE.Color().fromArray(rig.worldColor).multiplyScalar(rig.worldStrength);
 for(const entry of rig.lights.filter(l=>l.type==='AREA')){
  const w=entry.size||1,h=entry.shape==='RECTANGLE'||entry.shape==='ELLIPSE'?entry.sizeY:w;
  const mat=new THREE.MeshBasicMaterial({color:new THREE.Color().fromArray(entry.color).multiplyScalar(entry.energy/(w*h*Math.PI)),side:THREE.DoubleSide,toneMapped:false});
  const card=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);card.position.fromArray(entry.position).sub(center);card.up.fromArray(entry.up);card.lookAt(card.position.clone().add(new THREE.Vector3().fromArray(entry.direction)));envScene.add(card);
 }
 const pmrem=new THREE.PMREMGenerator(renderer);const env=pmrem.fromScene(envScene,.04,extent/100,extent*200);scene.environment=env.texture;pmrem.dispose();
 envScene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const ctx=canvas.getContext('2d');const gradient=ctx.createRadialGradient(128,128,8,128,128,120);gradient.addColorStop(0,'rgba(0,0,0,.55)');gradient.addColorStop(.5,'rgba(0,0,0,.28)');gradient.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,256,256);const floor=new THREE.Mesh(new THREE.PlaneGeometry(size.x*1.3,size.z*1.3),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas),transparent:true,depthWrite:false}));floor.rotation.x=-Math.PI/2;floor.position.y=box.min.y-center.y-extent*.001;floor.receiveShadow=true;scene.add(floor);
 function reset(){
  const vertical=THREE.MathUtils.degToRad(camera.fov),horizontal=2*Math.atan(Math.tan(vertical/2)*camera.aspect);
  const distance=Math.max(size.y/(2*Math.tan(vertical/2)),Math.hypot(size.x,size.z)/(2*Math.tan(horizontal/2)))*1.55;
  const direction=new THREE.Vector3().fromArray(rig.camera.position).sub(center);direction.y=Math.hypot(direction.x,direction.z)*.12;direction.normalize();camera.position.copy(direction.multiplyScalar(distance));camera.up.set(0,1,0);camera.near=extent/1000;camera.far=extent*300;camera.updateProjectionMatrix();controls.target.set(0,0,0);controls.minDistance=extent*.65;controls.maxDistance=extent*12;controls.update();
 }
 reset();document.querySelector('#reset').onclick=reset;
 composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
 composer.addPass(new OutputPass());
 const exposure=document.querySelector('#exposure'),lightInput=document.querySelector('#light'),background=document.querySelector('#background'),rotate=document.querySelector('#rotate');
 function settings(){renderer.toneMappingExposure=Number(exposure.value);for(const [l,v] of baseLights)l.intensity=v*Number(lightInput.value);scene.background.set(background.value);controls.autoRotate=rotate.checked;}
 for(const input of [exposure,lightInput,background,rotate])input.addEventListener('input',settings);
 document.querySelector('#export').onclick=()=>{const xml=`<?xml version="1.0"?><j5mocBlenderSettings><exposure>${exposure.value}</exposure><light>${lightInput.value}</light><background>${background.value}</background><rotate>${rotate.checked}</rotate></j5mocBlenderSettings>`;const url=URL.createObjectURL(new Blob([xml],{type:'application/xml'}));const a=document.createElement('a');a.href=url;a.download='value.xml';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 document.querySelector('#import').onclick=()=>document.querySelector('#file').click();document.querySelector('#file').onchange=async e=>{const f=e.target.files[0];if(!f)return;const xml=new DOMParser().parseFromString(await f.text(),'application/xml');if(xml.querySelector('parsererror'))return;for(const [id,input] of [['exposure',exposure],['light',lightInput],['background',background]]){const text=xml.querySelector(id)?.textContent;if(text)input.value=text;}rotate.checked=xml.querySelector('rotate')?.textContent==='true';settings();};
 addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();loading.style.display='grid';progress.textContent='Die Grafikansicht wurde unterbrochen. Bitte neu laden oder die vorherige Version öffnen.';});
 window.__j5moc={model,scene,camera,renderer,controls,source:rig.source,materials:gltf.parser.json.materials.length,lights:baseLights.length};
 renderer.setAnimationLoop(()=>{controls.update();composer.render();});loading.style.display='none';document.body.dataset.ready='true';
}
