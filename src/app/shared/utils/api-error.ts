/**
 * Errores de la API reingenierizada (ESPECIFICACION_FRONT §2).
 * El cuerpo del error es texto plano listo para mostrarse; el código estable viene en `X-Codigo-Error`.
 */

/** Mensajes propios del front para códigos que conviene explicar mejor. */
export const MENSAJES_CODIGO_ERROR: Record<string, string> = {
  MONEDERO_OTRA_SALA: 'Este monedero es de otra sala.',
  MONEDERO_SIN_PIN: 'El monedero no tiene PIN asignado. Asígnale uno antes de operar.',
  SEGUNDO_FACTOR_PENDIENTE: 'Debes configurar tu segundo factor de autenticación para continuar.',
  QR_VENCIDO: 'El código QR venció. Pide al afiliado que muestre el código actual.',
  QR_USADO: 'Ese código QR ya se usó. Pide al afiliado que muestre el código actual.',
  QR_DISPOSITIVO_REVOCADO: 'El teléfono de este monedero fue revocado.',
};

export interface ApiError {
  status: number;
  /** Mensaje listo para mostrar. */
  message: string;
  /** Igual que `message`: los componentes existentes leen `error.error`. */
  error: string;
  /** Código estable de `X-Codigo-Error`, si vino. */
  codigo: string | null;
  /** Cuerpo original. */
  raw: any;
}

export function textoDeError(cuerpo: any): string {
  if (typeof cuerpo === 'string') return cuerpo;
  return cuerpo?.message || cuerpo?.error || '';
}

/** Mensaje para mostrar a partir de cualquier error (ApiError, HttpErrorResponse o string). */
export function mensajeError(err: any, porDefecto = 'Ocurrió un error inesperado.'): string {
  if (!err) return porDefecto;
  if (typeof err === 'string') return err;
  const codigo = err.codigo as string | undefined;
  if (codigo && MENSAJES_CODIGO_ERROR[codigo]) return MENSAJES_CODIGO_ERROR[codigo];
  return (typeof err.error === 'string' && err.error) || textoDeError(err.raw ?? err.error) || err.message || porDefecto;
}

export function codigoError(err: any): string | null {
  return err?.codigo ?? err?.headers?.get?.('X-Codigo-Error') ?? null;
}
