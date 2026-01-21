import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { AfiliadosService } from 'src/app/shared/services/afiliados.service';
import { SalaService } from 'src/app/shared/services/salas.service';
import { CajasService } from 'src/app/shared/services/cajas.service';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

type SelectItem = { id: number; text: string };

@Component({
  selector: 'app-agregar-afiliado',
  templateUrl: './agregar-afiliado.component.html',
  styleUrl: './agregar-afiliado.component.scss',
  animations: [fadeInRightAnimation],
})
export class AgregarAfiliadoComponent implements OnInit {
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public idAfiliado: number;
  public title = 'Agregar Afiliado';
  public listaSalas: any[] = [];
  public listaTipoIdentificacion: SelectItem[] = [];
  public listaEstatusAfiliado: SelectItem[] = [];

  afiliadoForm: FormGroup;

  isSalaOpen = false;
  salaLabel = '';

  isTipoIdentificacionOpen = false;
  tipoIdentificacionLabel = '';

  isEstatusAfiliadoOpen = false;
  estatusAfiliadoLabel = '';

  isSexoOpen = false;

  constructor(
    private fb: FormBuilder,
    private route: Router,
    private activatedRoute: ActivatedRoute,
    private afiliadosService: AfiliadosService,
    private salasService: SalaService,
    private cajasService: CajasService,
  ) { }

