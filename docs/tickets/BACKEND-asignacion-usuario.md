# Ticket backend — Exponer la asignación de ubicación en el DTO de usuario

**Repo:** `OptiWay-Backend`
**Tipo:** Feature / corrección de contrato
**Prioridad:** Alta
**Estado:** ✅ **Implementado en backend** — `AsignacionUbicacion`, campo `asignacion` en
`UsuarioResponse`, resolución en `UsuarioService` (3 queries fijas, sin N+1) y 6 tests.
El frontend ya consume el contrato y se eliminó el fallback temporal.
**Bloquea:** simplificación de `UsersPanel` en el frontend, y arregla un bug de datos visible en producción.

---

## 1. Problema

El backend modela la relación encargado ↔ ubicación **solo en un sentido**: la
tienda y el centro de distribución conocen a su encargado, pero el usuario **no
sabe a qué ubicación pertenece**.

Endpoints actuales:

- `GET /api/usuarios` → devuelve `id`, `nombre`, `email`, `rol`, `creadoPor`. **Sin ubicación.**
- `GET /api/usuarios/me` → ídem.
- `PUT /api/tiendas/{id}/encargado` → sí guarda la relación.
- `PUT /api/centros-distribucion/{id}/encargado` → sí guarda la relación.

Consecuencia: el frontend no puede saber dónde está asignado un usuario sin
pedir **todas** las tiendas y **todos** los centros de distribución y recorrerlos
buscando `encargadoId === userId`.

## 2. Evidencia en el frontend

`src/services/usuarios.ts` — el campo no existe, así que se descarta:

```ts
return data.map(mapBackendUserToFrontend);
// mapBackendUserToFrontend → asignacion: mapBackendAsignacion(u.asignacion) → null
```

`src/services/auth.ts` — antes había un fallback hardcodeado que **causaba un bug real**:

```ts
locationId: 1, // Fallback a ubicación 1 por defecto para pantallas de tienda/CD
```

Efecto: un encargado de la tienda 5 veía el nombre, el inventario y registraba
ventas **contra la tienda 1**. Es un problema de integridad de datos, no solo de UI.

`src/pages/admin/UsersPanel.tsx` — workaround de 3 requests + índice invertido
para pintar una columna de la tabla.

## 3. Cambio propuesto

Agregar un objeto `asignacion` al DTO de usuario, en **todos** los endpoints que
devuelven usuarios.

### 3.1 Contrato

```jsonc
GET /api/usuarios/12
{
  "id": 12,
  "authUserId": "a1b2c3d4-....",
  "nombre": "Ana Torres",
  "email": "ana@optiway.com",
  "rol": "ENCARGADO_TIENDA",
  "creadoPor": "admin@optiway.com",
  "asignacion": {
    "tipo": "TIENDA",          // "TIENDA" | "CD"
    "id": 3,
    "nombre": "Sucursal Centro"
  }
}
```

Usuario sin ubicación asignada (o con rol `ADMINISTRADOR` / `PLANIFICADOR`):

```json
{
  "id": 20,
  "nombre": "Luis Prado",
  "email": "luis@optiway.com",
  "rol": "ENCARGADO_CD",
  "asignacion": null
}
```

### 3.2 Reglas

1. `asignacion` **siempre presente** en el JSON (objeto o `null`). No omitir la clave.
2. `asignacion.id` es el id de **la tienda o del CD**, no un id de tabla intermedia.
3. `asignacion.tipo` es el discriminante obligatorio. El frontend ya no puede
   adivinar por el rol del usuario, porque un encargado de tienda puede quedar
   sin asignación y un usuario puede cambiar de rol.
4. `asignacion.nombre` es el nombre de la ubicación, para no obligar al frontend
   a resolverlo con otra request. Si es costoso de calcular en el listado, se
   puede omitir y el frontend cae al id — pero conviene incluirlo.
5. Un usuario puede tener **como máximo una** asignación. Si el modelo permite
   varias, avisar antes de implementar: cambia el contrato a lista.
6. La asignación debe salir de la misma fuente de verdad que
   `PUT /api/tiendas/{id}/encargado` y `PUT /api/centros-distribucion/{id}/encargado`.

### 3.3 Endpoints afectados

| Endpoint | Cambio |
|---|---|
| `GET /api/usuarios` | Agregar `asignacion` a cada elemento |
| `GET /api/usuarios/{id}` | Agregar `asignacion` |
| `GET /api/usuarios/me` | Agregar `asignacion` ← **arregla el bug del fallback a id 1** |
| `POST /api/usuarios` | Devolver `asignacion: null` en el usuario creado |

### 3.4 Notas de implementación

Es un `left join` desde `usuario` hacia `tienda` y `centro_distribucion` por
`encargado_id`. Para el listado, conviene resolverlo en una sola query
(union de las dos tablas de ubicación) para no generar N+1.

Si la entidad `Usuario` es un `record` de Java, agregar el campo es compatible
hacia atrás: el frontend ya lo trata como opcional durante la transición.

## 4. Criterios de aceptación

- [ ] `GET /api/usuarios` devuelve `asignacion` en **todos** los elementos, con `null` cuando corresponde.
- [ ] `GET /api/usuarios/me` devuelve la asignación del usuario autenticado.
- [ ] Un `ENCARGADO_TIENDA` asignado a la tienda 5 devuelve `{"tipo":"TIENDA","id":5,...}`.
- [ ] Al reasignar con `PUT /api/tiendas/{id}/encargado`, el cambio se refleja en el siguiente `GET /api/usuarios`.
- [ ] Al desasignar (`encargado = null`), `asignacion` pasa a `null` y no queda un objeto con `id` viejo.
- [ ] `ADMINISTRADOR` y `PLANIFICADOR` devuelven `asignacion: null`.
- [ ] Existe al menos un test de integración que cubra: asignado a tienda, asignado a CD, sin asignación.
- [ ] El listado no genera N+1 queries (verificar con el log SQL).

## 5. Qué se borra del frontend cuando esto esté listo

- `src/services/asignaciones.ts` completo (fallback temporal, 2 requests de más).
- El bloque `needsAsignacionFallback(...)` en `loadData` de `UsersPanel.tsx`.
- La carga de tiendas/CDs para pintar la tabla (queda solo la del modal).

**Ahorro:** 2 requests por carga de la tabla de usuarios y ~90 líneas de lógica
de reconstrucción de datos.

## 6. Fuera de alcance

`PUT /api/usuarios/{id}/asignacion` como endpoint dedicado. Sería más limpio
que el frontend tenga que llamar a `/tiendas/{id}/encargado` o
`/centros-distribucion/{id}/encargado` según el rol, pero se puede resolver en
un ticket aparte. Hoy alcanza con exponer el dato en lectura.
