# Configuración de Supabase - HabitsF

Guía paso a paso para configurar Supabase para HabitsF.

## 1. Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Click en "New Project"
3. Completa los datos:
   - **Name**: `habitsf` o `habits-family`
   - **Database Password**: Guarda esta contraseña en lugar seguro
   - **Region**: Elige la más cercana (ej: South America)
4. Click en "Create new project"
5. Espera 2-3 minutos mientras se crea

## 2. Obtener Credenciales

1. En el proyecto creado, ve a **Settings** → **API**
2. Copia y guarda:
   - **Project URL** (ej: `https://xxxxx.supabase.co`)
   - **anon/public key** (la API key pública)

## 3. Configurar Variables de Entorno

1. En el proyecto local, copia el archivo de ejemplo:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edita `.env.local` y agrega tus credenciales:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
   ```

## 4. Ejecutar SQL Schema

1. En Supabase Dashboard, ve a **SQL Editor**
2. Click en "+ New query"
3. Copia y pega el contenido completo de `supabase/schema.sql`
4. Click en "Run" (▶️)
5. Verifica que diga "Success. No rows returned"

Esto creará:
- ✅ 9 tablas principales
- ✅ Enums personalizados
- ✅ Índices para performance
- ✅ Triggers para updated_at
- ✅ Row Level Security (RLS)
- ✅ Políticas de acceso

## 5. Insertar Datos Iniciales

1. En SQL Editor, abre "+ New query"
2. Copia y pega el contenido completo de `supabase/seed.sql`
3. Click en "Run" (▶️)
4. Esto insertará:
   - ✅ 6 miembros de familia
   - ✅ 8 hábitos diarios
   - ✅ 5 tareas del hogar
   - ✅ Calendarios rotativos (lunes-domingo)
   - ✅ 17 reglas familiares

## 6. Crear Usuarios en Auth

1. Ve a **Authentication** → **Users**
2. Click en "Add user" → "Create new user"
3. Crea un usuario para cada miembro:

### Usuario 1: Pablo
- Email: `pablo@habitsf.local` (o email real)
- Password: `password123` (o una segura)
- Click "Create user"
- **Copia el UUID** que aparece (ej: `a1b2c3d4-...`)

### Usuario 2: Benjamín
- Email: `benjamin@habitsf.local`
- Password: `password123`
- **Copia el UUID**

### Usuario 3: David
- Email: `david@habitsf.local`
- Password: `password123`
- **Copia el UUID**

### Usuario 4: Maricielo
- Email: `maricielo@habitsf.local`
- Password: `password123`
- **Copia el UUID**

### Usuario 5: Mamá (Admin)
- Email: `mama@habitsf.local`
- Password: `password123`
- **Copia el UUID**

### Usuario 6: Papá Walter (Admin)
- Email: `walter@habitsf.local`
- Password: `password123`
- **Copia el UUID**

## 7. Vincular Usuarios con Family Members

1. Ve a **SQL Editor** → "+ New query"
2. Ejecuta estas queries reemplazando los UUIDs con los que copiaste:

```sql
-- Pablo
UPDATE family_members
SET user_id = 'uuid-de-pablo-aqui'
WHERE name = 'Pablo';

-- Benjamín
UPDATE family_members
SET user_id = 'uuid-de-benjamin-aqui'
WHERE name = 'Benjamin';

-- David
UPDATE family_members
SET user_id = 'uuid-de-david-aqui'
WHERE name = 'David';

-- Maricielo
UPDATE family_members
SET user_id = 'uuid-de-maricielo-aqui'
WHERE name = 'Maricielo';

-- Mamá
UPDATE family_members
SET user_id = 'uuid-de-mama-aqui'
WHERE name = 'Mama';

-- Papá Walter
UPDATE family_members
SET user_id = 'uuid-de-walter-aqui'
WHERE name = 'Walter';
```

3. Click "Run"

## 8. Verificar Configuración

1. Ve a **Table Editor** → `family_members`
2. Deberías ver 6 filas, cada una con:
   - ✅ `user_id` no nulo (UUID vinculado)
   - ✅ `name` correcto
   - ✅ `role` (admin o member)

3. Verifica otras tablas:
   - `habits` → 8 hábitos
   - `tasks` → 5 tareas
   - `rules` → 17 reglas
   - `rotative_schedules` → ~35 asignaciones

## 9. Probar Login

1. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Abre [http://localhost:3000](http://localhost:3000)

3. Prueba login con cualquier usuario creado:
   - Email: `pablo@habitsf.local`
   - Password: `password123`

4. Si funciona, deberías ver el dashboard con tu nombre

## 10. Verificar Row Level Security (RLS)

Para confirmar que RLS está funcionando:

1. Ve a **Authentication** → **Policies**
2. Revisa cada tabla:
   - `family_members` → Debe tener políticas
   - `habits` → Debe tener políticas
   - `habit_logs` → Debe tener políticas
   - etc.

## ✅ Checklist de Verificación

Antes de continuar, confirma que:

- [ ] Proyecto Supabase creado
- [ ] Variables de entorno configuradas en `.env.local`
- [ ] Schema ejecutado sin errores
- [ ] Seed ejecutado correctamente
- [ ] 6 usuarios creados en Auth
- [ ] 6 family_members vinculados con user_id
- [ ] Login funciona correctamente
- [ ] Dashboard muestra el nombre del usuario

## 🆘 Troubleshooting

### Error: "Invalid credentials"
- Verifica que el email/password sean correctos
- Confirma que el usuario existe en Authentication → Users

### Error: "No member found"
- Verifica que `family_members.user_id` esté vinculado
- Ejecuta: `SELECT * FROM family_members WHERE user_id IS NULL;`
- Debe retornar 0 filas

### Error: "Permission denied for table"
- Verifica que RLS esté habilitado
- Revisa las políticas en cada tabla
- Re-ejecuta `supabase/schema.sql` si es necesario

### No aparecen datos en el dashboard
- Verifica que el seed se ejecutó correctamente
- Ejecuta: `SELECT COUNT(*) FROM habits;` → Debe retornar 8
- Ejecuta: `SELECT COUNT(*) FROM tasks;` → Debe retornar 5

## 📚 Recursos

- [Documentación Supabase](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

---

¿Listo? Continúa con el desarrollo en `README.md`
