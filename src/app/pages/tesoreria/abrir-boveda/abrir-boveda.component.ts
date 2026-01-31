import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { TesoreriaService } from 'src/app/shared/services/tesoreria.service';
import { SalaService } from 'src/app/shared/services/salas.service';
import { CajasService } from 'src/app/shared/services/cajas.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-abrir-boveda',
  templateUrl: './abrir-boveda.component.html',
  styleUrl: './abrir-boveda.component.scss',
  animations: [fadeInRightAnimation],
})
export class AbrirBovedaComponent implements OnInit {
  abrirTesoreriaForm: FormGroup;
  public listaSalas: any[] = [];
  public listaCajas: any[] = [];

  constructor(
    private router: Router,
    private tesoreriaService: TesoreriaService,
    private fb: FormBuilder,
    private salasService: SalaService,
    private cajasService: CajasService,
  ) {
    this.abrirTesoreriaForm = this.fb.group({
      idSala: [null, Validators.required],
      fondoInicial: ['', [Validators.required, Validators.min(0.01)]],
      observaciones: [''],
      turnosAbrir: this.fb.array([], this.minLengthArray(1))
    });
  }

  // Validador personalizado para requerir al menos un elemento en el array
  minLengthArray(min: number) {
    return (control: any) => {
      if (!control.value || control.value.length < min) {
        return { minLengthArray: { requiredLength: min, actualLength: control.value?.length || 0 } };
      }
      return null;
    };
  }

  ngOnInit() {
    this.cargarListas();
    // Agregar un turno inicial automáticamente
    this.agregarTurnoAbrir();
  }

  cargarListas() {
    forkJoin({
      salas: this.salasService.obtenerSalas(),
      cajas: this.cajasService.obtenerCajas()
    }).subscribe({
      next: (responses) => {
        this.listaSalas = (responses.salas.data || []).map((s: any) => ({
          ...s,
          id: Number(s.id),
          text: `${s.nombreSala || ''}${s.nombreComercialSala ? ' - ' + s.nombreComercialSala : ''}`.trim() || 'Sala sin nombre'
        }));

        this.listaCajas = (responses.cajas.data || []).map((c: any) => ({
          ...c,
          id: Number(c.id),
          text: `${c.codigo || ''} - ${c.nombre || ''}`.trim()
        }));
      },
      error: (error) => {
        Swal.fire({
          title: '¡Error!',
          text: 'No se pudieron cargar las listas necesarias.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  get turnosAbrirArray(): FormArray {
    return this.abrirTesoreriaForm.get('turnosAbrir') as FormArray;
  }

  agregarTurnoAbrir() {
    const turnoForm = this.fb.group({
      idCaja: [null, Validators.required],
      fondoInicial: ['', [Validators.min(0.01)]],
      idEstatusTurno: [null],
      fechaApertura: ['']
    });
    this.turnosAbrirArray.push(turnoForm);
  }

  eliminarTurnoAbrir(index: number) {
    if (this.turnosAbrirArray.length <= 1) {
      Swal.fire({
        title: '¡Atención!',
        text: 'Debe haber al menos un turno de caja. No se puede eliminar el último turno.',
        icon: 'warning',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Confirmar',
      });
      return;
    }
    this.turnosAbrirArray.removeAt(index);
  }

  guardarAbrirTesoreria() {
    if (this.abrirTesoreriaForm.invalid) {
      const turnosArray = this.abrirTesoreriaForm.get('turnosAbrir') as FormArray;
      if (turnosArray.length === 0) {
        Swal.fire({
          title: '¡Atención!',
          text: 'Debe agregar al menos un turno de caja para abrir la boveda.',
          icon: 'warning',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        return;
      }
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

    const turnosArray = this.abrirTesoreriaForm.get('turnosAbrir') as FormArray;
    const turnosAbrir = turnosArray.controls.map(control => {
      const turno: any = {
        idCaja: Number(control.get('idCaja')?.value)
      };
      if (control.get('fondoInicial')?.value) {
        turno.fondoInicial = Number(control.get('fondoInicial')?.value);
      }
      if (control.get('idEstatusTurno')?.value) {
        turno.idEstatusTurno = Number(control.get('idEstatusTurno')?.value);
      }
      if (control.get('fechaApertura')?.value) {
        turno.fechaApertura = control.get('fechaApertura')?.value;
      }
      return turno;
    });

    const payload: any = {
      idsala: Number(this.abrirTesoreriaForm.value.idSala),
      fondoInicial: Number(this.abrirTesoreriaForm.value.fondoInicial),
      observaciones: this.abrirTesoreriaForm.value.observaciones || null,
      turnosAbrir: turnosAbrir
    };

    this.tesoreriaService.abrirTesoreria(payload).subscribe({
      next: (response) => {
        Swal.fire({
          title: '¡Operación Exitosa!',
          text: 'Se ha abierto la boveda de manera exitosa.',
          icon: 'success',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.router.navigate(['/tesoreria']);
      },
      error: (error) => {
        Swal.fire({
          title: '¡Error!',
          text: error.error?.message || error.error || 'No se pudo abrir la boveda.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  cancelar() {
    this.router.navigate(['/tesoreria']);
  }
}