import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { PromocionesService } from 'src/app/shared/services/promociones.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pendientes-conversion',
  templateUrl: './pendientes-conversion.component.html',
  styleUrl: './pendientes-conversion.component.scss',
  animations: [fadeInRightAnimation],
})
export class PendientesConversionComponent implements OnInit {
  list: any[] = [];
  loading = false;

  constructor(
    private promocionesService: PromocionesService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.loading = true;
    this.list = [];
    this.promocionesService.pendientesConversion().subscribe({
      next: (r) => {
        this.loading = false;
        const data = r?.data ?? r;
        this.list = Array.isArray(data) ? data : (data ? [data] : []);
      },
      error: (e) => {
        this.loading = false;
        Swal.fire({ title: 'Error', text: e?.error?.message || 'Error al cargar pendientes de conversión.', icon: 'error', background: '#0d121d', confirmButtonColor: '#3085d6' });
      },
    });
  }

  formatearFecha(f: string | null): string {
    if (!f) return '—';
    try {
      const d = new Date(f);
      return isNaN(d.getTime()) ? '—' : d.toLocaleString('es-MX');
    } catch { return '—'; }
  }

  verDetalle(id: number) {
    this.router.navigate(['/promociones/catalogo', id]);
  }
}
