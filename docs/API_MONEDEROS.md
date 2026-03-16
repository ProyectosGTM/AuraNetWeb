# Documentación API - Monederos

## 📋 Información General

**Base URL:** `https://auran3t.mx/api`  
**Swagger UI:** `https://auran3t.mx/api/docs`  
**Módulo:** Monederos  
**Versión API:** (Consultar en Swagger)

---

## 📚 Índice

1. [Endpoints Principales](#endpoints-principales)
2. [Modelos de Datos](#modelos-de-datos)
3. [Endpoints CRUD](#endpoints-crud)
4. [Endpoints POS (Punto de Venta)](#endpoints-pos-punto-de-venta)
5. [Endpoints de Operaciones](#endpoints-de-operaciones)
6. [Endpoints de Consulta](#endpoints-de-consulta)
7. [Códigos de Estado HTTP](#códigos-de-estado-http)
8. [Manejo de Errores](#manejo-de-errores)
9. [Integración con Angular](#integración-con-angular)

---

## Endpoints Principales

### Base Path
```
/monederos
```

### Endpoints POS (Punto de Venta)
```
/pos/monederos
```

---

## Modelos de Datos

### Monedero (Modelo Principal)

```typescript
interface Monedero {
  id: number;
  numeroMonedero: string;
  alias?: string;
  idAfiliado: number;
  idEstatusMonedero: number;
  saldoEfectivo?: number;
  saldoPromocional?: number;
  saldoPuntos?: number;
  fechaCreacion?: string;
  fechaUltimaActualizacion?: string;
  // ... (completar con campos del Swagger)
}
```

### Estatus Monedero

```typescript
interface EstatusMonedero {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}
```

### Afiliado

```typescript
interface Afiliado {
  id: number;
  nombreCompleto: string;
  numeroIdentificacion: string;
  // ... (completar con campos del Swagger)
}
```

### Movimiento Monedero

```typescript
interface MovimientoMonedero {
  id: number;
  idMonedero: number;
  tipoMovimiento: string;
  monto: number;
  saldoAnterior: number;
  saldoNuevo: number;
  fechaMovimiento: string;
  idTurnoCaja?: number;
  observaciones?: string;
  // ... (completar con campos del Swagger)
}
```

---

## Endpoints CRUD

### 1. Obtener Lista de Monederos (Paginado)

**Endpoint:** `GET /monederos/{page}/{pageSize}`

**Descripción:** Obtiene una lista paginada de monederos.

**Parámetros:**
- `page` (path, required): Número de página (integer)
- `pageSize` (path, required): Tamaño de página (integer)

**Respuesta Exitosa (200):**
```json
{
  "data": [
    {
      "id": 1,
      "numeroMonedero": "MON001",
      "alias": "Monedero Principal",
      "idAfiliado": 123,
      "idEstatusMonedero": 1,
      "saldoEfectivo": 1000.00,
      "saldoPromocional": 500.00,
      "saldoPuntos": 2500
    }
  ],
  "total": 100,
  "page": 1,
  "pageSize": 20
}
```

**Uso en Angular:**
```typescript
obtenerMonederosData(page: number, pageSize: number): Observable<any> {
  return this.http.get(`${environment.API_SECURITY}/monederos/${page}/${pageSize}`);
}
```

---

### 2. Obtener Lista Completa de Monederos

**Endpoint:** `GET /monederos/list`

**Descripción:** Obtiene la lista completa de monederos (sin paginación).

**Respuesta Exitosa (200):**
```json
[
  {
    "id": 1,
    "numeroMonedero": "MON001",
    "alias": "Monedero Principal",
    "idAfiliado": 123
  }
]
```

**Uso en Angular:**
```typescript
obtenerMonederos(): Observable<any> {
  return this.http.get(`${environment.API_SECURITY}/monederos/list`);
}
```

---

### 3. Obtener Monedero por ID

**Endpoint:** `GET /monederos/{idMonedero}`

**Descripción:** Obtiene los detalles de un monedero específico.

**Parámetros:**
- `idMonedero` (path, required): ID del monedero (integer)

**Respuesta Exitosa (200):**
```json
{
  "id": 1,
  "numeroMonedero": "MON001",
  "alias": "Monedero Principal",
  "idAfiliado": 123,
  "idEstatusMonedero": 1,
  "saldoEfectivo": 1000.00,
  "saldoPromocional": 500.00,
  "saldoPuntos": 2500,
  "fechaCreacion": "2024-01-15T10:30:00Z",
  "fechaUltimaActualizacion": "2024-01-20T14:45:00Z"
}
```

**Uso en Angular:**
```typescript
obtenerMonedero(idMonedero: number): Observable<any> {
  return this.http.get<any>(`${environment.API_SECURITY}/monederos/${idMonedero}`);
}
```

---

### 4. Crear Monedero

**Endpoint:** `POST /monederos`

**Descripción:** Crea un nuevo monedero.

**Body (JSON):**
```json
{
  "numeroMonedero": "MON001",
  "alias": "Monedero Principal",
  "idAfiliado": 123,
  "idEstatusMonedero": 1
}
```

**Respuesta Exitosa (201):**
```json
{
  "id": 1,
  "numeroMonedero": "MON001",
  "alias": "Monedero Principal",
  "idAfiliado": 123,
  "idEstatusMonedero": 1,
  "fechaCreacion": "2024-01-15T10:30:00Z"
}
```

**Uso en Angular:**
```typescript
agregarMonedero(data: any) {
  return this.http.post(environment.API_SECURITY + '/monederos', data);
}
```

---

### 5. Actualizar Monedero

**Endpoint:** `PATCH /monederos/{idMonedero}`

**Descripción:** Actualiza un monedero existente (actualización parcial).

**Parámetros:**
- `idMonedero` (path, required): ID del monedero (integer)

**Body (JSON):**
```json
{
  "alias": "Monedero Actualizado",
  "idEstatusMonedero": 2
}
```

**Respuesta Exitosa (200):**
```json
{
  "id": 1,
  "numeroMonedero": "MON001",
  "alias": "Monedero Actualizado",
  "idEstatusMonedero": 2,
  "fechaUltimaActualizacion": "2024-01-20T14:45:00Z"
}
```

**Uso en Angular:**
```typescript
actualizarMonedero(idMonedero: number, saveForm: any): Observable<any> {
  return this.http.patch(`${environment.API_SECURITY}/monederos/${idMonedero}`, saveForm);
}
```

---

### 6. Eliminar Monedero

**Endpoint:** `DELETE /monederos/{idMonedero}`

**Descripción:** Elimina un monedero (soft delete o hard delete según implementación).

**Parámetros:**
- `idMonedero` (path, required): ID del monedero (integer)

**Respuesta Exitosa (200 o 204):**
```json
{
  "message": "Monedero eliminado exitosamente"
}
```

**Uso en Angular:**
```typescript
eliminarMonedero(idMonedero: Number) {
  return this.http.delete(environment.API_SECURITY + '/monederos/' + idMonedero);
}
```

---

### 7. Actualizar Estatus de Monedero

**Endpoint:** `PATCH /monederos/estatus/{id}`

**Descripción:** Actualiza únicamente el estatus de un monedero.

**Parámetros:**
- `id` (path, required): ID del monedero (integer)

**Body (JSON):**
```json
{
  "estatus": 1
}
```

**Respuesta Exitosa (200):**
```
"Estatus actualizado exitosamente"
```

**Uso en Angular:**
```typescript
updateEstatus(id: number, estatus: number): Observable<string> {
  const url = `${this.apiUrl}/estatus/${id}`;
  const body = { estatus };
  return this.http.patch(url, body, { responseType: 'text' });
}
```

---

## Endpoints POS (Punto de Venta)

### 1. Cargar Monedero

**Endpoint:** `POST /pos/monederos/cargar`

**Descripción:** Realiza una carga de efectivo a un monedero desde una caja.

**Body (JSON):**
```json
{
  "idTurnoCaja": 1,
  "idMonedero": 123,
  "monto": 500.00,
  "idTipoSaldo": 1,
  "observaciones": "Carga inicial"
}
```

**Respuesta Exitosa (200):**
```json
{
  "id": 1,
  "idMonedero": 123,
  "idTurnoCaja": 1,
  "monto": 500.00,
  "saldoAnterior": 0.00,
  "saldoNuevo": 500.00,
  "fechaMovimiento": "2024-01-15T10:30:00Z"
}
```

**Uso en Angular:**
```typescript
cargarMonedero(data: any): Observable<any> {
  return this.http.post(`${environment.API_SECURITY}/pos/monederos/cargar`, data);
}
```

---

### 2. Descargar Monedero

**Endpoint:** `POST /pos/monederos/descargar`

**Descripción:** Transfiere efectivo de un monedero a una caja.

**Body (JSON):**
```json
{
  "idTurnoCaja": 1,
  "idMonedero": 123,
  "monto": 200.00,
  "idTipoSaldo": 1,
  "observaciones": "Descarga parcial"
}
```

**Respuesta Exitosa (200):**
```json
{
  "id": 2,
  "idMonedero": 123,
  "idTurnoCaja": 1,
  "monto": 200.00,
  "saldoAnterior": 500.00,
  "saldoNuevo": 300.00,
  "fechaMovimiento": "2024-01-15T11:00:00Z"
}
```

**Uso en Angular:**
```typescript
descargarMonedero(data: any): Observable<any> {
  return this.http.post(`${environment.API_SECURITY}/pos/monederos/descargar`, data);
}
```

---

### 3. Consultar Saldo por Número

**Endpoint:** `GET /pos/monederos/{numero}`

**Descripción:** Consulta el saldo de un monedero usando su número o identificador RFID.

**Parámetros:**
- `numero` (path, required): Número del monedero o identificador RFID (string)

**Respuesta Exitosa (200):**
```json
{
  "id": 123,
  "numeroMonedero": "MON001",
  "alias": "Monedero Principal",
  "saldoEfectivo": 500.00,
  "saldoPromocional": 200.00,
  "saldoPuntos": 1000,
  "idEstatusMonedero": 1,
  "estatusNombre": "Activo"
}
```

**Uso en Angular:**
```typescript
consultarSaldoMonedero(numero: string): Observable<any> {
  return this.http.get(`${environment.API_SECURITY}/pos/monederos/${numero}`);
}
```

---

## Endpoints de Operaciones

### 1. Cambiar Estatus de Monedero

**Endpoint:** `POST /monederos/cambiar-estatus`

**Descripción:** Cambia el estatus de un monedero con motivo.

**Body (JSON):**
```json
{
  "idMonedero": 123,
  "idEstatusMonedero": 2,
  "motivo": "Monedero bloqueado por reporte de pérdida"
}
```

**Respuesta Exitosa (200):**
```json
{
  "id": 123,
  "idEstatusMonedero": 2,
  "estatusNombre": "Bloqueado",
  "fechaCambio": "2024-01-20T14:45:00Z",
  "motivo": "Monedero bloqueado por reporte de pérdida"
}
```

**Uso en Angular:**
```typescript
cambiarEstatus(payload: { 
  idMonedero: number; 
  idEstatusMonedero: number; 
  motivo: string 
}): Observable<any> {
  return this.http.post(`${environment.API_SECURITY}/monederos/cambiar-estatus`, payload);
}
```

---

### 2. Traspaso entre Monederos

**Endpoint:** `POST /monederos/traspaso`

**Descripción:** Transfiere saldo entre monederos del mismo afiliado.

**Body (JSON):**
```json
{
  "idTurnoCaja": 1,
  "idMonederoOrigen": 123,
  "idMonederoDestino": 124,
  "monto": 100.00
}
```

**Respuesta Exitosa (200):**
```json
{
  "idMovimientoOrigen": 10,
  "idMovimientoDestino": 11,
  "monto": 100.00,
  "fechaMovimiento": "2024-01-20T15:00:00Z"
}
```

**Uso en Angular:**
```typescript
traspasoMonedero(payload: {
  idTurnoCaja: number;
  idMonederoOrigen: number;
  idMonederoDestino: number;
  monto: number;
}): Observable<any> {
  return this.http.post(`${environment.API_SECURITY}/monederos/traspaso`, payload);
}
```

---

### 3. Ajuste de Saldo (Solo GERENTE)

**Endpoint:** `POST /monederos/ajuste`

**Descripción:** Ajusta el saldo de un monedero (requiere permisos de gerente).

**Body (JSON):**
```json
{
  "idMonedero": 123,
  "tipoAjuste": "positivo",
  "idTipoSaldo": 1,
  "monto": 50.00,
  "justificacion": "Ajuste por error en sistema"
}
```

**Parámetros:**
- `tipoAjuste`: `"positivo"` | `"negativo"`

**Respuesta Exitosa (200):**
```json
{
  "id": 12,
  "idMonedero": 123,
  "tipoAjuste": "positivo",
  "monto": 50.00,
  "saldoAnterior": 500.00,
  "saldoNuevo": 550.00,
  "fechaAjuste": "2024-01-20T16:00:00Z",
  "justificacion": "Ajuste por error en sistema"
}
```

**Uso en Angular:**
```typescript
ajusteMonedero(payload: {
  idMonedero: number;
  tipoAjuste: 'positivo' | 'negativo';
  idTipoSaldo: number;
  monto: number;
  justificacion: string;
}): Observable<any> {
  return this.http.post(`${environment.API_SECURITY}/monederos/ajuste`, payload);
}
```

---

### 4. Reemplazar Monedero

**Endpoint:** `POST /monederos/reemplazar`

**Descripción:** Reemplaza un monedero por uno nuevo, opcionalmente transfiriendo el saldo.

**Body (JSON):**
```json
{
  "idMonederoAnterior": 123,
  "numeroMonederoNuevo": "MON002",
  "motivo": "Monedero dañado",
  "transferirSaldo": true
}
```

**Respuesta Exitosa (200):**
```json
{
  "idMonederoAnterior": 123,
  "idMonederoNuevo": 124,
  "numeroMonederoNuevo": "MON002",
  "saldoTransferido": 500.00,
  "fechaReemplazo": "2024-01-20T17:00:00Z"
}
```

**Uso en Angular:**
```typescript
reemplazarMonedero(payload: {
  idMonederoAnterior: number;
  numeroMonederoNuevo: string;
  motivo: string;
  transferirSaldo: boolean;
}): Observable<any> {
  return this.http.post(`${environment.API_SECURITY}/monederos/reemplazar`, payload);
}
```

---

## Endpoints de Consulta

### 1. Obtener Monederos por Afiliado

**Endpoint:** `GET /monederos/afiliado/{idAfiliado}`

**Descripción:** Obtiene todos los monederos asociados a un afiliado.

**Parámetros:**
- `idAfiliado` (path, required): ID del afiliado (integer)

**Respuesta Exitosa (200):**
```json
[
  {
    "id": 123,
    "numeroMonedero": "MON001",
    "alias": "Monedero Principal",
    "saldoEfectivo": 500.00,
    "saldoPromocional": 200.00,
    "idEstatusMonedero": 1
  },
  {
    "id": 124,
    "numeroMonedero": "MON002",
    "alias": "Monedero Secundario",
    "saldoEfectivo": 300.00,
    "saldoPromocional": 100.00,
    "idEstatusMonedero": 1
  }
]
```

**Uso en Angular:**
```typescript
obtenerMonederosPorAfiliado(idAfiliado: number): Observable<any> {
  return this.http.get(`${environment.API_SECURITY}/monederos/afiliado/${idAfiliado}`);
}
```

---

### 2. Historial de Movimientos

**Endpoint:** `GET /monederos/movimientos/historial/{idMonedero}`

**Descripción:** Obtiene el historial completo de movimientos de un monedero.

**Parámetros:**
- `idMonedero` (path, required): ID del monedero (integer)

**Query Parameters (opcionales):**
- `fechaInicio` (query, optional): Fecha de inicio (ISO 8601)
- `fechaFin` (query, optional): Fecha de fin (ISO 8601)
- `tipoMovimiento` (query, optional): Tipo de movimiento a filtrar

**Respuesta Exitosa (200):**
```json
[
  {
    "id": 1,
    "idMonedero": 123,
    "tipoMovimiento": "Carga",
    "monto": 500.00,
    "saldoAnterior": 0.00,
    "saldoNuevo": 500.00,
    "fechaMovimiento": "2024-01-15T10:30:00Z",
    "idTurnoCaja": 1,
    "observaciones": "Carga inicial"
  },
  {
    "id": 2,
    "idMonedero": 123,
    "tipoMovimiento": "Descarga",
    "monto": 200.00,
    "saldoAnterior": 500.00,
    "saldoNuevo": 300.00,
    "fechaMovimiento": "2024-01-15T11:00:00Z",
    "idTurnoCaja": 1,
    "observaciones": "Descarga parcial"
  }
]
```

**Uso en Angular:**
```typescript
obtenerHistorialMovimientosMonedero(idMonedero: number): Observable<any> {
  return this.http.get(`${environment.API_SECURITY}/monederos/movimientos/historial/${idMonedero}`);
}
```

---

## Endpoints de Catálogos Relacionados

### 1. Obtener Lista de Afiliados

**Endpoint:** `GET /afiliados/list`

**Descripción:** Obtiene la lista completa de afiliados para usar en selectores.

**Respuesta Exitosa (200):**
```json
[
  {
    "id": 1,
    "nombreCompleto": "Juan Pérez",
    "numeroIdentificacion": "1234567890"
  }
]
```

**Uso en Angular:**
```typescript
obtenerAfiliados(): Observable<any> {
  return this.http.get(`${environment.API_SECURITY}/afiliados/list`);
}
```

---

### 2. Obtener Estatus de Monedero

**Endpoint:** `GET /catestatusmonedero/list`

**Descripción:** Obtiene la lista de estatus disponibles para monederos.

**Respuesta Exitosa (200):**
```json
[
  {
    "id": 1,
    "nombre": "Activo",
    "descripcion": "Monedero activo y operativo"
  },
  {
    "id": 2,
    "nombre": "Bloqueado",
    "descripcion": "Monedero bloqueado temporalmente"
  },
  {
    "id": 3,
    "nombre": "Cancelado",
    "descripcion": "Monedero cancelado permanentemente"
  }
]
```

**Uso en Angular:**
```typescript
obtenerEstatusMonedero(): Observable<any> {
  return this.http.get(`${environment.API_SECURITY}/catestatusmonedero/list`);
}
```

---

## Códigos de Estado HTTP

### Códigos de Éxito

- **200 OK:** Solicitud exitosa
- **201 Created:** Recurso creado exitosamente
- **204 No Content:** Operación exitosa sin contenido de respuesta

### Códigos de Error del Cliente

- **400 Bad Request:** Solicitud mal formada o parámetros inválidos
- **401 Unauthorized:** No autenticado o token inválido
- **403 Forbidden:** No tiene permisos para realizar la operación
- **404 Not Found:** Recurso no encontrado
- **409 Conflict:** Conflicto (ej: monedero duplicado)
- **422 Unprocessable Entity:** Validación fallida

### Códigos de Error del Servidor

- **500 Internal Server Error:** Error interno del servidor
- **503 Service Unavailable:** Servicio temporalmente no disponible

---

## Manejo de Errores

### Formato de Error Estándar

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensaje de error descriptivo",
    "details": {
      "field": "Campo específico con error",
      "reason": "Razón del error"
    },
    "timestamp": "2024-01-20T14:45:00Z"
  }
}
```

### Errores Comunes

#### 400 - Validación Fallida
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos proporcionados no son válidos",
    "details": {
      "monto": "El monto debe ser mayor a 0",
      "idMonedero": "El monedero no existe"
    }
  }
}
```

#### 403 - Sin Permisos
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "No tiene permisos para realizar ajustes de saldo. Se requiere rol de GERENTE"
  }
}
```

#### 409 - Conflicto
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "El número de monedero ya existe",
    "details": {
      "numeroMonedero": "MON001"
    }
  }
}
```

---

## Integración con Angular

### Servicio Completo

El servicio `MonederosServices` ya está implementado en:
```
src/app/shared/services/monederos.service.ts
```

### Ejemplo de Uso en Componente

```typescript
import { MonederosServices } from 'src/app/shared/services/monederos.service';

export class MiComponente {
  constructor(private monederosService: MonederosServices) {}
  
  cargarDatos() {
    this.monederosService.obtenerMonederosData(1, 20).subscribe({
      next: (response) => {
        this.listaMonederos = response.data;
        this.totalRegistros = response.total;
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los monederos'
        });
      }
    });
  }
  
  cargarMonedero(datos: any) {
    this.monederosService.cargarMonedero(datos).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Monedero cargado exitosamente'
        });
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'Error al cargar monedero'
        });
      }
    });
  }
}
```

---

## Notas Importantes

### Autenticación

Todos los endpoints requieren autenticación mediante token JWT en el header:
```
Authorization: Bearer {token}
```

### Validaciones Comunes

1. **Monto:** Debe ser mayor a 0 y tener máximo 2 decimales
2. **Número de Monedero:** Debe ser único en el sistema
3. **Estatus:** Solo ciertos cambios de estatus son permitidos según reglas de negocio
4. **Saldo:** No se puede descargar más saldo del disponible

### Permisos

- **Operaciones POS:** Requieren turno de caja activo
- **Ajustes de Saldo:** Requieren rol de GERENTE
- **Reemplazo de Monedero:** Requiere justificación y aprobación

---

## Próximos Pasos

1. ✅ Revisar Swagger UI en `https://auran3t.mx/api/docs`
2. ✅ Completar modelos de datos con campos exactos del Swagger
3. ✅ Agregar ejemplos de request/response reales
4. ✅ Documentar query parameters adicionales
5. ✅ Agregar diagramas de flujo para operaciones complejas
6. ✅ Documentar reglas de negocio específicas

---

## Referencias

- **Swagger UI:** https://auran3t.mx/api/docs
- **Servicio Angular:** `src/app/shared/services/monederos.service.ts`
- **Componente Lista:** `src/app/pages/monederos/lista-monederos/`
- **Componente Agregar:** `src/app/pages/monederos/agregar-monedero/`

---

**Última actualización:** 2024  
**Versión del documento:** 1.0  
**Basado en:** Swagger API Documentation
