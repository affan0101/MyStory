"use client";

import { Suspense, useEffect, useMemo, useRef, useState, Component, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { SceneKind } from "@/data/chapters";

const cube = new THREE.BoxGeometry(1,1,1);
const ball = new THREE.IcosahedronGeometry(1,1);
const column = new THREE.CylinderGeometry(1,1,1,8);
const cone = new THREE.ConeGeometry(1,1,7);
const disc = new THREE.CylinderGeometry(1,1,1,64);
const material = (color:string, extra:THREE.MeshStandardMaterialParameters={})=>new THREE.MeshStandardMaterial({color,roughness:.88,...extra});
const M = {white:material("#e9e0ce"),rust:material("#a9543e"),wood:material("#a98050"),dark:material("#172f30"),ground:material("#33463c"),stone:material("#283c39"),leaf:material("#637d48"),leaf2:material("#3e6246"),gold:material("#dcb473",{metalness:.3,roughness:.5}),paper:material("#e6dac3"),pink:material("#b97f85"),blue:material("#7099a9"),mint:material("#8abdaa"),screen:material("#244844",{emissive:"#336456",emissiveIntensity:.4}),light:material("#f3bb6c",{emissive:"#ef9d48",emissiveIntensity:1.2})};
type Mat = keyof typeof M;
function Box({p=[0,0,0],s=[1,1,1],m="white",r=[0,0,0]}:{p?:[number,number,number];s?:[number,number,number];m?:Mat;r?:[number,number,number]}){return <mesh geometry={cube} material={M[m]} position={p} scale={s} rotation={r} castShadow receiveShadow/>}
function Cyl({p=[0,0,0],s=[1,1,1],m="wood",r=[0,0,0]}:{p?:[number,number,number];s?:[number,number,number];m?:Mat;r?:[number,number,number]}){return <mesh geometry={column} material={M[m]} position={p} scale={s} rotation={r} castShadow receiveShadow/>}
function Pebble({p,s=[1,1,1],m="stone"}:{p:[number,number,number];s?:[number,number,number];m?:Mat}){return <mesh geometry={ball} material={M[m]} position={p} scale={s} castShadow/>}
function Foliage({count=45,spread=3,seed=1,y=0}:{count?:number;spread?:number;seed?:number;y?:number}){
  const ref=useRef<THREE.InstancedMesh>(null);
  useEffect(()=>{if(!ref.current)return;const o=new THREE.Object3D();for(let i=0;i<count;i++){const n=Math.sin(i*127.1+seed*31)*43758.5453;const a=(n-Math.floor(n))*Math.PI*2;const b=Math.sin(i*53.2+seed)*91.12;const d=(b-Math.floor(b))*spread;o.position.set(Math.cos(a)*d,y+.07,Math.sin(a)*d);o.scale.set(.055,.14+(i%4)*.035,.055);o.rotation.set(.1,a,.1);o.updateMatrix();ref.current.setMatrixAt(i,o.matrix);}ref.current.instanceMatrix.needsUpdate=true},[count,spread,seed,y]);
  return <instancedMesh ref={ref} args={[cone,M.leaf,count]} />;
}
function Tree({p=[0,0,0],scale=1}:{p?:[number,number,number];scale?:number}){return <group position={p} scale={scale}><Cyl p={[0,1,0]} s={[.13,2,.13]} m="wood" r={[0,0,-.06]}/><Cyl p={[.27,1.6,0]} s={[.07,.8,.07]} r={[0,0,-.65]}/>{[[0,2.25,0],[.6,2.05,.1],[-.52,2.0,.15],[.15,2.65,.1],[.2,2.1,-.55]].map((x,i)=><Pebble key={i} p={x as [number,number,number]} s={[.65,.72,.64]} m={i%2?"leaf":"leaf2"}/>)}</group>}
function Ground({hills=false}:{hills?:boolean}){return <group><mesh geometry={disc} material={M.stone} position={[0,-.35,0]} scale={[4.65,.7,3.65]} receiveShadow/><mesh geometry={disc} material={M.ground} position={[0,.01,0]} scale={[4.55,.11,3.55]} receiveShadow/>{Array.from({length:17},(_,i)=><Pebble key={i} p={[Math.cos(i/17*Math.PI*2)*4.48,-.22,Math.sin(i/17*Math.PI*2)*3.48]} s={[.36,.38,.35]}/>)}{!hills&&<Foliage count={80} spread={3.5}/>}</group>}
function Path(){return <group>{Array.from({length:8},(_,i)=><Box key={i} p={[Math.sin(i*.45)*.28,.105,1.0+i*.32]} s={[1.05,.035,.24]} m="wood" r={[0,Math.sin(i*.4)*.12,0]}/>)}</group>}
function House(){return <group position={[0,.08,-.45]}>
  <Box p={[0,.85,0]} s={[5,1.7,2.15]} m="white"/><Box p={[0,.25,.05]} s={[5.06,.5,2.2]} m="rust"/>
  <Box p={[0,1.76,.28]} s={[5.3,.2,2.95]} m="white"/>
  <Box p={[0,2.02,-1.05]} s={[5.3,.45,.13]}/><Box p={[0,2.02,1.69]} s={[5.3,.45,.13]}/><Box p={[-2.58,2.02,.28]} s={[.13,.45,2.85]}/><Box p={[2.58,2.02,.28]} s={[.13,.45,2.85]}/>
  {[-2.55,-1.1,1.1,2.55].map(x=><Box key={x} p={[x,2.03,1.72]} s={[.09,.49,.08]}/>)}
  <Box p={[0,.45,1.55]} s={[2.45,.14,.65]} m="rust"/>
  <Box p={[0,.21,1.97]} s={[1.2,.2,.34]} m="stone"/><Box p={[0,.1,2.24]} s={[1.45,.17,.34]} m="stone"/>
  {[-1.04,1.04].map(x=><group key={x}><Box p={[x,1,1.47]} s={[.16,1.55,.16]}/><Box p={[x,.52,1.47]} s={[.17,.55,.17]} m="rust"/></group>)}
  <Box p={[0,.97,1.091]} s={[.72,1.23,.045]} m="wood"/><Box p={[-.08,.98,1.124]} s={[.45,1.16,.045]} m="light"/>
  {[-1.86,1.86].map(x=><group key={x}><Box p={[x,1.04,1.12]} s={[.77,.82,.12]} m="wood"/><Box p={[x,1.04,1.2]} s={[.65,.7,.06]} m="dark"/>{[-.22,0,.22].map(d=><Box key={d} p={[x+d,1.04,1.25]} s={[.023,.7,.04]} m="white"/>)}</group>)}
  <Cyl p={[-1.96,2.6,-.55]} s={[.34,.7,.34]} m="white"/>
  <Box p={[.66,.75,1.25]} s={[.6,.06,.3]} m="wood"/>
  <pointLight position={[0,.9,1.6]} color="#ffbf6a" intensity={3} distance={4}/>
</group>}
function School(){return <group position={[0,.1,-.25]}>
  <Box p={[0,.08,0]} s={[4.3,.14,2.8]} m="wood"/>
  {[-2,-1,0,1,2].map(x=><group key={x}><Cyl p={[x,1.05,-1.2]} s={[.075,2.1,.075]}/><Cyl p={[x,1.05,1.2]} s={[.075,2.1,.075]}/></group>)}
  <Box p={[0,2.22,-.73]} s={[4.75,.16,1.8]} m="wood" r={[.4,0,0]}/><Box p={[0,2.22,.73]} s={[4.75,.16,1.8]} m="wood" r={[-.4,0,0]}/>
  {Array.from({length:21},(_,i)=><Cyl key={i} p={[-2.2+i*.22,2.25,.72]} s={[.035,1.84,.035]} r={[Math.PI/2-.4,0,0]} m="gold"/>)}
  {Array.from({length:17},(_,i)=><Cyl key={i} p={[-2+i*.25,1,-1.2]} s={[.033,1.8,.033]} m="gold"/>)}
  <Box p={[0,1.3,-1.08]} s={[1.6,.7,.06]} m="dark"/>
  {[-1,1].map(x=><group key={x} position={[x,0,.22]}><Box p={[0,.57,0]} s={[1.2,.09,.55]} m="wood"/>{[-.47,.47].map(d=><Box key={d} p={[d,.3,0]} s={[.08,.54,.37]} m="wood"/>)}<Box p={[0,.36,.56]} s={[1.25,.08,.3]} m="wood"/><Book p={[0,.67,0]} scale={.34}/></group>)}
</group>}
function Book({p=[0,0,0],m="pink",scale=1,angle=0}:{p?:[number,number,number];m?:Mat;scale?:number;angle?:number}){return <group position={p} scale={scale} rotation={[0,angle,0]}><Box p={[0,.05,0]} s={[1.5,.08,1.95]} m={m}/><Box p={[0,.18,0]} s={[1.4,.18,1.85]} m="paper"/><Box p={[0,.31,0]} s={[1.5,.07,1.95]} m={m}/><Box p={[-.72,.18,0]} s={[.05,.29,1.95]} m={m}/><Box p={[.2,.354,-.18]} s={[.65,.007,.045]} m="gold"/><Box p={[.2,.354,-.02]} s={[.45,.007,.028]} m="gold"/></group>}
function Bat(){return <group rotation={[0,.2,-.15]}><Box p={[0,.8,0]} s={[.42,1.55,.16]} m="paper"/><Cyl p={[0,1.88,0]} s={[.07,.7,.07]} m="dark"/><Box p={[0,1.1,.09]} s={[.28,.45,.02]} m="rust"/></group>}
function CricketBall({animate}:{animate:boolean}){const ref=useRef<THREE.Mesh>(null);useFrame(({clock})=>{if(ref.current&&animate)ref.current.position.y=.2+Math.abs(Math.sin(clock.elapsedTime*.9))*.8});return <mesh ref={ref} geometry={ball} material={M.rust} position={[1.8,.25,1.3]} scale={.17}/>}
function Cricket({animate}:{animate:boolean}){return <group><Box p={[0,.15,0]} s={[1.6,.04,5.5]} m="wood"/>{[-.22,0,.22].map(x=><Cyl key={x} p={[x,.67,-1.8]} s={[.04,1.05,.04]} m="paper"/>)}<Cyl p={[0,1.22,-1.8]} s={[.02,.53,.02]} m="paper" r={[0,0,Math.PI/2]}/><group position={[-.8,.1,.8]}><Bat/></group><CricketBall animate={animate}/><Box p={[0,.18,1.85]} s={[1.8,.015,.07]} m="white"/></group>}
function Keyboard(){const ref=useRef<THREE.InstancedMesh>(null);useEffect(()=>{if(!ref.current)return;const t=new THREE.Object3D();for(let i=0;i<40;i++){t.position.set((i%10-.5)*.11-.46,.027,Math.floor(i/10)*.105-.2);t.scale.set(.085,.017,.075);t.updateMatrix();ref.current.setMatrixAt(i,t.matrix)}ref.current.instanceMatrix.needsUpdate=true},[]);return <instancedMesh ref={ref} args={[cube,M.dark,40]}/>}
function Laptop({p=[0,0,0],s=1,r=0}:{p?:[number,number,number];s?:number;r?:number}){return <group position={p} scale={s} rotation={[0,r,0]}><Box s={[1.45,.06,.95]} m="blue"/><Keyboard/><group position={[0,.53,-.43]} rotation={[-.16,0,0]}><Box s={[1.45,1,.055]} m="dark"/><Box p={[0,.015,.033]} s={[1.28,.83,.01]} m="screen"/>{Array.from({length:6},(_,i)=><Box key={i} p={[-.16+(i%2)*.07,.27-i*.1,.043]} s={[.48+(i%3)*.13,.019,.006]} m={i%3?"mint":"gold"}/>)}</group></group>}
function Desk({draft=false}:{draft?:boolean}){return <group><Box p={[0,1.15,0]} s={[4,.16,2]} m="wood"/>{[-1.65,1.65].map(x=><group key={x}><Box p={[x,.57,-.67]} s={[.12,1.14,.12]} m="dark"/><Box p={[x,.57,.67]} s={[.12,1.14,.12]} m="dark"/></group>)}{draft?<group><Box p={[0,1.3,0]} s={[2.55,.035,1.5]} m="paper"/>{[-.6,0,.6].map(x=><Box key={x} p={[x,1.325,0]} s={[.018,.005,1.25]} m="blue"/>)}{[-.4,.35].map(z=><Box key={z} p={[0,1.33,z]} s={[2.05,.005,.018]} m="blue"/>)}<Cyl p={[1.54,1.35,.1]} s={[.026,.85,.026]} m="gold" r={[0,0,Math.PI/2]}/></group>:<Laptop p={[0,1.26,0]} s={1.6}/>}<Cyl p={[1.48,1.47,-.58]} s={[.13,.48,.13]} m="rust"/><Cyl p={[-1.5,1.7,-.55]} s={[.045,1,.045]} m="gold"/><mesh geometry={cone} material={M.light} position={[-1.5,2.2,-.55]} scale={[.34,.3,.34]} rotation={[0,0,Math.PI]}/></group>}
function Chairs(){return <group>{[[-1.15,-.8],[1.15,-.8],[-1.15,1],[1.15,1]].map(([x,z],i)=><group key={i} position={[x,.05,z]} rotation={[0,i%2?-.16:.16,0]}><Box p={[0,.65,0]} s={[1,.12,.9]} m={(["pink","blue","mint","gold"] as Mat[])[i]}/><Box p={[0,1.15,-.4]} s={[1,.9,.09]} m={(["pink","blue","mint","gold"] as Mat[])[i]}/>{[-.4,.4].map(d=><Box key={d} p={[d,.32,0]} s={[.07,.64,.65]} m="wood"/>)}<Book p={[0,.76,.06]} scale={.34} m={(["blue","pink","gold","mint"] as Mat[])[i]}/></group>)}</group>}
function Trophy(){return <group><Cyl p={[0,.14,0]} s={[.4,.2,.4]} m="dark"/><Cyl p={[0,.48,0]} s={[.09,.5,.09]} m="gold"/><mesh geometry={cone} material={M.gold} position={[0,.88,0]} rotation={[0,0,Math.PI]} scale={[.43,.52,.43]}/><Cyl p={[0,1.13,0]} s={[.44,.035,.44]} m="gold"/></group>}
function Hills(){return <group>{[[-1.7,.75,-1.3,1.8],[1.3,1.1,-1.5,2.1],[.5,.4,1.2,1.5],[-2.4,.3,.8,1.25]].map(([x,y,z,s],i)=><Pebble key={i} p={[x,y,z]} s={[s,y+1,s*.8]} m={i%2?"leaf2":"ground"}/>)}{[[-2,1.3,-.2],[2,1.2,-.5],[.4,1.7,-1.7],[1,1.2,1],[-.9,.8,1.1]].map((p,i)=><Tree key={i} p={p as [number,number,number]} scale={.5+(i%2)*.15}/>)}<Path/></group>}
function Work(){return <group><group position={[-1.7,.1,-.6]}>{[0,1,2].map(i=><group key={i}><Box p={[0,.35+i*.52,0]} s={[1.3,.43,1]} m="dark"/><Box p={[0,.35+i*.52,.515]} s={[1.08,.27,.02]} m="blue"/><Box p={[.37,.35+i*.52,.54]} s={[.07,.07,.02]} m="light"/></group>)}</group><group position={[1,0,.3]} scale={.7}><Desk/></group>{[-1,0,1].map((x,i)=><Pebble key={i} p={[x*.6,1.8+(i%2)*.6,-1.35]} s={[.12,.12,.12]} m="mint"/>)}</group>}

function Model({kind,animate}:{kind:SceneKind;animate:boolean}){return <group dispose={null}><Ground hills={kind==="hills"}/>{kind==="home"||kind==="future"?<><House/><Path/><Tree p={[-3,.06,-.15]} scale={1.15}/><Tree p={[2.9,.06,-1.75]} scale={.8}/>{kind==="future"&&<Laptop p={[1.8,.15,2.1]} s={.7} r={-.4}/>}</>:kind==="school"?<><School/><Tree p={[-2.9,0,-1.3]} scale={1.1}/><Path/></>:kind==="books"?<><Book p={[-1,.13,.3]} m="pink" scale={1.4} angle={-.25}/><Book p={[1.3,.13,-.5]} m="blue" scale={1.4} angle={.3}/><Tree p={[-2.8,0,-1.4]} scale={.85}/></>:kind==="cricket"?<><Cricket animate={animate}/><Tree p={[-2.7,0,-1.6]} scale={.85}/><Tree p={[2.8,0,-1.4]} scale={.75}/></>:kind==="design"?<Desk draft/>:kind==="friends"?<><Chairs/><Tree p={[-2.8,0,-1.5]} scale={1}/></>:kind==="hackathon"?<><group position={[-.8,0,0]} scale={.82}><Desk/></group><group position={[2.2,.14,.8]} scale={1.4}><Trophy/></group></>:kind==="hills"?<Hills/>:kind==="freelance"?<><Desk/><Book p={[-2.6,.17,1.15]} m="mint" scale={.7}/></>:<Work/>}</group>}

function Turntable({kind,reduced,light}:{kind:SceneKind;reduced:boolean;light:boolean}){
  const ref=useRef<THREE.Group>(null); const mouse=useRef(0); const {setDpr}=useThree(); const frames=useRef({n:0,time:0,reduced:false});
  useEffect(()=>{if(reduced)return;const move=(event:PointerEvent)=>{mouse.current=(event.clientX/window.innerWidth)*2-1};window.addEventListener("pointermove",move,{passive:true});return()=>window.removeEventListener("pointermove",move)},[reduced]);
  useFrame(({clock},delta)=>{if(ref.current){const target=-.28+(reduced?0:mouse.current*.13);ref.current.rotation.y=THREE.MathUtils.damp(ref.current.rotation.y,target,3,delta);ref.current.position.y=reduced?0:Math.sin(clock.elapsedTime*.42)*.055;}if(!frames.current.reduced){frames.current.n++;frames.current.time+=delta;if(frames.current.n===150){if(frames.current.time/150>.032){setDpr(1);frames.current.reduced=true;}else frames.current={n:0,time:0,reduced:false};}}});
  return <group ref={ref} rotation={[0,-.28,0]}><Model kind={kind} animate={!reduced&&!light}/></group>;
}
class SceneBoundary extends Component<{children:ReactNode;onFailure:()=>void},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return{failed:true}}componentDidCatch(){this.props.onFailure()}render(){return this.state.failed?null:this.props.children}}

