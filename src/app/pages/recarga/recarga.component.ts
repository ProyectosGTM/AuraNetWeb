import { Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { MonederosServices } from 'src/app/shared/services/monederos.service';
import { TurnosService } from 'src/app/shared/services/turnos.service';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

type SelectItem = { id: number; text: string };

@Component({
  selector: 'app-recarga',
  templateUrl: './recarga.component.html',
  styleUrl: './recarga.component.scss',
  animations: [fadeInRightAnimation],
})
export class RecargaComponent implements OnInit {

  recargaForm: FormGroup;
  public listaTurnos: any[] = [];
  public listaMonederos: any[] = [];

  // Estados para selects
  isTurnoCajaOpen = false;
  turnoCajaLabel = '';
  isMonederoOpen = false;
  monederoLabel = '';

  // Datos seleccionados para mostrar información adicional
  turnoSeleccionado: any = null;
  monederoSeleccionado: any = null;

  procesando: boolean = false;

  constructor(
    private fb: FormBuilder,
    private turnosService: TurnosService,
    private monederosService: MonederosServices
  ) {
    this.recargaForm = this.fb.group({
      idTurnoCaja: [null, Validators.required],
      idMonedero: [null, Validators.required],
      monto: ['', [Validators.required, Validators.min(0.01)]]
    });
  }

  ngOnInit(): void {
    this.cargarListas();
  }

  @HostListener('document:mousedown', ['$event'])
  onDocMouseDown(ev: MouseEvent) {
    const target = ev.target as HTMLElement;
    if (!target.closest('.select-sleek')) {
      this.closeSelects();
    }
  }

  private closeSelects() {
    this.isTurnoCajaOpen = false;
    this.isMonederoOpen = false;
  }

  cargarListas() {
    forkJoin({
      turnos: this.turnosService.obtenerTurnos(),
      monederos: this.monederosService.obtenerMonederos()
    }).subscribe({
      next: (responses) => {
        this.listaTurnos = (responses.turnos.data || []).map((t: any) => ({
          ...t,
          id: Number(t.id),
          text: `Turno #${t.id} - ${t.codigoCaja || ''} - ${this.formatearFechaHora(t.fechaApertura) || ''}`
        }));

        this.listaMonederos = (responses.monederos.data || []).map((m: any) => {
          const nombreCompletoAfiliado = `${m?.nombreAfiliado || ''} ${m?.apellidoPaternoAfiliado || ''} ${m?.apellidoMaternoAfiliado || ''}`.trim() || 'Sin afiliado';
          return {
            ...m,
            id: Number(m.id),
            nombreCompletoAfiliado,
            text: `${m.numeroMonedero || ''} - ${m.alias || ''}`.trim()
          };
        });
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

  toggleTurnoCaja(event: any) {
    event.stopPropagation();
    this.isTurnoCajaOpen = !this.isTurnoCajaOpen;
  }

  setTurnoCaja(id: number, label: string, event: any) {
    event.stopPropagation();
    this.recargaForm.patchValue({ idTurnoCaja: id });
    this.turnoCajaLabel = label;
    this.isTurnoCajaOpen = false;
    
    // Buscar el turno completo para mostrar información
    const turno = this.listaTurnos.find(t => t.id === id);
    if (turno) {
      this.turnoSeleccionado = turno;
    }
  }

  toggleMonedero(event: any) {
    event.stopPropagation();
    this.isMonederoOpen = !this.isMonederoOpen;
  }

  setMonedero(id: number, label: string, event: any) {
    event.stopPropagation();
    this.recargaForm.patchValue({ idMonedero: id });
    this.monederoLabel = label;
    this.isMonederoOpen = false;
    
    // Buscar el monedero completo para mostrar información
    const monedero = this.listaMonederos.find(m => m.id === id);
    if (monedero) {
      this.monederoSeleccionado = monedero;
    }
  }

  setMontoRapido(monto: number) {
    this.recargaForm.patchValue({ monto: monto });
  }

  formatearFechaHora(fecha: string | null): string {
    if (!fecha) return 'Sin registro';
    try {
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return 'Sin registro';
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
    } catch {
      return 'Sin registro';
    }
  }

  formatearMoneda(valor: number | null | undefined): string {
    if (valor === null || valor === undefined) return '$0.00';
    return `$${Number(valor).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  procesarRecarga() {
    if (this.recargaForm.invalid) {
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
      idTurnoCaja: this.recargaForm.value.idTurnoCaja,
      idMonedero: this.recargaForm.value.idMonedero,
      monto: Number(this.recargaForm.value.monto)
    };

    this.procesando = true;
    this.monederosService.cargarMonedero(payload).subscribe({
      next: (response) => {
        this.procesando = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          text: 'Se ha procesado la recarga de manera exitosa.',
          icon: 'success',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.limpiarFormulario();
      },
      error: (error) => {
        this.procesando = false;
        Swal.fire({
          title: '¡Error!',
          text: error.error || 'No se pudo procesar la recarga.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  limpiarFormulario() {
    this.recargaForm.reset();
    this.turnoCajaLabel = '';
    this.monederoLabel = '';
    this.turnoSeleccionado = null;
    this.monederoSeleccionado = null;
    this.isTurnoCajaOpen = false;
    this.isMonederoOpen = false;
  }
}
