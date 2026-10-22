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
