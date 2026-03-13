import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { PromocionesService } from 'src/app/shared/services/promociones.service';

@Component({
  selector: 'app-detalle-promocion',
  templateUrl: './detalle-promocion.component.html',
  styleUrl: './detalle-promocion.component.scss',
  animations: [fadeInRightAnimation],
})
export class DetallePromocionComponent implements OnInit {
  id: number | null = null;
  promocion: any = null;
  loading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private promocionesService: PromocionesService
  ) {}

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.id = idParam ? +idParam : null;
    if (this.id != null) {
      this.cargar();
    } else {
      this.error = 'ID no válido';
    }
  }

  cargar() {
    if (this.id == null) return;
    this.loading = true;
    this.error = null;
    this.promocionesService.obtenerPorId(this.id).subscribe({
      next: (r) => {
        this.loading = false;
        this.promocion = r?.data ?? r ?? null;
      },
      error: (e) => {
        this.loading = false;
        this.error = e?.error?.message || e?.message || 'Error al cargar la promoción';
      },
    });
  }

  formatearFecha(f: string | null): string {
    if (!f) return '—';
    try {
      const d = new Date(f);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleString('es-MX');
    } catch {
      return '—';
    }
  }

  volver() {
    this.router.navigate(['/promociones/catalogo']);
  }

  irRollover() {
    if (this.id != null) {
      this.router.navigate(['/promociones/rollover', this.id]);
    }
  }
}
