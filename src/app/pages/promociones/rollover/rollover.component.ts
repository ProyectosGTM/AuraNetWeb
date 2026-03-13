import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { PromocionesService } from 'src/app/shared/services/promociones.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-rollover-promociones',
  templateUrl: './rollover.component.html',
  styleUrl: './rollover.component.scss',
  animations: [fadeInRightAnimation],
})
export class RolloverPromocionesComponent implements OnInit {
  idPromocion: number | null = null;
  rolloverData: any = null;
  historialData: any[] = [];
  promocion: any = null;
  loading = false;
  loadingHistorial = false;
  tab: 'estado' | 'historial' = 'estado';
  listaVigentes: any[] = [];
  loadingLista = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private promocionesService: PromocionesService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.idPromocion = id ? +id : null;
    if (this.idPromocion != null) {
      this.cargarRollover();
      this.cargarPromocion();
    } else {
      this.cargarVigentes();
    }
  }

  cargarVigentes() {
    this.loadingLista = true;
    this.promocionesService.vigentes().subscribe({
      next: (r) => {
        this.loadingLista = false;
        const data = r?.data ?? r;
        this.listaVigentes = Array.isArray(data) ? data : (data ? [data] : []);
      },
      error: () => { this.loadingLista = false; this.listaVigentes = []; },
    });
  }

  cargarPromocion() {
    if (this.idPromocion == null) return;
    this.promocionesService.obtenerPorId(this.idPromocion).subscribe({
      next: (r) => {
        this.promocion = r?.data ?? r ?? null;
      },
      error: () => {},
    });
  }

  cargarRollover() {
    if (this.idPromocion == null) return;
    this.loading = true;
    this.rolloverData = null;
    this.promocionesService.rollover(this.idPromocion).subscribe({
      next: (r) => {
        this.loading = false;
        this.rolloverData = r?.data ?? r ?? null;
      },
      error: (e) => {
        this.loading = false;
        Swal.fire({ title: 'Error', text: e?.error?.message || 'Error al cargar rollover.', icon: 'error', background: '#0d121d', confirmButtonColor: '#3085d6' });
      },
    });
  }

  cargarHistorial() {
    if (this.idPromocion == null) return;
    this.loadingHistorial = true;
    this.historialData = [];
    this.promocionesService.rolloverHistorial(this.idPromocion).subscribe({
      next: (r) => {
        this.loadingHistorial = false;
        const data = r?.data ?? r;
        this.historialData = Array.isArray(data) ? data : (data ? [data] : []);
      },
      error: (e) => {
        this.loadingHistorial = false;
        Swal.fire({ title: 'Error', text: e?.error?.message || 'Error al cargar historial.', icon: 'error', background: '#0d121d', confirmButtonColor: '#3085d6' });
      },
    });
  }

  setTab(t: 'estado' | 'historial') {
    this.tab = t;
    if (t === 'historial' && this.historialData.length === 0 && !this.loadingHistorial) {
      this.cargarHistorial();
    }
  }

  volver() {
    this.router.navigate(['/promociones/rollover']);
  }

  irSelector() {
    this.router.navigate(['/promociones/rollover']);
  }
}
