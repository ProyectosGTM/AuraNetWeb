import query from 'devextreme/data/query';

/** Texto que se muestra cuando un dato viene vacío (null, undefined, '' o solo espacios). */
export const VACIO = '--';

export function esVacio(v: any): boolean {
  return v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
}

/**
 * onCellPrepared de los grids de Administración: pone "--" en las celdas de datos vacías.
 * Las columnas con plantilla propia (acciones, imágenes, estatus) no se tocan.
 */
export function celdaVacia(e: any): void {
  if (e?.rowType !== 'data' || !e.column?.dataField || e.column?.cellTemplate) return;
  if (esVacio(e.value)) {
    e.cellElement.textContent = VACIO;
    e.cellElement.classList.add('celda-vacia');
  }
}

/**
 * Aplica en el navegador los filtros de columna y el buscador sobre la página cargada.
 * Los grids traen los datos página por página desde la API, que no recibe filtros.
 */
export function aplicarFiltroLocal<T>(filas: T[], loadOptions: any): T[] {
  const filtro = loadOptions?.filter;
  if (!filtro || !Array.isArray(filas) || !filas.length) return filas;
  try {
    return query(filas).filter(filtro).toArray() as T[];
  } catch {
    return filas;
  }
}

/** Opciones del filtro de Estatus (lista en lugar de texto libre). */
export const LOOKUP_ESTATUS = [
  { valor: 1, texto: 'Activo' },
  { valor: 0, texto: 'Inactivo' },
];
