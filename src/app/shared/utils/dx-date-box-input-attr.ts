/**
 * Atributos del input nativo interno de dx-date-box.
 * En HTTP, Chrome puede confundir fechas (p. ej. yyyy-MM-dd) con datos de pago y bloquear el clic.
 * Usar un slug por campo + tokens section-* y nombre único suele evitar el autofill agresivo.
 */
const ATTR_BASE: Record<string, string> = {
  autocorrect: 'off',
  spellcheck: 'false',
  'data-lpignore': 'true',
  'data-1p-ignore': 'true',
  'data-bwignore': 'true',
  inputmode: 'none',
};

export function dxDateBoxInputAttr(campo: string): Record<string, string> {
  const slug = campo.replace(/[^a-z0-9-]/gi, '').toLowerCase() || 'campo';
  return {
    ...ATTR_BASE,
    name: `aura-fecha-${slug}`,
    autocomplete: `section-auranet-${slug}`,
  };
}
