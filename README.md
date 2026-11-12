# Travelers

Web app mínima de Travelers: el viajero deja sus datos, cuenta su presupuesto y recibe en segundos
3 destinos con su PHAMA (hospedaje, actividades, movilidad y alimentación), o un plan día por día si ya
tiene destino. Cada registro se guarda en Supabase con la autorización de datos del usuario.

- Español e inglés, modo claro y oscuro.
- Las sugerencias las genera Claude Haiku 5.5 (el modelo más económico de Anthropic) desde una función de Netlify.
- Respuestas idénticas se reutilizan durante 7 días para no pagar dos veces la misma búsqueda.

## Cómo está armado

| Carpeta | Qué hay |
| --- | --- |
| `src/` | La página (React + Vite + Tailwind). |
| `src/shared/` | Reglas compartidas entre la página y las funciones (campos, planes, formato de respuesta). |
| `netlify/functions/plan.mts` | `POST /api/plan`: guarda el registro, consulta la IA y devuelve el plan. |
| `netlify/functions/contact.mts` | `POST /api/contact`: marca que el usuario quiere que una agencia lo contacte. |
| `supabase/schema.sql` | Tablas `leads` y `plan_cache`. |

## Puesta en marcha

1. **Supabase**: abre tu proyecto > SQL Editor, pega el contenido de `supabase/schema.sql` y ejecútalo.
   Luego, en Project Settings > API, copia la *Project URL* y la clave *service_role*.
2. **Netlify**: Add new site > Import from GitHub > este repositorio. La configuración de build ya está en `netlify.toml`.
3. En Netlify > Site configuration > Environment variables, crea:
   - `ANTHROPIC_API_KEY`: la clave creada en console.anthropic.com.
   - `SUPABASE_URL`: la Project URL de Supabase.
   - `SUPABASE_SERVICE_ROLE_KEY`: la clave service_role de Supabase.

   Estas claves nunca llegan al navegador. No las subas al repositorio.
4. Vuelve a publicar el sitio (Deploys > Trigger deploy).

## Desarrollo local

```bash
npm install
npm run dev        # solo la página, en http://localhost:5173
npx netlify dev    # página + funciones, usando un archivo .env (ver .env.example)
npm run build      # revisa tipos y genera dist/
```

## Ver los registros

En Supabase > Table Editor > `leads`. Cada fila trae los datos del viajero, la versión del texto de
autorización que aceptó, el presupuesto (también convertido a COP), el plan generado y si pidió que una
agencia lo contacte (`wants_contact`). Desde ahí se puede exportar a CSV.

## Pendiente antes de vender datos

La política de privacidad (`src/components/Privacy.tsx`) es un borrador con campos entre corchetes
(responsable, NIT/CC, ciudad, correo). Complétalos y haz que un abogado revise el texto y la política, y
confirma si debes inscribir la base en el Registro Nacional de Bases de Datos de la SIC.
