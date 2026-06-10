import { useState, useMemo } from 'react';
import { ALL } from './data';
import type { Cargo } from './data';
import { abbr, fmtSalary, gradoColor, NIVEL_META } from './constants';
import { saveOverride, SUPA_OK } from './supabaseClient';

const M = {fontFamily:"'Space Mono',monospace"} as const;
const CTRL:React.CSSProperties = {padding:'6px 9px',border:'0.5px solid hsl(220,20%,75%)',
  background:'hsl(36,20%,98%)',fontFamily:"'Space Grotesk',sans-serif",
  fontSize:12,outline:'none',color:'hsl(220,35%,10%)'};

const FIELDS = [
  {key:'asignacion',label:'Asignación salarial',ph:'ej. 8777002'},
  {key:'vacantes',  label:'Vacantes',           ph:'ej. 1'},
  {key:'cierre',    label:'Cierre inscripciones',ph:'2024-11-20'},
  {key:'link_pdf',  label:'Link PDF Box',        ph:'https://app.box.com/...'},
  {key:'tipo',      label:'Tipo: O=Abierto A=Ascenso',ph:'O o A'},
];

function Row({c,onSave}:{c:Cargo;onSave:(f:string,v:string)=>void}) {
  const [open,setOpen] = useState(false);
  const [vals,setVals] = useState<Record<string,string>>({});
  const [saving,setSaving] = useState('');
  const [saved,setSaved] = useState<string[]>([]);
  const nm=NIVEL_META[c.nivel]; const gCol=gradoColor(c.grado);

  const handle = async (field:string) => {
    const val = vals[field]; if(val===undefined) return;
    setSaving(field);
    const err = await saveOverride(c.id,field,val);
    setSaving('');
    if(!err){ setSaved(p=>[...p,field]); onSave(field,val); }
    else alert('Error: '+(err as any).message);
  };

  return (
    <div style={{borderBottom:'0.5px solid hsl(220,20%,86%)',background:open?'hsl(36,15%,96%)':'white'}}>
      <div onClick={()=>setOpen(p=>!p)} style={{padding:'8px 12px',cursor:'pointer',
        display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
        <div style={{display:'flex',alignItems:'center',gap:7,minWidth:0}}>
          <div style={{width:24,height:24,background:gCol,display:'flex',flexDirection:'column',
            alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <span style={{...M,fontSize:5,color:'rgba(255,255,255,.6)',lineHeight:1}}>G</span>
            <span style={{fontFamily:"'DM Serif Display',serif",fontSize:11,color:'#fff',lineHeight:1}}>{c.grado}</span>
          </div>
          <span style={{...M,fontSize:9,padding:'1px 5px',background:nm?.bg,color:nm?.color,
            border:`0.5px solid ${nm?.border}`,flexShrink:0}}>{nm?.short}</span>
          {c.opec&&<span style={{...M,fontSize:9,color:'#0f3460',flexShrink:0}}>OPEC {c.opec}</span>}
          <span style={{fontSize:11,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.denominacion}</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
          <span style={{fontSize:10,color:'hsl(220,20%,55%)'}}>{abbr(c.secretaria).slice(0,22)}</span>
          <span style={{...M,fontSize:11,color:'hsl(220,20%,55%)'}}>{open?'▲':'▼'}</span>
        </div>
      </div>

      {open&&(
        <div style={{padding:'10px 14px 14px',display:'flex',flexDirection:'column',gap:9}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'3px 16px',fontSize:11,marginBottom:4}}>
            <span><span style={{color:'hsl(220,20%,50%)'}}>Dependencia: </span>{c.dependencia}</span>
            <span><span style={{color:'hsl(220,20%,50%)'}}>Salario actual: </span><strong>{fmtSalary(c.asignacion)||'—'}</strong></span>
            <span><span style={{color:'hsl(220,20%,50%)'}}>Tipo: </span><strong>{c.tipo==='A'?'↑ Ascenso':c.tipo==='O'?'Abierto':'—'}</strong></span>
            <span><span style={{color:'hsl(220,20%,50%)'}}>Vacantes: </span><strong>{c.vacantes||'—'}</strong></span>
          </div>
          {!SUPA_OK&&<div style={{padding:'6px 10px',background:'#7c4d1012',border:'0.5px solid #7c4d1040',fontSize:10,color:'#7c4d10'}}>
            ⚠ Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para persistir cambios.
          </div>}
          {FIELDS.map(({key,label,ph})=>(
            <div key={key} style={{display:'flex',alignItems:'center',gap:8}}>
              <label style={{...M,fontSize:8,color:'hsl(220,20%,50%)',textTransform:'uppercase',
                letterSpacing:'0.08em',width:190,flexShrink:0}}>{label}</label>
              <input defaultValue={String((c as any)[key]||'')} placeholder={ph}
                onChange={e=>setVals(p=>({...p,[key]:e.target.value}))}
                style={{...CTRL,flex:1}}/>
              <button onClick={()=>handle(key)} disabled={vals[key]===undefined||saving===key}
                style={{...M,fontSize:9,padding:'5px 12px',cursor:'pointer',border:'none',
                  textTransform:'uppercase',letterSpacing:'0.07em',
                  background:saved.includes(key)?'#1a5c35':vals[key]!==undefined?'hsl(220,55%,15%)':'hsl(220,20%,82%)',
                  color:vals[key]!==undefined||saved.includes(key)?'#f5f1e8':'hsl(220,20%,55%)'}}>
                {saving===key?'…':saved.includes(key)?'✓ OK':'Guardar'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPanel({onClose,onSave}:{onClose:()=>void;onSave:(id:number,f:string,v:string)=>void}) {
  const [search,setSearch]=useState('');
  const [fOpec,setFOpec]=useState(false);
  const filtered=useMemo(()=>ALL.filter(c=>{
    if(fOpec&&!c.opec) return false;
    if(!search) return true;
    const s=search.toLowerCase();
    return c.denominacion.toLowerCase().includes(s)||c.opec.includes(s)||
           c.secretaria.toLowerCase().includes(s)||c.dependencia.toLowerCase().includes(s);
  }).slice(0,100),[search,fOpec]);

  return (
    <div style={{position:'fixed',inset:0,zIndex:200,display:'flex',flexDirection:'column',
      background:'hsl(36,20%,98%)',fontFamily:"'Space Grotesk',system-ui,sans-serif"}}>
      <div style={{padding:'12px 16px',background:'hsl(220,55%,12%)',
        display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
        <div>
          <p style={{...M,fontSize:9,color:'hsl(32,60%,55%)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:2}}>Panel de Administración</p>
          <p style={{...M,fontSize:12,color:'#f5f1e8',margin:0,fontWeight:700}}>Quipu · ANT3 Envigado</p>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span style={{...M,fontSize:9,padding:'2px 8px',
            color:SUPA_OK?'#9FE1CB':'#f5c518',border:`0.5px solid ${SUPA_OK?'#1a5c35':'#7c4d10'}`}}>
            {SUPA_OK?'● Supabase OK':'● Sin Supabase'}
          </span>
          <button onClick={onClose} style={{...M,fontSize:10,padding:'5px 12px',
            background:'hsl(32,60%,42%)',border:'none',cursor:'pointer',
            color:'#f5f1e8',textTransform:'uppercase'}}>✕ Cerrar</button>
        </div>
      </div>
      <div style={{padding:'10px 16px',borderBottom:'0.5px solid hsl(220,20%,84%)',
        background:'hsl(36,20%,96%)',display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{position:'relative',flex:'1 1 240px'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Buscar cargo, OPEC, secretaría..."
            style={{...CTRL,width:'100%',paddingLeft:28}}/>
          <span style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',
            fontSize:14,color:'hsl(220,20%,55%)'}}>⌕</span>
        </div>
        <button onClick={()=>setFOpec(p=>!p)}
          style={{...M,fontSize:9,padding:'5px 12px',cursor:'pointer',
            textTransform:'uppercase',letterSpacing:'0.08em',
            background:fOpec?'#7c4d10':'transparent',
            color:fOpec?'#f5f1e8':'#7c4d10',border:'0.5px solid #7c4d10'}}>
          {fOpec?'✓ Solo ANT3':'Solo ANT3'}
        </button>
        <span style={{...M,fontSize:9,color:'hsl(220,20%,55%)'}}>{filtered.length} cargos</span>
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {filtered.map(c=><Row key={c.id} c={c} onSave={(f,v)=>onSave(c.id,f,v)}/>)}
      </div>
    </div>
  );
}
