import { Component, OnInit, HostListener } from '@angular/core';
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

  monederoForm: FormGroup;

  isAfiliadoOpen = false;
  afiliadoLabel = '';

  isEstatusMonederoOpen = false;
  estatusMonederoLabel = '';

  isEsPrincipalOpen = false;

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
          afiliados: this.monederosService.obtenerAfiliados(),
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
        this.cargarListasIndividualmente();
      }
    });
  }

  private procesarListas(responses: any) {
    this.listaAfiliados = (responses.afiliados.data || []).map((a: any) => ({
      ...a,
      id: Number(a.id),
      nombreCompleto: `${a.nombre || ''} ${a.apellidoPaterno || ''} ${a.apellidoMaterno || ''}`.trim()
    }));

    this.listaEstatusMonedero = (responses.estatusMonedero.data || []).map((e: any) => ({
      id: Number(e.id),
      text: e.nombre || ''
    } as SelectItem));
  }

  private cargarListasIndividualmente() {
    this.obtenerAfiliados();
    this.obtenerEstatusMonedero();
  }

  obtenerAfiliados(): void {
    this.monederosService.obtenerAfiliados().subscribe({
      next: (response: any) => {
        this.listaAfiliados = (response.data || []).map((a: any) => ({
          ...a,
          id: Number(a.id),
          nombreCompleto: `${a.nombre || ''} ${a.apellidoPaterno || ''} ${a.apellidoMaterno || ''}`.trim()
        }));
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

  obtenerMonedero(): void {
    this.monederosService.obtenerMonedero(this.idMonedero).subscribe({
      next: (response: any) => {
        const data = response.data || response;

        this.monederoForm.patchValue({
          idAfiliado: data.idAfiliado ? Number(data.idAfiliado) : null,
          numeroMonedero: data.numeroMonedero || '',
          codigoRFID: data.codigoRFID || '',
          esPrincipal: data.esPrincipal === 1 || data.esPrincipal === true ? 1 : 0,
          alias: data.alias || '',
          idEstatusMonedero: data.idEstatusMonedero ? Number(data.idEstatusMonedero) : null,
        });

        const idAfiliado = Number(data.idAfiliado ?? 0);
        if (idAfiliado) {
          this.afiliadoLabel = data.nombreCompletoAfiliado || '';
          if (!this.afiliadoLabel && this.listaAfiliados && this.listaAfiliados.length > 0) {
            const foundAfiliado = this.listaAfiliados.find((x: any) => Number(x.id) === idAfiliado);
            if (foundAfiliado) {
              this.afiliadoLabel = foundAfiliado.nombreCompleto || 'Afiliado';
            }
          }
        }

        const idEstatusMonedero = Number(data.idEstatusMonedero ?? 0);
        if (idEstatusMonedero) {
          this.estatusMonederoLabel = data.nombreEstatusMonedero || '';
          if (!this.estatusMonederoLabel && this.listaEstatusMonedero && this.listaEstatusMonedero.length > 0) {
            const foundEstatus = this.listaEstatusMonedero.find((x: SelectItem) => x.id === idEstatusMonedero);
            if (foundEstatus) {
              this.estatusMonederoLabel = foundEstatus.text;
            }
          }
        }
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
      codigoRFID: ['', Validators.required],
      esPrincipal: [0, Validators.required],
      alias: [''],
      idEstatusMonedero: [null, Validators.required],
    });
  }

  toggleAfiliado(event: MouseEvent) {
    event.preventDefault();
    this.isAfiliadoOpen = !this.isAfiliadoOpen;
    if (this.isAfiliadoOpen) {
      this.isEstatusMonederoOpen = false;
      this.isEsPrincipalOpen = false;
    }
  }

  setAfiliado(id: any, nombre: string, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.monederoForm.patchValue({ idAfiliado: id });
    this.afiliadoLabel = nombre;
    this.isAfiliadoOpen = false;
  }

  toggleEstatusMonedero(event: MouseEvent) {
    event.preventDefault();
    this.isEstatusMonederoOpen = !this.isEstatusMonederoOpen;
    if (this.isEstatusMonederoOpen) {
      this.isAfiliadoOpen = false;
      this.isEsPrincipalOpen = false;
    }
  }

  setEstatusMonedero(id: any, nombre: string, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.monederoForm.patchValue({ idEstatusMonedero: id });
    this.estatusMonederoLabel = nombre;
    this.isEstatusMonederoOpen = false;
  }

  toggleEsPrincipal(event: MouseEvent) {
    event.preventDefault();
    this.isEsPrincipalOpen = !this.isEsPrincipalOpen;
    if (this.isEsPrincipalOpen) {
      this.isAfiliadoOpen = false;
      this.isEstatusMonederoOpen = false;
    }
  }

  setEsPrincipal(valor: number, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.monederoForm.patchValue({ esPrincipal: valor });
    this.isEsPrincipalOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocClickCloseSelects(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (target.closest('.select-sleek')) return;

    this.isAfiliadoOpen = false;
    this.isEstatusMonederoOpen = false;
    this.isEsPrincipalOpen = false;
  }

  buildPayloadMonedero(): any {
    const formValue = this.monederoForm.value;
    return {
      idAfiliado: Number(formValue.idAfiliado ?? 0),
      numeroMonedero: formValue.numeroMonedero || '',
      codigoRFID: formValue.codigoRFID || '',
      esPrincipal: Number(formValue.esPrincipal ?? 0),
      alias: formValue.alias || null,
      idEstatusMonedero: Number(formValue.idEstatusMonedero ?? 0),
    };
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
          text: error.error,
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
