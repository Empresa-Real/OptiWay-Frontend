# Deuda técnica — OptiWay Frontend

**Última actualización:** 2026-10-22
**Rama de trabajo:** `integration/sprint`
**Backend:** `https://optiway-backend.onrender.com` (Spring Boot, springdoc habilitado)

Este documento registra lo que ya se resolvió, lo que queda abierto y el porqué de las
decisiones, para no volver a analizar lo mismo dos veces.

---

## 1. Modelo de datos en el cliente

### 1.1 Es memoria, no `localStorage`

Todo el estado de la aplicación son `useState` de React (`src/App.tsx`). No hay
persistencia propia:

```
localStorage / sessionStorage en src/  →  0 usos
```

| Dato | Dónde vive | Sobrevive a F5 |
|---|---|---|
| `products`, `stores`, `dcs`, `users` | RAM (`useState` en `App.tsx`) | ❌ |
| `inventoryStore`, `inventoryCD` | RAM (`useState` en `App.tsx`) | ❌ |
| Token de sesión de Supabase | `localStorage` (lo maneja el SDK, clave `sb-<ref>-auth-token`) | ✅ |

Consecuencia: **cada recarga vuelve a pedir todo**. La sesión se restaura, pero los datos no.

### 1.2 Cuándo se disparan las peticiones

El disparador es `currentUser`, no la pantalla:

```ts
// App.tsx
useEffect(() => {
  if (!currentUser) return;
  // getTiendas(), getCentrosDistribucion(), getProductos()
  // + inventario según asignación
}, [currentUser]);
```

| Evento | ¿Peticiones al backend? | Por qué |
|---|---|---|
| **F5 / recargar** | ✅ Sí | El estado se pierde; `getCurrentUser()` restaura y `setCurrentUser` dispara el efecto |
| **Login** | ✅ Sí | `handleLogin` hace `setCurrentUser(user)` |
| **Logout** | ❌ No | `setCurrentUser(null)` re-ejecuta el efecto, pero el `if (!currentUser) return` lo corta |
| **Cambiar de pantalla** (Sidebar) | ❌ No | Los catálogos viven en `App.tsx`, no en cada pantalla |
| **Entrar a Tiendas / CDs / Usuarios** | ✅ Sí | Cada panel tiene su propio `useEffect` de montaje |
| **Entrar a Productos** | ❌ No | Usa la prop de `App` (el fetch duplicado se eliminó en `b91f679`) |
| **Entrar a Venta / Ingreso** | ❌ No | Reciben productos e inventario por props |

### 1.3 Mapa de peticiones en un F5

Encargado de tienda:

```
GET /api/usuarios/me                                  ← restaurar sesión
GET /api/tiendas              ┐
GET /api/centros-distribucion ├ en paralelo (loadAuxData)
GET /api/productos            ┘
GET /api/inventario?tiendaId=N                        ← después, solo si tiene asignación
```

Administrador: los mismos 4 + `GET /api/usuarios` al montar `UsersPanel` (su pantalla inicial).
Encargado de CD: los mismos 4 + `GET /api/inventario/centro-distribucion?...`.

Total: **5 requests por recarga o login**. No hay caché (ni React Query, ni SWR, ni
`staleTime`), lo cual es aceptable hoy por el tamaño de los catálogos, pero es el primer
candidato a optimizar si crece el volumen.

### 1.4 Por qué importa limpiar el estado en logout

Al no haber persistencia, el riesgo no es "quedó guardado en disco", es este:

```
Misma pestaña, sin F5:
  usuario A → logout → login usuario B
  React nunca se desmonta: el estado de App sobrevive al cambio de sesión
```

Sin `setStores([])`, `setProducts([])`, etc., el usuario B veía los datos del usuario A
hasta que llegara su propia respuesta. Resuelto en `b91f679`:

```ts
setCurrentUser(null);
setScreen("");
setStores([]); setDCs([]); setUsers([]);
setProducts([]); setInventoryStore([]); setInventoryCD([]);
```

Verificación manual: login A → logout → login B **sin recargar** → el inventario debe ser el
de B (o vacío mientras carga), nunca el de A.

