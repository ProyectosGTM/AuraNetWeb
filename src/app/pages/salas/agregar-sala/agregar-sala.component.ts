import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { ClientesService } from 'src/app/shared/services/clientes.service';
import { SalaService } from 'src/app/shared/services/salas.service';
import { UsuariosService } from 'src/app/shared/services/usuario.service';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

type SelectItem = { id: number; text: string };

@Component({
  selector: 'app-agregar-sala',
  templateUrl: './agregar-sala.component.html',
  styleUrl: './agregar-sala.component.scss',
  animations: [fadeInRightAnimation],
})
export class AgregarSalaComponent implements OnInit {
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public idSala: number;
  public title = 'Agregar Sala';
  public listaClientes: any;
  public listaTipoZona: any;
  public listaMonedas: any;
  public listaEstatusLic: any;
  public idMonedaItems: SelectItem[] = [];
  public idEstatusLicItems: SelectItem[] = [];
  salaForm: FormGroup;
  private pendingSubmitAfterLocation = false;

  constructor(
    private fb: FormBuilder,
    private route: Router,
    private activatedRoute: ActivatedRoute,
    private usuaService: UsuariosService,
    private salasService: SalaService,
    private clienService: ClientesService,
  ) { }

  ngOnInit(): void {
    this.initForm();
    
    this.activatedRoute.params.subscribe((params) => {
      this.idSala = params['idSala'];
      if (this.idSala) {
        this.title = 'Actualizar Sala';
        this.submitButton = 'Actualizar';
        // Cargar todas las listas primero, luego obtener la sala
        forkJoin({
          clientes: this.clienService.obtenerClientes(),
          monedas: this.salasService.obtenerMonedas(),
          estatusLic: this.salasService.obtenerEstatusLic()
        }).subscribe({
          next: (responses) => {
            this.listaClientes = (responses.clientes.data || []).map((c: any) => ({
              ...c,
              id: Number(c.id),
              text: (c.nombre ?? '').trim() || 'Sin nombre',
            }));
            
            const monedas = (responses.monedas.data || []).map((c: any) => ({
              id: Number(c.id),
              text: (c.nombre ?? '').trim() || 'Sin nombre',
            } as SelectItem));
            this.listaMonedas = monedas;
            this.idMonedaItems = monedas;

            const estatusLic = (responses.estatusLic.data || []).map((c: any) => ({
              id: Number(c.id),
              text: (c.nombre ?? '').trim() || 'Sin nombre',
            } as SelectItem));
            this.listaEstatusLic = estatusLic;
            this.idEstatusLicItems = estatusLic;
            
            // Ahora obtener la sala con todas las listas cargadas
            this.obtenerSala();
          },
          error: (error) => {
            console.error('Error al cargar listas:', error);
            // Aun así intentar cargar las listas individualmente
            this.obtenerClientes();
            this.obtenerMonedas();
            this.obtenerEstatusLic();
            this.obtenerSala();
          }
        });
      } else {
        this.title = 'Agregar Sala';
        this.submitButton = 'Guardar';
        // Para agregar, cargar las listas normalmente
        this.obtenerClientes();
        this.obtenerMonedas();
        this.obtenerEstatusLic();
      }
    });
  }

  obtenerMonedas() {
    this.salasService.obtenerMonedas().subscribe((response) => {
      const monedas = (response.data || []).map((c: any) => ({
        id: Number(c.id),
        text: (c.nombre ?? '').trim() || 'Sin nombre',
      } as SelectItem));
      this.listaMonedas = monedas;
      this.idMonedaItems = monedas;
    });
  }

