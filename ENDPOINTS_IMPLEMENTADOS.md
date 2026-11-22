# Estado de Integración de Endpoints (Backend Swagger & OpenAPI)

Este documento registra el avance de conexión entre el frontend (**OptiWay-Frontend**) y el backend en Render (**OptiWay-Backend** / `https://optiway-backend.onrender.com`).

---

## 1. Autenticación y Sesión
- [x] **`POST /auth/v1/token?grant_type=password` (Supabase Auth)**
  - *Función frontend:* `login(email, password)` en [`src/services/auth.ts`](./src/services/auth.ts)
  - *Vista:* [`src/pages/Login.tsx`](./src/pages/Login.tsx)
- [x] **`PUT /auth/v1/user` (Supabase Auth)**
  - *Función frontend:* `updatePassword(password)` en [`src/services/auth.ts`](./src/services/auth.ts)
  - *Vista:* [`src/pages/SetPassword.tsx`](./src/pages/SetPassword.tsx) (activada por hash de invitación en la raíz)
- [x] **`GET /api/usuarios/me` (Backend Spring Boot)**
  - *Función frontend:* `fetchUsuarioActual(token)` y `getCurrentUser()` en [`src/services/auth.ts`](./src/services/auth.ts)
  - *Uso:* Carga y mapea el rol real (`ADMINISTRADOR`, `ENCARGADO_TIENDA`, `ENCARGADO_CD`, `PLANIFICADOR`) al iniciar sesión o recargar página.
- [x] **UUID de Supabase del usuario actual**
  - *Función frontend:* `getCurrentAuthUserId()` en [`src/services/auth.ts`](./src/services/auth.ts)
  - *Uso:* Comparar con `creadoPor` / `resueltoPorUsuarioId` de las recomendaciones. **`User.id` es el id numérico local del backend; no es el UUID de Supabase.**

---

## 2. Módulo de Usuarios (`usuario-controller`)
- [x] **`GET /api/usuarios`**
  - *Función frontend:* `getUsuarios()` en [`src/services/usuarios.ts`](./src/services/usuarios.ts)
  - *Vista:* [`src/pages/admin/UsersPanel.tsx`](./src/pages/admin/UsersPanel.tsx) (Tabla de usuarios conectada al servidor con botón Actualizar)
- [x] **`POST /api/usuarios`**
  - *Función frontend:* `createUsuario({ nombre, email, role })` en [`src/services/usuarios.ts`](./src/services/usuarios.ts)
  - *Vista:* Modal de crear usuario en [`src/pages/admin/UsersPanel.tsx`](./src/pages/admin/UsersPanel.tsx) (Captura y visualiza el error JSON del servidor en caso de duplicidad o validación)
- [x] **`GET /api/usuarios/{id}`**
  - *Función frontend:* `getUsuarioById(id)` en [`src/services/usuarios.ts`](./src/services/usuarios.ts)
- [x] **`PATCH /api/usuarios/{id}/rol`**
  - *Función frontend:* `updateRolUsuario(id, role)` en [`src/services/usuarios.ts`](./src/services/usuarios.ts)
  - *Vista:* Modal de cambio de rol en [`src/pages/admin/UsersPanel.tsx`](./src/pages/admin/UsersPanel.tsx) con control de errores JSON
- [x] **`DELETE /api/usuarios/{id}`**
  - *Función frontend:* `deleteUsuario(id)` en [`src/services/usuarios.ts`](./src/services/usuarios.ts)
  - *Vista:* Confirmación de eliminación de usuario en [`src/pages/admin/UsersPanel.tsx`](./src/pages/admin/UsersPanel.tsx) con control de errores JSON

---

## 3. Módulo de Tiendas (`tienda-controller`)
- [x] **`GET /api/tiendas`**
  - *Función frontend:* `getTiendas()` en [`src/services/tiendas.ts`](./src/services/tiendas.ts)
  - *Vista:* [`src/pages/admin/StoresPanel.tsx`](./src/pages/admin/StoresPanel.tsx) (Listado en tiempo real con botón Actualizar)
- [x] **`POST /api/tiendas`**
  - *Función frontend:* `createTienda({ name, address, city })` en [`src/services/tiendas.ts`](./src/services/tiendas.ts)
  - *Vista:* Modal de crear tienda en [`src/pages/admin/StoresPanel.tsx`](./src/pages/admin/StoresPanel.tsx)
