import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { PromocionesService } from 'src/app/shared/services/promociones.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-promociones-por-afiliado',
  templateUrl: './por-afiliado.component.html',
  styleUrl: './por-afiliado.component.scss',
  animations: [fadeInRightAnimation],
})
export class PromocionesPorAfiliadoComponent {
  form: FormGroup;
  list: any[] = [];
  loading = false;

  constructor(
    private fb: FormBuilder,
    private promocionesService: PromocionesService,
    private router: Router
  ) {
    this.form = this.fb.group({
      idAfiliado: ['', [Validators.required, Validators.min(1)]],
    });
  }

  buscar() {
    if (this.form.invalid) {
      Swal.fire({ title: 'Atención', text: 'Ingresa un ID de afiliado válido.', icon: 'warning', background: '#0d121d', confirmButtonColor: '#3085d6' });
      return;
    }
    const id = Number(this.form.value.idAfiliado);
    this.loading = true;
    this.list = [];
    this.promocionesService.porAfiliado(id).subscribe({
      next: (r) => {
        this.loading = false;
        const data = r?.data ?? r;
        this.list = Array.isArray(data) ? data : (data ? [data] : []);
      },
      error: (e) => {
        this.loading = false;
        this.list = [];
        Swal.fire({ title: 'Error', text: e?.error?.message || 'No se pudieron cargar las promociones.', icon: 'error', background: '#0d121d', confirmButtonColor: '#3085d6' });
      },
    });
  }

  formatearFecha(f: string | null): string {
    if (!f) return '—';
    try {
      const d = new Date(f);
      return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-MX');
    } catch { return '—'; }
  }

  verDetalle(id: number) {
    this.router.navigate(['/promociones/catalogo', id]);
  }
}
