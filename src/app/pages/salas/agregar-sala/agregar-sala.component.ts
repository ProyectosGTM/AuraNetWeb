import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
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
  salaForm: FormGroup;

  isClienteOpen = false;
  clienteLabel = '';

  toggleCliente(event: MouseEvent) {
    event.preventDefault();
    this.isClienteOpen = !this.isClienteOpen;
  }

  setCliente(id: any, nombre: string, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    this.salaForm.patchValue({ idCliente: id });
    this.clienteLabel = nombre;
    this.isClienteOpen = false;
  }

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
            // Procesar clientes
            this.listaClientes = (responses.clientes.data || []).map((c: any) => ({
              ...c,
              id: Number(c.id),
            }));
            
            // Procesar monedas
            const monedas = (responses.monedas.data || []).map((c: any) => ({
              id: Number(c.id),
              text: c.nombre || ''
            } as SelectItem));
            this.listaMonedas = monedas;
            this.setIdMonedaItems(monedas);
            
            // Procesar estatus licencia
            const estatusLic = (responses.estatusLic.data || []).map((c: any) => ({
              id: Number(c.id),
              text: c.nombre || ''
            } as SelectItem));
            this.listaEstatusLic = estatusLic;
            this.setIdEstatusLicItems(estatusLic);
            
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
        text: c.nombre || ''
      } as SelectItem));
      this.listaMonedas = monedas;
      this.setIdMonedaItems(monedas);
      
      // Establecer label si ya hay un valor en el formulario
      const currentId = Number(this.salaForm.get('idMonedaPrincipal')?.value ?? 0);
      if (currentId) {
        const found = monedas.find((x: SelectItem) => x.id === currentId);
        if (found) {
          this.idMonedaLabel = found.text;
        }
      }
    });
  }

  obtenerEstatusLic() {
    this.salasService.obtenerEstatusLic().subscribe((response) => {
      const estatusLic = (response.data || []).map((c: any) => ({
        id: Number(c.id),
        text: c.nombre || ''
      } as SelectItem));
      this.listaEstatusLic = estatusLic;
      this.setIdEstatusLicItems(estatusLic);
      
      // Establecer label si ya hay un valor en el formulario
      const currentId = Number(this.salaForm.get('idEstatusLicencia')?.value ?? 0);
      if (currentId) {
        const found = estatusLic.find((x: SelectItem) => x.id === currentId);
        if (found) {
          this.idEstatusLicLabel = found.text;
        }
      }
    });
  }

  obtenerClientes() {
    this.clienService.obtenerClientes().subscribe((response) => {
      this.listaClientes = (response.data || []).map((c: any) => ({
        ...c,
        id: Number(c.id),
      }));
      const currentId = Number(this.salaForm.get('idCliente')?.value ?? 0);
      if (currentId) {
        const found = (this.listaClientes || []).find((x: any) => Number(x.id) === currentId);
        if (found) this.clienteLabel = found.nombre;
      }
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
          pais: data.paisSala ?? 'México',
          estado: data.estadoSala ?? '',
          municipio: data.municipioSala ?? '',
          colonia: data.coloniaSala ?? '',
          calle: data.calleSala ?? '',
          numeroExterior: data.numeroExteriorSala ?? '',
          numeroInterior: data.numeroInteriorSala ?? '',
          codigoPostal: data.codigoPostalSala ?? '',
          referencias: data.referenciasSala ?? '',
          latitud: Number(data.latitudSala ?? 0),
          longitud: Number(data.longitudSala ?? 0),
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
          idCliente: Number(data.idCliente ?? 0),
        });

        // Establecer labels para los selects usando los nombres del servicio
        const idCliente = Number(data.idCliente ?? 0);
        if (idCliente && this.listaClientes && this.listaClientes.length > 0) {
          const foundCliente = this.listaClientes.find((x: any) => Number(x.id) === idCliente);
          if (foundCliente) {
            // Construir el nombre completo del cliente
            const nombreCompleto = [
              data.nombreCliente,
              data.apellidoPaternoCliente,
              data.apellidoMaternoCliente
            ].filter(Boolean).join(' ').trim();
            this.clienteLabel = nombreCompleto || foundCliente.nombre || 'Cliente';
          }
        }

        // Establecer label de moneda usando nombreMoneda del servicio
        const idMoneda = Number(data.idMonedaPrincipal ?? 0);
        if (idMoneda) {
          this.idMonedaLabel = data.nombreMoneda || '';
          // Si no viene en el servicio, buscar en la lista
          if (!this.idMonedaLabel && this.idMonedaItems && this.idMonedaItems.length > 0) {
            const foundMoneda = this.idMonedaItems.find((x: SelectItem) => x.id === idMoneda);
            if (foundMoneda) {
              this.idMonedaLabel = foundMoneda.text;
            }
          }
        }

        // Establecer label de estatus licencia usando nombreEstatusLicencia del servicio
        const idEstatusLic = Number(data.idEstatusLicencia ?? 0);
        if (idEstatusLic) {
          this.idEstatusLicLabel = data.nombreEstatusLicencia || '';
          // Si no viene en el servicio, buscar en la lista
          if (!this.idEstatusLicLabel && this.idEstatusLicItems && this.idEstatusLicItems.length > 0) {
            const foundEstatus = this.idEstatusLicItems.find((x: SelectItem) => x.id === idEstatusLic);
            if (foundEstatus) {
              this.idEstatusLicLabel = foundEstatus.text;
            }
          }
        }

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
          this.selectedLat = Number(data.latitudSala);
          this.selectedLng = Number(data.longitudSala);
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
      nombre: [''],
      nombreComercial: [''],
      descripcion: [''],
      logotipo: [''],
      direccion: [''],
      pais: ['México'],
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
      idCliente: [null],
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
    this.salaForm.patchValue({ logotipo: file });
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
    this.salaForm.patchValue({ licenciaOperacion: file });
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

    this.salaForm.patchValue({ planoArquitectonico: file });
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

    this.salaForm.patchValue({ planoDistribucion: file });
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

  isIdClienteOpen = false;
  idClienteLabel = '';
  idClienteItems: SelectItem[] = [];

  isIdMonedaOpen = false;
  idMonedaLabel = '';
  idMonedaItems: SelectItem[] = [];

  isIdEstatusLicOpen = false;
  idEstatusLicLabel = '';
  idEstatusLicItems: SelectItem[] = [];

  toggleIdCliente(e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isIdClienteOpen = !this.isIdClienteOpen;
    if (this.isIdClienteOpen) {
      this.isIdMonedaOpen = false;
      this.isIdEstatusLicOpen = false;
    }
  }

  setIdCliente(id: number, text: string, e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.salaForm.patchValue({ idCliente: id });
    this.idClienteLabel = text;
    this.isIdClienteOpen = false;
  }

  toggleIdMoneda(e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isIdMonedaOpen = !this.isIdMonedaOpen;
    if (this.isIdMonedaOpen) {
      this.isIdClienteOpen = false;
      this.isIdEstatusLicOpen = false;
    }
  }

  setIdMoneda(id: number, text: string, e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.salaForm.patchValue({ idMonedaPrincipal: id });
    this.idMonedaLabel = text;
    this.isIdMonedaOpen = false;
  }

  toggleIdEstatusLic(e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isIdEstatusLicOpen = !this.isIdEstatusLicOpen;
    if (this.isIdEstatusLicOpen) {
      this.isIdClienteOpen = false;
      this.isIdMonedaOpen = false;
    }
  }

  setIdEstatusLic(id: number, text: string, e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.salaForm.patchValue({ idEstatusLicencia: id });
    this.idEstatusLicLabel = text;
    this.isIdEstatusLicOpen = false;
  }


  setIdClienteItems(items: SelectItem[]): void {
    this.idClienteItems = items || [];
    const current = this.salaForm.get('idCliente')?.value;
    const found = this.idClienteItems.find(x => x.id === current);
    this.idClienteLabel = found ? found.text : '';
  }

  setIdMonedaItems(items: SelectItem[]): void {
    this.idMonedaItems = items || [];
    const current = this.salaForm.get('idMonedaPrincipal')?.value;
    const found = this.idMonedaItems.find(x => x.id === current);
    this.idMonedaLabel = found ? found.text : '';
  }

  setIdEstatusLicItems(items: SelectItem[]): void {
    this.idEstatusLicItems = items || [];
    const current = this.salaForm.get('idEstatusLicencia')?.value;
    const found = this.idEstatusLicItems.find(x => x.id === current);
    this.idEstatusLicLabel = found ? found.text : '';
  }

  @HostListener('document:click', ['$event'])
  onDocClickCloseIds(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (target.closest('.select-sleek')) return;

    this.isIdClienteOpen = false;
    this.isIdMonedaOpen = false;
    this.isIdEstatusLicOpen = false;
  }


  submit(): void {
    if (this.salaForm.invalid) {

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
        codigoPostal: 'Código Postal',
        idMonedaPrincipal: 'Moneda Principal',
        idEstatusLicencia: 'Estatus Licencia',
        idCliente: 'Cliente',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.salaForm.controls).forEach((key) => {
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

    // Si estamos editando (idSala existe), preguntar si quiere cambiar la ubicación
    if (this.idSala) {
      const latitudActual = Number(this.salaForm.get('latitud')?.value);
      const longitudActual = Number(this.salaForm.get('longitud')?.value);
      
      // Si ya tiene coordenadas, preguntar si quiere cambiarlas
      if (latitudActual && longitudActual) {
        Swal.fire({
          title: '<div style="display: flex; align-items: center; gap: 12px; justify-content: center; flex-wrap: wrap;"><i class="fas fa-map-marker-alt" style="color: #f59e0b; font-size: 24px;"></i><span style="color: #fff; font-size: 18px; font-weight: 500;">¿Cambiar ubicación?</span></div>',
          html: '<p style="color: rgba(255, 255, 255, 0.8); text-align: center; margin: 16px 0;">Esta sala ya tiene una ubicación registrada. ¿Deseas cambiar la ubicación o mantener la actual?</p>',
          background: '#0d121d',
          showCancelButton: true,
          confirmButtonColor: '#f59e0b',
          cancelButtonColor: '#6c757d',
          confirmButtonText: '<i class="fas fa-map-marker-alt"></i> Cambiar ubicación',
          cancelButtonText: '<i class="fas fa-check"></i> Mantener actual',
          customClass: {
            popup: 'map-modal-popup',
            title: 'map-modal-title',
            htmlContainer: 'map-modal-html'
          }
        }).then((result) => {
          if (result.isConfirmed) {
            // Usuario quiere cambiar la ubicación - abrir mapa
            this.submitButton = this.idSala ? 'Actualizando...' : 'Guardando...';
            this.loading = true;
            this.abrirModalUbicacion();
          } else if (result.dismiss === Swal.DismissReason.cancel) {
            // Usuario quiere mantener la ubicación actual - enviar directamente
            this.submitButton = this.idSala ? 'Actualizando...' : 'Guardando...';
            this.loading = true;
            if (this.idSala) {
              this.actualizarSala();
            } else {
              this.agregarSala();
            }
          } else {
            // Usuario cerró el modal sin seleccionar
            this.submitButton = this.idSala ? 'Actualizar' : 'Guardar';
            this.loading = false;
          }
        });
      } else {
        // No tiene coordenadas, abrir mapa directamente
        this.submitButton = this.idSala ? 'Actualizando...' : 'Guardando...';
        this.loading = true;
        this.abrirModalUbicacion();
      }
    } else {
      // Es nueva sala, abrir mapa directamente
      this.submitButton = this.idSala ? 'Actualizando...' : 'Guardando...';
      this.loading = true;
      this.abrirModalUbicacion();
    }
  }

  private abrirModalUbicacion(): void {
    const modalHtml = `
      <div class="map-modal-container">
        <div id="map-modal" style="width: 100%; height: 450px; border-radius: 12px; overflow: hidden; margin: 16px 0;"></div>
        <div style="display: flex; gap: 12px; justify-content: center; margin-top: 20px;">
          <button id="btn-guardar-ubicacion" type="button" class="btn-alt btn-alt--success" style="display: none;">
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

  private createMap(): void {
    const mapElement = document.getElementById('map-modal');
    if (!mapElement) return;

    // Usar ubicación actual del formulario o centro de México
    const currentLat = Number(this.salaForm.get('latitud')?.value) || 19.4326;
    const currentLng = Number(this.salaForm.get('longitud')?.value) || -99.1332;

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
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
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
      btnGuardar.style.display = 'inline-flex';
    }
  }

  private attachModalButtons(): void {
    setTimeout(() => {
      const btnGuardar = document.getElementById('btn-guardar-ubicacion');
      const btnCancelar = document.getElementById('btn-cancelar-ubicacion');

      if (btnGuardar) {
        btnGuardar.addEventListener('click', () => {
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
        latitud: this.selectedLat,
        longitud: this.selectedLng
      });
    }

    Swal.close();

    // Ejecutar el servicio
    if (this.idSala) this.actualizarSala();
    else this.agregarSala();
  }

  private cancelarUbicacion(): void {
    Swal.close();
    // Restaurar estado del botón y loading
    this.submitButton = this.idSala ? 'Actualizar' : 'Guardar';
    this.loading = false;
    // NO limpiar el formulario si estamos editando
    if (!this.idSala) {
      this.limpiarFormulario();
    }
  }

  private limpiarFormulario(): void {
    this.salaForm.reset();
    this.salaForm.patchValue({
      pais: 'México',
      latitud: 0,
      longitud: 0,
      metrosCuadrados: 0,
      numeroNiveles: 0,
      capacidadPersonas: 0,
      idMonedaPrincipal: 0,
      idEstatusLicencia: 0,
      idCliente: 0
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
    
    // Limpiar labels
    this.clienteLabel = '';
    this.idMonedaLabel = '';
    this.idEstatusLicLabel = '';
    
    // Resetear estados
    this.selectedLat = 0;
    this.selectedLng = 0;
    this.markerInstance = null;
    this.mapInstance = null;
  }

  private buildPayloadSala(): any {
    const v = this.salaForm.getRawValue();
    return {
      nombre: v.nombre ?? '',
      nombreComercial: v.nombreComercial ?? '',
      descripcion: v.descripcion ?? '',
      logotipo: v.logotipo ?? '',
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
      latitud: Number(v.latitud) || 0,
      longitud: Number(v.longitud) || 0,
      metrosCuadrados: Number(v.metrosCuadrados) || 0,
      numeroNiveles: Number(v.numeroNiveles) || 0,
      capacidadPersonas: Number(v.capacidadPersonas) || 0,
      planoArquitectonico: v.planoArquitectonico ?? '',
      planoDistribucion: v.planoDistribucion ?? '',
      licenciaOperacion: v.licenciaOperacion ?? '',
      fechaVencimientoLicencia: v.fechaVencimientoLicencia ?? null,
      idMonedaPrincipal: Number(v.idMonedaPrincipal) || 0,
      fechaInicioContrato: v.fechaInicioContrato ?? null,
      fechaFinContrato: v.fechaFinContrato ?? null,
      idEstatusLicencia: Number(v.idEstatusLicencia) || 0,
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