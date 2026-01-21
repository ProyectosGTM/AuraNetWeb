import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { lastValueFrom } from 'rxjs';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { AfiliadosService } from 'src/app/shared/services/afiliados.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-lista-afiliados',
  templateUrl: './lista-afiliados.component.html',
  styleUrl: './lista-afiliados.component.scss',
  animations: [fadeInRightAnimation],
})
export class ListaAfiliadosComponent implements OnInit {

  isLoading: boolean = false;
  listaAfiliados: any;
  public grid: boolean = false;
  public showFilterRow: boolean;
  public showHeaderFilter: boolean;
  public loadingVisible: boolean = false;
  public mensajeAgrupar: string = "Arrastre un encabezado de columna aquí para agrupar por esa columna";
  public loading: boolean;
  public loadingMessage: string = 'Cargando...';
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
    private afiliadosService: AfiliadosService,
    private router: Router
  ) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit(): void {
    this.setupDataSource();
  }

  agregar() {
    this.router.navigateByUrl('/afiliados/agregar-afiliado');
  }

  setupDataSource() {
    this.loading = true;
    this.listaAfiliados = new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        const skip = Number(loadOptions?.skip) || 0;
        const take = Number(loadOptions?.take) || this.pageSize;
        const page = Math.floor(skip / take) + 1;

        try {
          const response: any = await lastValueFrom(
            this.afiliadosService.obtenerAfiliadosData(page, take)
          );

          this.loading = false;

          const totalRegistros = Number(response?.paginated?.total) || 0;
          const paginaActual = Number(response?.paginated?.page) || page;
          const totalPaginas = Number(response?.paginated?.limit) ||
            (take > 0 ? Math.ceil(totalRegistros / take) : 0);

          this.totalRegistros = totalRegistros;
          this.paginaActual = paginaActual;
          this.totalPaginas = totalPaginas;

          const dataTransformada = (Array.isArray(response?.data) ? response.data : []).map((item: any) => {
            const nombreCompleto = [
              item?.nombre || '',
              item?.apellidoPaterno || '',
              item?.apellidoMaterno || ''
            ].filter(Boolean).join(' ').trim() || 'Sin registro';

            return {
              ...item,
              nombreCompleto,
              nombreSala: item?.nombreSala || 'Sin registro',
              nombreComercialSala: item?.nombreComercialSala || 'Sin registro',
              nombreTipoIdentificacion: item?.nombreTipoIdentificacion || 'Sin registro',
              nombreEstatusAfiliado: item?.nombreEstatusAfiliado || 'Sin registro',
              numeroIdentificacion: this.sinRegistro(item?.numeroIdentificacion),
              email: this.sinRegistro(item?.email),
              telefonoCelular: this.sinRegistro(item?.telefonoCelular),
              estatusTexto: item?.estatus === 1 ? 'Activo' : 'Inactivo',
              sexoTexto: item?.sexo === 'M' ? 'Masculino' : item?.sexo === 'F' ? 'Femenino' : 'Sin registro',
              fechaNacimientoFormateada: this.formatearFecha(item?.fechaNacimiento),
              fechaCreacionFormateada: this.formatearFechaHora(item?.fechaCreacion),
              fechaActualizacionFormateada: this.formatearFechaHora(item?.fechaActualizacion)
            };
          });

          return {
            data: dataTransformada,
            totalCount: totalRegistros
          };
        } catch (error: any) {
          this.loading = false;
          console.error('Error al cargar afiliados:', error);
          return {
            data: [],
            totalCount: 0
          };
        }
      }
    });
  }

  formatearFecha(fecha: string | null): string {
    if (!fecha) return 'Sin registro';
    try {
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return 'Sin registro';
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch {
      return 'Sin registro';
    }
  }

  formatearFechaHora(fecha: string | null): string {
    if (!fecha) return 'Sin registro';
    try {
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return 'Sin registro';
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
    } catch {
      return 'Sin registro';
    }
  }

  sinRegistro(valor: any): string {
    if (valor === null || valor === undefined || valor === '') {
      return 'Sin registro';
    }
    return valor;
  }

  onPageIndexChanged(event: any) {
    this.paginaActual = event.pageIndex + 1;
  }

  onGridOptionChanged(event: any) {
    if (event.name === 'searchPanel') {
      const searchValue = event.value?.toLowerCase() || '';
      this.filtroActivo = searchValue;
    }
  }

  toggleExpandGroups() {
    this.autoExpandAllGroups = !this.autoExpandAllGroups;
    if (this.dataGrid && this.dataGrid.instance) {
      this.dataGrid.instance.option('grouping.autoExpandAll', this.autoExpandAllGroups);
    }
  }

  limpiarCampos() {
    if (this.dataGrid && this.dataGrid.instance) {
      this.dataGrid.instance.clearFilter();
      this.dataGrid.instance.clearGrouping();
      this.dataGrid.instance.clearSorting();
      this.dataGrid.instance.searchByText('');
      this.filtroActivo = '';
    }
  }

  actualizarAfiliado(id: number) {
    this.router.navigateByUrl('/afiliados/editar-afiliado/' + id);
  }

  eliminarAfiliado(rowData: any) {
    Swal.fire({
      title: '¡Eliminar!',
      html: `¿Está seguro que requiere eliminar este afiliado "${rowData.nombreCompleto || rowData.numeroIdentificacion}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      background: '#0d121d'
    }).then((result) => {
      if (result.value) {
        this.afiliadosService.eliminarAfiliado(rowData.id).subscribe({
          next: (response) => {
            Swal.fire({
              title: '¡Confirmación Realizada!',
              html: `El afiliado ha sido eliminado.`,
              icon: 'success',
              background: '#0d121d',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            });
            this.setupDataSource();
          },
          error: (error) => {
            Swal.fire({
              title: '¡Error!',
              text: error.error || 'No se pudo eliminar el afiliado.',
              icon: 'error',
              background: '#0d121d',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            });
          }
        });
      }
    });
  }

  activar(rowData: any) {
    Swal.fire({
      title: '¡Activar!',
      html: `¿Está seguro que requiere activar el afiliado: <strong>${rowData.nombreCompleto || rowData.numeroIdentificacion}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      background: '#0d121d'
    }).then((result) => {
      if (result.value) {
        this.afiliadosService.updateEstatus(rowData.id, 1).subscribe({
          next: (response) => {
            Swal.fire({
              title: '¡Confirmación Realizada!',
              html: `El afiliado ha sido activado.`,
              icon: 'success',
              background: '#0d121d',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            });
            this.setupDataSource();
            if (this.dataGrid && this.dataGrid.instance) {
              this.dataGrid.instance.refresh();
            }
          },
          error: (error) => {
            Swal.fire({
              title: '¡Error!',
              text: error.error || 'No se pudo activar el afiliado.',
              icon: 'error',
              background: '#0d121d',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            });
          }
        });
      }
    });
  }

  desactivar(rowData: any) {
    Swal.fire({
      title: '¡Desactivar!',
      html: `¿Está seguro que requiere desactivar el afiliado: <strong>${rowData.nombreCompleto || rowData.numeroIdentificacion}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      background: '#0d121d'
    }).then((result) => {
      if (result.value) {
        this.afiliadosService.updateEstatus(rowData.id, 0).subscribe({
          next: (response) => {
            Swal.fire({
              title: '¡Confirmación Realizada!',
              html: `El afiliado ha sido desactivado.`,
              icon: 'success',
              background: '#0d121d',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            });
            this.setupDataSource();
            if (this.dataGrid && this.dataGrid.instance) {
              this.dataGrid.instance.refresh();
            }
          },
          error: (error) => {
            Swal.fire({
              title: '¡Error!',
              text: error.error || 'No se pudo desactivar el afiliado.',
              icon: 'error',
              background: '#0d121d',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            });
          }
        });
      }
    });
  }
}
