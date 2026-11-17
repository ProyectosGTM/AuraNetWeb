import { Component, Input } from '@angular/core';
import { animate, group, query, style, transition, trigger } from '@angular/animations';

/**
 * Pantalla de carga homologada: ruleta de casino girando.
 * Uso: <app-cargando [visible]="loading" texto="Cargando Usuarios"></app-cargando>
 */
@Component({
  selector: 'app-cargando',
  animations: [
    trigger('cgSalida', [
      transition(':enter', [
        style({ opacity: 0 }),
        query('.cg-box', style({ opacity: 0, transform: 'scale(.9) translateY(10px)' })),
        group([
          animate('220ms ease-out', style({ opacity: 1 })),
          query('.cg-box', animate('380ms 60ms cubic-bezier(.16, 1, .3, 1)', style({ opacity: 1, transform: 'none' }))),
        ]),
      ]),
      transition(':leave', [
        group([
          query('.cg-box', animate('320ms cubic-bezier(.4, 0, .2, 1)', style({ opacity: 0, transform: 'scale(.85)', filter: 'blur(4px)' }))),
          animate('380ms 120ms ease', style({ opacity: 0 })),
        ]),
      ]),
    ]),
  ],
  template: `
    <div class="cg" *ngIf="visible" @cgSalida role="status" aria-live="polite">
      <div class="cg-box">
        <div class="cg-ruleta" aria-hidden="true">
          <span class="cg-arco"></span>
          <span class="cg-arco cg-arco--2"></span>
          <span class="cg-aro"></span>
          <span class="cg-rueda"></span>
          <span class="cg-pista"><span class="cg-bola"></span></span>
          <span class="cg-centro"><img src="assets/images/icono.png" alt="" /></span>
          <span class="cg-flecha"></span>
        </div>
        <strong class="cg-txt">{{ texto }}</strong>
        <span class="cg-sub">Un momento, por favor</span>
      </div>
    </div>
  `,
  styles: [`
    .cg {
      position: fixed; inset: 0; z-index: 1500; display: grid; place-items: center; padding: 16px;
      background: radial-gradient(circle at 50% 45%, rgba(228, 0, 65, .14), transparent 45%), rgba(8, 10, 16, .6);
      backdrop-filter: blur(5px);
    }
    .cg-box {
      display: flex; flex-direction: column; align-items: center; gap: .55rem;
      padding: 1.8rem 2.4rem 1.5rem; border-radius: 22px; font-family: 'Poppins', sans-serif;
      background: linear-gradient(165deg, #1b212d, #10141c);
      border: 1px solid rgba(148, 163, 184, .16);
      box-shadow: 0 30px 60px -24px rgba(0, 0, 0, .9);
    }

    /* Ruleta */
    .cg-ruleta { position: relative; width: 112px; height: 112px; margin: 14px 0 1.1rem; }
    /* Arcos de luz que giran: lo que se lee como \"cargando\" */
    .cg-arco {
      position: absolute; inset: -14px; border-radius: 50%;
      background: conic-gradient(from 0deg, transparent 0 55%, rgba(255, 26, 91, .15) 65%, #ff1a5b 88%, #ffd978 100%);
      -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 4px));
      mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 4px));
      filter: drop-shadow(0 0 6px rgba(255, 26, 91, .8));
      animation: cg-giro .85s linear infinite;
    }
    .cg-arco--2 {
      inset: -22px; opacity: .55;
      background: conic-gradient(from 180deg, transparent 0 70%, rgba(255, 201, 77, .2) 80%, #ffd978 100%);
      -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px));
      mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px));
      filter: drop-shadow(0 0 4px rgba(255, 201, 77, .7));
      animation: cg-giro-inv 1.6s linear infinite;
    }
    .cg-aro {
      position: absolute; inset: 0; border-radius: 50%;
      background: conic-gradient(from 0deg, #8a5a12, #ffd978, #b37d1a, #ffe7a3, #8a5a12, #ffd978, #b37d1a, #ffe7a3, #8a5a12);
      box-shadow: 0 0 0 1px rgba(0, 0, 0, .6), 0 10px 26px -8px rgba(255, 201, 77, .55);
    }
    .cg-rueda {
      position: absolute; inset: 7px; border-radius: 50%;
      background:
        radial-gradient(circle, transparent 58%, rgba(0, 0, 0, .35) 59%, transparent 61%),
        repeating-conic-gradient(#d4003c 0deg 10deg, #15111b 10deg 20deg);
      box-shadow: inset 0 0 0 2px rgba(255, 201, 77, .5), inset 0 0 18px rgba(0, 0, 0, .6);
      animation: cg-giro 1.6s linear infinite;
    }
    /* La casilla verde del cero */
    .cg-rueda::after {
      content: ''; position: absolute; inset: 0; border-radius: 50%;
      background: conic-gradient(from -5deg, #10b981 0deg 10deg, transparent 10deg);
      -webkit-mask: radial-gradient(circle, transparent 58%, #000 59%);
      mask: radial-gradient(circle, transparent 58%, #000 59%);
    }
    .cg-pista { position: absolute; inset: 4px; border-radius: 50%; animation: cg-giro-inv 1.3s cubic-bezier(.45, .05, .55, .95) infinite; }
    .cg-bola {
      position: absolute; top: 3px; left: 50%; width: 10px; height: 10px; margin-left: -5px; border-radius: 50%;
      background: radial-gradient(circle at 35% 30%, #fff, #c8ccd6 60%, #7c8291);
      box-shadow: 0 2px 4px rgba(0, 0, 0, .6);
    }
    .cg-centro {
      position: absolute; inset: 34px; border-radius: 50%; display: grid; place-items: center;
      background: radial-gradient(circle at 35% 30%, #ffe7a3, #c48a1e 70%);
      box-shadow: 0 0 0 3px #15111b, 0 4px 10px rgba(0, 0, 0, .6);
    }
    .cg-centro img { width: 26px; height: 26px; object-fit: contain; filter: drop-shadow(0 1px 1px rgba(0, 0, 0, .4)); }
    .cg-flecha {
      position: absolute; top: -6px; left: 50%; margin-left: -6px; width: 0; height: 0;
      border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 11px solid #ffd978;
      filter: drop-shadow(0 2px 2px rgba(0, 0, 0, .6));
    }

    /* Texto con brillo */
    .cg-txt {
      font-size: 1rem; font-weight: 500; letter-spacing: .02em;
      background: linear-gradient(90deg, #8b95a7 0%, #fff 45%, #ffd978 55%, #8b95a7 100%);
      background-size: 220% 100%; -webkit-background-clip: text; background-clip: text; color: transparent;
      animation: cg-brillo 1.8s linear infinite;
    }
    .cg-sub { font-size: .74rem; color: #8b95a7; }

    @keyframes cg-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes cg-giro { to { transform: rotate(360deg); } }
    @keyframes cg-giro-inv { to { transform: rotate(-360deg); } }
    @keyframes cg-brillo { from { background-position: 120% 0; } to { background-position: -120% 0; } }
    @media (prefers-reduced-motion: reduce) { .cg-rueda, .cg-pista, .cg-txt, .cg-arco { animation: none; } .cg-txt { color: #fff; } }
  `],
})
export class CargandoComponent {
  @Input() visible = false;
  @Input() texto = 'Cargando';
}
