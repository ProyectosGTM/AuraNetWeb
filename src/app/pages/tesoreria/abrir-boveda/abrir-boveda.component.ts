import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { TesoreriaService } from 'src/app/shared/services/tesoreria.service';
import { SalaService } from 'src/app/shared/services/salas.service';
import { TurnosActivosService } from 'src/app/shared/services/turnos-activos.service';
import Swal from 'sweetalert2';
import { UsuariosService } from 'src/app/shared/services/usuario.service';

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
  public listaUsuarios: any[] = [];
  public mapaUsuarios: Map<string, any> = new Map();

  constructor(
    private router: Router,
    private tesoreriaService: TesoreriaService,
    private fb: FormBuilder,
    private salasService: SalaService,
    private turnosActivosService: TurnosActivosService,
    private usuService: UsuariosService,
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
    this.obtenerUsuarios();
  }

  obtenerUsuarios() {
    this.usuService.obtenerUsuarios().subscribe((response) => {
      const data = response.data || [];
      this.listaUsuarios = data.map((u: any) => ({
        ...u,
        id: Number(u.id),
        text: `${u.nombre || ''} ${u.apellidoPaterno || ''} ${u.apellidoMaterno || ''}`.trim() || u.usuario || u.correo || String(u.id)
      }));
      this.mapaUsuarios = new Map(
        (this.listaUsuarios || []).map((u: any) => [String(u.id), u])
      );
    });
  }

  cargarListas() {
    forkJoin({
      salas: this.salasService.obtenerSalas(),
      turnosActivos: this.turnosActivosService.obtenerTurnosActivos()
    }).subscribe({
      next: (responses) => {
        this.listaSalas = (responses.salas.data || []).map((s: any) => ({
          ...s,
          id: Number(s.id),
          text: `${s.nombreSala || ''}${s.nombreComercialSala ? ' - ' + s.nombreComercialSala : ''}`.trim() || 'Sala sin nombre'
        }));

        const turnosData = responses.turnosActivos?.data ?? responses.turnosActivos ?? [];
        const turnosArray = Array.isArray(turnosData) ? turnosData : [];
        const cajasMap = new Map<number, { id: number; text: string }>();
        turnosArray.forEach((t: any) => {
          const idCaja = Number(t.idCaja ?? t.caja?.id ?? t.id);
          if (idCaja && !cajasMap.has(idCaja)) {
            const codigo = t.codigoCaja ?? t.caja?.codigo ?? t.codigo ?? '';
            const nombre = t.nombreCaja ?? t.caja?.nombre ?? t.nombre ?? '';
            cajasMap.set(idCaja, {
              id: idCaja,
              text: `${codigo} - ${nombre}`.trim() || `Caja ${idCaja}`
            });
          }
        });
        this.listaCajas = Array.from(cajasMap.values());
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
      fondoInicial: ['', [Validators.required, Validators.min(0.01)]],
      idUsuario: [null, Validators.required]
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
    const turnosAbrir = turnosArray.controls.map(control => ({
      idCaja: Number(control.get('idCaja')?.value),
      fondoInicial: Number(control.get('fondoInicial')?.value ?? 0),
      idUsuario: Number(control.get('idUsuario')?.value)
    }));

    const payload = {
      idSala: Number(this.abrirTesoreriaForm.value.idSala),
      fondoInicial: Number(this.abrirTesoreriaForm.value.fondoInicial),
      observaciones: this.abrirTesoreriaForm.value.observaciones || '',
      turnosAbrir
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