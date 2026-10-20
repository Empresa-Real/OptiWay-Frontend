# Estado de Integración de Endpoints (Backend Swagger & OpenAPI)

Este documento registra el avance de conexión entre el frontend (**OptiWay-Frontend**) y el backend en Render (**OptiWay-Backend** / `https://optiway-backend.onrender.com`).

---

## 1. Autenticación y Sesión
- [x] **`POST /auth/v1/token?grant_type=password` (Supabase Auth)**
  - *Función frontend:* `login(email, password)` en [`src/services/auth.ts`](./src/services/auth.ts)
  - *Vista:* [`src/pages/Login.tsx`](./src/pages/Login.tsx)
- [x] **`PUT /auth/v1/user` (Supabase Auth)**
  - *Función frontend:* `updatePassword(password)` en [`src/services/auth.ts`](./src/services/auth.ts)
  - *Vista:* [`src/pages/SetPassword.tsx`](./src/pages/SetPassword.tsx) y [`set-password.html`](./set-password.html)
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
- [ ] `GET /api/productos`
- [ ] `POST /api/productos`
- [ ] `PUT /api/productos/{id}`
- [ ] `PATCH /api/productos/{id}/estado`

---

## 6. Inventario (`inventario-controller`)
- [ ] `GET /api/inventario` (Inventario de tienda)
- [ ] `GET /api/inventario/centro-distribucion` (Inventario de CD)

---

## 7. Operaciones y Movimientos (`ingreso-mercancia-controller` & `venta-controller`)
- [ ] `POST /api/ingresos-mercancia` (Recepción de mercancía en CD)
- [x] `POST /api/ventas` (Registro de venta en tienda)
  - *Función frontend:* `registrarVenta({ tiendaId, productoId, quantity, fechaHora? })` en [`src/services/ventas.ts`](./src/services/ventas.ts)
  - *Vista:* [`src/pages/store/RegisterSale.tsx`](./src/pages/store/RegisterSale.tsx) (formulario conectado al backend con control de errores)
