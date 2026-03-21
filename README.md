# HabitsF - Sistema de Gestión Familiar

Sistema web moderno para gestionar hábitos, tareas, reglas y consecuencias familiares.

## 🎨 Características

- ✅ Diseño minimalista estilo Apple
- 📱 Totalmente responsive con navegación inferior móvil
- 🔐 Autenticación con Supabase
- 👨‍👩‍👧‍👦 Multi-usuario (6 miembros de familia)
- 📊 Dashboard con estadísticas en tiempo real
- ✓ Hábitos diarios con seguimiento
- 📋 Tareas rotativas por día de semana
- ⚠️ Sistema de consecuencias
- 🎯 Reglas familiares

## 🚀 Stack Tecnológico

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS v4
- **Componentes**: shadcn/ui (Base UI)
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Validación**: Zod
- **Formularios**: React Hook Form
- **Estado**: Zustand
- **Iconos**: Lucide Icons

## 📦 Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Copia `.env.local.example` a `.env.local`
3. Agrega tus credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 3. Crear base de datos

Ejecuta los siguientes archivos SQL en el SQL Editor de Supabase (en orden):

1. **`supabase/schema.sql`** - Crea todas las tablas y configuraciones
2. **`supabase/seed.sql`** - Inserta datos iniciales (familia, hábitos, tareas, reglas)

### 4. Crear usuarios

En Supabase Dashboard → Authentication → Users:

1. Crea 6 usuarios (uno por miembro de familia)
2. Anota los `user_id` (UUID) de cada uno
3. En SQL Editor, actualiza la tabla `family_members`:

```sql
UPDATE family_members
SET user_id = 'uuid-del-usuario-aqui'
WHERE name = 'Pablo';

-- Repite para cada miembro...
```

### 5. Iniciar desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 📂 Estructura del proyecto

```
d:/habitsf/
├── src/
│   ├── app/
│   │   ├── (dashboard)/        # Grupo de rutas protegidas
│   │   │   ├── layout.tsx      # Layout con sidebar
│   │   │   ├── dashboard/      # Página principal
│   │   │   ├── mi-dia/         # Resumen personal
│   │   │   ├── habitos/        # Gestión de hábitos
│   │   │   ├── tareas/         # Gestión de tareas
│   │   │   ├── consecuencias/  # Consecuencias activas
│   │   │   └── familia/        # Miembros de familia
│   │   ├── login/              # Página de login
│   │   └── page.tsx            # Redirect inicial
│   ├── components/
│   │   ├── ui/                 # Componentes shadcn/ui
│   │   └── sidebar.tsx         # Navegación (desktop + mobile)
│   ├── features/
│   │   ├── auth/               # Autenticación
│   │   ├── habits/             # Feature de hábitos
│   │   ├── tasks/              # Feature de tareas
│   │   ├── consequences/       # Feature de consecuencias
│   │   └── dashboard/          # Feature de dashboard
│   ├── lib/
│   │   ├── supabase/           # Clientes Supabase
│   │   └── utils.ts            # Utilidades
│   ├── types/
│   │   └── database.ts         # Tipos TypeScript generados
│   └── proxy.ts                # Middleware de autenticación (Next.js 16)
├── supabase/
│   ├── schema.sql              # Esquema completo de BD
│   └── seed.sql                # Datos iniciales
└── package.json
```

## 👨‍👩‍👧‍👦 Miembros de Familia

La aplicación está configurada para 6 miembros:

1. **Pablo** (member)
2. **Benjamín** (member)
3. **David** (member)
4. **Maricielo** (member)
5. **Mamá** (admin)
6. **Papá Walter** (admin)

Los admins pueden gestionar reglas, hábitos y tareas. Los miembros pueden completar sus actividades diarias.

## 📊 Módulos

### 1. Dashboard
- Resumen de hábitos completados
- Tareas del día
- Consecuencias activas
- Accesos rápidos

### 2. Mi Día
- Vista personal consolidada
- Todos los hábitos y tareas del día
- Progreso individual