- [x] **`PUT /api/tiendas/{id}/encargado`**
  - *Función frontend:* `asignarEncargadoTienda(id, encargadoId)` en [`src/services/tiendas.ts`](./src/services/tiendas.ts)

---

## 4. Módulo de Centros de Distribución (`centro-distribucion-controller`)
- [x] **`GET /api/centros-distribucion`**
  - *Función frontend:* `getCentrosDistribucion()` en [`src/services/centrosDistribucion.ts`](./src/services/centrosDistribucion.ts)
  - *Vista:* [`src/pages/admin/DCsPanel.tsx`](./src/pages/admin/DCsPanel.tsx)
- [x] **`POST /api/centros-distribucion`**
  - *Función frontend:* `createCentroDistribucion({ name, address, capacity, coverage })` en [`src/services/centrosDistribucion.ts`](./src/services/centrosDistribucion.ts)
  - *Vista:* Modal de crear CD en [`src/pages/admin/DCsPanel.tsx`](./src/pages/admin/DCsPanel.tsx)
- [x] **`PUT /api/centros-distribucion/{id}/encargado`**
  - *Función frontend:* `updateEncargadoCentroDistribucion(id, encargadoId)` en [`src/services/centrosDistribucion.ts`](./src/services/centrosDistribucion.ts)

---

## 5. Catálogo de Productos (`producto-controller`)
- [x] `GET /api/productos`
  - *Función frontend:* `getProductos()` en [`src/services/productos.ts`](./src/services/productos.ts)
  - *Vista:* [`src/pages/admin/ProductsPanel.tsx`](./src/pages/admin/ProductsPanel.tsx) (Listado conectado al backend con botón Actualizar)
- [x] `POST /api/productos`
  - *Función frontend:* `createProducto({ identificador, nombre, categoria, price, unit })` en [`src/services/productos.ts`](./src/services/productos.ts)
  - *Vista:* Modal de crear producto en [`src/pages/admin/ProductsPanel.tsx`](./src/pages/admin/ProductsPanel.tsx) con control de errores JSON
- [x] `PATCH /api/productos/{id}`
  - *Función frontend:* `updateProducto(id, { nombre, categoria, price, unit })` en [`src/services/productos.ts`](./src/services/productos.ts)
  - *Vista:* Modal de editar producto en [`src/pages/admin/ProductsPanel.tsx`](./src/pages/admin/ProductsPanel.tsx)
- [x] `PATCH /api/productos/{id}/estado`
  - *Función frontend:* `cambiarEstadoProducto(id, activo)` en [`src/services/productos.ts`](./src/services/productos.ts)
  - *Vista:* Botones Desactivar / Reactivar en [`src/pages/admin/ProductsPanel.tsx`](./src/pages/admin/ProductsPanel.tsx)

---

## 6. Inventario (`inventario-controller`)
- [x] `GET /api/inventario` (Inventario de tienda)
  - *Función frontend:* `getInventarioTienda({ tiendaId, nombre?, categoria?, productoId? })` en [`src/services/inventario.ts`](./src/services/inventario.ts)
  - *Vista:* [`src/pages/shared/InventoryView.tsx`](./src/pages/shared/InventoryView.tsx) (listado conectado al backend con búsqueda)
- [x] `GET /api/inventario/centro-distribucion` (Inventario de CD)
  - *Función frontend:* `getInventarioCD({ centroDistribucionId, nombre?, categoria?, productoId? })` en [`src/services/inventario.ts`](./src/services/inventario.ts)
  - *Vista:* [`src/pages/shared/InventoryView.tsx`](./src/pages/shared/InventoryView.tsx) (listado conectado al backend con búsqueda)
- [x] `POST /api/inventario/ajustes` (Ajuste de inventario en tienda o CD)
  - *Función frontend:* `ajustarInventario(tipo, locationId, productId, nuevaCantidad)` en [`src/services/inventario.ts`](./src/services/inventario.ts)
  - *Body:* `{ tiendaId }` o `{ centroDistribucionId }`, más `{ productoId, nuevaCantidad }`
  - *Respuesta:* `id`, `tiendaId`, `centroDistribucionId`, `productoId`, `cantidadAnterior`, `diferencia`, `cantidadNueva`, `usuarioId`, `fechaAjuste`
  - *Vista:* [`src/pages/shared/InventoryView.tsx`](./src/pages/shared/InventoryView.tsx) (modal de ajuste, historial de la sesión y recarga del inventario desde el backend)

---

