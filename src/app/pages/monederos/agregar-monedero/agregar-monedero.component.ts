import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { MonederosServices } from 'src/app/shared/services/monederos.service';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

type SelectItem = { id: number; text: string };

@Component({
  selector: 'app-agregar-monedero',
  templateUrl: './agregar-monedero.component.html',
  styleUrl: './agregar-monedero.component.scss',
  animations: [fadeInRightAnimation],
})
export class AgregarMonederoComponent implements OnInit {
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public idMonedero: number;
  public title = 'Agregar Monedero';
  public listaAfiliados: any[] = [];
  public listaEstatusMonedero: SelectItem[] = [];
  public listaEsPrincipal: SelectItem[] = [
    { id: 0, text: 'No' },
    { id: 1, text: 'Sí' },
  ];

  monederoForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: Router,
    private activatedRoute: ActivatedRoute,
    private monederosService: MonederosServices,
  ) { }

  ngOnInit(): void {
    this.initForm();

    this.activatedRoute.params.subscribe((params) => {
      this.idMonedero = params['idMonedero'];
      if (this.idMonedero) {
        this.title = 'Actualizar Monedero';
        this.submitButton = 'Actualizar';
        forkJoin({
          afiliados: this.monederosService.obtenerAfiliadosSinMonedero(),
          estatusMonedero: this.monederosService.obtenerEstatusMonedero()
        }).subscribe({
          next: (responses) => {
            this.procesarListas(responses);
            this.obtenerMonedero();
          },
          error: (error) => {
            console.error('Error al cargar listas:', error);
            this.cargarListasIndividualmente();
            if (this.idMonedero) {
              this.obtenerMonedero();
            }
          }
        });
      } else {
        forkJoin({
          afiliados: this.monederosService.obtenerAfiliadosSinMonedero(),
          estatusMonedero: this.monederosService.obtenerEstatusMonedero()
        }).subscribe({
          next: (responses) => this.procesarListas(responses),
          error: () => this.cargarListasIndividualmente()
        });
      }
    });
  }

  private procesarListas(responses: any) {
    this.listaAfiliados = (responses.afiliados.data || []).map((a: any) => {
      const text = `${a.nombre || ''} ${a.apellidoPaterno || ''} ${a.apellidoMaterno || ''}`.trim();
      return { ...a, id: Number(a.id), text: text || 'Sin nombre' };
    });

    this.listaEstatusMonedero = (responses.estatusMonedero.data || []).map((e: any) => ({
      id: Number(e.id),
      text: e.nombre || ''
    } as SelectItem));
  }

  private cargarListasIndividualmente() {
    this.obtenerAfiliadosSinMonedero();
    this.obtenerEstatusMonedero();
  }

  obtenerAfiliadosSinMonedero(): void {
    this.monederosService.obtenerAfiliadosSinMonedero().subscribe({
      next: (response: any) => {
        this.listaAfiliados = (response.data || []).map((a: any) => {
          const text = `${a.nombre || ''} ${a.apellidoPaterno || ''} ${a.apellidoMaterno || ''}`.trim();
          return { ...a, id: Number(a.id), text: text || 'Sin nombre' };
        });
      },
      error: (error) => {
        console.error('Error al obtener afiliados:', error);
      }
    });
  }

  obtenerEstatusMonedero(): void {
    this.monederosService.obtenerEstatusMonedero().subscribe({
      next: (response: any) => {
        this.listaEstatusMonedero = (response.data || []).map((e: any) => ({
          id: Number(e.id),
          text: e.nombre || ''
        } as SelectItem));
      },
      error: (error) => {
        console.error('Error al obtener estatus de monedero:', error);
      }
    });
  }

  /** En edición el afiliado ya tiene monedero y suele no aparecer en /sin-monedero; se agrega para que el select muestre el valor. */
  private asegurarAfiliadoEnListaDesdeMonedero(data: any): void {
    const idAf = data.idAfiliado != null ? Number(data.idAfiliado) : null;
    if (idAf == null || isNaN(idAf)) return;
    if (this.listaAfiliados.some((a) => Number(a.id) === idAf)) return;

    const nombre = `${data.nombreAfiliado ?? data.nombre ?? ''} ${data.apellidoPaternoAfiliado ?? data.apellidoPaterno ?? ''} ${data.apellidoMaternoAfiliado ?? data.apellidoMaterno ?? ''}`.trim();
    this.listaAfiliados = [
      { id: idAf, text: nombre || `Afiliado ${idAf}` },
      ...this.listaAfiliados,
    ];
  }

  obtenerMonedero(): void {
    this.monederosService.obtenerMonedero(this.idMonedero).subscribe({
      next: (response: any) => {
        const data = response.data || response;

        this.asegurarAfiliadoEnListaDesdeMonedero(data);

        this.monederoForm.patchValue({
          idAfiliado: data.idAfiliado ? Number(data.idAfiliado) : null,
          numeroMonedero: data.numeroMonedero || '',
          codigoRFID: data.codigoRFID || '',
          esPrincipal: data.esPrincipal === 1 || data.esPrincipal === true ? 1 : 0,
          alias: data.alias || '',
          idEstatusMonedero: data.idEstatusMonedero ? Number(data.idEstatusMonedero) : null,
        });
      },
      error: (error) => {
        console.error('Error al obtener monedero:', error);
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
    this.monederoForm = this.fb.group({
      idAfiliado: [null, Validators.required],
      numeroMonedero: ['', Validators.required],
      codigoRFID: [''],
      esPrincipal: [0],
      alias: [''],
      idEstatusMonedero: [null, Validators.required],
    });
  }

  private mensajeError(error: any): string {
    const e = error?.error;
    if (typeof e === 'string') return e;
    if (e?.message) return String(e.message);
    if (Array.isArray(e?.errors)) return e.errors.map((x: any) => String(x)).join(', ');
    return 'Ocurrió un error al procesar la solicitud.';
  }

  buildPayloadMonedero(): any {
    const formValue = this.monederoForm.value;
    const payload: any = {
      idAfiliado: Number(formValue.idAfiliado ?? 0),
      numeroMonedero: formValue.numeroMonedero || '',
      idEstatusMonedero: Number(formValue.idEstatusMonedero ?? 0),
      esPrincipal: Number(formValue.esPrincipal ?? 0),
    };

    const codigo = String(formValue.codigoRFID ?? '').trim();
    if (codigo) payload.codigoRFID = codigo;

    const alias = String(formValue.alias ?? '').trim();
    payload.alias = alias || null;

    return payload;
  }

  agregarMonedero(): void {
    const payload = this.buildPayloadMonedero();
    this.loading = true;
    this.monederosService.agregarMonedero(payload).subscribe({
      next: (response) => {
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          text: 'Se ha agregado el monedero de manera exitosa.',
          icon: 'success',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        })
        this.route.navigateByUrl('/monederos');
      },
      error: (error) => {
        this.loading = false;
        Swal.fire({
          title: '¡Error!',
          text: this.mensajeError(error),
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  actualizarMonedero(): void {
    const payload = this.buildPayloadMonedero();
    this.loading = true;
    this.monederosService.actualizarMonedero(this.idMonedero, payload).subscribe({
      next: (response) => {
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          text: 'Se ha actualizado el monedero de manera exitosa.',
          icon: 'success',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        })
        this.route.navigateByUrl('/monederos');
      },
      error: (error) => {
        this.loading = false;
        Swal.fire({
          title: '¡Error!',
          text: this.mensajeError(error),
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  submit(): void {
    if (this.monederoForm.invalid) {
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

    if (this.idMonedero) {
      this.actualizarMonedero();
    } else {
      this.agregarMonedero();
    }
  }

  cancelar(): void {
    this.route.navigateByUrl('/monederos');
  }
}
