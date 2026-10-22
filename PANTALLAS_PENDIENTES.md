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

## 3. Integración de Servicios en Pantallas Existentes — [COMPLETADA]
Todas las pantallas listadas ya leen y escriben contra la API. El archivo
`src/data/seed.ts`, que contenía los datos simulados, **fue eliminado**.

| Pantalla | Endpoints conectados |
|---|---|
| `src/pages/admin/UsersPanel.tsx` | `GET/POST /api/usuarios`, `PATCH /api/usuarios/{id}/rol`, `DELETE /api/usuarios/{id}`, `GET /api/tiendas`, `GET /api/centros-distribucion` |
| `src/pages/admin/StoresPanel.tsx` | `GET/POST /api/tiendas`, `PUT /api/tiendas/{id}/encargado` |
| `src/pages/admin/DCsPanel.tsx` | `GET/POST /api/centros-distribucion`, `PUT /api/centros-distribucion/{id}/encargado` |
| `src/pages/admin/ProductsPanel.tsx` | `GET/POST /api/productos`, `PUT /api/productos/{id}`, `PUT /api/productos/{id}/estado` |
| `src/pages/shared/InventoryView.tsx` | `GET /api/inventario`, `GET /api/inventario/centro-distribucion` |
| `src/pages/store/RegisterSale.tsx` | `POST /api/tiendas/{id}/ventas` |
| `src/pages/dc/RegisterReceipt.tsx` | `POST /api/centros-distribucion/{id}/ingresos` |

Los catálogos (productos, tiendas, centros de distribución) se cargan una sola vez en
`App.tsx` y se pasan como props. Ninguna pantalla hace `fetch` propio.