## 7. Operaciones y Movimientos (`TiendaController` & `CentroDistribucionController`)
- [x] `POST /api/centros-distribucion/{id}/ingresos` (Recepción de mercancía en CD)
  - *Alias corto:* `POST /api/cd/{id}/ingresos`
  - *Función frontend:* `registrarIngreso({ centroDistribucionId, productoId, quantity, origin })` en [`src/services/ingresoMercancia.ts`](./src/services/ingresoMercancia.ts)
  - *Body:* `{ productoId, cantidad, origen }` — el id del CD viaja en la URL
  - *Vista:* [`src/pages/dc/RegisterReceipt.tsx`](./src/pages/dc/RegisterReceipt.tsx) (formulario conectado al backend con control de errores)
- [x] `POST /api/tiendas/{id}/ventas` (Registro de venta en tienda)
  - *Función frontend:* `registrarVenta({ tiendaId, productoId, quantity, fechaHora? })` en [`src/services/ventas.ts`](./src/services/ventas.ts)
  - *Body:* `{ productoId, cantidad, fechaHora }` — el id de la tienda viaja en la URL
  - *Vista:* [`src/pages/store/RegisterSale.tsx`](./src/pages/store/RegisterSale.tsx) (formulario conectado al backend con control de errores)

---

## 8. Sprint 3 — Integraciones implementadas

### 8.1 HU-15 — Solicitudes de reposición
- [x] **`POST /api/tiendas/{id}/solicitudes-reposicion`**
  - *Función frontend:* `crearSolicitudReposicion({ tiendaId, productoId, quantity })` en [`src/services/solicitudesReposicion.ts`](./src/services/solicitudesReposicion.ts)
  - *Body:* `{ productoId, cantidad }` — el id de la tienda viaja en la URL
  - *Vista:* [`src/pages/store/SolicitarReposicion.tsx`](./src/pages/store/SolicitarReposicion.tsx)
- [x] **`GET /api/solicitudes-reposicion`**
  - *Función frontend:* `getSolicitudesReposicion()` en [`src/services/solicitudesReposicion.ts`](./src/services/solicitudesReposicion.ts)
  - *Vista:* [`src/pages/planner/Recomendaciones.tsx`](./src/pages/planner/Recomendaciones.tsx) (solicitudes pendientes para el Planificador)
- **Comportamiento:** la tienda muestra únicamente las solicitudes creadas en la sesión actual (no existe endpoint por tienda). El Planificador consulta todas las solicitudes y las usa como origen de una recomendación.

### 8.2 HU-20 — Crear recomendación de reposición
- [x] **`POST /api/recomendaciones-reposicion`**
  - *Función frontend:* `crearRecomendacion(payload, currentUser?)` en [`src/services/recomendaciones.ts`](./src/services/recomendaciones.ts)
  - *Body:* `{ productoId, cantidad, centroDistribucionOrigenId, tiendaDestinoId, confirmarFueraDeCobertura? }`
  - *Vista:* [`src/pages/planner/Recomendaciones.tsx`](./src/pages/planner/Recomendaciones.tsx) (creación manual o desde una solicitud)
- [x] **`GET /api/recomendaciones-reposicion`**
  - *Función frontend:* `getRecomendaciones(currentUser?)` en [`src/services/recomendaciones.ts`](./src/services/recomendaciones.ts)
- **Cobertura:** si el backend responde `409` porque la tienda destino no pertenece a la zona del CD, la UI muestra el mensaje del backend y ofrece:
  - **Cambiar origen:** limpia el CD seleccionado y el aviso.
  - **Confirmar de todas formas:** reenvía la operación con `confirmarFueraDeCobertura: true`.
- **Tienda destino:** el selector de creación manual lista solo tiendas activas.

### 8.3 HU-21 — Aprobar / rechazar recomendaciones y auditoría
- [x] **`PATCH /api/recomendaciones-reposicion/{id}/aprobar`**
  - *Función frontend:* `aprobarRecomendacion(id, { cantidad?, centroDistribucionOrigenId?, confirmarFueraDeCobertura? })` en [`src/services/recomendaciones.ts`](./src/services/recomendaciones.ts)
  - *Body opcional:* `{ cantidadAjustada?, centroDistribucionOrigenId?, confirmarFueraDeCobertura? }`
  - *Respuesta:* orden de reposición generada por el backend
- [x] **`PATCH /api/recomendaciones-reposicion/{id}/rechazar`**
  - *Función frontend:* `rechazarRecomendacion(id, motivo, currentUser?)` en [`src/services/recomendaciones.ts`](./src/services/recomendaciones.ts)
  - *Body:* `{ motivo }` (obligatorio)
