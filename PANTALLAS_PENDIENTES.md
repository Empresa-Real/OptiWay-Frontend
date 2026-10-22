# Pantallas y Flujos Pendientes de Integración

Este documento detalla las pantallas y flujos identificados en el prototipo funcional del backend (`OptiWay-Backend/src/main/resources/static/web`) que aún no están implementados o requieren adaptación en el frontend React (`OptiWay-Frontend`).

---

## 1. Pantalla de Configuración / Restablecimiento de Contraseña (`SetPassword`) — [COMPLETADA]
- **Ruta de redirección:** `https://opti-way-frontend.vercel.app/#access_token=...`
- **Componente implementado:** [`src/pages/SetPassword.tsx`](./src/pages/SetPassword.tsx)
- **Flujo:**
  - Cuando un usuario abre la aplicación con un token de invitación o recuperación en el fragmento hash (`#access_token=...&type=invite` o `type=recovery`), o se dispara el evento `PASSWORD_RECOVERY` de Supabase, la app muestra la pantalla para ingresar y confirmar la nueva contraseña (`updatePassword`).
  - Al completar la contraseña con éxito, se redirige automáticamente al usuario a su panel principal según su rol.
- **Estado:** ✅ Implementada y conectada en `App.tsx`.

---

## 2. Vista y Navegación para el Rol `PLANIFICADOR`
- **Referencia backend:** `nav.js` (`case 'PLANIFICADOR': return '/main.html'`)
- **Flujo:**
  - En el backend, el planificador tiene permisos de consulta y navegación para:
    - Tiendas (`tiendas.html`)
    - Centros de Distribución (`centros-distribucion.html`)
    - Inventario de Tiendas (`inventario.html`)
    - Ingreso de Mercancía en CD (`ingreso-mercancia.html`)
- **Estado actual en frontend:** Bloqueado en `App.tsx` (`if (currentUser.role === "planner") return;`). No tiene pantalla de inicio ni permisos definidos en el `Sidebar`.

---

## 3. Integración de Servicios en Pantallas Existentes (Próximos Sprints)
Las siguientes pantallas ya tienen interfaz gráfica maquetada en React, pero actualmente leen y escriben sobre datos simulados (`seed.ts`):
- **Administración de Usuarios:** `src/pages/admin/UsersPanel.tsx` (Pendiente conectar a `GET /api/usuarios`, `POST /api/usuarios`, `DELETE /api/usuarios/{id}`, `PATCH /api/usuarios/{id}/rol`).
- **Gestión de Tiendas:** `src/pages/admin/StoresPanel.tsx` (Pendiente conectar a `GET /api/tiendas`, `POST /api/tiendas`).
- **Gestión de Centros de Distribución:** `src/pages/admin/DCsPanel.tsx` (Pendiente conectar a `GET /api/centros-distribucion`, `POST /api/centros-distribucion`).
- **Inventario:** `src/pages/shared/InventoryView.tsx` (Pendiente conectar a los endpoints de inventario de tiendas y CDs).
- **Registro de Venta:** `src/pages/store/RegisterSale.tsx` (Pendiente conectar a ventas).
- **Ingreso de Mercancía en CD:** `src/pages/dc/RegisterReceipt.tsx` (Pendiente conectar a `POST /api/ingresos-mercancia`).
