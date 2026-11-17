import { animate, group, query, style, transition, trigger } from '@angular/animations';

/**
 * Transición entre pantallas fuera del sistema: fundido cruzado limpio.
 * Sin movimientos laterales ni giros, para que nada se descuadre.
 */
export const rutaAuthAnimation = trigger('rutaAuth', [
  transition('* <=> *', [
    query(':enter, :leave', [
      style({ position: 'absolute', inset: 0, width: '100%' }),
    ], { optional: true }),
    group([
      query(':leave', [
        style({ opacity: 1 }),
        animate('300ms ease', style({ opacity: 0 })),
      ], { optional: true }),
      query(':enter', [
        style({ opacity: 0 }),
        animate('450ms 120ms ease', style({ opacity: 1 })),
      ], { optional: true }),
    ]),
  ]),
]);