### 1.5 Detalle: identidad del objeto `currentUser`

La dependencia es el objeto, no el id. `getCurrentUser()` devuelve un objeto nuevo cada vez,
así que cualquier `setCurrentUser(...)` posterior (por ejemplo `handlePasswordSet`) vuelve a
lanzar las 4 peticiones. No genera un loop, pero sí un refetch extra.

**Deuda:** si se quiere evitar, usar `currentUser?.id` como dependencia o cachear con
`staleTime`.

---

## 2. Capa HTTP

### 2.1 Resuelto — un solo `apiFetch`

Commit `5e3f18e`. Antes cada servicio copiaba su propio `API_BASE_URL`, `getAuthToken` y
`parseErrorResponse` (6 copias), y cada copia priorizaba distinto los campos de error.

| Antes | Ahora |
|---|---|
| `const API_BASE_URL` ×8 | 1 (`src/services/http.ts`) |
| `getAuthToken()` ×7 | 1 |
| `parseErrorResponse()` ×6 | 1 |
| 3 precedencias de error distintas | 1: `message` → `error` → `detalle` → texto |

- Las traducciones de dominio son datos (`ErrorTranslations`), no cadenas de `else if`.
- El 403 tiene un mensaje por servicio (`forbidden`).
- `centrosDistribucion` ya no asigna `detalle` directo (se acabó el `[object Object]`).
- `getCentrosDistribucion` propaga el error; `DCsPanel` lo muestra.

### 2.2 Pendiente — congelar el contrato de error

`apiFetch` **tolera** varios formatos (`message`, `error`, `detalle`, texto plano), pero eso
es mitigación, no contrato. Hoy conviven respuestas de Spring, de Supabase y de validación.

**Objetivo:** documentar y respetar un único `ErrorResponse { status, error, message }` y
eliminar los fallbacks. Mientras no esté congelado, `pickMessage()` seguirá adivinando.

### 2.3 Pendiente — errores silenciados en `loadAuxData`

```ts
getTiendas().catch(() => [])
getCentrosDistribucion().catch(() => [])
getProductos().catch(() => [])
```

Un 500 o un token vencido se ve exactamente igual que "no hay datos". **Deuda:** mostrar un
aviso o registrar el error de forma visible, sin romper el arranque.

---

## 3. Tipos desde OpenAPI — evaluado y postergado

**Decisión:** no se implementa por ahora (el cambio se consideró demasiado grande para el
momento). Queda documentado para retomarlo sin repetir el análisis.

### 3.1 Lo que ya se verificó

- El backend expone el contrato: `GET /v3/api-docs` responde **200**.
- Dependencia presente: `springdoc-openapi-starter-webmvc-ui` (`pom.xml:58`).
- Contenido actual: **19 rutas y 20 esquemas** (`ErrorResponse`, `UsuarioResponse`,
  `ProductoResponse`, `InventarioResponse`, `VentaResponse`, `IngresoMercanciaResponse`, …).
- El generador `openapi-typescript@7` funciona sobre ese JSON.

### 3.2 Por qué se postergó

- Obliga a tocar los 7 servicios a la vez.
- springdoc no marca `nullable`, así que hay que corregir a mano `asignacion`, `encargadoId`,
  `creadoPor`, `tiendasAbastecidasIds`.
- Requiere agregar una dependencia y un paso de generación al flujo de build.

### 3.3 Cómo retomarlo

```bash
corepack pnpm add -D openapi-typescript
```

```jsonc
// package.json
"gen:api": "node scripts/gen-api.mjs"
```

El script ya estaba diseñado: lee `VITE_API_URL` del `.env`, descarga `/v3/api-docs`, guarda
`docs/openapi.json` y genera `src/api/schema.d.ts` con `propertiesRequiredByDefault: true`.

Luego, en cada servicio, cambiar el tipo hecho a mano por:

```ts
type BackendProducto = components["schemas"]["ProductoResponse"];
```

