# Deuda técnica — OptiWay Frontend

**Última actualización:** 2026-11-21
**Rama de trabajo:** `integration/sprint`
**Backend:** `https://optiway-backend.onrender.com`

Este documento contiene únicamente trabajo pendiente.

---

## 1. Estado y carga de datos

### 1.1 Refetch por identidad de `currentUser`

El efecto de `loadAuxData` depende del objeto `currentUser`. Cuando se obtiene un objeto nuevo
para el mismo usuario —por ejemplo, después de configurar la contraseña— se repiten las
consultas de tiendas, centros de distribución y productos.

**Pendiente:** evaluar usar `currentUser?.id` como dependencia o incorporar una caché.

### 1.2 Errores silenciados en `loadAuxData`

```ts
getTiendas().catch(() => [])
getCentrosDistribucion().catch(() => [])
getProductos().catch(() => [])
```

Un error de servidor o sesión vencida se ve igual que una lista vacía.

**Pendiente:** mostrar un aviso o registrar el error de forma visible sin impedir el arranque.

---

## 2. Tipos desde OpenAPI

El backend expone `GET /v3/api-docs`, pero los servicios frontend mantienen sus propios tipos.
La generación de tipos se postergó porque requiere actualizar varios servicios, revisar campos
nullable y agregar el paso de generación al flujo de desarrollo/build.

**Pendiente:** evaluar `openapi-typescript` y automatizar la generación cuando haya margen para
actualizar los servicios.

---

## 3. Cobertura de tests

- Faltan pruebas de componentes React.
- Los tests live dependen del deploy y disponibilidad de Render; no son un gate confiable de CI.

La suite actual tiene **78 tests unitarios en 8 archivos** y 3 tests live, ejecutados por separado.

---

## 4. Otros pendientes

### 4.0 Store de mocks y modo VITE_USE_MOCKS (Sprint 3)

Se mantiene `src/services/mocks/` para los endpoints que aún no tienen conexión real con backend:
- `ordenes.ts` (`GET /api/ordenes`, `GET /api/centros-distribucion/{id}/ordenes`).
- `historialVentas.ts` (patrones de demanda y rotación).

Los servicios de estado (`desactivarTienda` / `desactivarCentroDistribucion`) ya no dependen de `VITE_USE_MOCKS`:
- `cambiarEstadoTienda` y `cambiarEstadoCentroDistribucion` conectan contra los `PATCH` reales (`/api/tiendas/{id}/estado` y `/api/centros-distribucion/{id}/estado`) y lanzan `Error("Endpoint pendiente de backend")` si no hay sesión o el token es inválido.

No se agregó ninguna dependencia nueva.

### 4.1 Historial de ediciones de producto

`ProductsPanel` mantiene `productEdits` en memoria. Se pierde al recargar y el backend no tiene
un endpoint para persistir el historial.

### 4.2 Candado del Sidebar

El ícono de candado es decorativo: si un módulo vuelve a marcarse como no integrado, su
`onClick` todavía permite navegar. Actualmente todos los módulos están marcados como integrados.

### 4.3 Validación duplicada

`DCsPanel` valida nombre y capacidad antes de llamar al backend, que vuelve a validar esos
campos. Es útil para dar feedback inmediato, pero conviene mantener alineados los mensajes.

### 4.4 Lockfiles

Resuelto: **pnpm es el único gestor**. `package-lock.json` se eliminó y quedó en
`.gitignore`; el único lockfile es `pnpm-lock.yaml`. En CI/Vercel se instala con
`pnpm install --frozen-lockfile`, así que cualquier dependencia nueva debe agregarse con
`corepack pnpm add` (actualiza el lockfile correcto).

### 4.5 Clase CSS inactiva en UsersPanel.tsx:666

El botón de eliminar usuario usa `hover:bg-red-700`, que no resuelve a ningún color en el build de Tailwind v4 (clase inválida/ínactiva). No afecta el funcionamiento, pero debe revisarse al agregar el endpoint de eliminación real.

### 4.6 Falta de pruebas para servicios nuevos

Los servicios nuevos del Sprint 3 (`ordenes.ts`, `cambiarEstadoTienda` en `tiendas.ts`, `cambiarEstadoCentroDistribucion` en `centrosDistribucion.ts`, `inventario.ts` función `ajustarInventario`, `historialVentas.ts`, `solicitudesReposicion.ts`, `recomendaciones.ts`) carecen de pruebas unitarias. No se agregaron pruebas de componentes React para las pantallas nuevas del planner, tienda ni CD.

La suite existente (78 tests) pasa usando variables de Supabase de prueba. Sin `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`, `createClient` falla al importar `src/services/supabase.ts` y los suites no llegan a ejecutarse.

### 4.8 Nuevos servicios integrados sin pruebas unitarias

Los dos servicios nuevos que conectan con endpoints reales (`cambiarEstadoTienda`, `cambiarEstadoCentroDistribucion`) no tienen pruebas unitarias. Se recomienda añadir tests que cubran:
- Cambio de estado exitoso.
- Error 409 al intentar desactivar con órdenes en tránsido / tiendas en cobertura sin confirmar.
- Flujo de confirmación (`confirmarConOrdenesEnTransito`, `confirmarConTiendasAsignadas`).

### 4.7 Eliminación de diccionarios locales de traducción de errores (`ErrorTranslations`)

Cada servicio mantiene constantes locales de traducción de errores (`CD_ERRORS`, `TIENDA_ERRORS`,
`PRODUCTO_ERRORS`, `VENTA_ERRORS`, etc.) que buscan coincidencias parciales de cadenas devueltas
por el backend para reescribirlas.

Ahora que el backend estandarizó `ErrorResponse` (incluyendo 401, 403, 404 y validaciones de negocio)
retornando mensajes limpios y descriptivos en español directamente en el campo `message`, esta capa
intermedia introduce fragilidad por acoplamiento a substrings y mantenimiento redundante.

**Pendiente:** Desacoplar los servicios de la prop `errors` en `apiFetch`, eliminar las constantes
de traducción de strings en cada servicio y dejar que la UI consuma y muestre `ErrorResponse.message`
directamente del backend.

### 4.8 Brechas del backend para Sprint 3

- **`GET /api/tiendas/{id}/solicitudes-reposicion`:** no existe. La pantalla de tienda solo muestra las solicitudes creadas en la sesión.
- **Transición de estado de la solicitud:** no existe endpoint para marcarla como atendida al crear una recomendación. El Planificador la sigue viendo como pendiente.
- **`GET /api/ordenes`:** no existe. El panel de órdenes del Planificador deriva de las recomendaciones aprobadas y no muestra el id real de la orden.
- **`GET /api/centros-distribucion/{id}/ordenes`:** no existe. La pantalla `OrdenesEntrantes.tsx` sigue pendiente.
- **`GET /api/recomendaciones-reposicion/{id}/historial`:** no existe. El historial se construye con los campos de auditoría de la respuesta.
- **`GET /api/inventario/ajustes`:** no existe. El historial del modal es solo de la sesión y se toma de la respuesta del `POST`.
- **Identificador de usuario:** `User.id` es el id numérico local; `creadoPor` y `resueltoPorUsuarioId` son UUID de Supabase. La UI usa `getCurrentAuthUserId()` para comparar. Si se agrega `authUserId` a `User`, hay que actualizar los tests de mapeo que comparan el objeto exacto.
