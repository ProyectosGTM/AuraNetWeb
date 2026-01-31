import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { ClientesService } from 'src/app/shared/services/clientes.service';
import { SalaService } from 'src/app/shared/services/salas.service';
import { ZonaService } from 'src/app/shared/services/zona.service';
import { MaquinasService } from 'src/app/shared/services/maquinas.service';
import { UsuariosService } from 'src/app/shared/services/usuario.service';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

type SelectItem = { id: number; text: string };

@Component({
  selector: 'app-agregar-maquina',
  templateUrl: './agregar-maquina.component.html',
  styleUrl: './agregar-maquina.component.scss',
  animations: [fadeInRightAnimation],
})
export class AgregarMaquinaComponent implements OnInit {
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public idMaquina: number;
  public title = 'Agregar Máquina';
  public listaClientes: any;
  public listaZonas: any;
  public listaSalas: any;
  public listaTipoMaquina: any;
  public listaFabricantes: any;
  public listaEstatusMaquina: any;
  maquinaForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: Router,
    private activatedRoute: ActivatedRoute,
    private usuaService: UsuariosService,
    private maquinasService: MaquinasService,
    private clienService: ClientesService,
    private salasService: SalaService,
    private zonaService: ZonaService,
  ) { }

  ngOnInit(): void {
    this.initForm();
    
    this.activatedRoute.params.subscribe((params) => {
      this.idMaquina = params['idMaquina'];
      if (this.idMaquina) {
        this.title = 'Actualizar Máquina';
        this.submitButton = 'Actualizar';
        // Cargar todas las listas primero, luego obtener la máquina
        forkJoin({
          clientes: this.clienService.obtenerClientes(),
          zonas: this.zonaService.obtenerZonas(),
          salas: this.salasService.obtenerSalas(),
          tipoMaquina: this.maquinasService.obtenerTiposMaquina(),
          fabricantes: this.maquinasService.obtenerFabricantes(),
          estatusMaquina: this.maquinasService.obtenerEstatusMaquina()
        }).subscribe({
          next: (responses) => {
            this.procesarListas(responses);
            this.obtenerMaquina();
          },
          error: (error) => {
            console.error('Error al cargar listas:', error);
            this.cargarListasIndividualmente();
            this.obtenerMaquina();
          }
        });
      } else {
        this.title = 'Agregar Máquina';
        this.submitButton = 'Guardar';
        this.cargarListasIndividualmente();
      }
    });
  }

  private procesarListas(responses: any) {
    this.listaClientes = (responses.clientes.data || []).map((c: any) => ({
      ...c,
      id: Number(c.id),
      text: (c.nombre ?? '').trim() || 'Sin nombre',
    }));
    this.listaZonas = (responses.zonas.data || []).map((z: any) => ({
      id: Number(z.idZona || z.id),
      nombre: z.nombreZona || z.nombre || '',
      text: (z.nombreZona ?? z.nombre ?? 'Sin nombre').trim(),
    }));
    this.listaSalas = (responses.salas.data || []).map((s: any) => ({
      id: Number(s.idSala || s.id),
      nombre: s.nombreSala || s.nombre || '',
      text: (s.nombreSala ?? s.nombre ?? 'Sin nombre').trim(),
    }));
    
    // Procesar tipo máquina
    this.listaTipoMaquina = (responses.tipoMaquina.data || []).map((t: any) => ({
      id: Number(t.id),
      text: t.nombre || ''
    } as SelectItem));
    
    // Procesar fabricantes
    this.listaFabricantes = (responses.fabricantes.data || []).map((f: any) => ({
      id: Number(f.id),
      text: f.nombre || ''
    } as SelectItem));
    
    // Procesar estatus máquina
    this.listaEstatusMaquina = (responses.estatusMaquina.data || []).map((e: any) => ({
      id: Number(e.id),
      text: e.nombre || ''
    } as SelectItem));
  }

  private cargarListasIndividualmente() {
    this.obtenerClientes();
    this.obtenerZonas();
    this.obtenerSalas();
    this.obtenerTiposMaquina();
    this.obtenerFabricantes();
    this.obtenerEstatusMaquina();
  }

  obtenerClientes() {
    this.clienService.obtenerClientes().subscribe((response) => {
      this.listaClientes = (response.data || []).map((c: any) => ({
        ...c,
        id: Number(c.id),
        text: (c.nombre ?? '').trim() || 'Sin nombre',
      }));
    });
  }

  obtenerZonas() {
    this.zonaService.obtenerZonas().subscribe((response) => {
      this.listaZonas = (response.data || []).map((z: any) => ({
        id: Number(z.idZona || z.id),
        nombre: z.nombreZona || z.nombre || '',
        text: (z.nombreZona ?? z.nombre ?? 'Sin nombre').trim(),
      }));
    });
  }

  obtenerSalas() {
    this.salasService.obtenerSalas().subscribe((response) => {
      this.listaSalas = (response.data || []).map((s: any) => ({
        id: Number(s.idSala || s.id),
        nombre: s.nombreSala || s.nombre || '',
        text: (s.nombreSala ?? s.nombre ?? 'Sin nombre').trim(),
      }));
    });
  }

  obtenerTiposMaquina() {
    return this.maquinasService.obtenerTiposMaquina().subscribe((response) => {
      this.listaTipoMaquina = (response.data || []).map((t: any) => ({
        id: Number(t.id),
        text: t.nombre || ''
      } as SelectItem));
    });
  }

  obtenerFabricantes() {
    return this.maquinasService.obtenerFabricantes().subscribe((response) => {
      this.listaFabricantes = (response.data || []).map((f: any) => ({
        id: Number(f.id),
        text: f.nombre || ''
      } as SelectItem));
    });
  }

  obtenerEstatusMaquina() {
    return this.maquinasService.obtenerEstatusMaquina().subscribe((response) => {
      this.listaEstatusMaquina = (response.data || []).map((e: any) => ({
        id: Number(e.id),
        text: e.nombre || ''
      } as SelectItem));
    });
  }

  obtenerMaquina() {
    this.maquinasService.obtenerMaquina(this.idMaquina).subscribe({
      next: (response: any) => {
        const data = response.data || {};
        
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
        
        this.maquinaForm.patchValue({
          numeroSerie: data.numeroSerieMaquina || data.numeroSerie || '',
          nombre: data.nombreMaquina || data.nombre || '',
          marca: data.marcaMaquina || data.marca || '',
          modelo: data.modeloMaquina || data.modelo || '',
          idZona: Number(data.idZona ?? 0),
          idSala: Number(data.idSala ?? 0),
          idCliente: Number(data.idCliente ?? 0),
          idTipoMaquina: Number(data.idTipoMaquina ?? 0),
          idFabricante: Number(data.idFabricante ?? 0),
          idEstatusMaquina: Number(data.idEstatusMaquina ?? 0),
          anioFabricacion: formatDate(data.anioFabricacion),
          fechaAdquisicion: formatDate(data.fechaAdquisicion),
          costoAdquisicion: Number(data.costoAdquisicion ?? 0),
          anchoMetros: Number(data.anchoMetros ?? 0),
          altoMetros: Number(data.altoMetros ?? 0),
          profundidadMetros: Number(data.profundidadMetros ?? 0),
          imagenMaquina: data.imagenMaquina || '',
          iconoMaquina: data.iconoMaquina || '',
        });

        // Cargar imágenes si existen
        if (data.imagenMaquina) {
          this.imagenPreviewUrl = data.imagenMaquina;
        }
        if (data.iconoMaquina) {
          this.iconoPreviewUrl = data.iconoMaquina;
        }
      },
      error: (error) => {
        console.error('Error al obtener máquina:', error);
        Swal.fire({
          title: '¡Error!',
          text: 'No se pudo cargar la información de la máquina.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  private   initForm(): void {
    this.maquinaForm = this.fb.group({
      numeroSerie: [''],
      nombre: [''],
      marca: [''],
      modelo: [''],
      idZona: [null],
      idSala: [null],
      idCliente: [null],
      idTipoMaquina: [null],
      idFabricante: [null],
      idEstatusMaquina: [null],
      anioFabricacion: [null],
      fechaAdquisicion: [null],
      costoAdquisicion: [null],
      anchoMetros: [null],
      altoMetros: [null],
      profundidadMetros: [null],
      imagenMaquina: [''],
      iconoMaquina: [''],
    });
  }

  // File upload properties
  @ViewChild('imagenFileInput') imagenFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('iconoFileInput') iconoFileInput!: ElementRef<HTMLInputElement>;

  imagenPreviewUrl: string | ArrayBuffer | null = null;
  imagenFileName: string | null = null;
  private imagenFile: File | null = null;

  iconoPreviewUrl: string | ArrayBuffer | null = null;
  iconoFileName: string | null = null;
  private iconoFile: File | null = null;

  private readonly MAX_FILE_MB = 5;

  private isImage(file: File) {
    return /^image\/(png|jpe?g|webp)$/i.test(file.type);
  }

  private uploadImagenAuto(): void {
    if (!this.imagenFile) return;
    const fd = new FormData();
    fd.append('file', this.imagenFile, this.imagenFile.name);
    fd.append('folder', 'usuarios');
    fd.append('idModule', '2');

    this.usuaService.uploadFile(fd).subscribe({
      next: (res: any) => {
        const url = res?.url ?? res?.Location ?? res?.data?.url ?? '';
        if (url) {
          this.maquinaForm.patchValue({ imagenMaquina: url });
          this.imagenPreviewUrl = url;
        }
      },
      error: (err) => console.error('Error al subir imagen', err),
    });
  }

  private uploadIconoAuto(): void {
    if (!this.iconoFile) return;
    const fd = new FormData();
    fd.append('file', this.iconoFile, this.iconoFile.name);
    fd.append('folder', 'usuarios');
    fd.append('idModule', '2');

    this.usuaService.uploadFile(fd).subscribe({
      next: (res: any) => {
        const url = res?.url ?? res?.Location ?? res?.data?.url ?? '';
        if (url) {
          this.maquinaForm.patchValue({ iconoMaquina: url });
          this.iconoPreviewUrl = url;
        }
      },
      error: (err) => console.error('Error al subir icono', err),
    });
  }

  onImagenSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0] || null;
    if (f && this.isImage(f) && f.size <= this.MAX_FILE_MB * 1024 * 1024) {
      this.imagenFile = f;
      this.imagenFileName = f.name;
      const reader = new FileReader();
      reader.onload = () => this.imagenPreviewUrl = reader.result;
      reader.readAsDataURL(f);
      this.uploadImagenAuto();
    }
    input.value = '';
  }

  onIconoSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0] || null;
    if (f && this.isImage(f) && f.size <= this.MAX_FILE_MB * 1024 * 1024) {
      this.iconoFile = f;
      this.iconoFileName = f.name;
      const reader = new FileReader();
      reader.onload = () => this.iconoPreviewUrl = reader.result;
      reader.readAsDataURL(f);
      this.uploadIconoAuto();
    }
    input.value = '';
  }

  openImagenFilePicker() {
    this.imagenFileInput.nativeElement.click();
  }

  openIconoFilePicker() {
    this.iconoFileInput.nativeElement.click();
  }

  clearImagen(e: Event) {
    e.stopPropagation();
    this.imagenPreviewUrl = null;
    this.imagenFileName = null;
    this.imagenFile = null;
    this.maquinaForm.patchValue({ imagenMaquina: '' });
    this.imagenFileInput.nativeElement.value = '';
  }

  clearIcono(e: Event) {
    e.stopPropagation();
    this.iconoPreviewUrl = null;
    this.iconoFileName = null;
    this.iconoFile = null;
    this.maquinaForm.patchValue({ iconoMaquina: '' });
    this.iconoFileInput.nativeElement.value = '';
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const charCode = event.keyCode ? event.keyCode : event.which;
    const key = event.key;
    const allowedKeys = [8, 9, 13, 37, 38, 39, 40, 46];
    const isNumber = (charCode >= 48 && charCode <= 57) || (charCode >= 96 && charCode <= 105);
    const isDecimal = key === '.' || key === ',' || charCode === 190 || charCode === 188 || charCode === 110;
    const isAllowedKey = allowedKeys.includes(charCode);
    
    if (!isNumber && !isAllowedKey && !isDecimal) {
      event.preventDefault();
    }
  }

  buildPayloadMaquina(): any {
    const v = this.maquinaForm.getRawValue();
    return {
      numeroSerie: v.numeroSerie ?? '',
      nombre: v.nombre ?? '',
      marca: v.marca ?? '',
      modelo: v.modelo ?? '',
      idZona: Number(v.idZona) || 0,
      idSala: Number(v.idSala) || 0,
      idCliente: Number(v.idCliente) || 0,
      idTipoMaquina: Number(v.idTipoMaquina) || 0,
      idFabricante: Number(v.idFabricante) || 0,
      idEstatusMaquina: Number(v.idEstatusMaquina) || 0,
      anioFabricacion: v.anioFabricacion ?? null,
      fechaAdquisicion: v.fechaAdquisicion ?? null,
      costoAdquisicion: Number(v.costoAdquisicion) || 0,
      anchoMetros: Number(v.anchoMetros) || 0,
      altoMetros: Number(v.altoMetros) || 0,
      profundidadMetros: Number(v.profundidadMetros) || 0,
      imagenMaquina: v.imagenMaquina ?? '',
      iconoMaquina: v.iconoMaquina ?? '',
    };
  }

  submit(): void {
    if (this.maquinaForm.invalid) {
      Swal.fire({
        title: '¡Campos incompletos!',
        text: 'Por favor completa todos los campos obligatorios.',
        icon: 'warning',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    this.submitButton = this.idMaquina ? 'Actualizando...' : 'Guardando...';
    this.loading = true;

    if (this.idMaquina) {
      this.actualizarMaquina();
    } else {
      this.agregarMaquina();
    }
  }

  agregarMaquina(): void {
    const payload = this.buildPayloadMaquina();
    this.maquinasService.agregarMaquina(payload).subscribe({
      next: () => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#0d121d',
          text: 'Se agregó una nueva máquina de manera exitosa.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.regresar();
      },
      error: (error) => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Ops!',
          background: '#0d121d',
          text: error.error,
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      },
    });
  }

  actualizarMaquina(): void {
    const payload = this.buildPayloadMaquina();
    this.maquinasService.actualizarMaquina(this.idMaquina, payload).subscribe({
      next: () => {
        this.submitButton = 'Actualizar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#0d121d',
          text: 'Los datos de la máquina se actualizaron correctamente.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.regresar();
      },
      error: (error) => {
        this.submitButton = 'Actualizar';
        this.loading = false;
        Swal.fire({
          title: '¡Ops!',
          background: '#0d121d',
          text: error.error,
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      },
    });
  }

  public regresar() {
    this.route.navigateByUrl('/maquinas');
  }
}
