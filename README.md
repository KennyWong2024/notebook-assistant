# 📓 Congress Notebook

> **Versión Alpha** · Proyecto interno de Pequeño Mundo

Una aplicación web progresiva diseñada para los equipos de compras que asisten a ferias internacionales. Permite capturar prospectos de productos —tarjetas de presentación, fotos, precios y notas— directamente desde el piso de la feria usando el celular, y enriquecer esa información desde una laptop al final del día.

---

## ✨ ¿Qué hace esta app?

El flujo de trabajo está dividido en **dos momentos operativos clave**:

### 📱 Modo Feria — *"Estás caminando por los pasillos"*
Formulario mobile-first optimizado para captura ultrarrápida. Desde un solo formulario el comprador puede:

- Fotografiar la **tarjeta de presentación** del proveedor.
- Registrar el **nombre del proveedor** con autocompletado inteligente desde la base de datos.
- Agregar el **correo de contacto** del stand.
- Capturar **múltiples productos** del mismo proveedor con nombre, precio de referencia, moneda y nivel de prioridad (escala 1–4).
- Tomar **fotos de los productos** directamente con la cámara trasera del dispositivo.
- Añadir **fotos generales del stand** y notas libres de contexto.
- Guardar todo como **borrador** con un solo toque — listo para enriquecer después.

### 💻 Modo Hotel — *"Al final del día, con la laptop"*
Desde el dashboard el equipo puede revisar todos los borradores del día y completar los campos de mayor peso como departamento, categoría, Incoterm, shelf life y estado de muestra.

---

## 🗺️ Rutas de la Aplicación

| Ruta | Descripción | Acceso |
|---|---|---|
| `/` | Login — puerta de entrada al sistema | Público |
| `/dashboard` | Mis Pendientes — prospectos en estado borrador | Todos los usuarios autenticados |
| `/captura` | Formulario de captura express — Mobile First | Todos los usuarios autenticados |
| `/historico` | Archivo maestro con filtros de todos los productos | Todos los usuarios autenticados |
| `/ferias` | Catálogo y gestión de ferias y eventos | Todos los usuarios autenticados |
| `/perfil` | Perfil personal del usuario | Todos los usuarios autenticados |
| `/admin` | Gestión de accesos y usuarios del sistema | Solo `it` y `director` |

---

## 🏗️ Arquitectura Técnica

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js 16 (App Router)              │
│   ┌──────────────┐   ┌──────────────┐   ┌────────────────┐  │
│   │  Middleware  │   │  Server      │   │  Client        │  │
│   │  (Guardia)   │   │  Actions     │   │  Components    │  │
│   └──────┬───────┘   └──────┬───────┘   └───────┬────────┘  │
└──────────┼─────────────────┼───────────────────┼────────────┘
           │                 │                   │
           ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                        Supabase                             │
│   ┌──────────────┐   ┌──────────────┐   ┌────────────────┐  │
│   │     Auth     │   │  PostgreSQL  │   │    Storage     │  │
│   │  (Sesiones)  │   │  + RLS       │   │ (activos_feria)│  │
│   └──────────────┘   └──────────────┘   └────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Stack Tecnológico

| Categoría | Tecnología | Versión |
|---|---|---|
| Framework | Next.js | 16.2.3 |
| UI Library | React | 19.2.4 |
| Lenguaje | TypeScript | ^5 |
| Estilos | Tailwind CSS | ^4 |
| Backend / DB | Supabase | ^2.103 |
| Auth (SSR) | @supabase/ssr | ^0.10.2 |
| Íconos | Lucide React | ^1.8.0 |
| Compresión de imágenes | browser-image-compression | ^2.0.2 |

---

## 🔐 Capas de Seguridad

La aplicación implementa **tres capas independientes** de seguridad que se complementan entre sí:

### 1. Middleware de Next.js — *"El Guardia de la Puerta"*
`middleware.ts` intercepta **cada petición HTTP** antes de que llegue a cualquier página. Verifica la sesión de Supabase en el servidor. Si no hay sesión activa y la ruta solicitada no es `/`, redirige automáticamente al login. Esto cubre absolutamente todas las rutas del sistema, incluyendo accesos directos por URL.

