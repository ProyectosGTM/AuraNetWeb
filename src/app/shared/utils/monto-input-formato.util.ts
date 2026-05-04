import { AbstractControl } from '@angular/forms';

/** Solo dígitos y un punto; máximo dos decimales (centavos con punto). */
export function extraerNumericaEditableMonto(s: string): string {
  const limpio = s.replace(/\$/g, '').replace(/,/g, '').replace(/\s/g, '');
  let out = '';
  let dot = false;
  for (const ch of limpio) {
    if (ch >= '0' && ch <= '9') {
      if (dot) {
        const dec = out.split('.')[1] ?? '';
        if (dec.length >= 2) {
          continue;
        }
      }
      out += ch;
    } else if (ch === '.' && !dot) {
      dot = true;
      out += '.';
    }
  }
  return out;
}

export function aNumeroDesdeNormMonto(sNorm: string): number | null {
  if (sNorm === '' || sNorm === '.') {
    return null;
  }
  const [e, d] = sNorm.split('.');
  const ent = e === '' ? '0' : e;
  const n = Number(d !== undefined ? `${ent}.${d}` : ent);
  return Number.isFinite(n) ? n : null;
}

/** Vista mientras escriben (miles con coma; decimales solo si hay punto). */
export function vistaMontoDesdeNorm(sNorm: string): string {
  if (sNorm === '') {
    return '';
  }
  if (sNorm === '.') {
    return '$.';
  }
  const tienePunto = sNorm.includes('.');
  const [izq, derBruto = ''] = tienePunto ? sNorm.split('.') : [sNorm, ''];
  const izqNum = izq === '' ? 0 : parseInt(izq, 10);
  const izqFmt = izqNum.toLocaleString('en-US');
  if (!tienePunto) {
    return '$' + izqFmt;
  }
  const der = derBruto.slice(0, 2);
  if (sNorm.endsWith('.') && der === '') {
    return '$' + izqFmt + '.';
  }
  return '$' + izqFmt + (der.length ? '.' + der : '');
}

/** Al salir del campo: entero sin decimales forzados; si hay centavos, dos cifras. */
export function vistaMontoDesdeNumero(n: number): string {
  if (!Number.isFinite(n)) {
    return '';
  }
  const neg = n < 0;
  const v = Math.abs(n);
  const intPart = Math.trunc(v);
  const frac = v - intPart;
  const intFmt = intPart.toLocaleString('en-US');
  if (frac < 1e-9) {
    return (neg ? '-' : '') + '$' + intFmt;
  }
  const cents = Math.round(frac * 100);
  const d = String(cents).padStart(2, '0');
  return (neg ? '-' : '') + '$' + intFmt + '.' + d;
}

function cursorMontoPorConteo(vista: string, nCount: number): number {
  if (nCount <= 0) {
    const p = vista.indexOf('$');
    return p >= 0 ? p + 1 : 0;
  }
  let seen = 0;
  for (let i = 0; i < vista.length; i++) {
    const ch = vista[i];
    if ((ch >= '0' && ch <= '9') || ch === '.') {
      seen++;
      if (seen > nCount) {
        return i;
      }
    }
  }
  return vista.length;
}

/** Actualiza el control numérico y el texto del input mientras escribe (solo formato visual). */
export function aplicarMontoInputEnCampo(el: HTMLInputElement, ctrl: AbstractControl | null): void {
  const sel = el.selectionStart ?? 0;
  const antes = extraerNumericaEditableMonto(el.value.slice(0, sel));
  const cnt = antes.length;
  const sNorm = extraerNumericaEditableMonto(el.value);
  const num = aNumeroDesdeNormMonto(sNorm);
  ctrl?.setValue(num);
  ctrl?.updateValueAndValidity({ emitEvent: false });
  const vista = vistaMontoDesdeNorm(sNorm);
  el.value = vista;
  const pos = cursorMontoPorConteo(vista, cnt);
  requestAnimationFrame(() => el.setSelectionRange(pos, pos));
}

/** Al perder foco: normaliza la vista según el número en el control. */
export function aplicarMontoBlurEnCampo(el: HTMLInputElement, ctrl: AbstractControl | null): void {
  const sNorm = extraerNumericaEditableMonto(el.value);
  const num = aNumeroDesdeNormMonto(sNorm);
  ctrl?.setValue(num);
  ctrl?.updateValueAndValidity({ emitEvent: false });
  el.value = num === null ? '' : vistaMontoDesdeNumero(num);
}

/** Texto formateado para pintar el input tras `patchValue` (edición). */
export function textoMontoDesdeValorControl(valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') {
    return '';
  }
  const n = Number(valor);
  if (!Number.isFinite(n)) {
    return '';
  }
  return vistaMontoDesdeNumero(n);
}