  obtenerEstatusLic() {
    this.salasService.obtenerEstatusLic().subscribe((response) => {
      const estatusLic = (response.data || []).map((c: any) => ({
        id: Number(c.id),
        text: (c.nombre ?? '').trim() || 'Sin nombre',
      } as SelectItem));
      this.listaEstatusLic = estatusLic;
      this.idEstatusLicItems = estatusLic;
    });
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

  obtenerSala() {
    this.salasService.obtenerSala(this.idSala).subscribe({
      next: (response: any) => {
        const data = response.data || {};
        
        // Formatear fechas si existen
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
        
        // Mapear los campos del servicio al formulario usando los nombres correctos del JSON
        this.salaForm.patchValue({
          nombre: data.nombreSala ?? '',
          nombreComercial: data.nombreComercialSala ?? '',
          descripcion: data.descripcionSala ?? '',
          logotipo: data.logotipoSala ?? '',
          direccion: data.direccionSala ?? '',
          pais: data.paisSala ?? 'MEX',
          estado: data.estadoSala ?? '',
          municipio: data.municipioSala ?? '',
          colonia: data.coloniaSala ?? '',
          calle: data.calleSala ?? '',
          numeroExterior: data.numeroExteriorSala ?? '',
          numeroInterior: data.numeroInteriorSala ?? '',
          codigoPostal: data.codigoPostalSala ?? '',
          referencias: data.referenciasSala ?? '',
          latitud: this.toCoord8(data.latitudSala ?? 0),
          longitud: this.toCoord8(data.longitudSala ?? 0),
          metrosCuadrados: Number(data.metrosCuadradosSala ?? 0),
          numeroNiveles: Number(data.numeroNivelesSala ?? 0),
          capacidadPersonas: Number(data.capacidadPersonasSala ?? 0),
          planoArquitectonico: data.planoArquitectonico ?? '',
          planoDistribucion: data.planoDistribucion ?? '',
          licenciaOperacion: data.licenciaOperacion ?? '',
          fechaVencimientoLicencia: formatDate(data.fechaVencimientoLicencia),
          idMonedaPrincipal: Number(data.idMonedaPrincipal ?? 0),
          fechaInicioContrato: formatDate(data.fechaInicioContrato),
          fechaFinContrato: formatDate(data.fechaFinContrato),
          idEstatusLicencia: Number(data.idEstatusLicencia ?? 0),
          motivoSuspension: data.motivoSuspension ?? '',
          idCliente: Number(data.idCliente ?? 0),
          motivoSuspension: data.motivoSuspension ?? null,
        });

        // Cargar imágenes si existen
        if (data.logotipoSala) {
          this.logotipoPreviewUrl = data.logotipoSala;
        }
        if (data.licenciaOperacion) {
          if (/\.(png|jpe?g|webp|gif|bmp|svg|avif)(\?.*)?$/i.test(data.licenciaOperacion)) {
            this.licenciaPreviewUrl = data.licenciaOperacion;
          }
        }
        if (data.planoArquitectonico) {
          if (/\.(png|jpe?g|webp|gif|bmp|svg|avif)(\?.*)?$/i.test(data.planoArquitectonico)) {
            this.planoPreviewUrl = data.planoArquitectonico;
          }
        }
        if (data.planoDistribucion) {
          if (/\.(png|jpe?g|webp|gif|bmp|svg|avif)(\?.*)?$/i.test(data.planoDistribucion)) {
            this.planoDistribucionPreviewUrl = data.planoDistribucion;
          }
        }

        // Establecer coordenadas para el mapa si existen
        if (data.latitudSala && data.longitudSala) {
          this.selectedLat = this.toCoord8(data.latitudSala);
          this.selectedLng = this.toCoord8(data.longitudSala);
        }
      },
      error: (error) => {
        console.error('Error al obtener sala:', error);
        Swal.fire({
          title: '¡Error!',
          text: 'No se pudo cargar la información de la sala.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  initForm(): void {
    this.salaForm = this.fb.group({
<<<<<<< HEAD
      nombre: ['', Validators.required],
      nombreComercial: ['', Validators.required],
      descripcion: ['', Validators.required],
      logotipo: ['', Validators.required],
      direccion: ['', Validators.required],
      pais: ['MEX', Validators.required],
      estado: ['', Validators.required],
      municipio: ['', Validators.required],
      colonia: ['', Validators.required],
      calle: ['', Validators.required],
      numeroExterior: ['', Validators.required],
      numeroInterior: ['', Validators.required],
      codigoPostal: ['', Validators.required],
      referencias: ['', Validators.required],
      // Ubicación: se selecciona en el modal del mapa (no bloquea el submit por "required")
      latitud: [null, [Validators.min(-90), Validators.max(90)]],
      longitud: [null, [Validators.min(-180), Validators.max(180)]],
      metrosCuadrados: [null, Validators.required],
      numeroNiveles: [null, Validators.required],
      capacidadPersonas: [null, Validators.required],
      planoArquitectonico: ['', Validators.required],
      planoDistribucion: ['', Validators.required],
      licenciaOperacion: ['', Validators.required],
      fechaVencimientoLicencia: [null, Validators.required],
      idMonedaPrincipal: [null, Validators.required],
      fechaInicioContrato: [null, Validators.required],
      fechaFinContrato: [null, Validators.required],
      idEstatusLicencia: [null, Validators.required],
      motivoSuspension: [''],
=======
      nombre: [''],
      nombreComercial: [''],
      descripcion: [''],
      logotipo: [''],
      direccion: [''],
      pais: ['MEX'],
      estado: [''],
      municipio: [''],
      colonia: [''],
      calle: [''],
      numeroExterior: [''],
      numeroInterior: [''],
      codigoPostal: [''],
      referencias: [''],
      latitud: [0],
      longitud: [0],
      metrosCuadrados: [null],
      numeroNiveles: [null],
      capacidadPersonas: [null],
      planoArquitectonico: [''],
      planoDistribucion: [''],
      licenciaOperacion: [''],
      fechaVencimientoLicencia: [null],
      idMonedaPrincipal: [null],
      fechaInicioContrato: [null],
      fechaFinContrato: [null],
      idEstatusLicencia: [null],
>>>>>>> 7561ab3 ([Fix]Salas y cajas)
      idCliente: [null, Validators.required],
      motivoSuspension: [null],
    });
  }

  @ViewChild('logotipoFileInput') logotipoFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('licenciaFileInput') licenciaFileInput!: ElementRef<HTMLInputElement>;

  logotipoPreviewUrl: string | ArrayBuffer | null = null;
  logotipoDragging = false;
  logotipoFileName: string | null = null;
  private logotipoFile: File | null = null;

  licenciaPreviewUrl: string | ArrayBuffer | null = null;
  licenciaDragging = false;
  licenciaFileName: string | null = null;
  private licenciaFile: File | null = null;

  private readonly MAX_LOGO_MB = 3;
  private readonly MAX_LIC_MB = 5;

  private isImage(file: File) {
    return /^image\/(png|jpe?g|webp)$/i.test(file.type);
  }

  private isPdf(file: File) {
    return /^application\/pdf$/i.test(file.type);
  }

  private isAllowedLogotipo(file: File) {
    return this.isImage(file) && file.size <= this.MAX_LOGO_MB * 1024 * 1024;
  }

  private isAllowedLicencia(file: File) {
    const ok = this.isImage(file) || this.isPdf(file);
    return ok && file.size <= this.MAX_LIC_MB * 1024 * 1024;
  }

  private loadPreview(file: File, setter: (url: string | ArrayBuffer | null) => void) {
    if (!this.isImage(file)) {
      setter(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setter(reader.result);
    reader.readAsDataURL(file);
  }

  private uploadLogotipoAuto(): void {
    const fd = new FormData();
    if (this.logotipoFile) fd.append('file', this.logotipoFile, this.logotipoFile.name);
    fd.append('folder', 'usuarios');
    fd.append('idModule', '2');

    this.usuaService.uploadFile(fd).subscribe({
      next: (res: any) => {
        const url = res?.url ?? res?.Location ?? res?.data?.url ?? '';
        if (url) {
          this.salaForm.patchValue({ logotipo: url });
          if (/\.(png|jpe?g|webp|gif|bmp|svg|avif)(\?.*)?$/i.test(url)) {
            this.logotipoPreviewUrl = url;
          }
        }
      },
      error: (err) => console.error('Error al subir logotipo', err),
    });
  }

  private uploadLicenciaAuto(): void {
    const fd = new FormData();
    if (this.licenciaFile) fd.append('file', this.licenciaFile, this.licenciaFile.name);
    fd.append('folder', 'usuarios');
    fd.append('idModule', '2');

    this.usuaService.uploadFile(fd).subscribe({
      next: (res: any) => {
        const url = res?.url ?? res?.Location ?? res?.data?.url ?? '';
        if (url) {
          this.salaForm.patchValue({ licenciaOperacion: url });
          if (/\.(png|jpe?g|webp|gif|bmp|svg|avif)(\?.*)?$/i.test(url)) {
            this.licenciaPreviewUrl = url;
          } else {
            this.licenciaPreviewUrl = null;
          }
        }
      },
      error: (err) => console.error('Error al subir licencia', err),
    });
  }

  openLogotipoFilePicker() {
    this.logotipoFileInput.nativeElement.click();
  }

  onLogotipoDragOver(e: DragEvent) {
    e.preventDefault();
    this.logotipoDragging = true;
  }

  onLogotipoDragLeave(_e: DragEvent) {
    this.logotipoDragging = false;
  }

  onLogotipoDrop(e: DragEvent) {
    e.preventDefault();
    this.logotipoDragging = false;
    const f = e.dataTransfer?.files?.[0];
    if (f) this.handleLogotipoFile(f);
  }

  onLogotipoSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0] || null;
    if (f) this.handleLogotipoFile(f);
    input.value = '';
  }

  clearLogotipo(e: Event) {
    e.stopPropagation();
    this.logotipoPreviewUrl = null;
    this.logotipoFileName = null;
    this.logotipoFileInput.nativeElement.value = '';
    this.logotipoFile = null;
    this.salaForm.patchValue({ logotipo: '' });
    this.salaForm.get('logotipo')?.setErrors(null);
  }

  private handleLogotipoFile(file: File) {
    if (!this.isAllowedLogotipo(file)) {
      this.salaForm.get('logotipo')?.setErrors({ invalid: true });
      return;
    }

    this.logotipoFileName = file.name;
    this.loadPreview(file, (url) => (this.logotipoPreviewUrl = url));
    this.logotipoFile = file;
    // El body del API espera URL (string), no File
    if (typeof this.salaForm.get('logotipo')?.value !== 'string') {
      this.salaForm.patchValue({ logotipo: '' });
    }
    this.salaForm.get('logotipo')?.setErrors(null);
    this.uploadLogotipoAuto();
  }

  openLicenciaFilePicker() {
    this.licenciaFileInput.nativeElement.click();
  }

  onLicenciaDragOver(e: DragEvent) {
    e.preventDefault();
    this.licenciaDragging = true;
  }

  onLicenciaDragLeave(_e: DragEvent) {
    this.licenciaDragging = false;
  }

  onLicenciaDrop(e: DragEvent) {
    e.preventDefault();
    this.licenciaDragging = false;
    const f = e.dataTransfer?.files?.[0];
    if (f) this.handleLicenciaFile(f);
  }

  onLicenciaSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0] || null;
    if (f) this.handleLicenciaFile(f);
    input.value = '';
  }

  clearLicencia(e: Event) {
    e.stopPropagation();
    this.licenciaPreviewUrl = null;
    this.licenciaFileName = null;
    this.licenciaFileInput.nativeElement.value = '';
    this.licenciaFile = null;
    this.salaForm.patchValue({ licenciaOperacion: '' });
    this.salaForm.get('licenciaOperacion')?.setErrors(null);
  }

  private handleLicenciaFile(file: File) {
    if (!this.isAllowedLicencia(file)) {
      this.salaForm.get('licenciaOperacion')?.setErrors({ invalid: true });
      return;
    }

    this.licenciaFileName = file.name;
    this.loadPreview(file, (url) => (this.licenciaPreviewUrl = url));
    this.licenciaFile = file;
    // El body del API espera URL (string), no File
    if (typeof this.salaForm.get('licenciaOperacion')?.value !== 'string') {
      this.salaForm.patchValue({ licenciaOperacion: '' });
    }
    this.salaForm.get('licenciaOperacion')?.setErrors(null);
    this.uploadLicenciaAuto();
  }

  @ViewChild('planoFileInput') planoFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('planoDistribucionFileInput') planoDistribucionFileInput!: ElementRef<HTMLInputElement>;

  planoPreviewUrl: string | ArrayBuffer | null = null;
  planoDragging = false;
  planoFileName: string | null = null;

  private planoFile: File | null = null;

  planoDistribucionPreviewUrl: string | ArrayBuffer | null = null;
  planoDistribucionDragging = false;
  planoDistribucionFileName: string | null = null;

  private planoDistribucionFile: File | null = null;

  private readonly DEFAULT_PLANO_URL = '';
  private readonly MAX_MB = 3;

  private isPlanoImage(file: File) {
    return /^image\/(png|jpe?g|webp)$/i.test(file.type);
  }

  private isPlanoAllowed(file: File) {
    const okImg = this.isPlanoImage(file);
    const okPdf = /pdf/i.test(file.type);
    return (okImg || okPdf) && file.size <= this.MAX_MB * 1024 * 1024;
  }

  private loadPlanoPreview(file: File, setter: (url: string | ArrayBuffer | null) => void) {
    if (!this.isPlanoImage(file)) {
      setter(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setter(reader.result);
    reader.readAsDataURL(file);
  }

  private uploadPlanoAuto(): void {
    const fd = new FormData();

    if (this.planoFile) {
      fd.append('file', this.planoFile, this.planoFile.name);
    } else {
      fd.append('file', this.DEFAULT_PLANO_URL);
    }

    fd.append('folder', 'usuarios');
    fd.append('idModule', '2');

    this.usuaService.uploadFile(fd).subscribe({
      next: (res: any) => {
        const url = res?.url ?? res?.Location ?? res?.data?.url ?? '';
        if (url) {
          this.salaForm.patchValue({ planoArquitectonico: url });

          if (/\.(png|jpe?g|webp|gif|bmp|svg|avif)(\?.*)?$/i.test(url)) {
            this.planoPreviewUrl = url;
          } else {
            this.planoPreviewUrl = null;
          }
        }
      },
      error: (err) => {
        console.error('Error al subir plano', err);
      },
    });
  }

  openPlanoFilePicker() {
    this.planoFileInput.nativeElement.click();
  }

  onPlanoDragOver(e: DragEvent) {
    e.preventDefault();
    this.planoDragging = true;
  }

  onPlanoDragLeave(_e: DragEvent) {
    this.planoDragging = false;
  }

  onPlanoDrop(e: DragEvent) {
    e.preventDefault();
    this.planoDragging = false;
    const f = e.dataTransfer?.files?.[0];
    if (f) this.handlePlanoFile(f);
  }

  onPlanoFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0] || null;
    if (f) this.handlePlanoFile(f);
    if (input) input.value = '';
  }

  clearPlanoFile(e: Event) {
    e.stopPropagation();
    this.planoPreviewUrl = null;
    this.planoFileName = null;
    this.planoFileInput.nativeElement.value = '';
    this.planoFile = null;

    this.salaForm.patchValue({ planoArquitectonico: this.DEFAULT_PLANO_URL });
    this.salaForm.get('planoArquitectonico')?.setErrors(null);

    this.uploadPlanoAuto();
  }

  private handlePlanoFile(file: File) {
    if (!this.isPlanoAllowed(file)) {
      this.salaForm.get('planoArquitectonico')?.setErrors({ invalid: true });
      return;
    }

    this.planoFileName = file.name;

    this.loadPlanoPreview(file, (url) => (this.planoPreviewUrl = url));
    this.planoFile = file;

    // El body del API espera URL (string), no File
    if (typeof this.salaForm.get('planoArquitectonico')?.value !== 'string') {
      this.salaForm.patchValue({ planoArquitectonico: '' });
    }
    this.salaForm.get('planoArquitectonico')?.setErrors(null);

    this.uploadPlanoAuto();
  }

  private uploadPlanoDistribucionAuto(): void {
    const fd = new FormData();

    if (this.planoDistribucionFile) {
      fd.append('file', this.planoDistribucionFile, this.planoDistribucionFile.name);
    } else {
      fd.append('file', this.DEFAULT_PLANO_URL);
    }

    fd.append('folder', 'usuarios');
    fd.append('idModule', '2');

    this.usuaService.uploadFile(fd).subscribe({
      next: (res: any) => {
        const url = res?.url ?? res?.Location ?? res?.data?.url ?? '';
        if (url) {
          this.salaForm.patchValue({ planoDistribucion: url });

          if (/\.(png|jpe?g|webp|gif|bmp|svg|avif)(\?.*)?$/i.test(url)) {
            this.planoDistribucionPreviewUrl = url;
          } else {
            this.planoDistribucionPreviewUrl = null;
          }
        }
      },
      error: (err) => {
        console.error('Error al subir plano distribución', err);
      },
    });
  }

  openPlanoDistribucionFilePicker() {
    this.planoDistribucionFileInput.nativeElement.click();
  }

  onPlanoDistribucionDragOver(e: DragEvent) {
    e.preventDefault();
    this.planoDistribucionDragging = true;
  }

  onPlanoDistribucionDragLeave(_e: DragEvent) {
    this.planoDistribucionDragging = false;
  }

  onPlanoDistribucionDrop(e: DragEvent) {
    e.preventDefault();
    this.planoDistribucionDragging = false;
    const f = e.dataTransfer?.files?.[0];
    if (f) this.handlePlanoDistribucionFile(f);
  }

  onPlanoDistribucionFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0] || null;
    if (f) this.handlePlanoDistribucionFile(f);
    if (input) input.value = '';
  }

  clearPlanoDistribucionFile(e: Event) {
    e.stopPropagation();
    this.planoDistribucionPreviewUrl = null;
    this.planoDistribucionFileName = null;
    this.planoDistribucionFileInput.nativeElement.value = '';
    this.planoDistribucionFile = null;

    this.salaForm.patchValue({ planoDistribucion: this.DEFAULT_PLANO_URL });
    this.salaForm.get('planoDistribucion')?.setErrors(null);

    this.uploadPlanoDistribucionAuto();
  }

  private handlePlanoDistribucionFile(file: File) {
    if (!this.isPlanoAllowed(file)) {
      this.salaForm.get('planoDistribucion')?.setErrors({ invalid: true });
      return;
    }

    this.planoDistribucionFileName = file.name;

    this.loadPlanoPreview(file, (url) => (this.planoDistribucionPreviewUrl = url));
    this.planoDistribucionFile = file;

    // El body del API espera URL (string), no File
    if (typeof this.salaForm.get('planoDistribucion')?.value !== 'string') {
      this.salaForm.patchValue({ planoDistribucion: '' });
    }
    this.salaForm.get('planoDistribucion')?.setErrors(null);

    this.uploadPlanoDistribucionAuto();
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const charCode = event.keyCode ? event.keyCode : event.which;
    const key = event.key;
    // Permitir números (48-57), punto decimal (190 o 110), coma (188), backspace (8), delete (46), tab (9), enter (13), flechas (37-40)
    const allowedKeys = [8, 9, 13, 37, 38, 39, 40, 46]; // backspace, tab, enter, flechas, delete
    const isNumber = (charCode >= 48 && charCode <= 57) || (charCode >= 96 && charCode <= 105);
    const isDecimal = key === '.' || key === ',' || charCode === 190 || charCode === 188 || charCode === 110;
    const isAllowedKey = allowedKeys.includes(charCode);
    
    if (!isNumber && !isAllowedKey && !isDecimal) {
      event.preventDefault();
    }
  }

  submit(): void {
    // Validar todo excepto ubicación (lat/long). La ubicación se elige en el mapa.
    const invalidNonLocation = Object.keys(this.salaForm.controls).filter((key) => {
      if (key === 'latitud' || key === 'longitud') return false;
      return this.salaForm.get(key)?.invalid;
    });

    if (invalidNonLocation.length > 0) {

      const etiquetas: any = {
        nombre: 'Nombre',
        nombreComercial: 'Nombre Comercial',
        descripcion: 'Descripción',
        direccion: 'Dirección',
        pais: 'País',
        estado: 'Estado',
        municipio: 'Municipio',
        colonia: 'Colonia',
        calle: 'Calle',
        numeroExterior: 'Número Exterior',
        numeroInterior: 'Número Interior',
        codigoPostal: 'Código Postal',
        referencias: 'Referencias',
        metrosCuadrados: 'Metros Cuadrados',
        numeroNiveles: 'Número Niveles',
        capacidadPersonas: 'Capacidad Personas',
        planoArquitectonico: 'Plano Arquitectónico',
        planoDistribucion: 'Plano Distribución',
        licenciaOperacion: 'Licencia de Operación',
        idMonedaPrincipal: 'Moneda Principal',
        fechaVencimientoLicencia: 'Fecha Vencimiento Licencia',
        fechaInicioContrato: 'Fecha Inicio Contrato',
        fechaFinContrato: 'Fecha Fin Contrato',
        idEstatusLicencia: 'Estatus Licencia',
        motivoSuspension: 'Motivo Suspensión',
        idCliente: 'Cliente',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.salaForm.controls).forEach((key) => {
        if (key === 'latitud' || key === 'longitud') return;
        const control = this.salaForm.get(key);
        if (control?.invalid && control.errors?.['required']) {
          camposFaltantes.push(etiquetas[key] || key);
        }
      });

      const lista = camposFaltantes
        .map(
          (campo, index) => `
        <div style="padding: 8px 12px; border-left: 4px solid #d9534f;
                    background: #caa8a8; text-align: center; margin-bottom: 8px;
                    border-radius: 4px;">
          <strong style="color: #b02a37;">${index + 1}. ${campo}</strong>
        </div>
      `
        )
        .join('');

      Swal.fire({
        title: '¡Faltan campos obligatorios!',
        background: '#0d121d',
        html: `
        <p style="text-align: center; font-size: 15px; margin-bottom: 16px; color: white">
          Los siguientes <strong>campos obligatorios</strong> están vacíos.<br>
          Por favor complétalos antes de continuar:
        </p>
        <div style="max-height: 350px; overflow-y: auto;">${lista}</div>
      `,
        icon: 'error',
        confirmButtonText: 'Entendido',
        customClass: { popup: 'swal2-padding swal2-border' },
      });

      return;
    }

    // Flujo deseado: solo al cumplir obligatorios y presionar Guardar se abre el modal.
    // En el modal se habilita Guardar cuando el usuario selecciona ubicación.
    this.pendingSubmitAfterLocation = true;
    this.abrirModalUbicacion();
  }

  private abrirModalUbicacion(): void {
    const modalHtml = `
      <div class="map-modal-container">
        <div id="map-modal" style="width: 100%; height: 450px; border-radius: 12px; overflow: hidden; margin: 16px 0;"></div>
        <div style="display: flex; gap: 12px; justify-content: center; margin-top: 20px;">
          <button id="btn-guardar-ubicacion" type="button" class="btn-alt btn-alt--success" disabled style="opacity: .6; cursor: not-allowed;">
            <i class="fas fa-check"></i>
            <span>Guardar</span>
          </button>
          <button id="btn-cancelar-ubicacion" type="button" class="btn-alt btn-alt--cancel">
            <i class="fas fa-times"></i>
            <span>Cancelar</span>
          </button>
        </div>
      </div>
    `;

    Swal.fire({
      title: '<div style="display: flex; align-items: center; gap: 12px; justify-content: center; flex-wrap: wrap;"><i class="fas fa-map-marker-alt" style="color: #ff1a5b; font-size: 24px;"></i><span style="color: #fff; font-size: 18px; font-weight: 500;">Selecciona la ubicación del lugar</span></div>',
      html: modalHtml,
      width: '90%',
      background: '#0d121d',
      showConfirmButton: false,
      showCancelButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        this.initMapInModal();
        this.attachModalButtons();
      },
      customClass: {
        popup: 'map-modal-popup',
        htmlContainer: 'map-modal-html',
        title: 'map-modal-title'
      }
    } as any);
  }

  private initMapInModal(): void {
    // Esperar a que Google Maps esté cargado
    const waitForGoogle = () => {
      if (typeof window.google !== 'undefined' && window.google.maps) {
        this.createMap();
      } else {
        setTimeout(waitForGoogle, 100);
      }
    };
    waitForGoogle();
  }

  private mapInstance: google.maps.Map | null = null;
  private markerInstance: google.maps.Marker | null = null;
  private selectedLat: number = 0;
  private selectedLng: number = 0;

  private toCoord8(value: any): number {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Number(n.toFixed(8));
  }

  private createMap(): void {
    const mapElement = document.getElementById('map-modal');
    if (!mapElement) return;

    // Usar ubicación actual del formulario o centro de México
    const currentLat = this.toCoord8(this.salaForm.get('latitud')?.value) || 19.4326;
    const currentLng = this.toCoord8(this.salaForm.get('longitud')?.value) || -99.1332;

    this.mapInstance = new window.google.maps.Map(mapElement, {
      center: { lat: currentLat, lng: currentLng },
      zoom: 13,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: true,
      scaleControl: true,
      streetViewControl: true,
      rotateControl: true,
      fullscreenControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'all',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'poi.business',
          elementType: 'all',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'poi.place_of_worship',
          elementType: 'all',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'poi.school',
          elementType: 'all',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'poi.sports_complex',
          elementType: 'all',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    // Si ya hay coordenadas, poner el marker inicial
    if (currentLat !== 19.4326 || currentLng !== -99.1332) {
      this.addMarker(currentLat, currentLng);
      this.selectedLat = currentLat;
      this.selectedLng = currentLng;
      setTimeout(() => this.enableSaveButton(), 300);
    }

    // Agregar listener para clicks en el mapa
    this.mapInstance.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const lat = this.toCoord8(event.latLng.lat());
        const lng = this.toCoord8(event.latLng.lng());
        this.addMarker(lat, lng);
        this.selectedLat = lat;
        this.selectedLng = lng;
        this.enableSaveButton();
      }
    });
  }

