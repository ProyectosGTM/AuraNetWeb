import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { AfiliadosService } from 'src/app/shared/services/afiliados.service';
import { PromocionesService } from 'src/app/shared/services/promociones.service';
import { RolAccesoService } from 'src/app/shared/services/rol-acceso.service';
import { SalaService } from 'src/app/shared/services/salas.service';
import {
  aplicarMontoBlurEnCampo,
  aplicarMontoInputEnCampo,
  textoMontoDesdeValorControl,
} from 'src/app/shared/utils/monto-input-formato.util';
import Swal from 'sweetalert2';

type SelectItem = { id: number; text: string };

@Component({
  selector: 'app-agregar-promocion',
  templateUrl: './agregar-promocion.component.html',
  styleUrl: './agregar-promocion.component.scss',
  animations: [fadeInRightAnimation],
})
export class AgregarPromocionComponent implements OnInit, AfterViewInit {
  public title = 'Agregar promoción';
  public submitButton = 'Guardar';
  public loading = false;
  public listaSalas: SelectItem[] = [];
  public listaTiposPromocion: SelectItem[] = [];
  public listaNivelesVip: SelectItem[] = [];
  public listaSiNo: SelectItem[] = [
    { id: 1, text: 'Sí' },
    { id: 0, text: 'No' },
  ];

  promocionForm: FormGroup;

  @ViewChild('inpMontoFijo', { static: false }) inpMontoFijo?: ElementRef<HTMLInputElement>;
  @ViewChild('inpMontoMinDeposito', { static: false }) inpMontoMinDeposito?: ElementRef<HTMLInputElement>;
  @ViewChild('inpMontoMaxBono', { static: false }) inpMontoMaxBono?: ElementRef<HTMLInputElement>;

