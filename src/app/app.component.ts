import { Component, OnInit } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { rutaAuthAnimation } from './core/animaciones/ruta-auth.animation';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [rutaAuthAnimation],
})
export class AppComponent implements OnInit {
  /** Clave de la pantalla actual: cambia solo entre pantallas fuera del sistema. */
  claveRuta = '';
  /** Cortina con ficha giratoria al cambiar de pantalla (fuera del sistema o al entrar). */
  cortina = false;
  private timerCortina: any;

  constructor(private router: Router) { }

  private static esAuth(url: string): boolean {
    return /^\/(account|login)(\/|$|\?)/.test(url || '');
  }

  ngOnInit() {
    this.router.events.pipe(filter((e) => e instanceof NavigationStart)).subscribe((e: any) => {
      const desde = this.router.url;
      const hacia = e.url;
      // Solo cuando la navegación toca una pantalla fuera del sistema y realmente cambia de pantalla
      if ((AppComponent.esAuth(desde) || AppComponent.esAuth(hacia)) && desde.split('?')[0] !== hacia.split('?')[0] && desde !== '/') {
        clearTimeout(this.timerCortina);
        this.cortina = true;
        this.timerCortina = setTimeout(() => (this.cortina = false), 750);
      }
    });
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e: any) => {
      const url = (e.urlAfterRedirects || e.url || '').split('?')[0];
      // El sistema interno usa una sola clave para no animar su navegación (tiene su propio layout)
      this.claveRuta = AppComponent.esAuth(url) ? url : 'sistema';
    });
  }
}
