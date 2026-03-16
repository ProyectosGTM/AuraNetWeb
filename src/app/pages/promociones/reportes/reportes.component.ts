import { Component, OnInit } from '@angular/core';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { PromocionesService } from 'src/app/shared/services/promociones.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reportes-promociones',
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss',
  animations: [fadeInRightAnimation],
})
export class ReportesPromocionesComponent implements OnInit {
  reporteData: any = null;
  loading = false;

  constructor(private promocionesService: PromocionesService) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.loading = true;
    this.reporteData = null;
    this.promocionesService.reporte().subscribe({
      next: (r) => {
        this.loading = false;
        this.reporteData = r?.data ?? r ?? null;
      },
      error: (e) => {
        this.loading = false;
        Swal.fire({ title: 'Error', text: e?.error?.message || 'Error al cargar el reporte.', icon: 'error', background: '#0d121d', confirmButtonColor: '#3085d6' });
      },
    });
  }
}
