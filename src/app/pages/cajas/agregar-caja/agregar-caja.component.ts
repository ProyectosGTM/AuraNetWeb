import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { CajasService } from 'src/app/shared/services/cajas.service';
import { SalaService } from 'src/app/shared/services/salas.service';
import { ZonaService } from 'src/app/shared/services/zona.service';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

type SelectItem = { id: number; text: string };

@Component({
  selector: 'app-agregar-caja',
  templateUrl: './agregar-caja.component.html',
  styleUrl: './agregar-caja.component.scss',
  animations: [fadeInRightAnimation],
})
export class AgregarCajaComponent implements OnInit {
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public idCaja: number;
  public title = 'Agregar Caja';
  public listaSalas: any[] = [];
  public listaZonas: any[] = [];
  public listaTiposCaja: SelectItem[] = [];
  public listaEstatusCaja: SelectItem[] = [];

  cajaForm: FormGroup;

  isSalaOpen = false;
  salaLabel = '';

  isZonaOpen = false;
  zonaLabel = '';

  isTipoCajaOpen = false;
  tipoCajaLabel = '';

  isEstatusCajaOpen = false;
  estatusCajaLabel = '';

  isRequiereArqueoOpen = false;

  constructor(
    private fb: FormBuilder,
    private route: Router,
    private activatedRoute: ActivatedRoute,
    private cajasService: CajasService,
    private salasService: SalaService,
    private zonaService: ZonaService,
  ) { }

  ngOnInit(): void {
    this.initForm();
    
    this.activatedRoute.params.subscribe((params) => {
      this.idCaja = params['idCaja'];
      if (this.idCaja) {
        this.title = 'Actualizar Caja';
        this.submitButton = 'Actualizar';
        // Cargar todas las listas primero, luego obtener el registro
        forkJoin({
          salas: this.salasService.obtenerSalas(),
          zonas: this.zonaService.obtenerZonas(),
          tiposCaja: this.cajasService.obtenerTiposCaja(),
          estatusCaja: this.cajasService.obtenerEstatusCaja()
        }).subscribe({
          next: (responses) => {
            this.procesarListas(responses);
            this.obtenerCaja();
          },
          error: (error) => {
            console.error('Error al cargar listas:', error);
            this.cargarListasIndividualmente();
            if (this.idCaja) {
              this.obtenerCaja();
            }
          }
        });
      } else {
        // Modo agregar: cargar listas individualmente
        this.cargarListasIndividualmente();
      }
    });
  }

  private procesarListas(responses: any) {
    this.listaSalas = (responses.salas.data || []).map((s: any) => ({
      ...s,
      id: Number(s.id),
    }));

    this.listaZonas = (responses.zonas.data || []).map((z: any) => ({
      ...z,
      id: Number(z.idZona || z.id),
    }));

    this.listaTiposCaja = (responses.tiposCaja.data || []).map((t: any) => ({
      id: Number(t.id),
      text: t.nombre || ''
    } as SelectItem));

    this.listaEstatusCaja = (responses.estatusCaja.data || []).map((e: any) => ({
      id: Number(e.id),
      text: e.nombre || ''
    } as SelectItem));
  }

  private cargarListasIndividualmente() {
    this.obtenerSalas();
    this.obtenerZonas();
    this.obtenerTiposCaja();
    this.obtenerEstatusCaja();
  }

  obtenerSalas(): void {
    this.salasService.obtenerSalas().subscribe({
      next: (response: any) => {
        this.listaSalas = (response.data || []).map((s: any) => ({
          ...s,
          id: Number(s.id),
        }));
      },
      error: (error) => {
        console.error('Error al obtener salas:', error);
      }
    });
  }

  obtenerZonas(): void {
    this.zonaService.obtenerZonas().subscribe({
      next: (response: any) => {
        this.listaZonas = (response.data || []).map((z: any) => ({
          ...z,
          id: Number(z.idZona || z.id),
        }));
      },
      error: (error) => {
        console.error('Error al obtener zonas:', error);
      }
    });
  }

  obtenerTiposCaja(): void {
    this.cajasService.obtenerTiposCaja().subscribe({
      next: (response: any) => {
        this.listaTiposCaja = (response.data || []).map((t: any) => ({
          id: Number(t.id),
          text: t.nombre || ''
        } as SelectItem));
      },
      error: (error) => {
        console.error('Error al obtener tipos de caja:', error);
      }
    });
  }

  obtenerEstatusCaja(): void {
    this.cajasService.obtenerEstatusCaja().subscribe({
      next: (response: any) => {
        this.listaEstatusCaja = (response.data || []).map((e: any) => ({
          id: Number(e.id),
          text: e.nombre || ''
        } as SelectItem));
      },
      error: (error) => {
        console.error('Error al obtener estatus de caja:', error);
      }
    });
  }

