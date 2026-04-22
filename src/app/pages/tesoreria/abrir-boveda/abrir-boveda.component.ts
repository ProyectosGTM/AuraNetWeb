import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { TesoreriaService } from 'src/app/shared/services/tesoreria.service';
import { SalaService } from 'src/app/shared/services/salas.service';
import { CajasService } from 'src/app/shared/services/cajas.service';
import Swal from 'sweetalert2';
import { UsuariosService } from 'src/app/shared/services/usuario.service';

@Component({
  selector: 'app-abrir-boveda',
  templateUrl: './abrir-boveda.component.html',
  styleUrl: './abrir-boveda.component.scss',
  animations: [fadeInRightAnimation],
})
export class AbrirBovedaComponent implements OnInit {
  /** Popup al body: evita listas cortadas por overflow en la tarjeta de turnos. */
  readonly selectDropDownOptions = { container: 'body', hideOnParentScroll: false };

  abrirTesoreriaForm: FormGroup;
  public listaSalas: any[] = [];
  /** Cajas filtradas por la sala seleccionada (origen: GET /cajas/list). */
  public listaCajas: any[] = [];
  private listaCajasTodas: any[] = [];
  public listaUsuarios: any[] = [];
  public mapaUsuarios: Map<string, any> = new Map();

  constructor(
    private router: Router,
    private tesoreriaService: TesoreriaService,
    private fb: FormBuilder,
    private salasService: SalaService,
    private cajasService: CajasService,
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
    this.abrirTesoreriaForm.get('idSala')?.valueChanges.subscribe((idSala) => {
      this.refrescarOpcionesCajasPorSala(idSala);
    });
    // Agregar un turno inicial automáticamente
    this.agregarTurnoAbrir();
    this.obtenerUsuarios();
  }

  /**
   * Actualiza el select de cajas según la sala (mismo listado que recarga /cajas/list).
   */
  private refrescarOpcionesCajasPorSala(idSala: number | string | null | undefined): void {
    const sid = idSala === null || idSala === undefined || idSala === '' ? null : Number(idSala);
    if (sid === null || Number.isNaN(sid)) {
      // Sin sala: mostrar todas las cajas cargadas para que el select tenga datos (al elegir sala se acota).
      this.listaCajas = [...this.listaCajasTodas];
      this.limpiarCajasInvalidasEnTurnos(new Set(this.listaCajasTodas.map((c: any) => Number(c.id))));
      return;
    }
    this.listaCajas = this.listaCajasTodas.filter((c: any) => Number(c.idSala) === sid);
    const validIds = new Set(this.listaCajas.map((c: any) => Number(c.id)));
    this.limpiarCajasInvalidasEnTurnos(validIds);
  }

  private limpiarCajasInvalidasEnTurnos(validIds: Set<number>): void {
    this.turnosAbrirArray.controls.forEach((ctrl) => {
      const idCaja = ctrl.get('idCaja')?.value;
      if (idCaja == null || idCaja === '') {
        return;
      }
      if (validIds.size === 0 || !validIds.has(Number(idCaja))) {
        ctrl.get('idCaja')?.setValue(null, { emitEvent: false });
      }
    });
  }

  obtenerUsuarios() {
    this.usuService.obtenerUsuarios().subscribe((response) => {
      const data = response.data || [];
      this.listaUsuarios = data.map((u: any) => {
        const idRaw = u.id ?? u.Id;
        const id = Number(idRaw);
        const nombre = u.Nombre || u.nombre || '';
        const apellidoPaterno = u.ApellidoPaterno || u.apellidoPaterno || '';
        const apellidoMaterno = u.ApellidoMaterno || u.apellidoMaterno || '';
        const nombreCompleto = `${nombre} ${apellidoPaterno} ${apellidoMaterno}`.trim();
        
        return {
          id,
          text: nombreCompleto || u.usuario || u.correo || String(id)
        };
      });
      this.mapaUsuarios = new Map(
        (this.listaUsuarios || []).map((u: any) => [String(u.id), u])
      );
    });
  }

  cargarListas() {
    forkJoin({
      salas: this.salasService.obtenerSalas(),
      cajas: this.cajasService.obtenerCajas()
    }).subscribe({
      next: (responses) => {
        this.listaSalas = (responses.salas.data || []).map((s: any) => ({
          ...s,
          id: Number(s.id ?? s.idSala ?? s.IdSala ?? 0),
          text: `${s.nombreSala || ''}${s.nombreComercialSala ? ' - ' + s.nombreComercialSala : ''}`.trim() || 'Sala sin nombre'
        }));

        const cajasData = responses.cajas?.data ?? responses.cajas ?? [];
        const cajasArray = Array.isArray(cajasData) ? cajasData : [];
        const cajasDisponibles = cajasArray.filter((c: any) => {
          const estatus = Number(c.idEstatusCaja);
          return estatus === 1 || estatus === 2;
        });
        this.listaCajasTodas = cajasDisponibles.map((c: any) => ({
          ...c,
          id: Number(c.id),
          idSala: Number(c.idSala ?? c.IdSala ?? 0),
          text: `${c.nombre || ''}`.trim() || 'Caja sin nombre'
        }));
        this.refrescarOpcionesCajasPorSala(this.abrirTesoreriaForm.get('idSala')?.value);
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