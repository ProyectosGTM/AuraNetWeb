import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { CajasService } from 'src/app/shared/services/cajas.service';
import { TesoreriaService } from 'src/app/shared/services/tesoreria.service';
import { TurnosService } from 'src/app/shared/services/turnos.service';
import Swal from 'sweetalert2';

type SelectItem = { id: number; text: string };

@Component({
  selector: 'app-abrir-turno',
  templateUrl: './abrir-turno.component.html',
  styleUrl: './abrir-turno.component.scss',
  animations: [fadeInRightAnimation],
})
export class AbrirTurnoComponent implements OnInit {
  abrirTurnoForm: FormGroup;
  public listaCajas: any[] = [];
  public listaTesoreria: any[] = [];
  public listaEstatusTurno: SelectItem[] = [];

  constructor(
    private router: Router,
    private turnosService: TurnosService,
    private fb: FormBuilder,
    private cajasService: CajasService,
    private tesoreriaService: TesoreriaService,
  ) {
    this.abrirTurnoForm = this.fb.group({
      idCaja: [null, Validators.required],
      idTesoreria: [null, Validators.required],
      idEstatusTurno: [null, Validators.required],
      fondoInicial: ['', [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit() {
    this.cargarListas();
  }

  cargarListas() {
    forkJoin({
      cajas: this.cajasService.obtenerCajas(),
      tesoreria: this.tesoreriaService.obtenerTesoreriaData(1, 100),
      estatusTurno: this.turnosService.obtenerEstatusTurno()
    }).subscribe({
      next: (responses) => {
        const cajasData = responses.cajas.data || [];
        const cajasAbiertas = cajasData.filter((c: any) => Number(c.idEstatusCaja) === 2);
        this.listaCajas = cajasAbiertas.map((c: any) => ({
          ...c,
          id: Number(c.id),
          text: `${c.codigo || ''} - ${c.nombre || ''}`.trim()
        }));

        this.listaTesoreria = (responses.tesoreria.data || []).map((t: any) => ({
          ...t,
          id: Number(t.id),
          text: `${t.nombreComercialSala || ''} - ${this.formatearFecha(t.fecha) || ''} - ${this.formatearMoneda(t.fondoInicial) || ''}`.trim()
        }));

        this.listaEstatusTurno = (responses.estatusTurno.data || []).map((e: any) => ({
          id: Number(e.id),
          text: e.nombre || e.nombreEstatusTurno || ''
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

  formatearFecha(fecha: string | null): string {
    if (!fecha) return '';
    try {
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return '';
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch {
      return '';
    }
  }

  formatearMoneda(valor: number | null | undefined): string {
    if (valor === null || valor === undefined || isNaN(valor)) return '';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor);
  }

  guardarAbrirTurno() {
    if (this.abrirTurnoForm.invalid) {
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

    const payload = {
      idCaja: this.abrirTurnoForm.value.idCaja,
      idTesoreria: this.abrirTurnoForm.value.idTesoreria,
      idEstatusTurno: this.abrirTurnoForm.value.idEstatusTurno,
      fondoInicial: Number(this.abrirTurnoForm.value.fondoInicial)
    };

    this.turnosService.abrirTurno(payload).subscribe({
      next: (response) => {
        Swal.fire({
          title: '¡Operación Exitosa!',
          text: 'Se ha abierto el turno de manera exitosa.',
          icon: 'success',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.router.navigate(['/turnos']);
      },
      error: (error) => {
        Swal.fire({
          title: '¡Error!',
          text: error.error || 'No se pudo abrir el turno.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  cancelar() {
    this.router.navigate(['/turnos']);
  }
}