  private addMarker(lat: number, lng: number): void {
    if (!this.mapInstance) return;

    // Eliminar marker anterior si existe
    if (this.markerInstance) {
      this.markerInstance.setMap(null);
    }

    // Crear marker atractivo personalizado
    const markerIcon = {
      url: 'data:image/svg+xml;base64,' + btoa(`
        <svg width="48" height="64" viewBox="0 0 48 64" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.3"/>
            </filter>
          </defs>
          <path d="M24 0C10.745 0 0 10.745 0 24c0 14.25 24 40 24 40s24-25.75 24-40C48 10.745 37.255 0 24 0z" fill="#ff1a5b" filter="url(#shadow)"/>
          <circle cx="24" cy="24" r="12" fill="#fff"/>
          <circle cx="24" cy="24" r="6" fill="#ff1a5b"/>
        </svg>
      `),
      scaledSize: new window.google.maps.Size(48, 64),
      anchor: new window.google.maps.Point(24, 64)
    };

    this.markerInstance = new window.google.maps.Marker({
      position: { lat, lng },
      map: this.mapInstance,
      icon: markerIcon,
      animation: window.google.maps.Animation.DROP,
      draggable: true
    });

    // Listener para cuando se arrastra el marker
    this.markerInstance.addListener('dragend', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        this.selectedLat = event.latLng.lat();
        this.selectedLng = event.latLng.lng();
        this.mapInstance?.panTo({ lat: this.selectedLat, lng: this.selectedLng });
      }
    });

    // Centrar el mapa en la nueva posición
    this.mapInstance.panTo({ lat, lng });
  }

  private enableSaveButton(): void {
    const btnGuardar = document.getElementById('btn-guardar-ubicacion');
    if (btnGuardar) {
      const b = btnGuardar as HTMLButtonElement;
      b.disabled = false;
      b.style.opacity = '1';
      b.style.cursor = 'pointer';
    }
  }

  private attachModalButtons(): void {
    setTimeout(() => {
      const btnGuardar = document.getElementById('btn-guardar-ubicacion');
      const btnCancelar = document.getElementById('btn-cancelar-ubicacion');

      if (btnGuardar) {
        btnGuardar.addEventListener('click', () => {
          const b = btnGuardar as HTMLButtonElement;
          if (b.disabled) return;
          this.confirmarUbicacion();
        });
      }

      if (btnCancelar) {
        btnCancelar.addEventListener('click', () => {
          this.cancelarUbicacion();
        });
      }
    }, 300);
  }

  private confirmarUbicacion(): void {
    if (this.selectedLat && this.selectedLng) {
      this.salaForm.patchValue({
        latitud: this.toCoord8(this.selectedLat),
        longitud: this.toCoord8(this.selectedLng)
      });
    }

    Swal.close();

    // Ejecutar el servicio (solo se llega aquí cuando el usuario ya seleccionó ubicación)
    this.submitButton = this.idSala ? 'Actualizando...' : 'Guardando...';
    this.loading = true;
    if (this.idSala) this.actualizarSala();
    else this.agregarSala();
  }

  private cancelarUbicacion(): void {
    Swal.close();
    // Restaurar estado del botón y loading (no enviar)
    this.submitButton = this.idSala ? 'Actualizar' : 'Guardar';
    this.loading = false;
    // No limpiar el formulario; el usuario solo canceló la selección de ubicación
  }

  private limpiarFormulario(): void {
    this.salaForm.reset();
    this.salaForm.patchValue({
      pais: 'MEX',
      latitud: 0,
      longitud: 0,
      metrosCuadrados: null,
      numeroNiveles: null,
      capacidadPersonas: null,
      idMonedaPrincipal: null,
      idEstatusLicencia: null,
      idCliente: null,
      motivoSuspension: null
    });
    
    // Limpiar previews de imágenes
    this.logotipoPreviewUrl = null;
    this.logotipoFileName = null;
    this.logotipoFile = null;
    this.licenciaPreviewUrl = null;
    this.licenciaFileName = null;
    this.licenciaFile = null;
    this.planoPreviewUrl = null;
    this.planoFileName = null;
    this.planoFile = null;
    this.planoDistribucionPreviewUrl = null;
    this.planoDistribucionFileName = null;
    this.planoDistribucionFile = null;
    
    // Resetear estados
    this.selectedLat = 0;
    this.selectedLng = 0;
    this.markerInstance = null;
    this.mapInstance = null;
  }

  private buildPayloadSala(): any {
    const v = this.salaForm.getRawValue();
<<<<<<< HEAD
    const toNumber = (val: unknown): number | null => {
      if (val === null || val === undefined || val === '') return null;
      if (typeof val === 'number') return Number.isFinite(val) ? val : null;
      const s = String(val).trim().replace(',', '.');
      if (!s) return null;
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    };

    const lat = toNumber(v.latitud);
    const lng = toNumber(v.longitud);
=======
    const toNumOrNull = (value: any): number | null => {
      if (value === null || value === undefined || value === '') return null;
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    };
    const toIntOrNull = (value: any): number | null => {
      const n = toNumOrNull(value);
      return n === null ? null : Math.trunc(n);
    };
>>>>>>> 7561ab3 ([Fix]Salas y cajas)
    return {
      nombre: v.nombre ?? '',
      nombreComercial: v.nombreComercial ?? '',
      descripcion: v.descripcion ?? '',
      logotipo: typeof v.logotipo === 'string' ? v.logotipo : '',
      direccion: v.direccion ?? '',
      pais: v.pais ?? '',
      estado: v.estado ?? '',
      municipio: v.municipio ?? '',
      colonia: v.colonia ?? '',
      calle: v.calle ?? '',
      numeroExterior: v.numeroExterior ?? '',
      numeroInterior: v.numeroInterior ?? '',
      codigoPostal: v.codigoPostal ?? '',
      referencias: v.referencias ?? '',
<<<<<<< HEAD
      latitud: lat,
      longitud: lng,
      metrosCuadrados: toNumber(v.metrosCuadrados),
      numeroNiveles: toNumber(v.numeroNiveles),
      capacidadPersonas: toNumber(v.capacidadPersonas),
      planoArquitectonico: v.planoArquitectonico ?? '',
      planoDistribucion: v.planoDistribucion ?? '',
      licenciaOperacion: v.licenciaOperacion ?? '',
=======
      latitud: (() => {
        const n = toNumOrNull(v.latitud);
        return n === null ? null : this.toCoord8(n);
      })(),
      longitud: (() => {
        const n = toNumOrNull(v.longitud);
        return n === null ? null : this.toCoord8(n);
      })(),
      metrosCuadrados: toNumOrNull(v.metrosCuadrados),
      numeroNiveles: toIntOrNull(v.numeroNiveles),
      capacidadPersonas: toIntOrNull(v.capacidadPersonas),
      planoArquitectonico: typeof v.planoArquitectonico === 'string' ? v.planoArquitectonico : '',
      planoDistribucion: typeof v.planoDistribucion === 'string' ? v.planoDistribucion : '',
      licenciaOperacion: typeof v.licenciaOperacion === 'string' ? v.licenciaOperacion : '',
>>>>>>> 7561ab3 ([Fix]Salas y cajas)
      fechaVencimientoLicencia: v.fechaVencimientoLicencia ?? null,
      idMonedaPrincipal: toIntOrNull(v.idMonedaPrincipal),
      fechaInicioContrato: v.fechaInicioContrato ?? null,
      fechaFinContrato: v.fechaFinContrato ?? null,
<<<<<<< HEAD
      idEstatusLicencia: Number(v.idEstatusLicencia) || 0,
      motivoSuspension: v.motivoSuspension ?? null,
      idCliente: (() => {
        const raw = v.idCliente;
        if (raw === null || raw === undefined || raw === '') {
          return 0;
        }
        const n = Number(raw);
        return Number.isFinite(n) ? Math.trunc(n) : 0;
      })(),
=======
      idEstatusLicencia: toIntOrNull(v.idEstatusLicencia),
      idCliente: toIntOrNull(v.idCliente),
      motivoSuspension: v.motivoSuspension ?? null,
>>>>>>> 7561ab3 ([Fix]Salas y cajas)
    };
  }


  agregarSala(): void {
    const payload = this.buildPayloadSala();

    this.salasService.agregarSala(payload).subscribe({
      next: () => {
        this.submitButton = 'Guardar';
        this.loading = false;

        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#0d121d',
          text: 'Se agregó una nueva sala de manera exitosa.',
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

  actualizarSala(): void {
    const payload = this.buildPayloadSala();

    this.salasService.actualizarSala(this.idSala, payload).subscribe({
      next: () => {
        this.submitButton = 'Actualizar';
        this.loading = false;

        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#0d121d',
          text: 'Los datos de la sala se actualizaron correctamente.',
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
    this.route.navigateByUrl('/salas')
  }
}