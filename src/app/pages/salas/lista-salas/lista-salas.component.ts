import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { NgxPermissionsService } from 'ngx-permissions';
import { forkJoin, lastValueFrom, map, of, switchMap } from 'rxjs';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { ModulosService } from 'src/app/shared/services/modulos.service';
import { SalaService } from 'src/app/shared/services/salas.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-lista-modulos',
  templateUrl: './lista-salas.component.html',
  styleUrl: './lista-salas.component.scss',
  animations: [fadeInRightAnimation],
})
export class ListaSalasComponent {
  public mensajeAgrupar: string = 'Arrastre un encabezado de columna aquí para agrupar por esa columna';
  public listaSalas: any;
  public showFilterRow: boolean;
  public showHeaderFilter: boolean;
  public loading: boolean;
  public loadingMessage: string = 'Cargando...';
  public showExportGrid: boolean;
  public paginaActual: number = 1;
  public totalRegistros: number = 0;
  public pageSize: number = 20;
  public totalPaginas: number = 0;
  @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;
  public autoExpandAllGroups: boolean = true;
  isGrouped: boolean = false;
  public paginaActualData: any[] = [];
  public filtroActivo: string = '';


  constructor(
    private router: Router,
    private salasService: SalaService,
  ) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit() {
    this.setupDataSource();
    // this.obtenerlistaSalas();
  }


  obtenerlistaSalas() {
    this.loading = true;
    this.salasService.obtenerSalas().subscribe((response: any[]) => {
      this.loading = false;
      this.listaSalas = response;
    });
  }

  agregar() {
    this.router.navigateByUrl('/salas/agregar-sala');
  }

  actualizarSala(id: Number) {
    this.router.navigateByUrl('/salas/editar-sala/' + id);
  }

  activar(rowData: any) {
    Swal.fire({
      title: '¡Activar!',
      html: `¿Está seguro que requiere activar la sala: <strong>${rowData.nombreSala || rowData.nombre}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      background: '#0d121d'
    }).then((result) => {
      if (result.value) {
        this.salasService.updateEstatus(rowData.id, 1).subscribe(
          (response) => {
            Swal.fire({
              title: '¡Confirmación Realizada!',
              html: `La sala ha sido activada.`,
              icon: 'success',
              background: '#0d121d',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            })

            this.setupDataSource();
            this.dataGrid.instance.refresh();
            // this.obtenerlistaSalas();
          },
          (error) => {
            Swal.fire({
              title: '¡Ops!',
              html: `${error}`,
              icon: 'error',
              background: '#0d121d',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            })
          }
        );
      }
    });
  }

  desactivar(rowData: any) {
    Swal.fire({
      title: '¡Desactivar!',
      html: `¿Está seguro que requiere desactivar la sala: <strong>${rowData.nombreSala || rowData.nombre}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      background: '#0d121d'
    }).then((result) => {
      if (result.value) {
        this.salasService.updateEstatus(rowData.id, 0).subscribe(
          (response) => {
            Swal.fire({
              title: '¡Confirmación Realizada!',
              html: `La sala ha sido desactivada.`,
              icon: 'success',
              background: '#0d121d',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            })
            this.setupDataSource();
            this.dataGrid.instance.refresh();
            // this.obtenerlistaSalas();
          },
          (error) => {
            Swal.fire({
              title: '¡Ops!',
              html: `${error}`,
              icon: 'error',
              background: '#0d121d',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            })
          }
        );
      }
    });
    // console.log('Desactivar:', rowData);
  }

  onPageIndexChanged(e: any) {
    const pageIndex = e.component.pageIndex();
    this.paginaActual = pageIndex + 1;
    e.component.refresh();
  }

