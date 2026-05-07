import { Component } from '@angular/core';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { AgregarZonaComponent } from '../../zonas/agregar-zona/agregar-zona.component';

/**
 * Pantalla de **Salas**: diagrama de distribución (`/salas/distribucion/:idSala`).
 * Comparte implementación con el editor de plano en zonas; el dominio y el API de layout son de sala.
 */
@Component({
  selector: 'app-distribucion-sala',
  templateUrl: '../../zonas/agregar-zona/agregar-zona.component.html',
  styleUrls: ['../../zonas/agregar-zona/agregar-zona.component.scss'],
  animations: [fadeInRightAnimation],
})
export class DistribucionSalaComponent extends AgregarZonaComponent {}
