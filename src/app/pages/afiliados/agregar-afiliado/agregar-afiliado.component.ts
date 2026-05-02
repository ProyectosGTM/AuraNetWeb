import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { AfiliadosService } from 'src/app/shared/services/afiliados.service';
import { RolAccesoService } from 'src/app/shared/services/rol-acceso.service';
import { FormularioValidacionSwalService } from 'src/app/shared/services/formulario-validacion-swal.service';
import { SalaService } from 'src/app/shared/services/salas.service';
import { UsuariosService } from 'src/app/shared/services/usuario.service';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

type SelectItem = { id: number; text: string };

const LISTA_SI_NO: SelectItem[] = [
  { id: 1, text: 'Sí' },
  { id: 0, text: 'No' },
];

/** Email vacío válido; si hay texto, debe ser correo válido. */
function optionalEmailValidator(control: AbstractControl): ValidationErrors | null {
  const v = (control.value ?? '').toString().trim();
  if (!v) {
    return null;
  }
  return Validators.email(control);
}

@Component({
  selector: 'app-agregar-afiliado',
  templateUrl: './agregar-afiliado.component.html',
  styleUrl: './agregar-afiliado.component.scss',
  animations: [fadeInRightAnimation],
})
export class AgregarAfiliadoComponent implements OnInit {
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public idAfiliado: number;
  public title = 'Agregar Afiliado';
  public listaSalas: any[] = [];
  public listaTipoIdentificacion: SelectItem[] = [];
  public listaEstatusAfiliado: SelectItem[] = [];
  public listaNivelesVip: SelectItem[] = [];
  public listaSiNo: SelectItem[] = LISTA_SI_NO;
  public listaSexo: { id: string; text: string }[] = [
    { id: 'M', text: 'Masculino' },
    { id: 'F', text: 'Femenino' },
  ];
  /** Valores de parentesco de contacto de emergencia (catálogo fijo en UI). */
  public listaParentescoEmergencia: { id: string; text: string }[] = [
    { id: 'Cónyuge', text: 'Cónyuge' },
    { id: 'Padre', text: 'Padre' },
    { id: 'Madre', text: 'Madre' },
    { id: 'Hijo(a)', text: 'Hijo(a)' },
    { id: 'Hermano(a)', text: 'Hermano(a)' },
    { id: 'Tío(a)', text: 'Tío(a)' },
    { id: 'Abuelo(a)', text: 'Abuelo(a)' },
    { id: 'Amigo(a)', text: 'Amigo(a)' },
    { id: 'Otro', text: 'Otro' },
  ];

  afiliadoForm: FormGroup;

  @ViewChild('identificacionFrenteInput', { static: false })
  identificacionFrenteInput!: ElementRef<HTMLInputElement>;
  @ViewChild('fotoPerfilInput', { static: false })
  fotoPerfilInput!: ElementRef<HTMLInputElement>;

  identificacionFrenteNombre: string | null = null;
  identificacionPreviewUrl: string | null = null;
  fotoPerfilNombre: string | null = null;
  fotoPerfilPreviewUrl: string | ArrayBuffer | null = null;
  uploadingIdentificacionFrente = false;
  uploadingFotoPerfil = false;

  private readonly MAX_FILE_MB = 5;

  /** Etiquetas solo para campos obligatorios (validación Swal). */
  private readonly etiquetasCamposAfiliado: Record<string, string> = {
    idSala: 'Sala',
    idTipoIdentificacion: 'Tipo de identificación',
    numeroIdentificacion: 'Número de identificación',
    nombre: 'Nombre',
    apellidoPaterno: 'Apellido paterno',
    fechaNacimiento: 'Fecha de nacimiento',
    sexo: 'Sexo',
    idEstatusAfiliado: 'Estatus del afiliado',
    email: 'Correo electrónico',
  };

  constructor(
    private fb: FormBuilder,
    private route: Router,
    private activatedRoute: ActivatedRoute,
    private afiliadosService: AfiliadosService,
    private salasService: SalaService,
    private usuariosService: UsuariosService,
    private rolAcceso: RolAccesoService,
    private formularioValidacionSwal: FormularioValidacionSwalService,
  ) { }

