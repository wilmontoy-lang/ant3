import React, { useState, useMemo, useCallback, useEffect, lazy, Suspense } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ALL } from './data';
import type { Cargo } from './data';
import { NIVEL_META, abbr, fmtSalary, gradoColor } from './constants';
import { useOverrides, applyOverrides } from './useOverrides';
import { SUPA_OK } from './supabaseClient';
import GraphView from './GraphView';
const AdminPanel = lazy(()=>import('./AdminPanel'));

/* ── Design tokens ─────────────────────────────── */
const T = {
  bg:        'oklch(0.165 0.006 255)',
  bg2:       'oklch(0.195 0.006 255)',
  surface:   'oklch(0.215 0.007 255)',
  surface2:  'oklch(0.245 0.008 255)',
  line:      'oklch(0.30 0.010 255)',
  lineSoft:  'oklch(0.27 0.008 255)',
  txt:       'oklch(0.945 0.004 255)',
  txt2:      'oklch(0.74 0.010 255)',
  txt3:      'oklch(0.58 0.012 255)',
  txt4:      'oklch(0.46 0.012 255)',
  accent:    'oklch(0.66 0.115 250)',
  accent2:   'oklch(0.74 0.10 250)',
  accentDim: 'oklch(0.66 0.115 250 / 0.14)',
  accentLine:'oklch(0.66 0.115 250 / 0.42)',
  cGreen:    'oklch(0.72 0.11 150)',
  cTeal:     'oklch(0.70 0.10 200)',
  cRose:     'oklch(0.70 0.11 12)',
  cBlue:     'oklch(0.68 0.11 250)',
  cViolet:   'oklch(0.68 0.11 300)',
  cAmber:    'oklch(0.78 0.11 80)',
  cSlate:    'oklch(0.62 0.02 255)',
};

const FF = "'Public Sans', system-ui, -apple-system, sans-serif";
const NIVELES = ['Profesional','Técnico','Asistencial','Directivo','Asesor'] as const;
const NIVEL_KPI: Record<string,{k:string;c:string;short:string}> = {
  'Profesional': {k:'k-pro', c:T.cGreen,  short:'Pro'},
  'Técnico':     {k:'k-tec', c:T.cTeal,   short:'Tec'},
  'Asistencial': {k:'k-asi', c:T.cRose,   short:'Asi'},
  'Directivo':   {k:'k-dir', c:T.txt3,    short:'Dir'},
  'Asesor':      {k:'k-ase', c:T.txt3,    short:'Ase'},
};

/* ── Elegibles accordion ───────────────────────── */
function ElegiblesAccordion({elegibles}:{elegibles:Cargo['elegibles']}) {
  const [open,setOpen] = useState(false);
  const [q,setQ]       = useState('');
  if(!elegibles?.length) return null;
  const list = q ? elegibles.filter(e=>(e[1]+' '+e[2]).toLowerCase().includes(q.toLowerCase())) : elegibles;
  return (
    <div style={{border:`1px solid ${T.line}`,borderRadius:8,overflow:'hidden',marginTop:8}}>
      <button onClick={()=>setOpen(p=>!p)} style={{width:'100%',display:'flex',justifyContent:'space-between',
        alignItems:'center',padding:'9px 14px',background:T.bg2,border:'none',cursor:'pointer',textAlign:'left'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0,flex:1}}>
          <span style={{fontSize:11,letterSpacing:'0.12em',textTransform:'uppercase' as const,
            color:T.txt4,fontWeight:600,flexShrink:0}}>Elegibles</span>
          <span style={{fontSize:11,fontWeight:700,padding:'1px 8px',
            background:T.accentDim,border:`1px solid ${T.accentLine}`,color:T.accent2,
            borderRadius:999,flexShrink:0}}>{elegibles.length}</span>
          <span style={{fontSize:12,color:T.txt3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
            #1 {elegibles[0][1]} {elegibles[0][2]} — {elegibles[0][3]}pts
          </span>
        </div>
        <span style={{fontSize:12,color:T.txt4,flexShrink:0,marginLeft:8}}>{open?'▲':'▼'}</span>
      </button>
      {open&&<div>
        <div style={{padding:'6px 10px',background:T.bg2,borderBottom:`1px solid ${T.line}`,position:'relative'}}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar concursante…" autoFocus
            style={{width:'100%',background:T.bg,border:`1px solid ${T.line}`,color:T.txt,
              fontFamily:FF,fontSize:13,padding:'6px 10px 6px 28px',outline:'none',borderRadius:6}}/>
          <span style={{position:'absolute',left:17,top:'50%',transform:'translateY(-50%)',
            fontSize:14,color:T.txt4}}>⌕</span>
        </div>
        <div style={{maxHeight:260,overflowY:'auto'}}>
          {!list.length&&<p style={{textAlign:'center',padding:'12px',fontSize:13,color:T.txt4}}>Sin resultados</p>}
          {list.map(([pos,n,a,pts,tip],i)=>{
            const firme=tip?.toLowerCase().includes('completa');
            return <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',
              padding:'8px 14px',borderBottom:`1px solid ${T.lineSoft}`,fontFamily:FF,
              background:pos===1?T.surface2:T.surface}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:11,fontWeight:700,background:pos===1?T.accent:T.bg2,
                  color:pos===1?'oklch(0.18 0.02 255)':T.txt2,padding:'2px 8px',
                  minWidth:26,textAlign:'center',borderRadius:5,flexShrink:0}}>{pos}</span>
                <span style={{fontSize:13,color:T.txt}}>{n} {a}</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:7,flexShrink:0}}>
                <span style={{fontSize:13,fontWeight:700,color:T.cGreen,fontVariantNumeric:'tabular-nums'}}>{pts}</span>
                {firme&&<span style={{fontSize:10,padding:'1px 6px',background:`${T.cGreen}20`,
                  color:T.cGreen,border:`1px solid ${T.cGreen}50`,borderRadius:4}}>✓ Firme</span>}
              </div>
            </div>;
          })}
        </div>
      </div>}
    </div>
  );
}