  setupDataSource() {
    this.loading = true;

    this.listaSalas = new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        const take = Number(loadOptions?.take) || this.pageSize || 10;
        const skip = Number(loadOptions?.skip) || 0;
        const page = Math.floor(skip / take) + 1;

        try {
          const resp: any = await lastValueFrom(
            this.salasService.obtenerSalasData(page, take)
          );
          this.loading = false;
          const rows: any[] = Array.isArray(resp?.data) ? resp.data : [];
          const meta = resp?.paginated || {};
          const totalRegistros =
            toNum(meta.total) ??
            toNum(resp?.total) ??
            rows.length;

          const paginaActual =
            toNum(meta.page) ??
            toNum(resp?.page) ??
            page;

          const totalPaginas =
            toNum(meta.lastPage) ??
            toNum(resp?.pages) ??
            Math.max(1, Math.ceil(totalRegistros / take));

          const dataTransformada = rows.map((item: any) => ({
            ...item,
            estatusTexto:
              item?.estatus === 1 ? 'Activo' :
                item?.estatus === 0 ? 'Inactivo' : null
          }));

          this.totalRegistros = totalRegistros;
          this.paginaActual = paginaActual;
          this.totalPaginas = totalPaginas;
          this.paginaActualData = dataTransformada;

          return {
            data: dataTransformada,
            totalCount: totalRegistros
          };
        } catch (err) {
          this.loading = false;
          console.error('Error en la solicitud de datos:', err);
          return { data: [], totalCount: 0 };
        }
      }
    });

    function toNum(v: any): number | null {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
  }

  onGridOptionChanged(e: any) {
    if (e.fullName !== 'searchPanel.text') return;

    const grid = this.dataGrid?.instance;
    const texto = (e.value ?? '').toString().trim().toLowerCase();
    if (!texto) {
      this.filtroActivo = '';
      grid?.option('dataSource', this.listaSalas);
      return;
    }
    this.filtroActivo = texto;
    let columnas: any[] = [];
    try {
      const colsOpt = grid?.option('columns');
      if (Array.isArray(colsOpt) && colsOpt.length) columnas = colsOpt;
    } catch { }
    if (!columnas.length && grid?.getVisibleColumns) {
      columnas = grid.getVisibleColumns();
    }
    const dataFields: string[] = columnas
      .map((c: any) => c?.dataField)
      .filter((df: any) => typeof df === 'string' && df.trim().length > 0);
    const normalizar = (val: any): string => {
      if (val === null || val === undefined) return '';
      if (val instanceof Date) {
        const dd = String(val.getDate()).padStart(2, '0');
        const mm = String(val.getMonth() + 1).padStart(2, '0');
        const yyyy = val.getFullYear();
        return `${dd}/${mm}/${yyyy}`.toLowerCase();
      }
      return String(val).toLowerCase();
    };
    const dataFiltrada = (this.paginaActualData || []).filter((row: any) => {
      const hitEnColumnas = dataFields.some((df) => normalizar(row?.[df]).includes(texto));
      const extras = [
        normalizar(row?.id),
        normalizar(row?.estatusTexto)
      ];

      return hitEnColumnas || extras.some((s) => s.includes(texto));
    });
    grid?.option('dataSource', dataFiltrada);
  }

  toggleExpandGroups() {
    const groupedColumns = this.dataGrid.instance
      .getVisibleColumns()
      .filter((col) => col.groupIndex >= 0);
    if (groupedColumns.length === 0) {
      Swal.fire({
        title: '¡Ops!',
        text: 'Debes arrastar un encabezado de una columna para expandir o contraer grupos.',
        icon: 'warning',
        showCancelButton: false,
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido',
        allowOutsideClick: false,
        background: '#0d121d'
      });
    } else {
      this.autoExpandAllGroups = !this.autoExpandAllGroups;
      this.dataGrid.instance.refresh();
    }
  }

  limpiarCampos() {
    this.dataGrid.instance.clearGrouping();
    this.dataGrid.instance.pageIndex(0);
    this.dataGrid.instance.refresh();
    this.isGrouped = false;
  }

  mostrarUbicacion(sala: any): void {
    const lat = Number(sala.latitudSala) || 19.4326;
    const lng = Number(sala.longitudSala) || -99.1332;
    const nombreSala = sala.nombreSala || 'Sala';

    const modalHtml = `
      <div class="map-modal-container">
        <div id="map-modal-view" style="width: 100%; height: 450px; border-radius: 12px; overflow: hidden; margin: 16px 0;"></div>
        <div style="display: flex; gap: 12px; justify-content: center; margin-top: 20px;">
          <button id="btn-cerrar-ubicacion" type="button" class="btn-alt btn-alt--cancel">
            <i class="fas fa-times"></i>
            <span>Cerrar</span>
          </button>
        </div>
      </div>
    `;

    Swal.fire({
      title: `<div style="display: flex; align-items: center; gap: 12px; justify-content: center; flex-wrap: wrap;"><i class="fas fa-map-marker-alt" style="color: #ff1a5b; font-size: 24px;"></i><span style="color: #fff; font-size: 18px; font-weight: 500;">Ubicación: ${nombreSala}</span></div>`,
      html: modalHtml,
      width: '90%',
      background: '#0d121d',
      showConfirmButton: false,
      showCancelButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        this.initMapView(lat, lng);
        this.attachCloseButton();
      },
      customClass: {
        popup: 'map-modal-popup',
        htmlContainer: 'map-modal-html',
        title: 'map-modal-title'
      }
    } as any);
  }

  private mapViewInstance: google.maps.Map | null = null;
  private markerViewInstance: google.maps.Marker | null = null;

  private initMapView(lat: number, lng: number): void {
    const waitForGoogle = () => {
      if (typeof window.google !== 'undefined' && window.google.maps) {
        this.createMapView(lat, lng);
      } else {
        setTimeout(waitForGoogle, 100);
      }
    };
    waitForGoogle();
  }

  private createMapView(lat: number, lng: number): void {
    const mapElement = document.getElementById('map-modal-view');
    if (!mapElement) return;

    this.mapViewInstance = new window.google.maps.Map(mapElement, {
      center: { lat, lng },
      zoom: 15,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: true,
      scaleControl: true,
      streetViewControl: true,
      rotateControl: true,
      fullscreenControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'all',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'poi.business',
          elementType: 'all',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'poi.place_of_worship',
          elementType: 'all',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'poi.school',
          elementType: 'all',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'poi.sports_complex',
          elementType: 'all',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    // Crear marker atractivo
    const markerIcon = {
      url: 'data:image/svg+xml;base64,' + btoa(`
        <svg width="48" height="64" viewBox="0 0 48 64" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.3"/>
            </filter>
          </defs>
          <path d="M24 0C10.745 0 0 10.745 0 24c0 14.25 24 40 24 40s24-25.75 24-40C48 10.745 37.255 0 24 0z" fill="#ff1a5b" filter="url(#shadow)"/>
          <circle cx="24" cy="24" r="12" fill="#fff"/>
          <circle cx="24" cy="24" r="6" fill="#ff1a5b"/>
        </svg>
      `),
      scaledSize: new window.google.maps.Size(48, 64),
      anchor: new window.google.maps.Point(24, 64)
    };

    this.markerViewInstance = new window.google.maps.Marker({
      position: { lat, lng },
      map: this.mapViewInstance,
      icon: markerIcon,
      animation: window.google.maps.Animation.DROP
    });
  }

  private attachCloseButton(): void {
    setTimeout(() => {
      const btnCerrar = document.getElementById('btn-cerrar-ubicacion');
      if (btnCerrar) {
        btnCerrar.addEventListener('click', () => {
          Swal.close();
          this.mapViewInstance = null;
          this.markerViewInstance = null;
        });
      }
    }, 300);
  }
}