### 2. Row Level Security (RLS) de PostgreSQL — *"El Guardia de los Datos"*
Las tablas críticas en el esquema `sourcing` tienen políticas RLS habilitadas directamente en Postgres. Esto significa que **aunque alguien obtuviera la API key anónima**, el motor de base de datos rechazaría a nivel SQL cualquier consulta que no cumpla las políticas definidas. Algunas políticas clave:

- Los compradores solo pueden ver los productos que ellos mismos crearon.
- El acceso a las asignaciones de ferias está restringido por rol (`it`, `director`) o por pertenencia directa.
- Las interacciones y activos respetan la jerarquía jerárquica de usuarios.

### 3. Control de Acceso por Rol (RBAC) en la UI — *"El Guardia de la Interfaz"*
El sistema maneja cuatro roles diferenciados:

| Rol | Permisos principales |
|---|---|
| `comprador` | Captura, consulta sus propios prospectos |
| `gerente` | Ve los prospectos de su equipo, puede aprobar / rechazar |
| `director` | Acceso total a reportería, ferias y gestión de accesos |
| `it` | Administración técnica del sistema y usuarios |

Los elementos sensibles de la interfaz (botón de "Gestión de Accesos", botón de "Nueva Feria", controles de activar/desactivar usuarios) se renderizan condicionalmente solo cuando `userRole` corresponde.

### 4. Administración con Privilegio Separado — *"La Llave Maestra"*
Las acciones que requieren el Supabase Service Role (como crear usuarios o banear cuentas) se ejecutan exclusivamente en **Server Actions** de Next.js (`/actions/usuarios.ts`). La `supabaseAdmin` key nunca sale al cliente, garantizando que el proceso de administración esté aislado del navegador.

---

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Pantalla de Login
│   │   ├── layout.tsx               # Root layout
│   │   ├── globals.css
│   │   └── (sistema)/               # Grupo de rutas protegidas
│   │       ├── layout.tsx           # Shell: sidebar + bottom nav + header
│   │       ├── dashboard/           # Bandeja de pendientes
│   │       ├── captura/             # Formulario mobile-first
│   │       ├── historico/           # Archivo maestro
│   │       ├── ferias/              # Gestión de eventos
│   │       ├── perfil/              # Perfil del usuario
│   │       └── admin/               # Administración de accesos
│   ├── components/
│   │   ├── captura/
│   │   │   ├── FormularioCaptura.tsx   # Orquestador principal del formulario
│   │   │   ├── CapturaTarjeta.tsx      # Widget de foto de tarjeta (aspect-video)
│   │   │   ├── CamaraWidget.tsx        # Botón de cámara con compresión
│   │   │   ├── GaleriaMiniaturas.tsx   # Grid dismissable de imágenes adjuntas
│   │   │   ├── TarjetaProducto.tsx     # Subformulario por cada producto
│   │   │   └── BuscadorProveedor.tsx   # Input con autocompletado debounced
│   │   ├── ferias/
│   │   │   └── ModalAsignacionFeria.tsx # Modal de gestión de equipo por feria
│   │   ├── buttons/
│   │   │   └── LogoutButton.tsx
│   │   └── ui/
│   │       └── ConfirmModal.tsx        # Modal de confirmación reutilizable (danger/success)
│   ├── actions/
│   │   └── usuarios.ts              # Server Actions (privilegio admin)
│   ├── lib/
│   │   ├── supabase.ts              # Cliente de Supabase (browser)
│   │   ├── supabase-admin.ts        # Cliente de Supabase (server, service role)
│   │   └── image-utils.ts           # Compresión y generación de código de trazabilidad
│   └── types/
│       └── database.ts              # Interfaces TypeScript del esquema de BD
└── middleware.ts                    # Guardia de sesión en Edge Runtime
```

---

## 🔄 Flujo de Datos — Captura de un Prospecto

```
Usuario en el piso de la feria
         │
         ▼
[1] FormularioCaptura.tsx carga las ferias
    ├── Consulta asignaciones_feria del usuario actual
    └── Establece feriaActiva automáticamente
         │
         ▼