**El punto de enganche ya está listo:** `apiFetch<T>` es genérico, así que solo cambia el `T`.
Si el backend renombra una ruta o un campo, `tsc` falla en vez de producir un 404.

**En CI:** `npm run gen:api && git diff --exit-code` para detectar que el frontend quedó
desactualizado.

---

## 4. Cobertura de tests

### 4.1 Estado

- **70 tests en 8 archivos** (incluye trabajo en curso de otro agente).
- Con `fetch` mockeado: `auth`, `usuarios`, `tiendas`, `centrosDistribucion`, `ventas`,
  `ingresoMercancia`, `http`.
- Los tests de `ventas` e `ingresoMercancia` se agregaron en `26ddbf3` **contra el contrato
  real** (leyendo los controladores Java), no contra lo que el frontend creía.

### 4.2 Pendiente

- Un test de integración **contra el backend real** (hay un `liveBackend.test.ts` sin
  commitear, en curso). Los mocks no detectan un 404 ni un `LocalDateTime` mal formado.
- Cobertura de las pantallas: hoy no hay tests de componentes (React Testing Library).

### 4.3 Lección registrada

Los 46 tests anteriores estaban verdes **por omisión**: `ventas.ts` e `ingresoMercancia.ts`
no tenían ninguno, y la URL equivocada estaba tanto en el código como en la documentación.
Un test escrito desde la suposición del frontend habría codificado el mismo bug.

---

## 5. Otros puntos abiertos

### 5.1 Historial de ediciones de producto no persiste

`ProductsPanel` guarda `productEdits` en `useState`. Se pierde al recargar y no hay endpoint
en el backend. Es una limitación de producto, no un bug.

### 5.2 El candado del Sidebar es decorativo

`Sidebar.tsx` dibuja el ícono cuando `integrated === false`, pero el `onClick` navega igual:

```tsx
onClick={() => setScreen(item.id)}   // entra siempre
{!item.integrated && <PadlockIcon />} // solo pinta
```

Hoy los 8 ítems están en `integrated: true`, así que no hay efecto visible. Si se vuelve a
bloquear un módulo, hay que cortar el `onClick`.

### 5.3 Validación duplicada front/back

`DCsPanel` valida nombre y capacidad antes de llamar; el backend valida lo mismo. Es
deliberado (feedback inmediato), pero conviene mantener un solo lugar de verdad para los
mensajes.

### 5.4 Dos lockfiles y `pnpm` no instalado

Conviven `package-lock.json` y `pnpm-lock.yaml`, y `package.json` declara
`packageManager: pnpm@10.34.3`. En esta máquina `pnpm` no está en el PATH; funciona con
`corepack pnpm`. **Deuda:** elegir uno y borrar el otro.

### 5.5 Archivo movido sin commitear

`src/imports/prompt-figma-sprint1-v2.txt` → `.figma/prompt-figma-sprint1-v2.txt`
permanece sin commitear (no lo generó este trabajo). Definir si se descarta o se integra.

---

## 6. Historial de cambios relevantes

| Commit | Qué resolvió |
|---|---|
| `b91f679` | `DCsPanel` con manejo de errores y botón Actualizar; logout limpia productos e inventario; se elimina el fetch duplicado de productos |
| `5e3f18e` | `src/services/http.ts`: un solo `apiFetch`, token y parser de errores (−373 líneas netas) |
| `26ddbf3` | `POST /api/tiendas/{id}/ventas` y `POST /api/centros-distribucion/{id}/ingresos`; tests de ambos servicios; `fechaHora` opcional |
| `40f220a` | Eliminado `src/data/seed.ts`; `PANTALLAS_PENDIENTES.md` actualizado |
| `e9d343e` | Integración del módulo de inventario con asignación de ubicación |

---

## 7. Prioridad sugerida

1. **Test contra el backend real** (detecta 404, 400 y contratos rotos que los mocks no ven).
2. **Congelar el contrato de error** (`ErrorResponse`).
3. **Errores visibles en `loadAuxData`** (no confundir fallo con "sin datos").
4. **Tipos desde OpenAPI** (cuando haya margen para tocar los 7 servicios).
5. **Un solo lockfile**.