/* ── OPEC Panel ─────────────────────────────────── */
function OpecPanel({c}:{c:Cargo}) {
  return (
    <div style={{padding:'14px 16px',display:'flex',flexDirection:'column',gap:12}}>
      <div style={{display:'flex',flexWrap:'wrap',gap:7,alignItems:'center'}}>
        <span style={{fontSize:13,fontWeight:700,padding:'4px 12px',fontVariantNumeric:'tabular-nums',
          background:T.bg2,border:`1px solid ${T.line}`,color:T.txt,borderRadius:6}}>
          OPEC {c.opec}
        </span>
        <span style={{fontSize:11,fontWeight:700,padding:'4px 10px',letterSpacing:'0.08em',
          textTransform:'uppercase' as const,background:T.accentDim,border:`1px solid ${T.accentLine}`,
          color:T.accent2,borderRadius:999}}>ANT3 · 2023</span>
        {c.tipo&&<span style={{fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:6,letterSpacing:'0.06em',
          background:c.tipo==='A'?`${T.cViolet}15`:`${T.cBlue}15`,
          color:c.tipo==='A'?T.cViolet:T.cBlue,
          border:`1px solid ${c.tipo==='A'?T.cViolet:T.cBlue}50`}}>
          {c.tipo==='A'?'↑ Ascenso':'Abierto'}
        </span>}
        {c.asignacion&&<span style={{fontSize:13,fontWeight:600,color:T.cGreen,
          fontVariantNumeric:'tabular-nums'}}>{fmtSalary(c.asignacion)}</span>}
        {c.vacantes>0&&<span style={{fontSize:12,color:T.txt3}}>{c.vacantes} vacante{c.vacantes!==1?'s':''}</span>}
      </div>
      {c.cierre&&<p style={{fontSize:12,color:T.txt3,margin:0,letterSpacing:'0.06em',
        textTransform:'uppercase' as const,fontWeight:600}}>
        Cierre: <strong style={{color:T.txt2}}>{c.cierre}</strong></p>}
      {c.link_pdf&&<div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        <a href={c.link_pdf} target="_blank" rel="noopener noreferrer"
          style={{display:'inline-flex',alignItems:'center',gap:6,padding:'7px 16px',
            background:T.accent,color:'oklch(0.18 0.02 255)',textDecoration:'none',
            fontSize:12,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase' as const,borderRadius:8}}>
          📄 Ver PDF
        </a>
      </div>}
      <ElegiblesAccordion elegibles={c.elegibles}/>
      {!c.elegibles?.length&&c.link_pdf&&<p style={{fontSize:12,color:T.txt4,margin:0}}>Lista de elegibles no disponible aún.</p>}
    </div>
  );
}

/* ── Detail Panel ───────────────────────────────── */
function DetailPanel({c,onClose}:{c:Cargo;onClose:()=>void}) {
  const [tab,setTab]=useState('proposito');
  const tabs:[string,string][]=[
    ['proposito','Propósito'],
    ...(c.opec?[['opec','📋 OPEC / ANT3']] as [string,string][]:[] as [string,string][]),
  ];
  return (
    <div style={{borderTop:`1px solid ${T.line}`,background:T.bg2}}>
      <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:12}}>
        <div style={{display:'flex',gap:4,flexWrap:'wrap',alignItems:'center'}}>
          {tabs.map(([k,lbl])=>(
            <button key={k} onClick={()=>setTab(k)}
              style={{fontSize:12,fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase' as const,
                padding:'6px 14px',border:`1px solid ${tab===k?T.accent:T.line}`,cursor:'pointer',
                borderRadius:7,background:tab===k?T.accent:T.bg,
                color:tab===k?'oklch(0.18 0.02 255)':T.txt3,fontFamily:FF}}>
              {lbl}
            </button>
          ))}
          <button onClick={onClose}
            style={{marginLeft:'auto',fontSize:12,fontWeight:600,letterSpacing:'0.08em',
              textTransform:'uppercase' as const,padding:'6px 14px',border:`1px solid ${T.line}`,
              cursor:'pointer',borderRadius:7,background:'transparent',color:T.txt4,fontFamily:FF}}>
            ▲ cerrar
          </button>
        </div>
        {tab==='proposito'&&(
          <p style={{fontSize:13.5,lineHeight:1.65,color:T.txt3,margin:0}}>{c.proposito||'—'}</p>
        )}
        {tab==='opec'&&c.opec&&<OpecPanel c={c}/>}
      </div>
    </div>
  );
}

/* ── Chart tooltip ──────────────────────────────── */
function ChartTip({active,payload,label}:any) {
  if(!active||!payload?.length) return null;
  return <div style={{background:T.surface2,border:`1px solid ${T.line}`,padding:'8px 12px',
    borderRadius:8,fontFamily:FF,fontSize:12,color:T.txt2}}>
    <p style={{fontWeight:700,marginBottom:4,color:T.txt}}>{label}</p>
    {payload.map((p:any)=><div key={p.name} style={{display:'flex',gap:10,justifyContent:'space-between',color:p.fill}}>
      <span>{p.name}</span><strong>{p.value}</strong>
    </div>)}
  </div>;
}