[2] Usuario llena el formulario
    ├── BuscadorProveedor: debounce de 300ms → ilike query a Supabase
    ├── CapturaTarjeta: cámara nativa → browser-image-compression → preview
    ├── TarjetaProducto (N): nombre, precio, moneda, prioridad 1–4, fotos
    └── CamaraWidget: cada foto comprimida a ≤400KB antes de subir
         │
         ▼
[3] handleSave() — secuencia atómica
    ├── Auth: getUser() verifica sesión activa
    ├── Proveedor: maybeSingle() → busca o crea con email
    ├── Interacción: upsert en proveedor_feria_interacciones con notas
    ├── Tarjeta: upload a Storage → insert en activos_adjuntos (tipo 1)
    ├── Por cada producto con datos:
    │   ├── Insert en productos_prospecto (estado: borrador)
    │   └── Por cada foto: upload → insert activos_adjuntos (tipo 2)
    └── Fotos del stand: upload → activos_adjuntos (tipo 3)
         │
         ▼
[4] Redirección automática a /dashboard
```

---

## 🧩 Componentes Destacados

### `FormularioCaptura.tsx`
El componente más complejo de la app. Actúa como orquestador de todo el flujo de captura. Gestiona un array dinámico de productos (`ProductoTemp[]`), el estado de múltiples fotos por producto, la selección de feria cuando el usuario está asignado a más de un evento simultáneo, y la guarda progresiva que evita pérdida de datos si el usuario intenta salir accidentalmente.

### `CamaraWidget.tsx`
Widget mínimo y reutilizable que envuelve un `<input type="file" capture="environment">` con el atributo correcto para forzar la cámara trasera en dispositivos móviles. Antes de entregar el archivo al componente padre, lo pasa por `browser-image-compression` para reducirlo a ≤400KB / 1280px máx, cuidando el plan de datos del comprador en la feria.

### `CapturaTarjeta.tsx`
Variante del widget de cámara con proporción `aspect-video` y un overlay de hover que permite retomar la foto sin perder el preview anterior.

### `BuscadorProveedor.tsx`
Input con búsqueda diferida (debounce 300ms) que consulta la tabla `proveedores` usando `ilike`. Incluye manejo de `onBlur` con un `setTimeout` de 200ms para que el clic en una sugerencia procese correctamente antes de que el dropdown desaparezca.

### `ModalAsignacionFeria.tsx`
Modal de bottom-sheet (móvil) / centered (desktop) para que los directores e IT asignen o desasignen usuarios a una feria mediante toggles visuales, con feedback inmediato en la UI sin necesidad de recargar.

### `ConfirmModal.tsx`
Componente de confirmación reutilizable con dos variantes visuales (`danger` / `success`) que se usa antes de ejecutar acciones destructivas como desactivar el acceso de un usuario.

---

## 🌐 Despliegue

La aplicación está desplegada en **Vercel** con integración directa al repositorio. Cada push a la rama principal genera un nuevo deployment automáticamente.

La base de datos y autenticación corren en **Supabase Cloud**, con el esquema lógico `sourcing` que separa los datos del producto del esquema público de Postgres.

---

## 🚀 Estado del Proyecto — Alpha

Este proyecto está en **Fase Alpha**. Las funcionalidades activas son las correspondientes a las primeras fases del roadmap. Las siguientes características están planificadas para futuras iteraciones:

- [x] **Fase 1** — Autenticación segura con dominio corporativo y middleware
- [x] **Fase 2 (en curso)** — Formulario de captura mobile-first con cámara y almacenamiento en Supabase
- [x] **Fase 2 (en curso)** — Gestión de ferias y asignación de equipo por evento
- [x] **Fase 2 (en curso)** — Administración de usuarios con activación / desactivación segura
- [ ] **Fase 3** — Dashboard de enriquecimiento (modo hotel): categorías, Incoterm, shelf life, muestras
- [ ] **Fase 4** — Bandeja gerencial: aprobación, rechazo y reportería de productividad
- [ ] **Fase 5** — Modo sin conexión: cola de sincronización con IndexedDB para el Wi-Fi inestable de los recintos

---

## ⚙️ Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.local.example .env.local
# Completa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. Iniciar el servidor de desarrollo
npm run dev
```

La app estará disponible en `http://localhost:3000`.

---

## 📄 Licencia

Proyecto interno de uso privado — **Pequeño Mundo**. No está destinado para uso o distribución externa.
