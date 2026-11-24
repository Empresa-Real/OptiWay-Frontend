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
- **Estado actual en frontend:** Desbloqueado. El login y la restauración de sesión aceptan `PLANIFICADOR`; la pantalla inicial es `recommendations`. El menú del Sidebar muestra 3 ítems ("Patrones de demanda", "Rotación de productos", "Recomendaciones").
  - **Recomendaciones:** conectada al backend real (`GET/POST /api/recomendaciones-reposicion`, `PATCH .../aprobar`, `PATCH .../rechazar`) y a `GET /api/solicitudes-reposicion`.
  - **Patrones de demanda y Rotación de productos:** siguen pendientes de `GET /api/ventas/historial`; usan mocks con `VITE_USE_MOCKS === 'true'` o muestran el error de endpoint pendiente.

---

## 3. Integración de Servicios en Pantallas Existentes — [COMPLETADA]
Todas las pantallas listadas ya leen y escriben contra la API. El archivo
`src/data/seed.ts`, que contenía los datos simulados, **fue eliminado**.

| Pantalla | Endpoints conectados |
|---|---|
| `src/pages/admin/UsersPanel.tsx` | `GET/POST /api/usuarios`, `PATCH /api/usuarios/{id}/rol`, `DELETE /api/usuarios/{id}`, `GET /api/tiendas`, `GET /api/centros-distribucion` |
| `src/pages/admin/StoresPanel.tsx` | `GET/POST /api/tiendas`, `PUT /api/tiendas/{id}/encargado`, `PATCH /api/tiendas/{id}/estado` |
| `src/pages/admin/DCsPanel.tsx` | `GET/POST /api/centros-distribucion`, `PUT /api/centros-distribucion/{id}/encargado`, `PATCH /api/centros-distribucion/{id}/estado` |
| `src/pages/admin/ProductsPanel.tsx` | `GET/POST /api/productos`, `PUT /api/productos/{id}`, `PUT /api/productos/{id}/estado` |
| `src/pages/shared/InventoryView.tsx` | `GET /api/inventario`, `GET /api/inventario/centro-distribucion`, `POST /api/inventario/ajustes` |
| `src/pages/store/RegisterSale.tsx` | `POST /api/tiendas/{id}/ventas` |
| `src/pages/dc/RegisterReceipt.tsx` | `POST /api/centros-distribucion/{id}/ingresos` |
| `src/pages/store/SolicitarReposicion.tsx` | `POST /api/tiendas/{id}/solicitudes-reposicion` |
| `src/pages/planner/Recomendaciones.tsx` | `GET/POST /api/recomendaciones-reposicion`, `PATCH /api/recomendaciones-reposicion/{id}/aprobar`, `PATCH /api/recomendaciones-reposicion/{id}/rechazar`, `GET /api/solicitudes-reposicion` |

Los catálogos (productos, tiendas, centros de distribución) se cargan una sola vez en
`App.tsx` y se pasan como props. Las pantallas de inventario, solicitudes y recomendaciones
consultan sus endpoints operativos.

---

## 4. Limitaciones conocidas de Sprint 3

- **Solicitudes de tienda:** no existe `GET /api/tiendas/{id}/solicitudes-reposicion`; la pantalla de tienda solo lista las solicitudes creadas en la sesión. El Planificador sí consulta todas con `GET /api/solicitudes-reposicion`.
- **Solicitud no cambia de estado:** al crear una recomendación desde una solicitud, el backend no expone una transición para marcarla como atendida. El Planificador la sigue viendo como pendiente.
- **Órdenes del Planificador:** no existe `GET /api/ordenes`; el panel muestra las recomendaciones aprobadas como órdenes, sin el identificador real de la orden.
- **Órdenes entrantes del CD:** no existe `GET /api/centros-distribucion/{id}/ordenes`; la pantalla `OrdenesEntrantes.tsx` sigue pendiente.
- **Historial de recomendaciones:** no existe un endpoint dedicado; se construye con los campos de auditoría de `GET /api/recomendaciones-reposicion`.
- **Historial de ajustes:** no existe `GET /api/inventario/ajustes`; el modal muestra solo los ajustes de la sesión tomados de la respuesta del `POST`.
- **Identificador de usuario:** `User.id` del frontend es el id numérico local; `creadoPor` y `resueltoPorUsuarioId` son UUID de Supabase. La UI compara con `getCurrentAuthUserId()` para mostrar el nombre del usuario actual o `Usuario <uuid8>`.