/* ── Elegibles en tabla (para el acordeón de la tabla principal) ── */
function ElegiblesTable({elegibles}:{elegibles:Cargo['elegibles']}) {
  const [q,setQ] = useState('');
  const list = q ? elegibles.filter(e=>(e[1]+' '+e[2]).toLowerCase().includes(q.toLowerCase())) : elegibles;

  // Color por tipo de novedad
  const novedadStyle = (tipo: string): React.CSSProperties => {
    const t = tipo?.toLowerCase() || '';
    if (t.includes('completa'))   return {color:'oklch(0.72 0.11 150)',background:'oklch(0.72 0.11 150/0.12)',border:'1px solid oklch(0.72 0.11 150/0.3)'};
    if (t.includes('exclu'))      return {color:'oklch(0.70 0.11 12)', background:'oklch(0.70 0.11 12/0.12)', border:'1px solid oklch(0.70 0.11 12/0.3)'};
    if (t.includes('parcial'))    return {color:'oklch(0.78 0.11 80)', background:'oklch(0.78 0.11 80/0.12)', border:'1px solid oklch(0.78 0.11 80/0.3)'};
    if (t.includes('suspendida')) return {color:'oklch(0.68 0.11 300)',background:'oklch(0.68 0.11 300/0.12)',border:'1px solid oklch(0.68 0.11 300/0.3)'};
    return {color:'oklch(0.58 0.012 255)',background:'oklch(0.245 0.008 255)',border:'1px solid oklch(0.30 0.010 255)'};
  };

  return (
    <div className="eleg">
      <div className="eleg-h">
        <span style={{fontSize:10,letterSpacing:'0.16em',textTransform:'uppercase' as const,
          fontWeight:700,color:'oklch(0.46 0.012 255)'}}>Elegibles</span>
        <span className="count-chip">{elegibles.length}</span>
        <span className="lead">
          <b>#1</b> {elegibles[0][1]} {elegibles[0][2]} — {elegibles[0][3]}pts
        </span>
      </div>
      <div className="eleg-search">
        <span className="ico">⌕</span>
        <input value={q} onChange={e=>setQ(e.target.value)}
          placeholder="Buscar concursante…"/>
        {q&&<button onClick={()=>setQ('')}
          style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',
            background:'none',border:'none',cursor:'pointer',color:'oklch(0.46 0.012 255)',fontSize:13}}>✕</button>}
      </div>
      <div className="eleg-list">
        {list.length===0&&<div className="el-empty">Sin resultados para "{q}"</div>}
        {list.map(([pos,nombres,apellidos,puntaje,novedad],i)=>(
          <div key={i} className={`el-row${pos===1?' top':''}`}>
            <span className="el-rank">{pos}</span>
            <span className="el-name">{nombres} {apellidos}</span>
            {novedad&&<span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:4,
              whiteSpace:'nowrap',...novedadStyle(novedad)}}>
              {novedad}
            </span>}
            <span className="el-score">{puntaje}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════ MAIN APP ════════════════════════ */
export default function App() {
  const overrides = useOverrides();
  const [view,setView]=useState<'catalogo'|'grafo'>('catalogo');
  const [showAdmin,setShowAdmin]=useState(false);
  const [pinMode,setPinMode]=useState(false);
  const [adminPin,setAdminPin]=useState('');
  const [localPatches,setLocalPatches]=useState<Record<number,Record<string,string>>>({});
  const [bannerOpen, setBannerOpen] = useState(()=>{
    try { return localStorage.getItem('quipu_banner_v1') !== '0'; } catch { return true; }
  });
  const toggleBanner = () => {
    setBannerOpen(p => {
      try { localStorage.setItem('quipu_banner_v1', p ? '0' : '1'); } catch {}
      return !p;
    });
  };

  const [filterNivel,setFilterNivel]=useState('');
  const [filterGrado,setFilterGrado]=useState('');
  const [filterSec,setFilterSec]=useState('');
  const [filterDep,setFilterDep]=useState('');
  const [filterOpec,setFilterOpec]=useState(false);
  const [search,setSearch]=useState('');
  const [opecSearch,setOpecSearch]=useState('');
  const [displayMode,setDisplayMode]=useState<'table'|'cards'>('table');
  const [expanded,setExpanded]=useState<number|null>(null);

  useEffect(()=>{if(window.matchMedia('(max-width:640px)').matches)setDisplayMode('cards');},[]);
  const toggle = useCallback((id:number) => {
    setExpanded(p => {
      const newId = p === id ? null : id;
      if (newId !== null) {
        // Scroll the row into view after state update, accounting for sticky header
        setTimeout(() => {
          const el = document.getElementById(`row-${newId}`);
          if (el) el.scrollIntoView({behavior:'smooth', block:'nearest'});
        }, 50);
      }
      return newId;
    });
  }, []);

  const ALL_EFF=useMemo(()=>{
    let base=applyOverrides(ALL,overrides);
    if(Object.keys(localPatches).length)base=base.map(c=>{const p=localPatches[c.id];return p?{...c,...p}:c;});
    return base;
  },[overrides,localPatches]);

  const SECS=useMemo(()=>[...new Set(ALL_EFF.map(c=>c.secretaria))].sort(),[ALL_EFF]);
  const GRADS=useMemo(()=>[...new Set(ALL_EFF.map(c=>c.grado))].sort(),[ALL_EFF]);
  const deps=useMemo(()=>{
    const src=filterSec?ALL_EFF.filter(c=>c.secretaria===filterSec):ALL_EFF;
    return [...new Set(src.map(c=>c.dependencia).filter(Boolean))].sort();
  },[filterSec,ALL_EFF]);

  const filtered=useMemo(()=>ALL_EFF.filter(c=>{
    if(filterNivel&&c.nivel!==filterNivel)return false;
    if(filterGrado&&c.grado!==filterGrado)return false;
    if(filterSec&&c.secretaria!==filterSec)return false;
    if(filterDep&&c.dependencia!==filterDep)return false;
    if(filterOpec&&!c.opec)return false;
    if(opecSearch&&!c.opec.includes(opecSearch))return false;
    if(search){const s=search.toLowerCase();
      return c.secretaria.toLowerCase().includes(s)||c.dependencia.toLowerCase().includes(s)||
             c.proposito.toLowerCase().includes(s)||c.denominacion.toLowerCase().includes(s)||
             c.opec.includes(s)||c.area.toLowerCase().includes(s)||c.formacion.toLowerCase().includes(s)||
             c.elegibles?.some(e=>(e[1]+' '+e[2]).toLowerCase().includes(s));}
    return true;
  }),[ALL_EFF,filterNivel,filterGrado,filterSec,filterDep,filterOpec,opecSearch,search]);

  const nivelCounts=useMemo(()=>{const m:Record<string,number>={};NIVELES.forEach(n=>{m[n]=filtered.filter(c=>c.nivel===n).length;});return m;},[filtered]);
  const secChartData=useMemo(()=>SECS.map(s=>({name:abbr(s),full:s,n:ALL_EFF.filter(c=>c.secretaria===s&&(!filterNivel||c.nivel===filterNivel)).length})).filter(d=>d.n>0).sort((a,b)=>b.n-a.n).slice(0,12),[filterNivel,ALL_EFF,SECS]);
  const gradoChartData=useMemo(()=>GRADS.map(g=>({name:`G${g}`,grado:g,n:filtered.filter(c=>c.grado===g).length})).filter(d=>d.n>0),[filtered,GRADS]);
  const heatGrados=useMemo(()=>GRADS.filter(g=>ALL_EFF.some(c=>c.grado===g)),[GRADS,ALL_EFF]);
  const heatData=useMemo(()=>NIVELES.map(n=>({nivel:n,cells:heatGrados.map(g=>{const cnt=filtered.filter(c=>c.nivel===n&&c.grado===g).length;return{g,cnt};})})),[filtered,heatGrados]);

  const hasFilters=filterNivel||filterGrado||filterSec||filterDep||filterOpec||search||opecSearch;
  const clearAll=()=>{setFilterNivel('');setFilterGrado('');setFilterSec('');setFilterDep('');setFilterOpec(false);setSearch('');setOpecSearch('');};

  const PIN=import.meta.env.VITE_ADMIN_PIN||'1234';
  const tryAdmin=()=>{if(adminPin===PIN){setShowAdmin(true);setPinMode(false);setAdminPin('');}else alert('PIN incorrecto');};
  const handleAdminSaved=(id:number,field:string,val:string)=>setLocalPatches(p=>({...p,[id]:{...(p[id]||{}),[field]:val}}));

  const CTRL:React.CSSProperties={background:T.bg2,border:`1px solid ${T.line}`,color:T.txt,
    fontFamily:FF,fontSize:13.5,padding:'0 12px',height:40,outline:'none',borderRadius:8,
    transition:'border-color .15s'};

  return (
    <div style={{minHeight:'100vh',background:T.bg,color:T.txt,fontFamily:FF,
      fontSize:15,lineHeight:1.5,WebkitFontSmoothing:'antialiased',letterSpacing:'0.002em'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,500&display=swap');
        *{box-sizing:border-box;} body{margin:0;background:${T.bg};}
        html{scroll-padding-top:80px;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:${T.bg};}
        ::-webkit-scrollbar-thumb{background:${T.line};border-radius:3px;}
        select{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%237b8190' stroke-width='1.4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 11px center;padding-right:32px!important;cursor:pointer;}
        input::placeholder{color:${T.txt4};}
        input:focus,select:focus{border-color:${T.accentLine}!important;box-shadow:0 0 0 3px ${T.accentDim};}
        .rh:hover{background:${T.bg2}!important;cursor:pointer;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(4px);}to{opacity:1;transform:translateY(0);}}
        .card-in{animation:fadeUp .18s ease both;}
        @media(max-width:640px){.dt-only{display:none!important;}}

        /* ── CSS variables (para el sistema de tabla) ── */
        :root{
          --bg:${T.bg};--bg-2:${T.bg2};--surface:${T.surface};--surface-2:${T.surface2};
          --line:${T.line};--line-soft:${T.lineSoft};
          --txt:${T.txt};--txt-2:${T.txt2};--txt-3:${T.txt3};--txt-4:${T.txt4};
          --accent:${T.accent};--accent-2:${T.accent2};
          --accent-dim:${T.accentDim};--accent-line:${T.accentLine};
          --c-green:${T.cGreen};--c-teal:${T.cTeal};--c-rose:${T.cRose};
          --c-blue:${T.cBlue};--c-violet:${T.cViolet};--green:oklch(0.74 0.12 150);
        }

        /* ── TABLA ── */
        .table-card{background:var(--surface);border:1px solid var(--line-soft);border-radius:12px;overflow:clip;}
        .tbl{width:100%;border-collapse:collapse;table-layout:fixed;}
        .tbl thead th{position:sticky;top:59px;z-index:5;background:var(--bg-2);color:var(--txt-4);
          font-size:10.5px;letter-spacing:0.12em;text-transform:uppercase;font-weight:700;
          text-align:left;padding:12px 14px;border-bottom:1px solid var(--line);white-space:nowrap;
          box-shadow:0 1px 0 var(--line);border-right:1px solid var(--bg-2);overflow:hidden;}
        .tbl thead th:last-child{text-align:right;border-right:none;}
        .row-main{cursor:pointer;scroll-margin-top:108px;}
        .tbl tbody td{padding:13px 14px;border-bottom:1px solid var(--line-soft);vertical-align:top;
          font-size:13.5px;border-right:1px solid var(--surface);overflow:hidden;}
        .tbl tbody td:last-child{border-right:none;}
        .tbl tbody tr{transition:.12s;}
        .tbl tbody tr:hover:not(.row-detail){background:var(--bg-2);}
        .col-idx{color:var(--txt-4);font-weight:600;font-variant-numeric:tabular-nums;}
        .col-grade{color:var(--txt-2);font-weight:700;font-variant-numeric:tabular-nums;}
        .col-sec{color:var(--txt-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .col-dep{color:var(--txt-3);font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .col-denom .name{margin-bottom:3px;color:var(--txt);font-weight:600;
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .col-denom .purpose{color:var(--txt-3);font-size:12.5px;line-height:1.5;
          display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
        .col-opec{text-align:right;}
        .col-opec .opec{color:var(--accent-2);font-weight:700;font-size:12px;font-variant-numeric:tabular-nums;}
        .col-opec .sal{margin-top:2px;color:var(--txt-3);font-size:11.5px;font-variant-numeric:tabular-nums;}
        .col-opec .noopec{color:var(--txt-4);font-size:11.5px;}
        /* Badges nivel: fondo con transparencia, borde sin transparencia, leve redondeo */
        .lvl-badge{display:inline-flex;align-items:center;padding:4px 9px;border-radius:7px;
          font-size:10.5px;font-weight:700;letter-spacing:0.06em;border:1.5px solid;}
        .lvl-PRO{color:oklch(0.72 0.11 150);background:oklch(0.72 0.11 150/0.15);border-color:oklch(0.72 0.11 150);}
        .lvl-TEC{color:oklch(0.70 0.10 200);background:oklch(0.70 0.10 200/0.15);border-color:oklch(0.70 0.10 200);}
        .lvl-ASI{color:oklch(0.70 0.11 12);background:oklch(0.70 0.11 12/0.15);border-color:oklch(0.70 0.11 12);}
        .lvl-DIR{color:oklch(0.68 0.11 300);background:oklch(0.68 0.11 300/0.15);border-color:oklch(0.68 0.11 300);}
        .lvl-ASE{color:oklch(0.62 0.02 255);background:oklch(0.62 0.02 255/0.15);border-color:oklch(0.62 0.02 255);}
        .chev{display:inline-block;margin-left:8px;color:var(--txt-4);font-size:10px;
          transform:translateY(-1px);transition:transform .2s,color .15s;}
        .row-main:hover .chev{color:var(--accent-2);}
        .row-main.open{background:var(--bg-2);}
        .row-main.open .chev{transform:rotate(180deg) translateY(1px);color:var(--accent-2);}
        .row-main.open td{border-bottom-color:transparent;}
        .row-main.open .col-denom .name{color:var(--accent-2);}
        .row-detail{display:none;}
        .row-detail.open{display:table-row;}
        .row-detail>td{padding:0!important;background:var(--bg);border-bottom:1px solid var(--line-soft)!important;}
        .detail-inner{display:grid;grid-template-columns:1fr 280px;gap:28px;
          margin:0 16px 16px;padding:20px 22px;background:var(--bg-2);
          border:1px solid var(--line-soft);border-left:3px solid var(--accent);
          border-radius:0 12px 12px 12px;animation:slideDown .22s ease;}
        @keyframes slideDown{from{opacity:0;transform:translateY(-6px);}to{opacity:1;transform:translateY(0);}}
        .detail-block .dh{display:flex;align-items:center;gap:7px;margin-bottom:9px;
          font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:var(--txt-4);font-weight:700;}
        .detail-block .dh::before{content:"";width:14px;height:1px;background:var(--accent-line);}
        .detail-prose{max-width:64ch;color:var(--txt-2);font-size:13.5px;line-height:1.7;}
        .detail-meta{align-self:start;display:flex;flex-direction:column;background:var(--surface);
          border:1px solid var(--line-soft);border-radius:8px;overflow:hidden;}
        .dm-row{display:flex;align-items:center;justify-content:space-between;gap:14px;
          padding:9px 13px;border-bottom:1px solid var(--line-soft);font-size:12.5px;}
        .dm-row:last-child{border-bottom:none;}
        .dm-row .k{color:var(--txt-4);font-size:11px;text-transform:uppercase;letter-spacing:0.04em;font-weight:600;}
        .dm-row .v{color:var(--txt);font-weight:700;font-variant-numeric:tabular-nums;}
        .dm-row .v.accent{color:var(--accent-2);}
        .dm-row .v.green{color:oklch(0.74 0.12 150);}
        .eleg{grid-column:1/-1;margin-top:6px;padding-top:18px;border-top:1px solid var(--line-soft);}
        .eleg-h{display:flex;align-items:center;gap:10px;margin-bottom:12px;}
        .eleg-h .lead{margin-left:auto;color:var(--txt-3);font-size:12px;}
        .eleg-h .lead b{color:var(--txt-2);font-weight:700;}
        .count-chip{display:inline-flex;align-items:center;justify-content:center;
          min-width:22px;height:20px;padding:0 7px;border-radius:999px;
          background:var(--accent-dim);border:1px solid var(--accent-line);
          color:var(--accent-2);font-size:11px;font-weight:700;font-variant-numeric:tabular-nums;}
        .eleg-search{position:relative;margin-bottom:10px;}
        .eleg-search input{width:100%;height:38px;padding:0 12px 0 34px;
          background:var(--surface);border:1px solid var(--line);border-radius:8px;
          color:var(--txt);font-family:inherit;font-size:13px;outline:none;transition:.15s;}
        .eleg-search input:focus{border-color:var(--accent-line);box-shadow:0 0 0 3px var(--accent-dim);}
        .eleg-search .ico{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--txt-4);font-size:13px;}
        .eleg-list{display:flex;flex-direction:column;background:var(--surface);
          border:1px solid var(--line-soft);border-radius:8px;overflow:hidden;}
        .el-row{display:grid;grid-template-columns:28px 1fr auto 54px;align-items:center;gap:12px;
          padding:9px 14px;border-bottom:1px solid var(--line-soft);font-size:13px;transition:.12s;}
        .el-bar{display:none!important;}
        .el-row:last-child{border-bottom:none;}
        .el-row:hover{background:var(--bg-2);}
        .el-rank{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;
          border-radius:6px;background:var(--surface-2);color:var(--txt-3);
          font-size:11px;font-weight:700;font-variant-numeric:tabular-nums;}
        .el-name{color:var(--txt-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .el-bar{height:5px;background:oklch(0.66 0.115 250/0.12);border-radius:3px;overflow:hidden;}
        .el-bar i{display:block;height:100%;border-radius:3px;
          background:linear-gradient(90deg,oklch(0.70 0.10 200),oklch(0.68 0.11 250));}
        .el-score{text-align:right;color:var(--accent-2);font-weight:700;font-variant-numeric:tabular-nums;}
        .el-row.top{background:oklch(0.66 0.115 250/0.08);}
        .el-row.top .el-rank{background:var(--accent);color:oklch(0.18 0.02 255);}
        .el-row.top .el-name{color:var(--txt);font-weight:700;}
        .el-empty{padding:14px;text-align:center;color:var(--txt-4);font-size:12.5px;}
        @media(max-width:1080px){.detail-inner{grid-template-columns:1fr;}}
        @media(max-width:768px){.col-dep,.h-dep{display:none;}}
        @media(max-width:680px){.col-sec,.h-sec{display:none;}.el-row{grid-template-columns:24px 1fr 50px;}.el-bar{display:none;}}
      `}</style>

      {/* PIN modal */}
      {pinMode&&<div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,.6)',
        display:'flex',alignItems:'center',justifyContent:'center'}}
        onClick={e=>{if(e.target===e.currentTarget)setPinMode(false);}}>
        <div style={{background:T.surface,border:`1px solid ${T.line}`,borderRadius:12,
          padding:24,width:300,display:'flex',flexDirection:'column',gap:12}}>
          <p style={{fontSize:13,fontWeight:700,margin:0,color:T.txt,letterSpacing:'0.04em'}}>Acceso administrador</p>
          <input type="password" value={adminPin} onChange={e=>setAdminPin(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&tryAdmin()} placeholder="PIN" autoFocus
            style={{...CTRL,width:'100%'}}/>
          <div style={{display:'flex',gap:8}}>
            <button onClick={tryAdmin} style={{flex:1,padding:'9px',background:T.accent,
              color:'oklch(0.18 0.02 255)',border:'none',cursor:'pointer',fontFamily:FF,
              fontSize:12,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',borderRadius:8}}>
              Ingresar
            </button>
            <button onClick={()=>{setPinMode(false);setAdminPin('');}}
              style={{padding:'9px 14px',background:'transparent',border:`1px solid ${T.line}`,
                cursor:'pointer',fontFamily:FF,fontSize:12,color:T.txt3,borderRadius:8}}>✕</button>
          </div>
        </div>
      </div>}

      {showAdmin&&<Suspense fallback={null}>
        <AdminPanel onClose={()=>setShowAdmin(false)} onSave={handleAdminSaved}/>
      </Suspense>}

      {/* ══ TOPBAR ══ */}
      <header style={{position:'sticky',top:0,zIndex:40,
        background:`${T.bg}d4`,backdropFilter:'blur(14px) saturate(1.1)',
        borderBottom:`1px solid ${T.lineSoft}`}}>
        <div style={{maxWidth:1320,margin:'0 auto',padding:'0 28px',height:58,
          display:'flex',alignItems:'center',gap:30}}>
          {/* Brand */}
          <div style={{display:'flex',alignItems:'center',gap:10,fontWeight:700,
            fontSize:13.5,letterSpacing:'0.04em',color:T.txt}}>
            <span style={{width:26,height:26,borderRadius:7,
              background:`linear-gradient(150deg, ${T.accent2}, ${T.accent})`,
              display:'grid',placeItems:'center',color:'oklch(0.18 0.02 255)',
              fontWeight:800,fontSize:13,boxShadow:`0 2px 10px ${T.accentDim}`}}>E</span>
            <span>EMPLEOS <span style={{color:T.accent2}}>ENVIGADO</span></span>
          </div>
          {/* Nav tabs */}
          <nav style={{display:'flex',alignItems:'center',gap:4,height:'100%'}}>
            {(['catalogo','grafo'] as const).map(v=>(
              <button key={v} onClick={()=>setView(v)}
                style={{display:'flex',alignItems:'center',gap:8,height:'100%',padding:'0 14px',
                  background:'transparent',border:'none',
                  borderBottom:`2px solid ${view===v?T.accent:'transparent'}`,
                  color:view===v?T.txt:T.txt3,fontFamily:FF,fontSize:13,fontWeight:600,
                  letterSpacing:'0.06em',textTransform:'uppercase',cursor:'pointer',transition:'.18s'}}>
                <span style={{fontSize:14,opacity:.85}}>{v==='catalogo'?'▦':'⛬'}</span>
                {v==='catalogo'?'Catálogo':'Estructura'}
              </button>
            ))}
          </nav>
          <div style={{flex:1}}/>
          <button onClick={toggleBanner}
            title="Sobre esta herramienta"
            style={{display:'flex',alignItems:'center',justifyContent:'center',
              width:34,height:34,borderRadius:8,
              border:`1px solid ${bannerOpen?T.accentLine:T.line}`,
              background:bannerOpen?T.accentDim:T.surface,
              color:bannerOpen?T.accent2:T.txt3,fontSize:15,cursor:'pointer',
              transition:'.18s',fontWeight:700}}>
            ℹ
          </button>
          <button onClick={()=>setPinMode(true)}
            style={{display:'flex',alignItems:'center',gap:8,padding:'7px 14px',borderRadius:8,
              border:`1px solid ${T.line}`,background:T.surface,color:T.txt2,fontFamily:FF,
              fontSize:12,fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',
              cursor:'pointer',transition:'.18s'}}>
            🔒 Admin
          </button>
        </div>
      </header>

      {/* ══ ESTRUCTURA ══ */}
      {view==='grafo'&&(
        <div style={{maxWidth:1320,margin:'0 auto',padding:'0 28px 28px'}}>
          <GraphView/>
        </div>
      )}

      {/* ══ CATÁLOGO ══ */}
      {view==='catalogo'&&(
        <main style={{maxWidth:1320,margin:'0 auto',padding:'34px 28px 90px'}}>

          {/* Hero */}
          <section style={{marginBottom:26}}>
            <div style={{fontSize:11.5,letterSpacing:'0.16em',textTransform:'uppercase',
              color:T.txt4,fontWeight:600,marginBottom:14,display:'flex',alignItems:'center',
              gap:10,flexWrap:'wrap'}}>
              <span>Alcaldía de Envigado</span>
              <span style={{width:3,height:3,borderRadius:'50%',background:T.txt4,display:'inline-block'}}/>
              <span>Manual de Funciones</span>
              <span style={{width:3,height:3,borderRadius:'50%',background:T.txt4,display:'inline-block'}}/>
              <span>ANT3 · 2023</span>
            </div>
            <h1 style={{margin:0,fontSize:'clamp(30px,3.5vw,46px)',lineHeight:1.0,fontWeight:800,
              letterSpacing:'-0.02em',color:T.txt}}>
              Empleos <em style={{fontStyle:'normal',color:T.accent2,fontWeight:500}}>Alcaldía de Envigado</em>
              <span style={{display:'block',fontSize:'clamp(16px,1.8vw,22px)',fontWeight:400,
                color:T.txt3,letterSpacing:'0.04em',marginTop:4}}>ANT3 · 2023</span>
            </h1>
            <div style={{marginTop:12,color:T.txt3,fontSize:14.5,display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
              <span><strong style={{color:T.txt2,fontWeight:600}}>{ALL_EFF.length}</strong> registros</span>
              <span style={{width:3,height:3,borderRadius:'50%',background:T.txt4,display:'inline-block'}}/>
              <span><strong style={{color:T.txt2,fontWeight:600}}>5</strong> niveles</span>
              <span style={{width:3,height:3,borderRadius:'50%',background:T.txt4,display:'inline-block'}}/>
              <span><strong style={{color:T.txt2,fontWeight:600}}>{SECS.length}</strong> secretarías</span>
            </div>
          </section>

          {/* KPI cards */}
          <section style={{display:'grid',gridTemplateColumns:'repeat(5,1fr) 1.7fr',gap:12,margin:'24px 0 28px'}}>
            {NIVELES.map(n=>{
              const k=NIVEL_KPI[n]; const cnt=nivelCounts[n]||0; const active=filterNivel===n;
              return (
                <div key={n} onClick={()=>setFilterNivel(filterNivel===n?'':n)}
                  style={{position:'relative',background:active?`${k.c}18`:T.surface,
                    border:`1px solid ${active?k.c:T.lineSoft}`,borderRadius:12,
                    padding:'16px 18px 15px',overflow:'hidden',cursor:'pointer',
                    transition:'.18s',opacity:['Directivo','Asesor'].includes(n)&&!active?.75:1}}>
                  <div style={{position:'absolute',left:0,top:0,bottom:0,width:3,background:k.c}}/>
                  <div style={{fontSize:30,fontWeight:800,lineHeight:1,letterSpacing:'-0.02em',
                    fontVariantNumeric:'tabular-nums',color:k.c}}>{cnt}</div>
                  <div style={{marginTop:8,fontSize:11,letterSpacing:'0.14em',textTransform:'uppercase',
                    color:T.txt4,fontWeight:600}}>{k.short}</div>
                  <div style={{marginTop:2,fontSize:11,color:T.txt3}}>{n}</div>
                </div>
              );
            })}
            {/* Featured ANT3 */}
            <div onClick={()=>setFilterOpec(p=>!p)}
              style={{position:'relative',
                background:filterOpec?T.accentDim:`linear-gradient(135deg, oklch(0.30 0.05 255), oklch(0.235 0.02 255))`,
                border:`1px solid ${T.accentLine}`,borderRadius:12,padding:'16px 18px 15px',
                cursor:'pointer',display:'flex',alignItems:'center',gap:16,transition:'.18s'}}>
              <div style={{fontSize:38,fontWeight:800,lineHeight:1,letterSpacing:'-0.02em',
                fontVariantNumeric:'tabular-nums',color:T.accent2}}>
                {ALL_EFF.filter(c=>c.opec).length}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:3}}>
                <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'3px 9px',
                  borderRadius:999,background:T.accentDim,border:`1px solid ${T.accentLine}`,
                  color:T.accent2,fontSize:10.5,fontWeight:700,letterSpacing:'0.1em',
                  textTransform:'uppercase',alignSelf:'flex-start'}}>🏷 ANT3</span>
                <span style={{fontSize:11.5,color:T.txt2,letterSpacing:'0.04em'}}>empleos con OPEC vigente</span>
              </div>
            </div>
          </section>

          {/* Charts panels */}
          <section className="dt-only" style={{display:'grid',gridTemplateColumns:'300px 1fr 1fr',gap:14,marginBottom:26}}>
            {/* Donut */}
            <div style={{background:T.surface,border:`1px solid ${T.lineSoft}`,borderRadius:12,padding:'18px 18px 16px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <span style={{fontSize:11,letterSpacing:'0.16em',textTransform:'uppercase',color:T.txt3,fontWeight:700}}>Por grado</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={gradoChartData} dataKey="n" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={76} paddingAngle={2}
                    onClick={(d:any)=>setFilterGrado(filterGrado===d.grado?'':d.grado)}>
                    {gradoChartData.map((d,i)=>{
                      const palette=[T.cAmber,T.cGreen,T.cTeal,T.cBlue,T.cViolet,T.cRose,T.cSlate];
                      return <Cell key={d.name} fill={!filterGrado||filterGrado===d.grado?palette[i%palette.length]:T.lineSoft} stroke="none" cursor="pointer"/>;
                    })}
                  </Pie>
                  <Tooltip contentStyle={{background:T.surface2,border:`1px solid ${T.line}`,borderRadius:8,fontFamily:FF,fontSize:12,color:T.txt2}}/>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Heatmap */}
            <div style={{background:T.surface,border:`1px solid ${T.lineSoft}`,borderRadius:12,padding:'18px 18px 16px',overflow:'auto'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <span style={{fontSize:11,letterSpacing:'0.16em',textTransform:'uppercase',color:T.txt3,fontWeight:700}}>Nivel × Grado</span>
                <span style={{fontSize:11,color:T.txt4}}>clic en celda para filtrar</span>
              </div>
              <div style={{overflowX:'auto'}}>
                <div style={{display:'grid',gridTemplateColumns:`56px repeat(${heatGrados.length},1fr)`,gap:4,minWidth:300}}>
                  <div/>
                  {heatGrados.map(g=><div key={g} style={{fontSize:9.5,fontWeight:600,color:T.txt4,
                    textAlign:'center',fontVariantNumeric:'tabular-nums'}}>G{g}</div>)}
                  {heatData.map(({nivel,cells})=>{
                    const k=NIVEL_KPI[nivel];
                    return [
                      <div key={`l-${nivel}`} style={{fontSize:11,color:T.txt3,fontWeight:700,letterSpacing:'0.08em',
                        display:'flex',alignItems:'center'}}>{k.short}</div>,
                      ...cells.map(({g,cnt})=>{
                        const active=filterNivel===nivel&&filterGrado===g;
                        const a=cnt>0?0.10+0.62*(cnt/40):0;
                        return <div key={`${nivel}-${g}`}
                          onClick={()=>{if(cnt>0){setFilterNivel(filterNivel===nivel&&filterGrado===g?'':nivel);setFilterGrado(filterGrado===g&&filterNivel===nivel?'':g);}}}
                          style={{height:26,borderRadius:6,textAlign:'center',display:'flex',
                            alignItems:'center',justifyContent:'center',
                            background:cnt>0?`oklch(0.66 0.115 250 / ${a.toFixed(2)})`:`oklch(0.66 0.115 250 / 0.05)`,
                            border:`1px solid ${active?T.accent2:'transparent'}`,
                            cursor:cnt>0?'pointer':'default',transition:'.13s',fontSize:11.5,
                            fontWeight:700,fontVariantNumeric:'tabular-nums',
                            color:a>0.45?'oklch(0.20 0.02 255)':T.txt}}>
                          {cnt>0?cnt:''}
                        </div>;
                      })
                    ];
                  })}
                </div>
              </div>
            </div>

            {/* Bars */}
            <div style={{background:T.surface,border:`1px solid ${T.lineSoft}`,borderRadius:12,padding:'18px 18px 16px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <span style={{fontSize:11,letterSpacing:'0.16em',textTransform:'uppercase',color:T.txt3,fontWeight:700}}>Por secretaría</span>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:11}}>
                {secChartData.slice(0,8).map(({name,full,n})=>(
                  <div key={name} onClick={()=>{setFilterSec(filterSec===full?'':full);setFilterDep('');}}
                    style={{display:'grid',gridTemplateColumns:'110px 1fr 34px',alignItems:'center',gap:12,cursor:'pointer'}}>
                    <span style={{fontSize:12.5,color:T.txt2,textAlign:'right',overflow:'hidden',
                      textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{name}</span>
                    <div style={{height:18,background:`oklch(0.66 0.115 250 / 0.06)`,borderRadius:5,overflow:'hidden'}}>
                      <div style={{height:'100%',borderRadius:5,width:`${(n/(secChartData[0]?.n||1)*100).toFixed(1)}%`,
                        background:`linear-gradient(90deg, ${T.cTeal}, ${T.cGreen})`,transition:'.4s'}}/>
                    </div>
                    <span style={{fontSize:12,color:T.txt3,fontWeight:600,textAlign:'right',
                      fontVariantNumeric:'tabular-nums'}}>{n}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Filter bar */}
          <section style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',
            background:T.surface,border:`1px solid ${T.lineSoft}`,borderRadius:12,
            padding:12,marginBottom:14}}>
            <div style={{position:'relative',display:'flex',alignItems:'center',flex:'1 1 230px',minWidth:200}}>
              <span style={{position:'absolute',left:12,color:T.txt4,fontSize:13,pointerEvents:'none'}}>⌕</span>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Buscar cargo, área, concursante…"
                style={{...CTRL,width:'100%',paddingLeft:34}}/>
              {search&&<button onClick={()=>setSearch('')}
                style={{position:'absolute',right:9,background:'none',border:'none',cursor:'pointer',
                  color:T.txt4,fontSize:13}}>✕</button>}
            </div>
            <div style={{position:'relative',display:'flex',alignItems:'center'}}>
              <span style={{position:'absolute',left:12,color:T.txt4,fontSize:13,fontWeight:700,
                pointerEvents:'none',letterSpacing:'.02em'}}>№</span>
              <input value={opecSearch} onChange={e=>setOpecSearch(e.target.value)}
                placeholder="Nro. OPEC…"
                style={{...CTRL,width:150,paddingLeft:34,
                  borderColor:opecSearch?T.accentLine:undefined,color:opecSearch?T.accent2:T.txt}}/>
            </div>
            <select value={filterGrado} onChange={e=>setFilterGrado(e.target.value)}
              style={{...CTRL,width:160,color:filterGrado?T.accent2:T.txt3}}>
              <option value="">Todos los grados</option>
              {GRADS.map(g=><option key={g} value={g}>Grado {g}</option>)}
            </select>
            <select value={filterSec} onChange={e=>{setFilterSec(e.target.value);setFilterDep('');}}
              style={{...CTRL,flex:'1 1 160px',minWidth:140,color:filterSec?T.accent2:T.txt3}}>
              <option value="">Todas las secretarías</option>
              {SECS.map(s=><option key={s} value={s}>{abbr(s)}</option>)}
            </select>
            {deps.length>1&&<select value={filterDep} onChange={e=>setFilterDep(e.target.value)}
              style={{...CTRL,flex:'1 1 140px',minWidth:130,color:filterDep?T.accent2:T.txt3}}>
              <option value="">Todas las dependencias</option>
              {deps.map(d=><option key={d} value={d}>{d.length>44?d.slice(0,43)+'…':d}</option>)}
            </select>}
            {/* Toggle table/cards */}
            <div style={{display:'flex',background:T.bg2,border:`1px solid ${T.line}`,
              borderRadius:8,padding:3,gap:2}}>
              {(['table','cards'] as const).map(v=>(
                <button key={v} onClick={()=>setDisplayMode(v)}
                  style={{border:'none',background:displayMode===v?T.accent:'transparent',
                    color:displayMode===v?'oklch(0.18 0.02 255)':T.txt3,fontFamily:FF,
                    fontSize:12,fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',
                    padding:'6px 14px',borderRadius:6,cursor:'pointer',transition:'.15s'}}>
                  {v==='table'?'Tabla':'Tarjetas'}
                </button>
              ))}
            </div>
            {hasFilters&&<button onClick={clearAll}
              style={{display:'flex',alignItems:'center',gap:7,background:'transparent',
                border:'none',color:T.txt4,fontFamily:FF,fontSize:12,fontWeight:600,
                letterSpacing:'0.06em',textTransform:'uppercase',cursor:'pointer',padding:'8px 6px'}}>
              ✕ Limpiar
            </button>}
          </section>

          {/* Info banner — togglable via ℹ en el nav */}
          {bannerOpen&&(
            <section style={{display:'flex',gap:12,alignItems:'flex-start',background:T.bg2,
              border:`1px solid ${T.lineSoft}`,borderLeft:`3px solid ${T.accent}`,
              borderRadius:12,padding:'14px 44px 14px 16px',marginBottom:22,position:'relative'}}>
              <span style={{fontSize:18,flexShrink:0,marginTop:1,color:T.accent2,lineHeight:1}}>ℹ</span>
              <div style={{fontSize:12.5,color:T.txt3,lineHeight:1.65}}>
                Iniciativa ciudadana independiente. Organiza y hace consultable la información del{' '}
                <em style={{color:T.txt2}}>Manual Específico de Funciones y Competencias Laborales</em>{' '}
                de la Alcaldía de Envigado ({' '}
                <a href="https://bit.ly/4v5VOkQ" target="_blank" rel="noopener noreferrer"
                  style={{color:T.accent2,textDecoration:'none'}}>fuente oficial</a>
                ), cuya extensión dificulta la consulta directa, así como la información relativa a cada
                una de las OPEC tomada desde el{' '}
                <em style={{color:T.txt2}}>Banco Nacional de Lista de Elegibles</em>.{' '}
                Los datos fueron extraídos con apoyo de IA y pueden contener errores o no reflejar
                actualizaciones recientes. Reportar correcciones:{' '}
                <a href="mailto:wil.montoy@gmail.com" style={{color:T.accent2,textDecoration:'none'}}>
                  wil.montoy@gmail.com
                </a>{' '}
                · <strong style={{color:T.txt2,fontWeight:600}}>Wilber Montoya Atehortúa</strong>.
              </div>
              <button onClick={toggleBanner}
                style={{position:'absolute',top:12,right:14,background:'none',border:'none',
                  color:T.txt4,cursor:'pointer',fontSize:16,lineHeight:1,padding:4,
                  transition:'.15s'}} title="Cerrar">✕</button>
            </section>
          )}

          {/* Results meta */}
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12,
            fontSize:13.5,color:T.txt3,flexWrap:'wrap'}}>
            <strong style={{color:T.txt,fontWeight:700,fontSize:15,fontVariantNumeric:'tabular-nums'}}>
              {filtered.length}
            </strong>
            {' '}empleos{hasFilters?` de ${ALL_EFF.length}`:''}
            {filterOpec&&<span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'3px 10px',
              borderRadius:999,background:T.accentDim,border:`1px solid ${T.accentLine}`,
              color:T.accent2,fontSize:11,fontWeight:700,letterSpacing:'0.06em'}}>🏷 solo ANT3</span>}
          </div>

          {/* TABLE */}
          {filtered.length>0&&displayMode==='table'&&(
            <div className="table-card">
              <table className="tbl">
                <colgroup>
                  <col style={{width:36}}/>   {/* # */}
                  <col style={{width:74}}/>   {/* Nivel */}
                  <col style={{width:54}}/>   {/* Grado */}
                  <col style={{width:100}}/> {/* Secretaría */}
                  <col style={{width:130}}/> {/* Dependencia */}
                  <col/>                      {/* Denominación · Propósito — mayoría del espacio */}
                  <col style={{width:112}}/> {/* OPEC / Sal */}
                </colgroup>
                <thead>
                  <tr>
                    <th className="h-idx">#</th>
                    <th>Nivel</th>
                    <th>Grado</th>
                    <th className="h-sec">Secretaría</th>
                    <th className="h-dep">Dependencia</th>
                    <th>Denominación · Propósito</th>
                    <th style={{textAlign:'right'}}>OPEC / Sal.</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c,idx)=>{
                    const isExp = expanded===c.id;
                    const lvlShort = NIVEL_KPI[c.nivel]?.short?.toUpperCase() || 'N/A';
                    const lvlClass = `lvl-badge lvl-${lvlShort}`;
                    return (
                      <React.Fragment key={c.id}>
                        {/* ── Main row ── */}
                        <tr id={`row-${c.id}`}
                          className={`row-main${isExp?' open':''}`}
                          onClick={()=>toggle(c.id)}>
                          <td className="col-idx">{String(idx+1).padStart(2,'0')}</td>
                          <td><span className={lvlClass}>{lvlShort}</span></td>
                          <td className="col-grade">G{c.grado}</td>
                          <td className="col-sec">{abbr(c.secretaria)}</td>
                          <td className="col-dep">{c.dependencia}</td>
                          <td className="col-denom">
                            <div className="name">
                              {c.denominacion}
                              <span className="chev">▼</span>
                            </div>
                            <div className="purpose">{c.proposito}</div>
                          </td>
                          <td className="col-opec">
                            {c.opec ? <>
                              <div className="opec">OPEC {c.opec}</div>
                              {c.tipo&&<div style={{fontSize:10,fontWeight:700,letterSpacing:'0.06em',
                                marginTop:3,color:c.tipo==='A'?T.cViolet:T.cBlue}}>
                                {c.tipo==='A'?'↑ Ascenso':'Abierto'}
                              </div>}
                              {c.asignacion&&<div className="sal">{fmtSalary(c.asignacion)}</div>}
                            </> : <div className="noopec">— sin OPEC —</div>}
                          </td>
                        </tr>

                        {/* ── Detail row ── */}
                        <tr className={`row-detail${isExp?' open':''}`}>
                          <td colSpan={7}>
                            <div className="detail-inner">
                              {/* Prosa izquierda */}
                              <div className="detail-block">
                                <div className="dh">Propósito del cargo</div>
                                <div className="detail-prose">{c.proposito}</div>

                                {/* Botón Ver Resolución — antes de elegibles */}
                                {c.link_pdf&&(
                                  <a href={c.link_pdf} target="_blank" rel="noopener noreferrer"
                                    style={{display:'inline-flex',alignItems:'center',gap:7,
                                      marginTop:18,padding:'7px 16px',
                                      background:T.accent,color:'oklch(0.18 0.02 255)',
                                      textDecoration:'none',fontSize:12,fontWeight:700,
                                      letterSpacing:'0.08em',textTransform:'uppercase',borderRadius:8}}>
                                    📋 Ver resolución
                                  </a>
                                )}

                                {/* Elegibles */}
                                {c.elegibles?.length>0&&(
                                  <ElegiblesTable elegibles={c.elegibles}/>
                                )}
                              </div>

                              {/* Metadata derecha */}
                              <div className="detail-meta">
                                <div className="dm-row">
                                  <span className="k">Nivel</span>
                                  <span className="v"><span className={lvlClass}>{lvlShort}</span></span>
                                </div>
                                <div className="dm-row">
                                  <span className="k">Grado</span>
                                  <span className="v">G{c.grado}</span>
                                </div>
                                <div className="dm-row">
                                  <span className="k">Código</span>
                                  <span className="v">{c.codigo}</span>
                                </div>
                                <div className="dm-row">
                                  <span className="k">Secretaría</span>
                                  <span className="v" style={{fontSize:11,textAlign:'right',maxWidth:160}}>{abbr(c.secretaria)}</span>
                                </div>
                                <div className="dm-row">
                                  <span className="k">Dependencia</span>
                                  <span className="v" style={{fontSize:10,textAlign:'right',maxWidth:160,fontWeight:500}}>{c.dependencia}</span>
                                </div>
                                {c.opec&&<>
                                  <div className="dm-row">
                                    <span className="k">OPEC</span>
                                    <span className="v accent">{c.opec}</span>
                                  </div>
                                  {c.tipo&&<div className="dm-row">
                                    <span className="k">Concurso</span>
                                    <span className="v" style={{color:c.tipo==='A'?T.cViolet:T.cBlue,fontSize:11}}>
                                      {c.tipo==='A'?'↑ Ascenso':'Abierto'}
                                    </span>
                                  </div>}
                                  {c.asignacion&&<div className="dm-row">
                                    <span className="k">Asignación</span>
                                    <span className="v green">{fmtSalary(c.asignacion)}</span>
                                  </div>}
                                  {c.vacantes>0&&<div className="dm-row">
                                    <span className="k">Vacantes</span>
                                    <span className="v">{c.vacantes}</span>
                                  </div>}
                                  {c.cierre&&<div className="dm-row">
                                    <span className="k">Cierre</span>
                                    <span className="v" style={{fontSize:11}}>{c.cierre}</span>
                                  </div>}
                                </>}
                              </div>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* CARDS */}
          {filtered.length>0&&displayMode==='cards'&&(
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(330px,1fr))',gap:12}}>
              {filtered.map((c,idx)=>{
                const isExp=expanded===c.id;
                const lvlColor:Record<string,string>={
                  'Profesional':T.cGreen,'Técnico':T.cTeal,'Asistencial':T.cRose,'Directivo':T.cViolet,'Asesor':T.txt3};
                const lc=lvlColor[c.nivel]||T.txt3;
                const kp=NIVEL_KPI[c.nivel];
                return (
                  <div key={c.id} className="card-in"
                    style={{background:T.surface,border:`1px solid ${T.lineSoft}`,borderRadius:12,
                      transition:'.16s',animationDelay:`${Math.min(idx*10,400)}ms`}}>
                    <div style={{padding:16,cursor:'pointer'}} onClick={()=>toggle(c.id)}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                        <span style={{display:'inline-flex',alignItems:'center',padding:'3px 8px',
                          borderRadius:6,fontSize:10.5,fontWeight:700,letterSpacing:'0.06em',
                          color:lc,background:`${lc}18`,border:`1px solid ${lc}50`}}>
                          {kp.short.toUpperCase()}
                        </span>
                        <span style={{color:T.txt2,fontWeight:600,fontSize:12,fontVariantNumeric:'tabular-nums'}}>
                          {c.grado}
                        </span>
                        {c.opec&&<span style={{marginLeft:'auto',color:T.accent2,fontWeight:700,
                          fontSize:12,fontVariantNumeric:'tabular-nums'}}>OPEC {c.opec}</span>}
                      </div>
                      <div style={{color:T.txt,fontWeight:700,fontSize:15,marginBottom:4}}>{c.denominacion}</div>
                      <div style={{color:T.txt3,fontSize:12,marginBottom:10}}>{abbr(c.secretaria)} · {c.dependencia}</div>
                      <div style={{color:T.txt3,fontSize:12.5,lineHeight:1.55}}>{c.proposito}</div>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                        marginTop:12,paddingTop:11,borderTop:`1px solid ${T.lineSoft}`,
                        fontSize:12,color:T.txt3}}>
                        <span>{c.nivel}</span>
                        {c.asignacion&&<span style={{fontVariantNumeric:'tabular-nums'}}>{fmtSalary(c.asignacion)}</span>}
                      </div>
                    </div>
                    {isExp&&<DetailPanel c={c} onClose={()=>toggle(c.id)}/>}
                  </div>
                );
              })}
            </div>
          )}

          {filtered.length===0&&(
            <div style={{textAlign:'center',padding:'60px 20px',color:T.txt4}}>
              <p style={{fontSize:22,fontWeight:800,marginBottom:6,color:T.txt3}}>Sin resultados</p>
              <p style={{fontSize:13}}>Ajusta los filtros o la búsqueda</p>
            </div>
          )}

          {/* Footer */}
          <footer style={{marginTop:48,paddingTop:20,borderTop:`1px solid ${T.lineSoft}`,
            display:'flex',justifyContent:'space-between',alignItems:'center',
            flexWrap:'wrap',gap:8,fontSize:12,color:T.txt4}}>
            <span>Manual de Funciones · Alcaldía de Envigado · ANT3 2023</span>
            <span>
              Wilber Montoya ·{' '}
              <a href="mailto:wil.montoy@gmail.com" style={{color:T.accent2,textDecoration:'none'}}>
                wil.montoy@gmail.com
              </a>
            </span>
          </footer>
        </main>
      )}
    </div>
  );
}