export default function World({kind,reduced,light,onReady,onFailure}:{kind:SceneKind;reduced:boolean;light:boolean;onReady:()=>void;onFailure:()=>void}){
  const [visible,setVisible]=useState(true);
  useEffect(()=>{const update=()=>setVisible(!document.hidden);document.addEventListener("visibilitychange",update);return()=>document.removeEventListener("visibilitychange",update)},[]);
  const dpr=useMemo<[number,number]>(()=>[1,light?1:1.5],[light]);
  return <SceneBoundary onFailure={onFailure}><Canvas aria-hidden="true" camera={{position:[10,7.7,12],fov:38,near:.1,far:65}} dpr={dpr} shadows={!light} frameloop={!visible?"never":reduced?"demand":"always"} gl={{alpha:true,antialias:!light,powerPreference:"low-power"}} onCreated={({gl,camera})=>{camera.lookAt(0,.5,0);gl.setClearColor(0x000000,0);onReady();gl.domElement.addEventListener("webglcontextlost",onFailure,{once:true});}}>
    <ambientLight intensity={1.6} color="#b5cec6"/><hemisphereLight args={["#adcdd4","#3a3027",1.8]}/><directionalLight position={[-3,7,4]} intensity={4} color="#f8cb8a" castShadow={!light} shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} shadow-normalBias={.045}/><directionalLight position={[5,3,-4]} intensity={1.7} color="#7fabb9"/>
    <Suspense fallback={null}><Turntable kind={kind} reduced={reduced} light={light}/></Suspense>
  </Canvas></SceneBoundary>;
}