- **Auditoría:** el historial se construye con los campos del backend (`creadoPor`, `fechaCreacion`, `resueltoPorUsuarioId`, `accionTomada`, `fechaResolucion`, `motivoRechazo`, `cantidadPropuesta`, `centroDistribucionPropuestoId`). No se marca localmente nada como atendido.
- **Usuario en el historial:** `creadoPor` y `resueltoPorUsuarioId` son UUID de Supabase. El frontend compara con `getCurrentAuthUserId()`: si coincide, muestra el nombre del usuario actual; si no, muestra `Usuario ` + los primeros 8 caracteres del UUID.
- **Órdenes:** el panel del Planificador muestra las recomendaciones aprobadas como órdenes. El backend aún no expone un `GET` de órdenes, por lo que no se puede listar el identificador real de la orden.

### 8.4 HU-17 / HU-13 — Ajuste de inventario
- [x] **`POST /api/inventario/ajustes`**
  - *Función frontend:* `ajustarInventario(tipo, locationId, productId, nuevaCantidad)` en [`src/services/inventario.ts`](./src/services/inventario.ts)
  - *Vista:* [`src/pages/shared/InventoryView.tsx`](./src/pages/shared/InventoryView.tsx) (tienda y CD)
- **Comportamiento:** tras guardar, se vuelve a consultar el inventario al backend (sin overlay de mocks). El historial del modal contiene solo los ajustes de la sesión, tomados de la respuesta del `POST`.

---

## 9. Sprint 3 — Pendientes de backend

Los siguientes endpoints no están implementados en el backend. Los servicios que aún los declaran (`ordenes.ts`, `desactivarTienda`, `desactivarCentroDistribucion`, `historialVentas.ts`) usan el store único en memoria (`src/services/mocks/`) cuando `VITE_USE_MOCKS === 'true'`; si no, lanzan `Error("Endpoint pendiente de backend")` que la UI muestra con el manejo de errores existente. Las brechas marcadas como **flujo local** se resolvieron en el frontend con los datos disponibles y quedan documentadas como limitación.

- [ ] **`GET /api/ordenes`**
  - *Función frontend:* `getOrdenes()` en [`src/services/ordenes.ts`](./src/services/ordenes.ts)
  - *Uso:* Consultar órdenes pendientes al desactivar tienda (HU-08) y listar órdenes reales del Planificador (HU-21).
- [ ] **`GET /api/ventas/historial?tiendaId=&productoId=&desde=&hasta=`**
  - *Función frontend:* `getHistorialVentas(params)` en [`src/services/historialVentas.ts`](./src/services/historialVentas.ts)
  - *Uso:* Historial de ventas para patrones de demanda y rotación (HU-19, HU-27).
- [ ] **`GET /api/centros-distribucion/{id}/ordenes`**
  - *Función frontend:* `getOrdenesCD(centroDistribucionId)` en [`src/services/ordenes.ts`](./src/services/ordenes.ts)
  - *Uso:* Órdenes entrantes de solo lectura para el CD (pantalla Órdenes entrantes).
- [ ] **`GET /api/tiendas/{id}/solicitudes-reposicion`**
  - *Uso:* Historial de solicitudes de una tienda. **Flujo local:** la pantalla de tienda solo muestra las solicitudes creadas en la sesión.
- [ ] **`GET /api/recomendaciones-reposicion/{id}/historial`**
  - *Uso:* Historial dedicado de una recomendación. **Flujo local:** se construye a partir de los campos de auditoría de la respuesta.
- [ ] **Transición de estado de la solicitud al crear una recomendación**
  - *Uso:* Marcar la solicitud como atendida. **Flujo local:** no se marca; el Planificador sigue viendo la solicitud como pendiente.
- [x] **`PATCH /api/tiendas/{id}/estado`** (desactivar/activar tienda)
  - *Uso:* cambia el estado activo/inactivo con validación de órdenes en tránsito y confirmación opcional. El frontend usa `cambiarEstadoTienda()`.
- [x] **`PATCH /api/centros-distribucion/{id}/estado`** (desactivar/activar CD)
  - *Uso:* cambia el estado activo/inactivo con validación de tiendas asignadas y confirmación opcional. El frontend usa `cambiarEstadoCentroDistribucion()`.
- [ ] **`GET /api/inventario/ajustes`**
  - *Uso:* Historial persistente de ajustes. **Flujo local:** el modal solo muestra los ajustes de la sesión tomados del `POST`.
