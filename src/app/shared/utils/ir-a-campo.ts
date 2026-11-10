import Swal from 'sweetalert2';

/** Devuelve el nombre del control al que pertenece una fila de la lista de campos faltantes. */
export function campoDeEtiqueta(etiquetas: Record<string, string>, texto: string): string {
  let clave = '';
  let largo = -1;
  for (const key of Object.keys(etiquetas || {})) {
    const etiqueta = etiquetas[key];
    if ((texto === etiqueta || texto.startsWith(`${etiqueta}:`)) && etiqueta.length > largo) {
      clave = key;
      largo = etiqueta.length;
    }
  }
  return clave || (texto.split(':')[0].match(/^\w+$/)?.[0] ?? '');
}

function buscarCampo(clave: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[formcontrolname="${clave}"], [data-campo-destino="${clave}"]`);
}

let activo: { zona: HTMLElement; aviso: HTMLElement } | null = null;

function quitarResaltado(animado = true): void {
  if (!activo) return;
  const { zona, aviso } = activo;
  activo = null;
  const limpiar = () => {
    aviso.remove();
    if (activo?.zona !== zona) zona.classList.remove('campo-resaltado', 'campo-saliendo');
  };
  if (!animado) {
    limpiar();
    return;
  }
  zona.classList.add('campo-saliendo');
  setTimeout(limpiar, 240);
}

/** Toma el motivo de la fila ("RFC: obligatorio" → "Obligatorio"). */
function motivoDeFila(texto: string): string {
  const motivo = texto.includes(':') ? texto.slice(texto.indexOf(':') + 1).trim() : '';
  return motivo ? motivo.charAt(0).toUpperCase() + motivo.slice(1) : 'Obligatorio';
}

function resaltar(campo: HTMLElement, motivo: string): void {
  quitarResaltado(false);
  const zona = campo.closest<HTMLElement>('.field, .ap-field, .dc') ?? campo.parentElement ?? campo;
  zona.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const editable = campo.matches('input, textarea, select')
    ? campo
    : campo.querySelector<HTMLElement>('input:not([type="hidden"]):not([type="file"]), textarea, select');
  editable?.focus({ preventScroll: true });

  zona.classList.remove('campo-resaltado');
  void zona.offsetWidth; // reinicia la animación si se presiona de nuevo
  zona.classList.add('campo-resaltado');

  zona.classList.remove('campo-saliendo');

  const aviso = document.createElement('span');
  aviso.className = 'campo-aviso';
  aviso.textContent = motivo;
  zona.appendChild(aviso);
  activo = { zona, aviso };
}

/** Espera a que la alerta termine de cerrarse, porque al cerrar devuelve el foco y el scroll. */
function alCerrarAlerta(accion: () => void, intentos = 25): void {
  if (!Swal.isVisible() || intentos <= 0) {
    setTimeout(accion, 60);
    return;
  }
  setTimeout(() => alCerrarAlerta(accion, intentos - 1), 40);
}

function irACampo(evento: Event): void {
  const fila = (evento.target as HTMLElement | null)?.closest?.<HTMLElement>('.sw-falta[data-campo]');
  const clave = fila?.dataset['campo'];
  if (!clave || !buscarCampo(clave)) return;

  evento.preventDefault();
  const motivo = motivoDeFila(fila?.querySelector('.sw-falta-t')?.textContent?.trim() ?? '');
  Swal.close();
  alCerrarAlerta(() => {
    const campo = buscarCampo(clave);
    if (campo) resaltar(campo, motivo);
  });
}

// El resaltado se mantiene hasta que el usuario presiona un campo o escribe
document.addEventListener('pointerdown', (e) => {
  if ((e.target as HTMLElement | null)?.closest?.('input, textarea, select, .dx-texteditor, .dc')) quitarResaltado();
});
document.addEventListener('input', () => quitarResaltado());

// Un solo listener para todas las alertas de campos faltantes
document.addEventListener('click', irACampo);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') irACampo(e);
});
