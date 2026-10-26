# Deuda técnica — OptiWay Frontend

**Última actualización:** 2026-10-26
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

### 4.5 Eliminación de diccionarios locales de traducción de errores (`ErrorTranslations`)

Cada servicio mantiene constantes locales de traducción de errores (`CD_ERRORS`, `TIENDA_ERRORS`,
`PRODUCTO_ERRORS`, `VENTA_ERRORS`, etc.) que buscan coincidencias parciales de cadenas devueltas
por el backend para reescribirlas.

Ahora que el backend estandarizó `ErrorResponse` (incluyendo 401, 403, 404 y validaciones de negocio)
retornando mensajes limpios y descriptivos en español directamente en el campo `message`, esta capa
intermedia introduce fragilidad por acoplamiento a substrings y mantenimiento redundante.

**Pendiente:** Desacoplar los servicios de la prop `errors` en `apiFetch`, eliminar las constantes
de traducción de strings en cada servicio y dejar que la UI consuma y muestre `ErrorResponse.message`
directamente del backend.