  ngOnInit(): void {
    this.initForm();
    
    this.activatedRoute.params.subscribe((params) => {
      this.idAfiliado = params['idAfiliado'];
      if (this.idAfiliado) {
        this.title = 'Actualizar Afiliado';
        this.submitButton = 'Actualizar';
        forkJoin({
          salas: this.salasService.obtenerSalas(),
          tipoIdentificacion: this.afiliadosService.obtenerTipoIdentificacion(),
          estatusAfiliado: this.afiliadosService.obtenerCatalogoEstatusAfiliado(),
          nivelesVip: this.afiliadosService.obtenerNivelesVip(),
        }).subscribe({
          next: (responses) => {
            this.procesarListas(responses);
            this.obtenerAfiliado();
          },
          error: (error) => {
            console.error('Error al cargar listas:', error);
            this.cargarListasIndividualmente();
            if (this.idAfiliado) {
              this.obtenerAfiliado();
            }
          }
        });
      } else {
        this.cargarListasIndividualmente();
      }
    });
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const charCode = event.keyCode ? event.keyCode : event.which;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  esUrlPdf(url: string): boolean {
    return /\.pdf(\?|#|$)/i.test((url || '').trim());
  }

  identificacionArchivoEsPdf(): boolean {
    const u = this.trimStr(this.afiliadoForm?.get('archivoIdentificacionFrente')?.value);
    return u !== '' && this.esUrlPdf(u);
  }

  tieneArchivoIdentificacionFrente(): boolean {
    return this.trimStr(this.afiliadoForm?.get('archivoIdentificacionFrente')?.value) !== '';
  }

  private actualizarVistaIdentificacionFrente(url: string): void {
    const u = (url || '').trim();
    if (!u || this.esUrlPdf(u)) {
      this.identificacionPreviewUrl = null;
    } else {
      this.identificacionPreviewUrl = u;
    }
  }

  private procesarListas(responses: any) {
    this.listaSalas = (responses.salas.data || []).map((s: any) => ({
      ...s,
      id: Number(s.id),
      text: (s.nombreSala ?? s.nombre ?? 'Sin nombre').trim(),
    }));

    this.listaTipoIdentificacion = (responses.tipoIdentificacion.data || []).map((t: any) => ({
      id: Number(t.id),
      text: t.nombre || ''
    } as SelectItem));

    this.listaEstatusAfiliado = (responses.estatusAfiliado.data || []).map((e: any) => ({
      id: Number(e.id),
      text:
        String(e.nombre ?? e.nombreEstatusAfiliado ?? e.descripcion ?? '').trim() ||
        `Estatus ${e.id}`,
    } as SelectItem));
    if (responses.nivelesVip != null) {
      this.aplicarListaNivelesVip(responses.nivelesVip);
    }
  }

  private aplicarListaNivelesVip(res: any): void {
    const raw = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    this.listaNivelesVip = raw
      .filter((x: any) => x?.id != null)
      .map((x: any) => ({
        id: Number(x.id),
        text:
          String(x.nombre ?? x.nombreNivelVip ?? x.descripcion ?? '').trim() || `Nivel ${x.id}`,
      }));
  }

  private cargarListasIndividualmente() {
    this.obtenerSalas();
    this.obtenerTipoIdentificacion();
    this.obtenerEstatusAfiliado();
    this.afiliadosService.obtenerNivelesVip().subscribe({
      next: (r) => this.aplicarListaNivelesVip(r),
      error: () => {
        this.listaNivelesVip = [];
      },
    });
  }

  obtenerSalas(): void {
    this.salasService.obtenerSalas().subscribe({
      next: (response: any) => {
        this.listaSalas = (response.data || []).map((s: any) => ({
          ...s,
          id: Number(s.id),
          text: (s.nombreSala ?? s.nombre ?? 'Sin nombre').trim(),
        }));
      },
      error: (error) => {
        console.error('Error al obtener salas:', error);
      }
    });
  }

  obtenerTipoIdentificacion(): void {
    this.afiliadosService.obtenerTipoIdentificacion().subscribe({
      next: (response: any) => {
        this.listaTipoIdentificacion = (response.data || []).map((t: any) => ({
          id: Number(t.id),
          text: t.nombre || ''
        } as SelectItem));
      },
      error: (error) => {
        console.error('Error al obtener tipos de identificación:', error);
      }
    });
  }

  obtenerEstatusAfiliado(): void {
    this.afiliadosService.obtenerCatalogoEstatusAfiliado().subscribe({
      next: (response: any) => {
        this.listaEstatusAfiliado = (response.data || []).map((e: any) => ({
          id: Number(e.id),
          text:
            String(e.nombre ?? e.nombreEstatusAfiliado ?? e.descripcion ?? '').trim() ||
            `Estatus ${e.id}`,
        } as SelectItem));
      },
      error: (error) => {
        console.error('Error al obtener estatus de afiliado:', error);
      }
    });
  }

  obtenerAfiliado(): void {
    this.afiliadosService.obtenerAfiliadoPorId(this.idAfiliado).subscribe({
      next: (response: any) => {
        const data = response.data || response;

        this.afiliadoForm.patchValue({
          idSala: Number(data.idSala ?? 0),
          idTipoIdentificacion: data.idTipoIdentificacion ? Number(data.idTipoIdentificacion) : null,
          numeroIdentificacion: data.numeroIdentificacion || '',
          nombre: data.nombre || '',
          apellidoPaterno: data.apellidoPaterno || '',
          apellidoMaterno: data.apellidoMaterno || '',
          fechaNacimiento: this.formatDate(data.fechaNacimiento),
          sexo: data.sexo || '',
          idEstatusAfiliado: data.idEstatusAfiliado ? Number(data.idEstatusAfiliado) : null,
          email: data.email || '',
          telefonoCelular: data.telefonoCelular || '',
          vigenciaIdentificacion: this.formatDate(data.vigenciaIdentificacion),
          archivoIdentificacionFrente: data.archivoIdentificacionFrente || '',
          curp: data.curp || '',
          rfc: data.rfc || '',
          telefono: data.telefono || '',
          estado: data.estado || '',
          municipio: data.municipio || '',
          colonia: data.colonia || '',
          calle: data.calle || '',
          numeroExterior: data.numeroExterior || '',
          numeroInterior: data.numeroInterior || '',
          codigoPostal: data.codigoPostal || '',
          nombreEmergencia: data.nombreEmergencia || '',
          telefonoEmergencia: data.telefonoEmergencia || '',
          parentescoEmergencia: data.parentescoEmergencia || '',
          fotoPerfil: data.fotoPerfil || '',
          idNivelVIP: data.idNivelVIP != null ? Number(data.idNivelVIP) : null,
          limiteApuestaDiaria: data.limiteApuestaDiaria ?? null,
          limiteRetiroDiario: data.limiteRetiroDiario ?? null,
          aceptaPromociones:
            data.aceptaPromociones === 0 || data.aceptaPromociones === 1 ? Number(data.aceptaPromociones) : 1,
          aceptaEmail: data.aceptaEmail === 0 || data.aceptaEmail === 1 ? Number(data.aceptaEmail) : 1,
          observaciones: data.observaciones || '',
        });
        const urlId = (data.archivoIdentificacionFrente || '').toString().trim();
        this.identificacionFrenteNombre = urlId ? urlId.split('/').pop() || urlId : null;
        this.actualizarVistaIdentificacionFrente(urlId);
        const urlFoto = (data.fotoPerfil || '').toString().trim();
        this.fotoPerfilNombre = urlFoto ? urlFoto.split('/').pop() || urlFoto : null;
        this.fotoPerfilPreviewUrl = /^https?:\/\//i.test(urlFoto) || urlFoto.startsWith('data:') ? urlFoto : urlFoto || null;
      },
      error: (error) => {
        Swal.fire({
          title: '¡Error!',
          text: error.error || 'No se pudo obtener la información del afiliado.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  }

  initForm() {
    this.afiliadoForm = this.fb.group({
      idSala: [null, Validators.required],
      idTipoIdentificacion: [null, Validators.required],
      numeroIdentificacion: ['', Validators.required],
      nombre: ['', Validators.required],
      apellidoPaterno: ['', Validators.required],
      apellidoMaterno: [''],
      fechaNacimiento: ['', Validators.required],
      sexo: ['', Validators.required],
      idEstatusAfiliado: [null, Validators.required],
      email: ['', optionalEmailValidator],
      telefonoCelular: [''],
      vigenciaIdentificacion: [''],
      archivoIdentificacionFrente: [''],
      curp: [''],
      rfc: [''],
      telefono: [''],
      estado: [''],
      municipio: [''],
      colonia: [''],
      calle: [''],
      numeroExterior: [''],
      numeroInterior: [''],
      codigoPostal: [''],
      nombreEmergencia: [''],
      telefonoEmergencia: [''],
      parentescoEmergencia: [''],
      fotoPerfil: [''],
      idNivelVIP: [null],
      limiteApuestaDiaria: [null as number | null],
      limiteRetiroDiario: [null as number | null],
      aceptaPromociones: [1],
      aceptaEmail: [1],
      observaciones: [''],
    });
  }

  guardar() {
    if (this.uploadingIdentificacionFrente || this.uploadingFotoPerfil) {
      Swal.fire({
        title: 'Espera un momento',
        text: 'Aún se está subiendo un archivo. Intenta de nuevo en unos segundos.',
        icon: 'info',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
      });
      return;
    }
    if (
      this.formularioValidacionSwal.resaltarYAlertarSiInvalido(
        this.afiliadoForm,
        this.etiquetasCamposAfiliado
      )
    ) {
      return;
    }

    this.loading = true;
    const payload = this.buildPayloadAfiliado();

    if (this.idAfiliado) {
      this.afiliadosService.actualizarAfiliado(this.idAfiliado, payload).subscribe({
        next: (response) => {
          this.loading = false;
          Swal.fire({
            title: '¡Operación Exitosa!',
            text: 'Se ha actualizado el afiliado de manera exitosa.',
            icon: 'success',
            background: '#0d121d',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Confirmar',
          })
          this.route.navigateByUrl('/afiliados');
        },
        error: (error) => {
          this.loading = false;
          Swal.fire({
            title: '¡Error!',
            text: error.error || 'No se pudo actualizar el afiliado.',
            icon: 'error',
            background: '#0d121d',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Confirmar',
          });
        }
      });
    } else {
      const rolUsuario = this.rolAcceso.obtenerRolUsuarioLogueado();
      if (!this.rolAcceso.puedeRealizarAccion('registrarAfiliado', rolUsuario)) {
        this.loading = false;
        this.rolAcceso.mostrarAccesoDenegado('registrarAfiliado');
        return;
      }

      this.afiliadosService.agregarAfiliado(payload).subscribe({
        next: (response) => {
          this.loading = false;
          Swal.fire({
            title: '¡Operación Exitosa!',
            text: 'Se ha agregado el afiliado de manera exitosa.',
            icon: 'success',
            background: '#0d121d',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Confirmar',
          })
          this.route.navigateByUrl('/afiliados');
        },
        error: (error) => {
          this.loading = false;
          Swal.fire({
            title: '¡Error!',
            text: error.error || 'No se pudo registrar el afiliado.',
            icon: 'error',
            background: '#0d121d',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Confirmar',
          });
        }
      });
    }
  }

  private trimStr(v: unknown): string {
    if (v == null) {
      return '';
    }
    return String(v).trim();
  }

  buildPayloadAfiliado(): any {
    const v = this.afiliadoForm.getRawValue();
    const t = (x: unknown) => this.trimStr(x);
    const payload: Record<string, unknown> = {
      idSala: v.idSala,
      idTipoIdentificacion: v.idTipoIdentificacion,
      numeroIdentificacion: t(v.numeroIdentificacion),
      nombre: t(v.nombre),
      apellidoPaterno: t(v.apellidoPaterno),
      apellidoMaterno: t(v.apellidoMaterno) || null,
      fechaNacimiento: v.fechaNacimiento || null,
      sexo: v.sexo,
      idEstatusAfiliado: v.idEstatusAfiliado,
      pais: 'MEX',
      email: t(v.email) || null,
      telefonoCelular: t(v.telefonoCelular) || null,
      vigenciaIdentificacion: v.vigenciaIdentificacion || null,
      archivoIdentificacionFrente: t(v.archivoIdentificacionFrente) || null,
      curp: t(v.curp) || null,
      rfc: t(v.rfc) || null,
      telefono: t(v.telefono) || null,
      estado: t(v.estado) || null,
      municipio: t(v.municipio) || null,
      colonia: t(v.colonia) || null,
      calle: t(v.calle) || null,
      numeroExterior: t(v.numeroExterior) || null,
      numeroInterior: t(v.numeroInterior) || null,
      codigoPostal: t(v.codigoPostal) || null,
      nombreEmergencia: t(v.nombreEmergencia) || null,
      telefonoEmergencia: t(v.telefonoEmergencia) || null,
      parentescoEmergencia: t(v.parentescoEmergencia) || null,
      fotoPerfil: t(v.fotoPerfil) || null,
      observaciones: t(v.observaciones) || null,
      aceptaPromociones: v.aceptaPromociones === 0 || v.aceptaPromociones === 1 ? Number(v.aceptaPromociones) : 1,
      aceptaEmail: v.aceptaEmail === 0 || v.aceptaEmail === 1 ? Number(v.aceptaEmail) : 1,
    };
    const idNv = v.idNivelVIP;
    if (idNv != null && !(typeof idNv === 'string' && idNv.trim() === '')) {
      const nv = Math.trunc(Number(idNv));
      if (Number.isFinite(nv)) {
        payload.idNivelVIP = nv;
      }
    }
    const parseLim = (x: unknown): number | undefined => {
      if (x === null || x === undefined || x === '') {
        return undefined;
      }
      const n = typeof x === 'number' ? x : parseFloat(String(x).replace(',', '.'));
      return Number.isFinite(n) ? n : undefined;
    };
    const la = parseLim(v.limiteApuestaDiaria);
    if (la !== undefined) {
      payload.limiteApuestaDiaria = la;
    }
    const lr = parseLim(v.limiteRetiroDiario);
    if (lr !== undefined) {
      payload.limiteRetiroDiario = lr;
    }
    return payload;
  }

  private isImagenPerfil(file: File): boolean {
    return /^image\/(png|jpe?g|webp)$/i.test(file.type);
  }

  private isDocIdentificacion(file: File): boolean {
    return /^image\/(png|jpe?g|webp)$/i.test(file.type) || file.type === 'application/pdf';
  }

  private subirArchivoS3(file: File, onOk: (url: string) => void, onFinally: () => void): void {
    const fd = new FormData();
    fd.append('file', file, file.name);
    fd.append('folder', 'afiliados');
    fd.append('idModule', '40');
    this.usuariosService.uploadFile(fd).subscribe({
      next: (res: any) => {
        const url = res?.url ?? res?.Location ?? res?.data?.url ?? '';
        if (url) {
          onOk(String(url));
        } else {
          Swal.fire({
            title: 'Subida incompleta',
            text: 'No se recibió la URL del archivo. Intenta de nuevo.',
            icon: 'warning',
            background: '#0d121d',
            confirmButtonColor: '#3085d6',
          });
        }
        onFinally();
      },
      error: () => {
        Swal.fire({
          title: 'Error al subir',
          text: 'No se pudo subir el archivo. Revisa tu conexión o vuelve a intentarlo.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
        });
        onFinally();
      },
    });
  }

  openIdentificacionFrentePicker(): void {
    this.identificacionFrenteInput?.nativeElement?.click();
  }

  openFotoPerfilPicker(): void {
    this.fotoPerfilInput?.nativeElement?.click();
  }

  onIdentificacionFrenteSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    input.value = '';
    if (!file) {
      return;
    }
    if (!this.isDocIdentificacion(file) || file.size > this.MAX_FILE_MB * 1024 * 1024) {
      Swal.fire({
        title: 'Archivo no válido',
        text: `Usa imagen (JPG, PNG, WEBP) o PDF de hasta ${this.MAX_FILE_MB} MB.`,
        icon: 'info',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
      });
      return;
    }
    this.uploadingIdentificacionFrente = true;
    this.identificacionFrenteNombre = file.name;
    this.subirArchivoS3(
      file,
      (url) => {
        this.afiliadoForm.patchValue({ archivoIdentificacionFrente: url });
        this.actualizarVistaIdentificacionFrente(url);
      },
      () => {
        this.uploadingIdentificacionFrente = false;
      }
    );
  }

  onFotoPerfilSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    input.value = '';
    if (!file) {
      return;
    }
    if (!this.isImagenPerfil(file) || file.size > this.MAX_FILE_MB * 1024 * 1024) {
      Swal.fire({
        title: 'Archivo no válido',
        text: `Usa imagen JPG, PNG o WEBP de hasta ${this.MAX_FILE_MB} MB.`,
        icon: 'info',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
      });
      return;
    }
    this.uploadingFotoPerfil = true;
    this.fotoPerfilNombre = file.name;
    const reader = new FileReader();
    reader.onload = () => (this.fotoPerfilPreviewUrl = reader.result);
    reader.readAsDataURL(file);
    this.subirArchivoS3(
      file,
      (url) => {
        this.afiliadoForm.patchValue({ fotoPerfil: url });
        this.fotoPerfilPreviewUrl = url;
      },
      () => {
        this.uploadingFotoPerfil = false;
      }
    );
  }

  limpiarIdentificacionFrente(ev: Event): void {
    ev.stopPropagation();
    this.identificacionFrenteNombre = null;
    this.identificacionPreviewUrl = null;
    this.afiliadoForm.patchValue({ archivoIdentificacionFrente: '' });
    if (this.identificacionFrenteInput?.nativeElement) {
      this.identificacionFrenteInput.nativeElement.value = '';
    }
  }

  limpiarFotoPerfil(ev: Event): void {
    ev.stopPropagation();
    this.fotoPerfilNombre = null;
    this.fotoPerfilPreviewUrl = null;
    this.afiliadoForm.patchValue({ fotoPerfil: '' });
    if (this.fotoPerfilInput?.nativeElement) {
      this.fotoPerfilInput.nativeElement.value = '';
    }
  }

  cancelar() {
    this.route.navigateByUrl('/afiliados');
  }
}
