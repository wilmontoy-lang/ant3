export const NIVEL_META: Record<string,{short:string;color:string;bg:string;border:string}> = {
  'Profesional': {short:'PRO',color:'#1a5c35',bg:'#1a5c3518',border:'#1a5c3555'},
  'Técnico':     {short:'TEC',color:'#1a3a6b',bg:'#1a3a6b18',border:'#1a3a6b55'},
  'Asistencial': {short:'ASI',color:'#5c1a5c',bg:'#5c1a5c18',border:'#5c1a5c55'},
  'Directivo':   {short:'DIR',color:'#0f3460',bg:'#0f346018',border:'#0f346055'},
  'Asesor':      {short:'ASE',color:'#7c4d10',bg:'#7c4d1018',border:'#7c4d1055'},
};
export const GRADO_COLORS: Record<string,string> = {
  '01':'#c17f24','02':'#a0692a','03':'#7d5230','04':'#2a6b3c',
  '05':'#1e5c57','06':'#2a4a6b','07':'#4a2a6b','08':'#6b2a3a',
  '09':'#5a4018','10':'#3a2a18','11':'#2a3a18','G1':'#c17f24',
  'G4':'#2a6b3c','G7':'#4a2a6b',
};
const ABBR: Record<string,string> = {
  'Depto. Administrativo de Planeación':'Planeación',
  'Secretaría de Bienestar Social':'Bienestar Social',
  'Secretaría de Cultura':'Cultura',
  'Secretaría de Desarrollo Económico':'Desarro. Económico',
  'Secretaría de Educación y Cultura':'Educación y Cultura',
  'Secretaría de Hacienda':'Hacienda',
  'Secretaría de la Mujer':'Sec. de la Mujer',
  'Secretaría de Medio Ambiente y Desarrollo Agropecuario':'Medio Ambiente',
  'Secretaría de Movilidad':'Movilidad',
  'Secretaría de Obras Públicas':'Obras Públicas',
  'Secretaría de Salud':'Salud',
  'Secretaría de Seguridad y Convivencia':'Seguridad',
  'Secretaría General':'Sec. General',
  'Despacho de la Alcaldía':'Alcaldía',
  'Tesorería':'Tesorería',
  'Oficina Control Disciplinario Interno':'Ctrl. Disciplinario',
  'Oficina Gestión del Riesgo':'Gestión del Riesgo',
};
export const abbr = (s:string) => ABBR[s] ?? s;
export const fmtSalary = (s:string) => {
  if(!s) return '';
  const n = parseInt(s);
  return isNaN(n) ? s : '$'+n.toLocaleString('es-CO');
};
export const gradoColor = (g:string) => GRADO_COLORS[g] ?? GRADO_COLORS[g?.padStart(2,'0')] ?? '#5a4018';
