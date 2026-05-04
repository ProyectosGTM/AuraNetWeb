import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { CajasService } from 'src/app/shared/services/cajas.service';
import { SalaService } from 'src/app/shared/services/salas.service';
import { ZonaService } from 'src/app/shared/services/zona.service';
import { RolAccesoService } from 'src/app/shared/services/rol-acceso.service';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';
import {
  aplicarMontoBlurEnCampo,
  aplicarMontoInputEnCampo,
  textoMontoDesdeValorControl,
} from 'src/app/shared/utils/monto-input-formato.util';

type SelectItem = { id: number; text: string };

@Component({
  selector: 'app-agregar-caja',
  templateUrl: './agregar-caja.component.html',
  styleUrl: './agregar-caja.component.scss',
  animations: [fadeInRightAnimation],
})
export class AgregarCajaComponent implements OnInit, AfterViewInit {
  /** Estatus enviado siempre al API (campo oculto, sin selector en pantalla). */
  private readonly idEstatusCajaDefault = 2;

  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public idCaja: number;
  public title = 'Agregar Caja';
  public listaSalas: any[] = [];
  public listaZonas: any[] = [];
  public listaTiposCaja: SelectItem[] = [];
  public listaRequiereArqueo: SelectItem[] = [
    { id: 0, text: 'No' },
    { id: 1, text: 'Sí' },
  ];

  cajaForm: FormGroup;

  @ViewChild('inpLimiteEfectivo', { static: false }) inpLimiteEfectivo?: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private route: Router,
    private activatedRoute: ActivatedRoute,
    private cajasService: CajasService,
    private salasService: SalaService,
    private zonaService: ZonaService,
    private rolAcceso: RolAccesoService,
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

  ngAfterViewInit(): void {
    queueMicrotask(() => this.refrescarVistaLimiteEfectivo());
  }

  private procesarListas(responses: any) {
    this.listaSalas = (responses.salas.data || []).map((s: any) => ({
      ...s,
      id: Number(s.id),
      text: (s.nombreSala ?? s.nombre ?? 'Sin nombre').trim(),
    }));

    this.listaZonas = (responses.zonas.data || []).map((z: any) => ({
      ...z,
      id: Number(z.idZona || z.id),
      text: (z.nombreZona ?? z.nombre ?? 'Sin nombre').trim(),
    }));

    this.listaTiposCaja = (responses.tiposCaja.data || []).map((t: any) => ({
      id: Number(t.id),
      text: t.nombre || ''
    } as SelectItem));
  }

  private cargarListasIndividualmente() {
    this.obtenerSalas();
    this.obtenerZonas();
    this.obtenerTiposCaja();
  }

  obtenerSalas(): void {
    this.salasService.obtenerSalas().subscribe({
      next: (response: any) => {
        this.listaSalas = (response.data || []).map((s: any) => ({
          ...s,
          id: Number(s.id),
          text: (s.nombreSala ?? s.nombre ?? 'Sin nombre').trim(),
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
          text: (z.nombreZona ?? z.nombre ?? 'Sin nombre').trim(),
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
          limiteEfectivo: Number(data.limiteEfectivo ?? 0),
          requiereArqueo: data.requiereArqueo === 1 || data.requiereArqueo === true ? 1 : 0,
        });
        queueMicrotask(() => this.refrescarVistaLimiteEfectivo());
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
      limiteEfectivo: [null],
      requiereArqueo: [0],
    });
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

  onLimiteEfectivoInput(ev: Event): void {
    aplicarMontoInputEnCampo(ev.target as HTMLInputElement, this.cajaForm.get('limiteEfectivo'));
  }

  onLimiteEfectivoBlur(ev: Event): void {
    aplicarMontoBlurEnCampo(ev.target as HTMLInputElement, this.cajaForm.get('limiteEfectivo'));
  }

  private refrescarVistaLimiteEfectivo(): void {
    const el = this.inpLimiteEfectivo?.nativeElement;
    if (!el) {
      return;
    }
    el.value = textoMontoDesdeValorControl(this.cajaForm.get('limiteEfectivo')?.value);
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
      idEstatusCaja: Number(this.idEstatusCajaDefault),
      limiteEfectivo: Number(formValue.limiteEfectivo ?? 0),
      requiereArqueo: Number(formValue.requiereArqueo ?? 0),
    };
  }

  agregarCaja(): void {
    if (!this.rolAcceso.esPerfilClienteLogueado()) {
      this.rolAcceso.mostrarAccesoDenegado('gestionarCajasCliente');
      return;
    }
    const payload = this.buildPayloadCaja();
    this.loading = true;
    this.cajasService.agregarCaja(payload).subscribe({
      next: (response) => {
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          text: 'Se ha agregado la caja de manera exitosa.',
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
    if (!this.rolAcceso.esPerfilClienteLogueado()) {
      this.rolAcceso.mostrarAccesoDenegado('gestionarCajasCliente');
      return;
    }
    const payload = this.buildPayloadCaja();
    this.loading = true;
    this.cajasService.actualizarCaja(this.idCaja, payload).subscribe({
      next: (response) => {
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          text: 'Se ha actualizado la caja de manera exitosa.',
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
      this.cajaForm.markAllAsTouched();
      const etiquetas: Record<string, string> = {
        idSala: 'Sala',
        idZona: 'Zona',
        codigo: 'Código',
        nombre: 'Nombre',
        idTipoCaja: 'Tipo de caja',
      };
      const camposFaltantes: string[] = [];
      Object.keys(this.cajaForm.controls).forEach((key) => {
        const control = this.cajaForm.get(key);
        if (control?.invalid && control.errors?.['required']) {
          camposFaltantes.push(etiquetas[key] || key);
        }
      });
      const lista = camposFaltantes
        .map(
          (campo, index) => `
            <div style="padding: 8px 12px; border-left: 4px solid #d9534f;
                        background: #caa8a8; text-align: center; margin-bottom: 8px;
                        border-radius: 4px;">
              <strong style="color: #b02a37;">${index + 1}. ${campo}</strong>
            </div>
          `
        )
        .join('');
      Swal.fire({
        title: '¡Faltan campos obligatorios!',
        background: '#0d121d',
        html: `
              <p style="text-align: center; font-size: 15px; margin-bottom: 16px; color: white">
                Los siguientes campos son <strong>obligatorios</strong> (marcados con * en el formulario). Complétalos antes de continuar:
              </p>
              <div style="max-height: 350px; overflow-y: auto;">${lista}</div>
            `,
        icon: 'warning',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido',
        customClass: {
          popup: 'swal2-padding swal2-border',
        },
      });
      return;
    }

    if (!this.rolAcceso.esPerfilClienteLogueado()) {
      this.rolAcceso.mostrarAccesoDenegado('gestionarCajasCliente');
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