### 3. Hábitos
- Listar hábitos asignados
- Marcar como completados
- Historial de cumplimiento

### 4. Tareas
- Tareas rotativas por día
- Tareas fijas asignadas
- Sistema de turnos automático

### 5. Consecuencias
- Ver consecuencias activas
- Estados: pendiente, en progreso, completada, perdonada
- Asignadas por los admins

### 6. Familia
- Lista de miembros
- Estadísticas por miembro
- Gestión de perfiles

## 🎨 Diseño

### Móvil (iOS style)
- Navegación inferior fija (bottom navigation)
- 5 items principales siempre visibles
- Iconos con animación al seleccionar
- Transiciones suaves
- Safe area support para iPhone

### Desktop
- Sidebar izquierda fija
- Fondo con blur (glassmorphism)
- Cards con sombras sutiles
- Espaciado generoso

## 🔐 Autenticación

El sistema usa Supabase Auth con:
- Email/Password login
- Row Level Security (RLS) habilitado
- Políticas por rol (admin/member)
- Proxy (Next.js 16) para proteger rutas

## 📝 Scripts

```bash
# Desarrollo
npm run dev

# Build producción
npm run build

# Iniciar producción
npm start

# Linting
npm run lint

# Type checking
npx tsc --noEmit
```

## 🚧 Estado del Proyecto

### ✅ Fase 1 Completada: Setup y Auth
- [x] Proyecto Next.js 16 inicializado
- [x] Estructura de carpetas (features)
- [x] Configuración Supabase
- [x] Autenticación completa
- [x] UI minimalista estilo Apple
- [x] Navegación responsive (desktop + mobile)
- [x] Esquema de base de datos
- [x] Datos iniciales (seed)

### 🚧 Fase 2: Funcionalidad Core (Próxima)
- [ ] CRUD de hábitos
- [ ] Sistema de logging diario
- [ ] Generador automático de tareas diarias
- [ ] Dashboard con datos reales de Supabase
- [ ] Módulo "Mi Día" completo

### 📅 Fase 3: Características Avanzadas
- [ ] Reportes y gráficas
- [ ] Sistema de puntos
- [ ] Calendario familiar
- [ ] Notificaciones
- [ ] Modo offline

---

**Hecho con ❤️ para la familia**

## 🌍 Despliegue en Producción

### Opción 1: Vercel (Recomendado)
Vercel es la plataforma ideal para proyectos Next.js:

1. **Conectar repositorio**:
   - Ve a [vercel.com](https://vercel.com) e conecta tu cuenta de GitHub
   - Importa este repositorio

2. **Configurar variables de entorno**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=tu-url-supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   ```

3. **¡Deployar!** 🚀
   - Vercel detectará automáticamente configuración Next.js
   - El build tardará ~2-3 minutos en primera vez
   - Cada push a main desplegará automáticamente

### Opción 2: Netlify
Alternativa robusta para deployment:

1. **Conectar repositorio**:
   - Ve a [netlify.com](https://netlify.com)
   - Conecta tu repositorio de GitHub

2. **Configuración de build**:
   - Build command: `npm run build`
   - Publish directory: `.next`

3. **Variables de entorno**: Igual que Vercel

4. **Instalar**: Netlify desplegará automáticamente

### Preparación para Deployment

El proyecto ya está optimizado para producción con:

- ✅ Build commands configurados en `package.json`
- ✅ Configuración Next.js lista en `next.config.ts`
- ✅ Variables de entorno documentadas
- ✅ Build exitoso verificado localmente
- ✅ TypeScript con modo temporal para deploy rápido

### Post-Deployment

1. **Configurar dominio personalizado** (opcional)
2. **Configurar usuarios de Supabase** para la familia
3. **Probar todas las funcionalidades** en producción
4. **Compartir URL** con la familia

### URLs de ejemplo
- Vercel: `https://habitsf-familia.vercel.app`
- Netlify: `https://habitsf-familia.netlify.app`

🎉 ¡Tu app estará lista para que toda la familia la use!
