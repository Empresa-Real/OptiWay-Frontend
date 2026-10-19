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
  - *Vista:* Modal de crear usuario en [`src/pages/admin/UsersPanel.tsx`](./src/pages/admin/UsersPanel.tsx)
- [ ] `GET /api/usuarios/{id}`
- [ ] `PATCH /api/usuarios/{id}/rol`
- [ ] `DELETE /api/usuarios/{id}`

---

## 3. Módulo de Tiendas (`tienda-controller`)
- [x] **`GET /api/tiendas`**
  - *Función frontend:* `getTiendas()` en [`src/services/tiendas.ts`](./src/services/tiendas.ts)
  - *Vista:* [`src/pages/admin/StoresPanel.tsx`](./src/pages/admin/StoresPanel.tsx) (Listado en tiempo real con botón Actualizar)
- [x] **`POST /api/tiendas`**
  - *Función frontend:* `createTienda({ name, address, city })` en [`src/services/tiendas.ts`](./src/services/tiendas.ts)
  - *Vista:* Modal de crear tienda en [`src/pages/admin/StoresPanel.tsx`](./src/pages/admin/StoresPanel.tsx)
- [ ] `PUT /api/tiendas/{id}/encargado`

---

## 4. Módulo de Centros de Distribución (`centro-distribucion-controller`)
- [ ] `GET /api/centros-distribucion`
- [ ] `POST /api/centros-distribucion`
- [ ] `PUT /api/centros-distribucion/{id}/encargado`

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
- [ ] `POST /api/ventas` (Registro de venta en tienda)