  private readonly etiquetasObligatorios: Record<string, string> = {
    codigo: 'Código',
    nombre: 'Nombre',
    idTipoPromocion: 'Tipo de promoción',
    esPorcentaje: 'Bono por porcentaje',
    multiplicadorRollover: 'Multiplicador rollover',
    diasParaCompletar: 'Días para completar',
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private promocionesService: PromocionesService,
    private salasService: SalaService,
    private afiliadosService: AfiliadosService,
    private rolAcceso: RolAccesoService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    forkJoin({
      salas: this.salasService.obtenerSalas(),
      tipos: this.promocionesService.tiposPromocion(),
      nivelesVip: this.afiliadosService.obtenerNivelesVip(),
    }).subscribe({
      next: ({ salas, tipos, nivelesVip }) => {
        this.listaSalas = (salas.data || []).map((s: any) => ({
          id: Number(s.id),
          text: (s.nombreSala ?? s.nombre ?? 'Sin nombre').trim(),
        }));
        const tiposRaw = tipos?.data ?? tipos ?? [];
        this.listaTiposPromocion = (Array.isArray(tiposRaw) ? tiposRaw : []).map((t: any) => ({
          id: Number(t.id),
          text:
            String(t.nombre ?? t.descripcion ?? '').trim() || `Tipo ${t.id}`,
        }));
        this.aplicarListaNivelesVip(nivelesVip);
      },
      error: () => {
        this.cargarListasPorSeparado();
      },
    });
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.refrescarVistasMontos());
  }

  private cargarListasPorSeparado(): void {
    this.salasService.obtenerSalas().subscribe({
      next: (response: any) => {
        this.listaSalas = (response.data || []).map((s: any) => ({
          id: Number(s.id),
          text: (s.nombreSala ?? s.nombre ?? 'Sin nombre').trim(),
        }));
      },
      error: () => {
        this.listaSalas = [];
      },
    });
    this.promocionesService.tiposPromocion().subscribe({
      next: (tipos: any) => {
        const tiposRaw = tipos?.data ?? tipos ?? [];
        this.listaTiposPromocion = (Array.isArray(tiposRaw) ? tiposRaw : []).map((t: any) => ({
          id: Number(t.id),
          text:
            String(t.nombre ?? t.descripcion ?? '').trim() || `Tipo ${t.id}`,
        }));
      },
      error: () => {
        this.listaTiposPromocion = [];
      },
    });
    this.afiliadosService.obtenerNivelesVip().subscribe({
      next: (r) => this.aplicarListaNivelesVip(r),
      error: () => {
        this.listaNivelesVip = [];
      },
    });
  }

  private aplicarListaNivelesVip(res: any): void {
    const raw = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    this.listaNivelesVip = raw
      .filter((x: any) => x?.id != null)
      .map((x: any) => ({
        id: Number(x.id),
        text:
          String(x.nombre ?? x.nombreNivelVip ?? x.descripcion ?? '').trim() || `Nivel ${x.id}`,
      }));
  }

  private initForm(): void {
    this.promocionForm = this.fb.group({
      codigo: ['', Validators.required],
      nombre: ['', Validators.required],
      descripcion: [''],
      idTipoPromocion: [null, Validators.required],
      idSala: [null],
      esPorcentaje: [1, Validators.required],
      porcentajeBono: [null],
      montoFijo: [null],
      montoMinDeposito: [null],
      montoMaxBono: [null],
      multiplicadorRollover: [null, [Validators.required, Validators.min(0.0001)]],
      diasParaCompletar: [null, [Validators.required, Validators.min(1)]],
      fechaInicio: [''],
      fechaFin: [''],
      horaInicio: [''],
      horaFin: [''],
      diasAplica: [''],
      soloNuevosAfiliados: [0],
      limiteUsosPorAfiliado: [null],
      limiteUsosTotal: [null],
      limiteUsosPorDia: [null],
      idNivelVIPMinimo: [null],
      diasMaxAntiguedad: [null],
      visible: [1],
      requiereCodigoPromo: [0],
      codigoPromo: [''],
      terminosCondiciones: [''],
      activa: [1],
    });
  }

  onMontoInput(campo: 'montoFijo' | 'montoMinDeposito' | 'montoMaxBono', ev: Event): void {
    aplicarMontoInputEnCampo(ev.target as HTMLInputElement, this.promocionForm.get(campo));
  }

  onMontoBlur(campo: 'montoFijo' | 'montoMinDeposito' | 'montoMaxBono', ev: Event): void {
    aplicarMontoBlurEnCampo(ev.target as HTMLInputElement, this.promocionForm.get(campo));
  }

  private refrescarVistasMontos(): void {
    const pares: { ref?: ElementRef<HTMLInputElement>; ctrl: string }[] = [
      { ref: this.inpMontoFijo, ctrl: 'montoFijo' },
      { ref: this.inpMontoMinDeposito, ctrl: 'montoMinDeposito' },
      { ref: this.inpMontoMaxBono, ctrl: 'montoMaxBono' },
    ];
    for (const { ref, ctrl } of pares) {
      const el = ref?.nativeElement;
      if (el) {
        el.value = textoMontoDesdeValorControl(this.promocionForm.get(ctrl)?.value);
      }
    }
  }

  private siNoABoolean(v: unknown): boolean {
    return v === true || v === 1 || v === '1';
  }

  private buildPayload(): Record<string, unknown> {
    const v = this.promocionForm.getRawValue();
    const n = (x: unknown): number | null => {
      if (x === null || x === undefined || x === '') return null;
      const num = Number(x);
      return Number.isFinite(num) ? num : null;
    };
    const trimOrNull = (s: unknown): string | null => {
      const t = (s ?? '').toString().trim();
      return t === '' ? null : t;
    };

    const idSala = n(v.idSala);
    const idNivelVIPMinimo = n(v.idNivelVIPMinimo);

    return {
      codigo: (v.codigo || '').trim(),
      nombre: (v.nombre || '').trim(),
      descripcion: trimOrNull(v.descripcion),
      idTipoPromocion: Number(v.idTipoPromocion),
      idSala: idSala != null && idSala > 0 ? idSala : null,
      esPorcentaje: this.siNoABoolean(v.esPorcentaje),
      porcentajeBono: n(v.porcentajeBono),
      montoFijo: n(v.montoFijo),
      montoMinDeposito: n(v.montoMinDeposito),
      montoMaxBono: n(v.montoMaxBono),
      multiplicadorRollover: Number(v.multiplicadorRollover),
      diasParaCompletar: Math.trunc(Number(v.diasParaCompletar)),
      fechaInicio: trimOrNull(v.fechaInicio),
      fechaFin: trimOrNull(v.fechaFin),
      horaInicio: trimOrNull(v.horaInicio),
      horaFin: trimOrNull(v.horaFin),
      diasAplica: trimOrNull(v.diasAplica),
      soloNuevosAfiliados: this.siNoABoolean(v.soloNuevosAfiliados),
      limiteUsosPorAfiliado: n(v.limiteUsosPorAfiliado),
      limiteUsosTotal: n(v.limiteUsosTotal),
      limiteUsosPorDia: n(v.limiteUsosPorDia),
      idNivelVIPMinimo: idNivelVIPMinimo != null && idNivelVIPMinimo > 0 ? idNivelVIPMinimo : null,
      diasMaxAntiguedad: n(v.diasMaxAntiguedad),
      visible: this.siNoABoolean(v.visible),
      requiereCodigoPromo: this.siNoABoolean(v.requiereCodigoPromo),
      codigoPromo: trimOrNull(v.codigoPromo),
      terminosCondiciones: trimOrNull(v.terminosCondiciones),
      activa: this.siNoABoolean(v.activa),
    };
  }

  submit(): void {
    const rol = this.rolAcceso.obtenerRolUsuarioLogueado();
    if (!this.rolAcceso.puedeRealizarAccion('registrarPromocion', rol)) {
      this.rolAcceso.mostrarAccesoDenegado('registrarPromocion');
      return;
    }

    if (this.promocionForm.invalid) {
      this.promocionForm.markAllAsTouched();
      const faltantes: string[] = [];
      Object.keys(this.etiquetasObligatorios).forEach((key) => {
        const c = this.promocionForm.get(key);
        if (c?.invalid && (c.errors?.['required'] || c.errors?.['min'])) {
          faltantes.push(this.etiquetasObligatorios[key]);
        }
      });
      const lista = faltantes
        .map(
          (campo, index) => `
            <div style="padding: 8px 12px; border-left: 4px solid #d9534f;
                        background: #caa8a8; text-align: center; margin-bottom: 8px;
                        border-radius: 4px;">
              <strong style="color: #b02a37;">${index + 1}. ${campo}</strong>
            </div>
          `,
        )
        .join('');
      Swal.fire({
        title: '¡Faltan campos obligatorios!',
        background: '#0d121d',
        html: `
              <p style="text-align: center; font-size: 15px; margin-bottom: 16px; color: white">
                Completa los campos marcados con <strong>*</strong> y los valores mínimos válidos antes de continuar:
              </p>
              <div style="max-height: 350px; overflow-y: auto;">${lista}</div>
            `,
        icon: 'warning',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    const payload = this.buildPayload();
    this.loading = true;
    this.promocionesService.crear(payload).subscribe({
      next: () => {
        this.loading = false;
        Swal.fire({
          title: '¡Operación exitosa!',
          text: 'La promoción se registró correctamente.',
          icon: 'success',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        }).then(() => this.router.navigateByUrl('/promociones'));
      },
      error: (error) => {
        this.loading = false;
        Swal.fire({
          title: '¡Error!',
          text: error?.error?.message || error?.error || 'No se pudo registrar la promoción.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      },
    });
  }

  cancelar(): void {
    this.router.navigateByUrl('/promociones');
  }
}
