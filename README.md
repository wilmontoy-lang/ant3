# Empleos Alcaldía de Envigado · ANT3

Catálogo ciudadano de empleos públicos del Manual de Funciones y convocatoria ANT3 2023.

## Deploy en Vercel

### 1. Instalar dependencias localmente
```bash
npm install
npm run build    # verificar que compila sin errores
```

### 2. Deploy
```bash
npm install -g vercel
vercel --prod
```

### 3. Variable de entorno en Vercel
En Settings → Environment Variables añadir:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `VITE_ADMIN_PIN` | (tu PIN) | Acceso al panel de administración |

### Opcional: Supabase (funciones de cargo)
Para habilitar la pestaña **Funciones** en cada cargo, configura también:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Y ejecuta los seeds del directorio `/supabase_deploy/`.

## Stack
- React 18 + TypeScript + Vite
- Recharts (gráficas)
- Cytoscape.js (grafo de estructura)
- Public Sans (tipografía)
- Diseño: oklch dark color system
