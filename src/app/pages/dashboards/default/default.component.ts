import { Component, OnInit } from '@angular/core';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';

@Component({
  selector: 'app-default',
  templateUrl: './default.component.html',
  styleUrls: ['./default.component.scss'],
  animations: [fadeInRightAnimation],
})
export class DefaultComponent implements OnInit {

  loading = false;

  // Datos falsos pero creíbles
  resumenOperativo = {
    totalAfiliados: 87,
    afiliadosActivos: 76,
    afiliadosInactivos: 11,
    totalSalas: 5,
    salasOperativas: 4,
    salasMantenimiento: 1,
    totalZonas: 8,
    totalMaquinas: 42,
    maquinasOperativas: 38,
    maquinasFueraServicio: 4,
    totalCajas: 6,
    cajasAbiertas: 5,
    cajasCerradas: 1,
    totalMonederos: 123,
    monederosActivos: 108,
    monederosInactivos: 15,
    totalTurnos: 18,
    turnosAbiertos: 3,
    turnosCerrados: 15,
    totalTesoreria: 5,
    tesoreriaAbierta: 4,
    tesoreriaCerrada: 1,
    totalTransacciones: 234,
    transaccionesHoy: 18,
    totalClientes: 56,
    clientesActivos: 48,
    clientesInactivos: 8
  };

  // Datos para gráficas
  transaccionesPorTipo: any[] = [
    { argument: 'Recargas', value: 42 },
    { argument: 'Juegos', value: 56 },
    { argument: 'Premios', value: 18 },
    { argument: 'Retiros', value: 12 },
    { argument: 'Transferencias', value: 9 },
    { argument: 'Depósitos', value: 34 },
    { argument: 'Consultas', value: 28 },
    { argument: 'Cancelaciones', value: 7 }
  ];
  
  // Verificar que los datos estén disponibles
  get datosTransacciones() {
    return this.transaccionesPorTipo;
  }
  
  distribucionMonederos: any[] = [
    { argument: 'Activos', value: 108 },
    { argument: 'Inactivos', value: 15 },
    { argument: 'Con Saldo', value: 78 },
    { argument: 'Sin Saldo', value: 30 }
  ];
  
  actividadPorHora: any[] = [
    { argument: '00:00', recargas: 1, juegos: 2, premios: 0 },
    { argument: '02:00', recargas: 0, juegos: 1, premios: 0 },
    { argument: '04:00', recargas: 0, juegos: 0, premios: 0 },
    { argument: '06:00', recargas: 1, juegos: 3, premios: 0 },
    { argument: '08:00', recargas: 2, juegos: 4, premios: 1 },
    { argument: '10:00', recargas: 3, juegos: 6, premios: 1 },
    { argument: '12:00', recargas: 4, juegos: 7, premios: 2 },
    { argument: '14:00', recargas: 5, juegos: 8, premios: 2 },
    { argument: '16:00', recargas: 4, juegos: 7, premios: 1 },
    { argument: '18:00', recargas: 3, juegos: 5, premios: 1 },
    { argument: '20:00', recargas: 2, juegos: 4, premios: 0 },
    { argument: '22:00', recargas: 1, juegos: 2, premios: 0 }
  ];
  
  saldoPorSala: any[] = [
    { argument: 'Sala Diamante', value: 18500 },
    { argument: 'Sala Platinum', value: 14200 },
    { argument: 'Sala Gold', value: 9800 },
    { argument: 'Sala Silver', value: 7600 },
    { argument: 'Sala Bronze', value: 5400 }
  ];
  
  movimientosRecientes: any[] = [
    { tipo: 'Recarga', monto: 150, sala: 'Sala Diamante', hora: '15:42', icon: 'fa-arrow-up', color: '#34c38f' },
    { tipo: 'Juego', monto: 85, sala: 'Sala Platinum', hora: '15:28', icon: 'fa-gamepad', color: '#5b73e8' },
    { tipo: 'Premio', monto: 320, sala: 'Sala Gold', hora: '15:15', icon: 'fa-gift', color: '#f1b44c' },
    { tipo: 'Retiro', monto: 200, sala: 'Sala Silver', hora: '15:05', icon: 'fa-arrow-down', color: '#e40041' },
    { tipo: 'Depósito', monto: 120, sala: 'Sala Bronze', hora: '14:58', icon: 'fa-arrow-up', color: '#50a5f1' },
    { tipo: 'Transferencia', monto: 75, sala: 'Sala Diamante', hora: '14:45', icon: 'fa-exchange-alt', color: '#6f42c1' }
  ];
  
  topSalas: any[] = [
    { nombre: 'Sala Diamante', transacciones: 42, saldo: 18500, maquinas: 12 },
    { nombre: 'Sala Platinum', transacciones: 35, saldo: 14200, maquinas: 9 },
    { nombre: 'Sala Gold', transacciones: 28, saldo: 9800, maquinas: 8 },
    { nombre: 'Sala Silver', transacciones: 22, saldo: 7600, maquinas: 7 },
    { nombre: 'Sala Bronze', transacciones: 18, saldo: 5400, maquinas: 6 }
  ];

  // Configuración de colores
  colors = {
    primary: '#5b73e8',
    success: '#34c38f',
    warning: '#f1b44c',
    danger: '#e40041',
    info: '#50a5f1'
  };

  constructor() {
    // Los datos ya están inicializados directamente en las propiedades
  }

  ngOnInit() {
    // Los datos ya están inicializados directamente
  }

  formatearNumero(numero: number): string {
    return numero.toLocaleString('es-MX');
  }

  formatearMoneda(valor: number): string {
    return `$${valor.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  calcularPorcentaje(actual: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((actual / total) * 100);
  }
}
