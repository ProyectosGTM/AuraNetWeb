import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { TesoreriaService } from 'src/app/shared/services/tesoreria.service';
import { SalaService } from 'src/app/shared/services/salas.service';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

type SelectItem = { id: number; text: string };

@Component({
  selector: 'app-agregar-tesoreria',
  templateUrl: './agregar-tesoreria.component.html',
  styleUrl: './agregar-tesoreria.component.scss',
  animations: [fadeInRightAnimation],
})
export class AgregarTesoreriaComponent implements OnInit {
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public idTesoreria: number;
  public title = 'Agregar Tesorería';
  public listaSalas: any[] = [];
  public listaEstatusTesoreria: SelectItem[] = [];

  tesoreriaForm: FormGroup;

  isSalaOpen = false;
  salaLabel = '';

  isEstatusTesoreriaOpen = false;
  estatusTesoreriaLabel = '';

  constructor(
    private fb: FormBuilder,
    private route: Router,
    private activatedRoute: ActivatedRoute,
    private tesoreriaService: TesoreriaService,
    private salasService: SalaService,
  ) { }

  ngOnInit(): void {
    this.initForm();
    
    this.activatedRoute.params.subscribe((params) => {
      this.idTesoreria = params['idTesoreria'];
      if (this.idTesoreria) {
        this.title = 'Actualizar Tesorería';
        this.submitButton = 'Actualizar';
        // Cargar todas las listas primero, luego obtener el registro
        forkJoin({
          salas: this.salasService.obtenerSalas(),
          estatusTesoreria: this.tesoreriaService.obtenerEstatusTesoreria()
        }).subscribe({
          next: (responses) => {
            // Procesar salas
            this.listaSalas = (responses.salas.data || []).map((s: any) => ({
              ...s,
              id: Number(s.id),
            }));
            
            // Procesar estatus tesorería
            const estatus = (responses.estatusTesoreria.data || []).map((e: any) => ({
              id: Number(e.id),
              text: e.nombre || ''
            } as SelectItem));
            this.listaEstatusTesoreria = estatus;
            
            // Ahora obtener el registro con todas las listas cargadas
            this.obtenerTesoreria();
          },
          error: (error) => {
            console.error('Error al cargar listas:', error);
            this.obtenerSalas();
            this.obtenerEstatusTesoreria();
            if (this.idTesoreria) {
              this.obtenerTesoreria();
            }
          }
        });
      } else {
        // Modo agregar: cargar listas individualmente
        this.obtenerSalas();
        this.obtenerEstatusTesoreria();
      }
    });
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

  obtenerEstatusTesoreria(): void {
    this.tesoreriaService.obtenerEstatusTesoreria().subscribe({
      next: (response: any) => {
        const estatus = (response.data || []).map((e: any) => ({
          id: Number(e.id),
          text: e.nombre || ''
        } as SelectItem));
        this.listaEstatusTesoreria = estatus;
      },
      error: (error) => {
        console.error('Error al obtener estatus tesorería:', error);
      }
    });
  }

  obtenerTesoreria(): void {
    this.tesoreriaService.obtenerTesoreriaPorId(this.idTesoreria).subscribe({
      next: (response: any) => {
        // Acceder a data.data si existe, sino a data directamente
        const data = response.data || response;

        const formatDate = (dateStr: string | null | undefined): string | null => {
          if (!dateStr) return null;
          try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return null;
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          } catch {
            return null;
          }
        };

        // Poblar el formulario con los datos requeridos
        this.tesoreriaForm.patchValue({
          idSala: Number(data.idSala ?? 0),
          fecha: formatDate(data.fecha),
          fondoInicial: data.fondoInicial?.toString() || '',
          idEstatusTesoreria: data.idEstatusTesoreria ? Number(data.idEstatusTesoreria) : null,
        });

        // Establecer label de sala - usar nombreSala del response
        const idSala = Number(data.idSala ?? 0);
        if (idSala) {
          // Priorizar nombreSala del response, luego buscar en lista
          this.salaLabel = data.nombreSala || '';
          if (!this.salaLabel && this.listaSalas && this.listaSalas.length > 0) {
            const foundSala = this.listaSalas.find((x: any) => Number(x.id) === idSala);
            if (foundSala) {
              this.salaLabel = foundSala.nombreSala || foundSala.nombre || 'Sala';
            }
          }
        }

        // Establecer label de estatus tesorería
        const idEstatus = Number(data.idEstatusTesoreria ?? 0);
        if (idEstatus) {
          // Priorizar nombreEstatusTesoreria del response
          this.estatusTesoreriaLabel = data.nombreEstatusTesoreria || '';
          if (!this.estatusTesoreriaLabel && this.listaEstatusTesoreria && this.listaEstatusTesoreria.length > 0) {
            const foundEstatus = this.listaEstatusTesoreria.find((x: SelectItem) => x.id === idEstatus);
            if (foundEstatus) {
              this.estatusTesoreriaLabel = foundEstatus.text;
            }
          }
        }
      },
      error: (error) => {
        console.error('Error al obtener tesorería:', error);
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
    this.tesoreriaForm = this.fb.group({
      idSala: [null, Validators.required],
      fecha: [null, Validators.required],
      fondoInicial: ['', Validators.required],
      idEstatusTesoreria: [null, Validators.required],
    });
  }

  toggleSala(event: MouseEvent) {
    event.preventDefault();
    this.isSalaOpen = !this.isSalaOpen;
    if (this.isSalaOpen) {
      this.isEstatusTesoreriaOpen = false;
    }
  }

  setSala(id: any, nombre: string, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.tesoreriaForm.patchValue({ idSala: id });
    this.salaLabel = nombre;
    this.isSalaOpen = false;
  }

  toggleEstatusTesoreria(event: MouseEvent) {
    event.preventDefault();
    this.isEstatusTesoreriaOpen = !this.isEstatusTesoreriaOpen;
    if (this.isEstatusTesoreriaOpen) {
      this.isSalaOpen = false;
    }
  }

  setEstatusTesoreria(id: any, nombre: string, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.tesoreriaForm.patchValue({ idEstatusTesoreria: id });
    this.estatusTesoreriaLabel = nombre;
    this.isEstatusTesoreriaOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocClickCloseSelects(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (target.closest('.select-sleek')) return;

    this.isSalaOpen = false;
    this.isEstatusTesoreriaOpen = false;
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

  buildPayloadTesoreria(): any {
    const formValue = this.tesoreriaForm.value;
    return {
      idSala: Number(formValue.idSala ?? 0),
      fecha: formValue.fecha || null,
      fondoInicial: Number(formValue.fondoInicial?.replace(/,/g, '.') ?? 0),
      idEstatusTesoreria: formValue.idEstatusTesoreria ? Number(formValue.idEstatusTesoreria) : null,
    };
  }

  agregarTesoreria(): void {
    const payload = this.buildPayloadTesoreria();
    this.loading = true;
    this.tesoreriaService.agregarTesoreria(payload).subscribe({
      next: (response) => {
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          text: 'Se ha agregado el registro de tesorería de manera exitosa.',
          icon: 'success',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        })
        this.route.navigateByUrl('/tesoreria');
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

  actualizarTesoreria(): void {
    const payload = this.buildPayloadTesoreria();
    this.loading = true;
    this.tesoreriaService.actualizarTesoreria(this.idTesoreria, payload).subscribe({
      next: (response) => {
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          text: 'Se ha actualizado el registro de tesorería de manera exitosa.',
          icon: 'success',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        })
        this.route.navigateByUrl('/tesoreria');
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
    if (this.tesoreriaForm.invalid) {
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

    if (this.idTesoreria) {
      this.actualizarTesoreria();
    } else {
      this.agregarTesoreria();
    }
  }

  cancelar(): void {
    this.route.navigateByUrl('/tesoreria');
  }
}