  obtenerCaja(): void {
    this.cajasService.obtenerCajaPorId(this.idCaja).subscribe({
      next: (response: any) => {
        const data = response.data || response;

        this.cajaForm.patchValue({
          idSala: Number(data.idSala ?? 0),
          idZona: Number(data.idZona ?? 0),
          codigo: data.codigo || '',
          nombre: data.nombre || '',
          descripcion: data.descripcion || '',
          idTipoCaja: data.idTipoCaja ? Number(data.idTipoCaja) : null,
          idEstatusCaja: data.idEstatusCaja ? Number(data.idEstatusCaja) : null,
          limiteEfectivo: data.limiteEfectivo?.toString() || '',
          requiereArqueo: data.requiereArqueo === 1 || data.requiereArqueo === true ? 1 : 0,
        });

        // Establecer labels para los selects
        const idSala = Number(data.idSala ?? 0);
        if (idSala) {
          this.salaLabel = data.nombreSala || '';
          if (!this.salaLabel && this.listaSalas && this.listaSalas.length > 0) {
            const foundSala = this.listaSalas.find((x: any) => Number(x.id) === idSala);
            if (foundSala) {
              this.salaLabel = foundSala.nombreSala || foundSala.nombre || 'Sala';
            }
          }
        }

        const idZona = Number(data.idZona ?? 0);
        if (idZona) {
          this.zonaLabel = data.nombreZona || '';
          if (!this.zonaLabel && this.listaZonas && this.listaZonas.length > 0) {
            const foundZona = this.listaZonas.find((x: any) => Number(x.id) === idZona);
            if (foundZona) {
              this.zonaLabel = foundZona.nombreZona || foundZona.nombre || 'Zona';
            }
          }
        }

        const idTipoCaja = Number(data.idTipoCaja ?? 0);
        if (idTipoCaja) {
          this.tipoCajaLabel = data.nombreTipoCaja || '';
          if (!this.tipoCajaLabel && this.listaTiposCaja && this.listaTiposCaja.length > 0) {
            const foundTipo = this.listaTiposCaja.find((x: SelectItem) => x.id === idTipoCaja);
            if (foundTipo) {
              this.tipoCajaLabel = foundTipo.text;
            }
          }
        }

        const idEstatusCaja = Number(data.idEstatusCaja ?? 0);
        if (idEstatusCaja) {
          this.estatusCajaLabel = data.nombreEstatusCaja || '';
          if (!this.estatusCajaLabel && this.listaEstatusCaja && this.listaEstatusCaja.length > 0) {
            const foundEstatus = this.listaEstatusCaja.find((x: SelectItem) => x.id === idEstatusCaja);
            if (foundEstatus) {
              this.estatusCajaLabel = foundEstatus.text;
            }
          }
        }
      },
      error: (error) => {
        console.error('Error al obtener caja:', error);
        Swal.fire({
          title: '¡Error!',
          text: 'No se pudo cargar la información del registro.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  initForm(): void {
    this.cajaForm = this.fb.group({
      idSala: [null, Validators.required],
      idZona: [null, Validators.required],
      codigo: ['', Validators.required],
      nombre: ['', Validators.required],
      descripcion: [''],
      idTipoCaja: [null, Validators.required],
      idEstatusCaja: [null, Validators.required],
      limiteEfectivo: ['', Validators.required],
      requiereArqueo: [0, Validators.required],
    });
  }

  toggleSala(event: MouseEvent) {
    event.preventDefault();
    this.isSalaOpen = !this.isSalaOpen;
    if (this.isSalaOpen) {
      this.isZonaOpen = false;
      this.isTipoCajaOpen = false;
      this.isEstatusCajaOpen = false;
    }
  }

  setSala(id: any, nombre: string, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.cajaForm.patchValue({ idSala: id });
    this.salaLabel = nombre;
    this.isSalaOpen = false;
  }

  toggleZona(event: MouseEvent) {
    event.preventDefault();
    this.isZonaOpen = !this.isZonaOpen;
    if (this.isZonaOpen) {
      this.isSalaOpen = false;
      this.isTipoCajaOpen = false;
      this.isEstatusCajaOpen = false;
    }
  }

  setZona(id: any, nombre: string, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.cajaForm.patchValue({ idZona: id });
    this.zonaLabel = nombre;
    this.isZonaOpen = false;
  }

  toggleTipoCaja(event: MouseEvent) {
    event.preventDefault();
    this.isTipoCajaOpen = !this.isTipoCajaOpen;
    if (this.isTipoCajaOpen) {
      this.isSalaOpen = false;
      this.isZonaOpen = false;
      this.isEstatusCajaOpen = false;
    }
  }

  setTipoCaja(id: any, nombre: string, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.cajaForm.patchValue({ idTipoCaja: id });
    this.tipoCajaLabel = nombre;
    this.isTipoCajaOpen = false;
  }

  toggleEstatusCaja(event: MouseEvent) {
    event.preventDefault();
    this.isEstatusCajaOpen = !this.isEstatusCajaOpen;
    if (this.isEstatusCajaOpen) {
      this.isSalaOpen = false;
      this.isZonaOpen = false;
      this.isTipoCajaOpen = false;
    }
  }

  setEstatusCaja(id: any, nombre: string, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.cajaForm.patchValue({ idEstatusCaja: id });
    this.estatusCajaLabel = nombre;
    this.isEstatusCajaOpen = false;
  }

  toggleRequiereArqueo(event: MouseEvent) {
    event.preventDefault();
    this.isRequiereArqueoOpen = !this.isRequiereArqueoOpen;
    if (this.isRequiereArqueoOpen) {
      this.isSalaOpen = false;
      this.isZonaOpen = false;
      this.isTipoCajaOpen = false;
      this.isEstatusCajaOpen = false;
    }
  }

  setRequiereArqueo(valor: number, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.cajaForm.patchValue({ requiereArqueo: valor });
    this.isRequiereArqueoOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocClickCloseSelects(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (target.closest('.select-sleek')) return;

    this.isSalaOpen = false;
    this.isZonaOpen = false;
    this.isTipoCajaOpen = false;
    this.isEstatusCajaOpen = false;
    this.isRequiereArqueoOpen = false;
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const charCode = event.keyCode ? event.keyCode : event.which;
    const key = event.key;
    const allowedKeys = [8, 9, 13, 37, 38, 39, 40, 46]; // backspace, tab, enter, flechas, delete
    const isNumber = (charCode >= 48 && charCode <= 57) || (charCode >= 96 && charCode <= 105);
    const isDecimal = key === '.' || key === ',' || charCode === 190 || charCode === 188 || charCode === 110;
    const isAllowedKey = allowedKeys.includes(charCode);
    
    if (!isNumber && !isAllowedKey && !isDecimal) {
      event.preventDefault();
    }
  }

  buildPayloadCaja(): any {
    const formValue = this.cajaForm.value;
    return {
      idSala: Number(formValue.idSala ?? 0),
      idZona: Number(formValue.idZona ?? 0),
      codigo: formValue.codigo || '',
      nombre: formValue.nombre || '',
      descripcion: formValue.descripcion || null,
      idTipoCaja: Number(formValue.idTipoCaja ?? 0),
      idEstatusCaja: Number(formValue.idEstatusCaja ?? 0),
      limiteEfectivo: Number(formValue.limiteEfectivo?.replace(/,/g, '.') ?? 0),
      requiereArqueo: Number(formValue.requiereArqueo ?? 0),
    };
  }

  agregarCaja(): void {
    const payload = this.buildPayloadCaja();
    this.loading = true;
    this.cajasService.agregarCaja(payload).subscribe({
      next: (response) => {
        this.loading = false;
        Swal.fire({
          title: '¡Éxito!',
          text: 'La caja ha sido agregada correctamente.',
          icon: 'success',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        })
        this.route.navigateByUrl('/cajas');
      },
      error: (error) => {
        this.loading = false;
        Swal.fire({
          title: '¡Error!',
          text: error.error,
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  actualizarCaja(): void {
    const payload = this.buildPayloadCaja();
    this.loading = true;
    this.cajasService.actualizarCaja(this.idCaja, payload).subscribe({
      next: (response) => {
        this.loading = false;
        Swal.fire({
          title: '¡Éxito!',
          text: 'La caja ha sido actualizada correctamente.',
          icon: 'success',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        })
        this.route.navigateByUrl('/cajas');
      },
      error: (error) => {
        this.loading = false;
        Swal.fire({
          title: '¡Error!',
          text: error.error,
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  submit(): void {
    if (this.cajaForm.invalid) {
      Swal.fire({
        title: '¡Atención!',
        text: 'Por favor, completa todos los campos requeridos.',
        icon: 'warning',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Confirmar',
      });
      return;
    }

    if (this.idCaja) {
      this.actualizarCaja();
    } else {
      this.agregarCaja();
    }
  }

  cancelar(): void {
    this.route.navigateByUrl('/cajas');
  }
}