  ngOnInit(): void {
    this.initForm();
    
    this.activatedRoute.params.subscribe((params) => {
      this.idAfiliado = params['idAfiliado'];
      if (this.idAfiliado) {
        this.title = 'Actualizar Afiliado';
        this.submitButton = 'Actualizar';
        forkJoin({
          salas: this.salasService.obtenerSalas(),
          tipoIdentificacion: this.afiliadosService.obtenerTipoIdentificacion(),
          estatusAfiliado: this.cajasService.obtenerEstatusAfiliado()
        }).subscribe({
          next: (responses) => {
            this.procesarListas(responses);
            this.obtenerAfiliado();
          },
          error: (error) => {
            console.error('Error al cargar listas:', error);
            this.cargarListasIndividualmente();
            if (this.idAfiliado) {
              this.obtenerAfiliado();
            }
          }
        });
      } else {
        this.cargarListasIndividualmente();
      }
    });
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const charCode = event.keyCode ? event.keyCode : event.which;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  private procesarListas(responses: any) {
    this.listaSalas = (responses.salas.data || []).map((s: any) => ({
      ...s,
      id: Number(s.id),
    }));

    this.listaTipoIdentificacion = (responses.tipoIdentificacion.data || []).map((t: any) => ({
      id: Number(t.id),
      text: t.nombre || ''
    } as SelectItem));

    this.listaEstatusAfiliado = (responses.estatusAfiliado.data || []).map((e: any) => ({
      id: Number(e.id),
      text: e.nombre || ''
    } as SelectItem));
  }

  private cargarListasIndividualmente() {
    this.obtenerSalas();
    this.obtenerTipoIdentificacion();
    this.obtenerEstatusAfiliado();
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

  obtenerTipoIdentificacion(): void {
    this.afiliadosService.obtenerTipoIdentificacion().subscribe({
      next: (response: any) => {
        this.listaTipoIdentificacion = (response.data || []).map((t: any) => ({
          id: Number(t.id),
          text: t.nombre || ''
        } as SelectItem));
      },
      error: (error) => {
        console.error('Error al obtener tipos de identificación:', error);
      }
    });
  }

  obtenerEstatusAfiliado(): void {
    this.cajasService.obtenerEstatusAfiliado().subscribe({
      next: (response: any) => {
        this.listaEstatusAfiliado = (response.data || []).map((e: any) => ({
          id: Number(e.id),
          text: e.nombre || ''
        } as SelectItem));
      },
      error: (error) => {
        console.error('Error al obtener estatus de afiliado:', error);
      }
    });
  }

  obtenerAfiliado(): void {
    this.afiliadosService.obtenerAfiliadoPorId(this.idAfiliado).subscribe({
      next: (response: any) => {
        const data = response.data || response;

        this.afiliadoForm.patchValue({
          idSala: Number(data.idSala ?? 0),
          idTipoIdentificacion: data.idTipoIdentificacion ? Number(data.idTipoIdentificacion) : null,
          numeroIdentificacion: data.numeroIdentificacion || '',
          nombre: data.nombre || '',
          apellidoPaterno: data.apellidoPaterno || '',
          apellidoMaterno: data.apellidoMaterno || '',
          fechaNacimiento: this.formatDate(data.fechaNacimiento),
          sexo: data.sexo || '',
          idEstatusAfiliado: data.idEstatusAfiliado ? Number(data.idEstatusAfiliado) : null,
          email: data.email || '',
          telefonoCelular: data.telefonoCelular || ''
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

        const idTipoIdentificacion = data.idTipoIdentificacion ? Number(data.idTipoIdentificacion) : null;
        if (idTipoIdentificacion) {
          const found = this.listaTipoIdentificacion.find((x: any) => Number(x.id) === idTipoIdentificacion);
          if (found) {
            this.tipoIdentificacionLabel = found.text;
          }
        }

        const idEstatusAfiliado = data.idEstatusAfiliado ? Number(data.idEstatusAfiliado) : null;
        if (idEstatusAfiliado) {
          const found = this.listaEstatusAfiliado.find((x: any) => Number(x.id) === idEstatusAfiliado);
          if (found) {
            this.estatusAfiliadoLabel = found.text;
          }
        }
      },
      error: (error) => {
        Swal.fire({
          title: '¡Error!',
          text: error.error || 'No se pudo obtener la información del afiliado.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  }

  initForm() {
    this.afiliadoForm = this.fb.group({
      idSala: [null, Validators.required],
      idTipoIdentificacion: [null, Validators.required],
      numeroIdentificacion: ['', Validators.required],
      nombre: ['', Validators.required],
      apellidoPaterno: ['', Validators.required],
      apellidoMaterno: [''],
      fechaNacimiento: ['', Validators.required],
      sexo: ['', Validators.required],
      idEstatusAfiliado: [null, Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefonoCelular: ['', Validators.required]
    });
  }

  @HostListener('document:mousedown', ['$event'])
  onDocMouseDown(ev: MouseEvent) {
    const target = ev.target as HTMLElement;
    if (!target.closest('.select-sleek')) {
      this.closeSelects();
    }
  }

  private closeSelects() {
    this.isSalaOpen = false;
    this.isTipoIdentificacionOpen = false;
    this.isEstatusAfiliadoOpen = false;
    this.isSexoOpen = false;
  }

  toggleSala(event: any) {
    event.stopPropagation();
    this.isSalaOpen = !this.isSalaOpen;
  }

  setSala(id: number, label: string, event: any) {
    event.stopPropagation();
    this.afiliadoForm.patchValue({ idSala: id });
    this.salaLabel = label;
    this.isSalaOpen = false;
  }

  toggleTipoIdentificacion(event: any) {
    event.stopPropagation();
    this.isTipoIdentificacionOpen = !this.isTipoIdentificacionOpen;
  }

  setTipoIdentificacion(id: number, label: string, event: any) {
    event.stopPropagation();
    this.afiliadoForm.patchValue({ idTipoIdentificacion: id });
    this.tipoIdentificacionLabel = label;
    this.isTipoIdentificacionOpen = false;
  }

  toggleEstatusAfiliado(event: any) {
    event.stopPropagation();
    this.isEstatusAfiliadoOpen = !this.isEstatusAfiliadoOpen;
  }

  setEstatusAfiliado(id: number, label: string, event: any) {
    event.stopPropagation();
    this.afiliadoForm.patchValue({ idEstatusAfiliado: id });
    this.estatusAfiliadoLabel = label;
    this.isEstatusAfiliadoOpen = false;
  }

  toggleSexo(event: any) {
    event.stopPropagation();
    this.isSexoOpen = !this.isSexoOpen;
  }

  setSexo(valor: string, event: any) {
    event.stopPropagation();
    this.afiliadoForm.patchValue({ sexo: valor });
    this.isSexoOpen = false;
  }

  guardar() {
    if (this.afiliadoForm.invalid) {
      Swal.fire({
        title: '¡Atención!',
        text: 'Por favor complete todos los campos requeridos.',
        icon: 'warning',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Confirmar',
      });
      return;
    }

    this.loading = true;
    const payload = this.buildPayloadAfiliado();

    if (this.idAfiliado) {
      this.afiliadosService.actualizarAfiliado(this.idAfiliado, payload).subscribe({
        next: (response) => {
          this.loading = false;
          Swal.fire({
            title: '¡Operación Exitosa!',
            text: 'Se ha actualizado el afiliado de manera exitosa.',
            icon: 'success',
            background: '#0d121d',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Confirmar',
          })
          this.route.navigateByUrl('/afiliados');
        },
        error: (error) => {
          this.loading = false;
          Swal.fire({
            title: '¡Error!',
            text: error.error || 'No se pudo actualizar el afiliado.',
            icon: 'error',
            background: '#0d121d',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Confirmar',
          });
        }
      });
    } else {
      this.afiliadosService.agregarAfiliado(payload).subscribe({
        next: (response) => {
          this.loading = false;
          Swal.fire({
            title: '¡Operación Exitosa!',
            text: 'Se ha agregado el afiliado de manera exitosa.',
            icon: 'success',
            background: '#0d121d',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Confirmar',
          })
          this.route.navigateByUrl('/afiliados');
        },
        error: (error) => {
          this.loading = false;
          Swal.fire({
            title: '¡Error!',
            text: error.error || 'No se pudo registrar el afiliado.',
            icon: 'error',
            background: '#0d121d',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Confirmar',
          });
        }
      });
    }
  }

  buildPayloadAfiliado(): any {
    return {
      idSala: this.afiliadoForm.value.idSala,
      idTipoIdentificacion: this.afiliadoForm.value.idTipoIdentificacion,
      numeroIdentificacion: this.afiliadoForm.value.numeroIdentificacion,
      nombre: this.afiliadoForm.value.nombre,
      apellidoPaterno: this.afiliadoForm.value.apellidoPaterno,
      apellidoMaterno: this.afiliadoForm.value.apellidoMaterno || null,
      fechaNacimiento: this.afiliadoForm.value.fechaNacimiento,
      sexo: this.afiliadoForm.value.sexo,
      idEstatusAfiliado: this.afiliadoForm.value.idEstatusAfiliado,
      email: this.afiliadoForm.value.email,
      telefonoCelular: this.afiliadoForm.value.telefonoCelular
    };
  }

  cancelar() {
    this.route.navigateByUrl('/afiliados');
  }
}
