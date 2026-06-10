import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import cytoscape from 'cytoscape';
import { ALL } from './data';
import { NIVEL_META, abbr, fmtSalary, gradoColor } from './constants';

const M = {fontFamily:"'Space Mono',monospace"} as const;
const LBL = {...M,fontSize:11,textTransform:'uppercase' as const,letterSpacing:'0.1em',color:'#5a6d9a'};

// Brighter node colors for dark background
const NIVEL_COLORS: Record<string,string> = {
  'Profesional':'#2DD88A','Técnico':'#5BA4F5','Asistencial':'#D46EF5',
  'Directivo':'#5b8de0','Asesor':'#F58C3A',
};

// Distinct colors per secretaría
const SEC_PALETTE = [
  '#2DD88A','#5BA4F5','#5b8de0','#D46EF5','#F55A5A',
  '#5AF5E8','#F5E85A','#F58C3A','#8CF55A','#5A7AF5',
  '#F55AAF','#5AF58C','#F5C35A','#5ACFF5',
];

export default function GraphView() {
  const allCargos = ALL;
  const containerRef  = useRef<HTMLDivElement>(null);
  const cyRef         = useRef<cytoscape.Core|null>(null);
  const isMountedRef  = useRef(true);
  const [ready,       setReady]       = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [selected,    setSelected]    = useState<any>(null);
  const [panelOpen,   setPanelOpen]   = useState(false);
  const [showCargos,  setShowCargos]  = useState(false);
  const [filterOpec,  setFilterOpec]  = useState(false);
  const [filterNivel, setFilterNivel] = useState(new Set<string>(['Profesional','Técnico','Asistencial','Directivo','Asesor']));
  const [filterSec,   setFilterSec]   = useState('');
  const [isMobile,    setIsMobile]    = useState(false);

  useEffect(()=>{
    const mq=window.matchMedia('(max-width:640px)');
    const up=()=>setIsMobile(mq.matches);
    up(); mq.addEventListener('change',up); return()=>mq.removeEventListener('change',up);
  },[]);

  const SECS = useMemo(()=>[...new Set(allCargos.map(c=>c.secretaria).filter(Boolean))].sort(),[allCargos]);

  const elements = useMemo(()=>{
    const nodes:cytoscape.NodeDefinition[]=[];
    const edges:cytoscape.EdgeDefinition[]=[];
    const pairMap = new Map<string,{sec:string;dep:string}>();
    allCargos.forEach(c=>{
      const k=`${c.secretaria}|||${c.dependencia}`;
      if(!pairMap.has(k)) pairMap.set(k,{sec:c.secretaria,dep:c.dependencia});
    });
    const secIdx = new Map(SECS.map((s,i)=>[s,i]));
    const addedSec=new Set<string>(); const addedDep=new Set<string>();
    pairMap.forEach(({sec,dep},k)=>{
      if(!addedSec.has(sec)){
        const secColor = SEC_PALETTE[secIdx.get(sec)! % SEC_PALETTE.length];
        nodes.push({data:{id:`S::${sec}`,label:abbr(sec),type:'secretaria',sec,scolor:secColor}});
        addedSec.add(sec);
      }
      const depId=`D::${k}`;
      if(!addedDep.has(depId)){
        const secColor = SEC_PALETTE[secIdx.get(sec)! % SEC_PALETTE.length];
        nodes.push({data:{id:depId,label:dep,type:'dependencia',sec,dep,scolor:secColor}});
        addedDep.add(depId);
        edges.push({data:{id:`eSD::${k}`,source:`S::${sec}`,target:depId,etype:'sec-dep'}});
      }
    });
    allCargos.forEach(c=>{
      const nColor=NIVEL_COLORS[c.nivel]||'#F5C35A';
      nodes.push({data:{id:`C::${c.id}`,label:c.denominacion,type:'cargo',
        nivel:c.nivel,grado:c.grado,sec:c.secretaria,dep:c.dependencia,
        opec:c.opec,asignacion:c.asignacion,vacantes:c.vacantes,cierre:c.cierre,
        proposito:c.proposito,tipo:c.tipo,
        ncolor:nColor}});
      edges.push({data:{id:`eDC::${c.id}`,source:`D::${c.secretaria}|||${c.dependencia}`,target:`C::${c.id}`,etype:'dep-cargo'}});
    });
    return {nodes,edges,pairMap};
  },[allCargos, SECS]);

  useEffect(()=>{
    isMountedRef.current=true;
    if(!containerRef.current) return;
    const cy=cytoscape({
      container:containerRef.current, elements:[],
      style:[
        // Secretaría: large hex-like circles, colored per secretaría, bright text
        {selector:'node[type="secretaria"]',style:{
          width:70 as any,height:70 as any,'background-color':'data(scolor)',
          label:'data(label)',color:'#0a0f1a',
          'text-valign':'center','text-halign':'center',
          'font-size':10,'font-weight':'bold','font-family':'Space Mono,monospace',
          'text-wrap':'wrap','text-max-width':62,
          'border-width':2,'border-color':'rgba(255,255,255,.25)'}},
        // Dependencia: medium, uses secretaría color (dimmed)
        {selector:'node[type="dependencia"]',style:{
          width:22 as any,height:22 as any,'background-color':'data(scolor)',
          'background-opacity':0.55,
          label:'data(label)',color:'rgba(255,255,255,.85)',
          'text-valign':'bottom','text-halign':'center','text-margin-y':5,
          'font-size':8,'font-family':'Space Mono,monospace',
          'text-wrap':'wrap','text-max-width':80,
          'border-width':1,'border-color':'rgba(255,255,255,.15)'}},
        // Cargo: small colored dots
        {selector:'node[type="cargo"]',style:{
          width:9,height:9,'background-color':'data(ncolor)',
          'background-opacity':0.85,label:'','border-width':0}},
        // ANT3 cargos: outlined in amber
        {selector:'node[type="cargo"][opec != ""]',style:{
          width:11,height:11,'border-width':2,'border-color':'#5b8de0',
          'background-opacity':1}},
        {selector:'node:selected',style:{'border-width':3,'border-color':'#ffffff','border-opacity':0.9}},
        // Edges
        {selector:'edge[etype="sec-dep"]',style:{
          'line-color':'rgba(255,255,255,.25)',width:1.5,
          'curve-style':'bezier','target-arrow-shape':'none'}},
        {selector:'edge[etype="dep-cargo"]',style:{
          'line-color':'rgba(255,255,255,.08)',width:0.6,
          'curve-style':'bezier','target-arrow-shape':'none'}},
        {selector:'.faded',style:{opacity:0.06}},
      ],
      zoomingEnabled:true,userZoomingEnabled:true,panningEnabled:true,userPanningEnabled:true,minZoom:0.05,maxZoom:5,
    });
    cyRef.current=cy; setReady(true);
    cy.on('tap','node',e=>{
      if(!isMountedRef.current) return;
      const d=e.target.data();
      setSelected(d); setPanelOpen(true);
      cy.elements().removeClass('faded');
      cy.elements().not(e.target.closedNeighborhood()).addClass('faded');
      cy.animate({center:{eles:e.target},zoom:Math.max(cy.zoom(),d.type==='secretaria'?1.2:d.type==='dependencia'?1.8:2.8),duration:400,easing:'ease-in-out-cubic'});
    });
    cy.on('tap',e=>{
      if(!isMountedRef.current) return;
      if(e.target===cy){setSelected(null);setPanelOpen(false);cy.elements().removeClass('faded');}
    });
    return()=>{
      isMountedRef.current=false;
      const inst=cyRef.current; cyRef.current=null;
      if(inst){ try{inst.stop();}catch{} try{(inst as any)._private.notificationsEnabled=false;}catch{} try{inst.destroy();}catch{} }
    };
  },[]);

  const runGraph = useCallback(()=>{
    const cy=cyRef.current; if(!cy) return;
    setLoading(true); cy.elements().remove();
    const toAdd:any[]=[];
    const nodeIdx=new Map(elements.nodes.map(n=>[n.data.id as string,n]));
    const edgeIdx=new Map(elements.edges.map(e=>[e.data.id as string,e]));
    const activeSecs=filterSec?new Set([filterSec]):new Set(SECS);
    activeSecs.forEach(sec=>{const n=nodeIdx.get(`S::${sec}`);if(n)toAdd.push(n);});
    elements.pairMap.forEach(({sec,dep},k)=>{
      if(!activeSecs.has(sec)) return;
      const n=nodeIdx.get(`D::${k}`);if(n)toAdd.push(n);
      const e=edgeIdx.get(`eSD::${k}`);if(e)toAdd.push(e);
    });
    if(showCargos){
      allCargos.forEach(c=>{
        if(!activeSecs.has(c.secretaria)) return;
        if(!filterNivel.has(c.nivel)) return;
        if(filterOpec && !c.opec) return;
        const cn=nodeIdx.get(`C::${c.id}`);if(cn)toAdd.push(cn);
        const ce=edgeIdx.get(`eDC::${c.id}`);if(ce)toAdd.push(ce);
      });
    }
    cy.add(toAdd);
    const cfg:any={name:'cose',animate:true,animationDuration:600,fit:true,padding:40,
      nodeRepulsion:(n:any)=>n.data('type')==='secretaria'?900000:n.data('type')==='dependencia'?450000:60000,
      edgeElasticity:100,gravity:60,numIter:showCargos?250:700,initialTemp:200,coolingFactor:0.99,
      stop:()=>{if(isMountedRef.current&&cyRef.current)setLoading(false);}};
    try{cy.layout(cfg).run();}catch{if(isMountedRef.current)setLoading(false);}
  },[ready,showCargos,filterNivel,filterOpec,filterSec,elements,allCargos,SECS]);

  useEffect(()=>{if(ready)runGraph();},[ready,showCargos,filterNivel,filterOpec,filterSec]);

  const btn={...M,fontSize:12,textTransform:'uppercase' as const,letterSpacing:'0.07em',padding:'6px 12px',border:'0.5px solid',cursor:'pointer'} as const;

  return (
    <div style={{display:'flex',height:'calc(100vh - 46px)',background:'hsl(220 55% 10%)',position:'relative',overflow:'hidden'}}>
      {loading&&<div style={{position:'absolute',top:10,left:'50%',transform:'translateX(-50%)',zIndex:20,...M,fontSize:9,padding:'5px 12px',background:'hsl(220 55% 12%)',color:'rgba(255,255,255,.75)',border:'0.5px solid hsl(220 35% 25%)'}}>Calculando posiciones…</div>}
      <div ref={containerRef} style={{flex:1,height:'100%'}}/>

      {/* Controls */}
      <div style={{position:'absolute',top:12,left:12,zIndex:10,display:'flex',flexDirection:'column',gap:6,maxWidth:220}}>
        <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
          <button onClick={()=>setShowCargos(p=>!p)}
            style={{...btn,background:showCargos?'hsl(32 60% 42%)':'hsl(220 45% 18%)',
              borderColor:showCargos?'hsl(32 60% 55%)':'hsl(220 35% 30%)',
              color:showCargos?'#ffffff':'rgba(255,255,255,.75)'}}>
            {showCargos?'▪ Ocultar':'◉ Ver cargos'}
          </button>
          <button onClick={()=>setFilterOpec(p=>!p)}
            style={{...btn,background:filterOpec?'#0d3d8e':'hsl(220 45% 18%)',
              borderColor:filterOpec?'#1a5dc0':'hsl(220 35% 30%)',
              color:filterOpec?'#ffffff':'rgba(255,255,255,.75)'}}>
            🏆 Solo ANT3
          </button>
        </div>
        {showCargos&&(
          <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
            {['Profesional','Técnico','Asistencial','Directivo','Asesor'].map(n=>{
              const on=filterNivel.has(n); const nm=NIVEL_META[n];
              return <button key={n} onClick={()=>setFilterNivel(prev=>{const s=new Set(prev);on?s.delete(n):s.add(n);return s;})}
                style={{...btn,padding:'3px 7px',background:on?nm.color:'hsl(220 45% 16%)',
                  borderColor:on?nm.border:'hsl(220 35% 28%)',
                  color:on?'#ffffff':'rgba(255,255,255,.55)'}}>
                {nm.short}
              </button>;
            })}
          </div>
        )}
        <select value={filterSec} onChange={e=>setFilterSec(e.target.value)}
          style={{...M,fontSize:11,padding:'5px 8px',background:'#1a5dc0',
            border:'0.5px solid hsl(220 35% 30%)',color:'rgba(255,255,255,.75)',outline:'none'}}>
          <option value="">Todas las secretarías</option>
          {SECS.map(s=><option key={s} value={s}>{abbr(s)}</option>)}
        </select>
        <button onClick={runGraph}
          style={{...btn,background:'hsl(220 45% 18%)',borderColor:'hsl(220 35% 30%)',color:'rgba(255,255,255,.75)'}}>
          ↺ Recalcular
        </button>
      </div>

      {/* Detail panel */}
      {panelOpen&&selected&&(
        <div style={{position:'absolute',top:0,right:0,height:'100%',
          width:isMobile?'100%':290,
          background:'oklch(0.215 0.007 255)',
          borderLeft:'1px solid oklch(0.27 0.008 255)',
          overflowY:'auto',zIndex:15,display:'flex',flexDirection:'column'}}>
          {/* Panel header */}
          <div style={{padding:'11px 14px',background:'oklch(0.165 0.006 255)',
            borderBottom:'1px solid oklch(0.27 0.008 255)',
            display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
            <span style={{fontSize:11,letterSpacing:'0.14em',textTransform:'uppercase' as const,
              fontWeight:700,color:'oklch(0.46 0.012 255)',fontFamily:"'Public Sans',sans-serif"}}>
              {selected.type==='secretaria'?'Secretaría':selected.type==='dependencia'?'Dependencia':'Cargo'}
            </span>
            <button onClick={()=>{setPanelOpen(false);cyRef.current?.elements().removeClass('faded');}}
              style={{background:'none',border:'none',cursor:'pointer',
                color:'oklch(0.58 0.012 255)',fontSize:16,lineHeight:1,padding:4}}>✕</button>
          </div>
          {/* Panel content */}
          <div style={{padding:'14px',flex:1,fontFamily:"'Public Sans',system-ui,sans-serif"}}>
            {selected.type==='secretaria'&&(<>
              <p style={{fontSize:16,fontWeight:700,margin:'0 0 5px',
                color:'oklch(0.945 0.004 255)'}}>{selected.sec}</p>
              <p style={{fontSize:12,color:'oklch(0.58 0.012 255)',margin:'0 0 10px'}}>
                {allCargos.filter(c=>c.secretaria===selected.sec).length} cargos en planta
              </p>
            </>)}
            {selected.type==='dependencia'&&(<>
              <p style={{fontSize:14,fontWeight:700,margin:'0 0 4px',
                color:'oklch(0.945 0.004 255)'}}>{selected.dep}</p>
              <p style={{fontSize:12,color:'oklch(0.66 0.115 250)',margin:'0 0 4px'}}>{abbr(selected.sec)}</p>
              <p style={{fontSize:12,color:'oklch(0.58 0.012 255)',margin:0}}>
                {allCargos.filter(c=>c.secretaria===selected.sec&&c.dependencia===selected.dep).length} cargos
              </p>
            </>)}
            {selected.type==='cargo'&&(<>
              {/* Nivel + grado + OPEC badges */}
              <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',marginBottom:10}}>
                {NIVEL_META[selected.nivel]&&(()=>{
                  const nm=NIVEL_META[selected.nivel];
                  return <span style={{fontSize:11,fontWeight:700,padding:'3px 9px',
                    borderRadius:8,color:nm.color,background:nm.bg,
                    border:`1.5px solid ${nm.color}`}}>
                    {nm.short}
                  </span>;
                })()}
                <span style={{fontSize:11,fontWeight:600,color:'oklch(0.74 0.010 255)',
                  background:'oklch(0.245 0.008 255)',padding:'3px 8px',borderRadius:6}}>
                  G{selected.grado}
                </span>
                {selected.opec&&<span style={{fontSize:10,fontWeight:700,padding:'3px 8px',
                  borderRadius:6,background:'oklch(0.66 0.115 250 / 0.14)',
                  color:'oklch(0.74 0.10 250)',border:'1px solid oklch(0.66 0.115 250 / 0.42)'}}>
                  OPEC {selected.opec}
                </span>}
                {selected.tipo&&<span style={{fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:6,
                  background:selected.tipo==='A'?'oklch(0.68 0.11 300 / 0.15)':'oklch(0.68 0.11 250 / 0.15)',
                  color:selected.tipo==='A'?'oklch(0.68 0.11 300)':'oklch(0.68 0.11 250)',
                  border:`1px solid ${selected.tipo==='A'?'oklch(0.68 0.11 300 / 0.4)':'oklch(0.68 0.11 250 / 0.4)'}`}}>
                  {selected.tipo==='A'?'↑ Ascenso':'Abierto'}
                </span>}
              </div>
              {/* Denominación */}
              <p style={{fontSize:13,fontWeight:700,margin:'0 0 3px',
                color:'oklch(0.945 0.004 255)'}}>{selected.label}</p>
              <p style={{fontSize:12,color:'oklch(0.66 0.115 250)',margin:'0 0 2px',fontWeight:500}}>
                {selected.dep}
              </p>
              <p style={{fontSize:11,color:'oklch(0.58 0.012 255)',margin:'0 0 12px'}}>
                {abbr(selected.sec)}
              </p>
              {/* OPEC info box */}
              {selected.opec&&(
                <div style={{padding:'10px 12px',background:'oklch(0.66 0.115 250 / 0.08)',
                  border:'1px solid oklch(0.66 0.115 250 / 0.3)',borderRadius:8,marginBottom:12}}>
                  <div style={{fontSize:12,fontWeight:700,color:'oklch(0.74 0.10 250)',marginBottom:4}}>
                    OPEC {selected.opec}
                  </div>
                  {selected.asignacion&&<div style={{fontSize:12,color:'oklch(0.72 0.11 150)',fontWeight:700}}>
                    {fmtSalary(selected.asignacion)}
                  </div>}
                  {selected.cierre&&<div style={{fontSize:11,color:'oklch(0.58 0.012 255)',marginTop:3}}>
                    Cierre: {selected.cierre}
                  </div>}
                  {selected.vacantes>0&&<div style={{fontSize:11,color:'oklch(0.58 0.012 255)',marginTop:2}}>
                    {selected.vacantes} vacante{selected.vacantes!==1?'s':''}
                  </div>}
                  {selected.link_pdf&&<a href={selected.link_pdf} target="_blank" rel="noopener noreferrer"
                    style={{display:'inline-flex',alignItems:'center',gap:5,marginTop:8,
                      padding:'5px 12px',background:'oklch(0.66 0.115 250)',
                      color:'oklch(0.18 0.02 255)',textDecoration:'none',fontSize:11,
                      fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase' as const,borderRadius:6}}>
                    📄 Ver PDF
                  </a>}
                </div>
              )}
              {/* Propósito */}
              <p style={{fontSize:11,letterSpacing:'0.12em',textTransform:'uppercase' as const,
                fontWeight:700,color:'oklch(0.46 0.012 255)',margin:'0 0 6px'}}>Propósito</p>
              <p style={{fontSize:12,lineHeight:1.6,color:'oklch(0.74 0.010 255)',margin:0}}>
                {selected.proposito?.length>320?selected.proposito.slice(0,319)+'…':selected.proposito}
              </p>
            </>)}
          </div>
        </div>
      )}
    </div>
  );
}
