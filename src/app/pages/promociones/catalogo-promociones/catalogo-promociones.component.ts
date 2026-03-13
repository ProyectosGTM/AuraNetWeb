import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { lastValueFrom } from 'rxjs';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { PromocionesService } from 'src/app/shared/services/promociones.service';

@Component({
  selector: 'app-catalogo-promociones',
  templateUrl: './catalogo-promociones.component.html',
  styleUrl: './catalogo-promociones.component.scss',
  animations: [fadeInRightAnimation],
})
export class CatalogoPromocionesComponent {
  @ViewChild(DxDataGridComponent, { static: false }) dataGrid!: DxDataGridComponent;
  listaPromociones: any;
  loading = false;
  pageSize = 20;
  filtroVista: 'todas' | 'vigentes' | 'por-vencer' = 'todas';

  constructor(
    private promocionesService: PromocionesService,
    private router: Router
  ) {
    this.listaPromociones = new CustomStore({
      key: 'id',
      load: (opts) => this.loadData(opts),
    });
  }

  private async loadData(opts: any): Promise<{ data: any[]; totalCount: number }> {
    this.loading = true;
    try {
      let resp: any;
      if (this.filtroVista === 'vigentes') {
        resp = await lastValueFrom(this.promocionesService.vigentes());
      } else if (this.filtroVista === 'por-vencer') {
        resp = await lastValueFrom(this.promocionesService.porVencer());
      } else {
        resp = await lastValueFrom(this.promocionesService.listar());
      }
      this.loading = false;
      const data = Array.isArray(resp?.data) ? resp.data : (resp?.data ? [resp.data] : []);
      const list = (data || []).map((item: any) => ({
        ...item,
        fechaInicioFormateada: this.formatearFecha(item?.fechaInicio),
        fechaFinFormateada: this.formatearFecha(item?.fechaFin),
      }));
      const skip = opts?.skip ?? 0;
      const take = opts?.take ?? this.pageSize;
      const page = list.slice(skip, skip + take);
      return { data: page, totalCount: list.length };
    } catch (e) {
      this.loading = false;
      return { data: [], totalCount: 0 };
    }
  }

  formatearFecha(f: string | null): string {
    if (!f) return 'Sin registro';
    try {
      const d = new Date(f);
      if (isNaN(d.getTime())) return 'Sin registro';
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      return 'Sin registro';
    }
  }

  setFiltro(f: 'todas' | 'vigentes' | 'por-vencer') {
    this.filtroVista = f;
    this.dataGrid?.instance?.refresh();
  }

  verDetalle(id: number) {
    this.router.navigate(['/promociones/catalogo', id]);
  }

  refreshGrid() {
    this.dataGrid?.instance?.refresh();
  }
}
