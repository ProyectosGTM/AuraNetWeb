import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { ClientesService } from 'src/app/shared/services/clientes.service';
import { PermisosService } from 'src/app/shared/services/permisos.service';
import { RolesService } from 'src/app/shared/services/roles.service';
import { SalaService } from 'src/app/shared/services/salas.service';
import { UsuariosService } from 'src/app/shared/services/usuario.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-alta-usuario',
  templateUrl: './agregar-usuario.component.html',
  styleUrl: './agregar-usuario.component.scss',
  animations: [fadeInRightAnimation],
})
export class AgregarUsuarioComponent implements OnInit {
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public usuarioForm: FormGroup;
  public idUsuario: number;
  public inputContrasena: boolean = true;
  public title = 'Agregar Usuario';
  public listaModulos: any[] = [];
  public listaRoles: any[] = [];
  public listaClientes: any[] = [];
  public listaSalas: any[] = [];

  public permisosIds: number[] = [];

  constructor(
    private fb: FormBuilder,
    private usuaService: UsuariosService,
    private route: Router,
    private activatedRouted: ActivatedRoute,
    private permService: PermisosService,
    private rolService: RolesService,
    private clienService: ClientesService,
    private salaService: SalaService
  ) { }

  ngOnInit(): void {
    this.obtenerClientes();
    this.obtenerRoles();
    this.obtenerModulos();
    this.initForm();
    this.obtenerSalas()

    this.activatedRouted.params.subscribe((params) => {
      this.idUsuario = params['idUsuario'];
      if (this.idUsuario) {
        this.title = 'Actualizar Usuario';
        this.obtenerUsuarioID();
        this.inputContrasena = false;
      }
    });
  }

  passwordsMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('passwordHash')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  initForm() {
    this.usuarioForm = this.fb.group(
      {
        userName: ['', [Validators.required, Validators.email]],
        passwordHash: ['', [Validators.required]],
        confirmPassword: ['', [Validators.required]],
        telefono: ['', [Validators.required]],
        nombre: ['', [Validators.required]],
        apellidoPaterno: ['', [Validators.required]],
        apellidoMaterno: [''],
        fotoPerfil: [null],
        idRol: [null],
        emailConfirmado: [1],
        estatus: [1],
        idCliente: [null, [Validators.required]],
        idSala: [null, [Validators.required]],
        permisosIds: this.fb.control<number[]>([]),
      },
      { validators: this.passwordsMatchValidator }
    );
  }

  obtenerSalas() {
    this.salaService.obtenerSalas().subscribe((response: any) => {
      const data = Array.isArray(response)
        ? response
        : (response?.data ?? response?.result ?? response?.salas ?? []);
      const arr = Array.isArray(data) ? data : [];
      this.listaSalas = arr.map((s: any) => ({
        ...s,
        id: Number(s?.idSala ?? s?.id ?? 0),
        text: (s?.nombreComercialSala ?? s?.nombreSala ?? s?.nombre ?? 'Sin nombre').trim(),
      }));
    });
  }


  obtenerModulos() {
    this.permService.obtenerPermisosAgrupados().subscribe((response: any) => {
      let raw: any = response;
      if (Array.isArray(response) && Array.isArray(response[0])) {
        raw = response[0];
      }
      if (!Array.isArray(raw)) raw = [];
      this.applyAssignedPermsToModules();
      this.listaModulos = raw.map((m: any) => ({
        id: Number(m?.Id ?? m?.id),
        nombre: m?.NombreModulo ?? m?.nombre ?? m?.Nombre ?? '',
        descripcion: m?.Descripcion ?? m?.descripcion ?? '',
        estatus: m?.Estatus ?? m?.estatus,
        permisos: (m?.Permisos ?? m?.permisos ?? []).map((p: any) => ({
          id: p?.Id ?? p?.id,
          nombre: p?.Nombre ?? p?.nombre ?? '',
          descripcion: p?.Descripcion ?? p?.descripcion ?? '',
          estatus: p?.Estatus ?? p?.estatus,
        })),
      }));
    });
  }

  obtenerRoles() {
    this.rolService.obtenerRoles().subscribe((response) => {
      const raw = (response as any)?.data ?? response ?? [];
      this.listaRoles = (raw as any[]).map((r: any) => ({
        id: Number(r?.id ?? r?.Id ?? r?.idRol ?? r?.IDROL),
        text: (r?.rolNombre ?? r?.nombre ?? r?.name ?? '').trim(),
      }));
    });
  }

  obtenerClientes() {
    this.clienService.obtenerClientes().subscribe((response) => {
      this.listaClientes = (response.data || []).map((c: any) => ({
        ...c,
        id: Number(c.id),
        text: (c?.nombre ?? c?.nombreComercial ?? '').trim(),
      }));
    });
  }

  private getPermisoId(p: any): number | null {
    const val = p?.idPermiso ?? p?.IdPermiso ?? p?.id ?? p?.Id ?? null;
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  }

  trackModulo = (_: number, m: any) => m.id ?? m.Id;
  trackPermiso = (_: number, p: any) => p.id ?? p.Id;

  onToggle(permiso: any, checked: boolean) {
    const idNum = this.getPermisoId(permiso);
    if (idNum === null) return;
    permiso.estatus = checked ? 1 : 0;
    if (checked) {
      if (!this.permisosIds.includes(idNum)) this.permisosIds.push(idNum);
    } else {
      this.permisosIds = this.permisosIds.filter((id) => id !== idNum);
    }
    this.usuarioForm.patchValue({ permisosIds: this.permisosIds });
  }

  obtenerUsuarioID() {
    this.usuaService.obtenerUsuario(this.idUsuario).subscribe((response: any) => {
      const data = response?.data ?? {};
      const usuarios = Array.isArray(data?.usuario)
        ? data.usuario
        : Array.isArray(data?.usuarios)
          ? data.usuarios
          : data?.usuario
            ? [data.usuario]
            : [];
      const u = usuarios[0] ?? {};

      const idRolNum = u?.idRol != null ? Number(u.idRol) : null;

      const permisosRaw = Array.isArray(data?.permiso) ? data.permiso : [];
      this.permisosIds = permisosRaw
        .map((x: any) => Number(x?.idPermiso))
        .filter((n: any) => Number.isFinite(n));

      const idSalaNum = u?.idSala != null ? Number(u.idSala) : null;

      this.usuarioForm.patchValue({
        userName: u?.userName ?? '',
        telefono: u?.telefono ?? '',
        nombre: u?.nombre ?? '',
        apellidoPaterno: u?.apellidoPaterno ?? '',
        apellidoMaterno: u?.apellidoMaterno ?? '',
        fotoPerfil: u?.fotoPerfil ?? this.usuarioForm.get('fotoPerfil')?.value,
        estatus: Number(u?.estatus ?? 1),
        idRol: idRolNum,
        idCliente: u?.idCliente != null ? Number(u.idCliente) : null,
        idSala: idSalaNum,
        permisosIds: this.permisosIds,
      });

      this.applyAssignedPermsToModules();
    });
  }

  isModuloCompleto(modulo: any): boolean {
    const perms = modulo?.permisos || [];
    if (!perms.length) return false;
    return perms.every((p: any) => this.isPermisoAsignado(p?.id));
  }

  onToggleModulo(modulo: any, checked: boolean) {
    const perms = modulo?.permisos || [];
    for (const p of perms) {
      this.onToggle(p, checked);
    }
  }

  isPermisoAsignado(id: any): boolean {
    const nid = Number(id);
    return Array.isArray(this.permisosIds) && this.permisosIds.includes(nid);
  }

  private applyAssignedPermsToModules(): void {
    if (!Array.isArray(this.listaModulos)) return;
    const asignados = new Set((this.permisosIds || []).map(Number));
    this.listaModulos = this.listaModulos.map((m) => ({
      ...m,
      permisos: (m.permisos || []).map((p) => {
        const idNum = Number(p?.id ?? p?.Id);
        return {
          ...p,
          id: idNum,
          estatus: asignados.has(idNum) ? 1 : 0,
        };
      }),
    }));
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const charCode = event.keyCode ? event.keyCode : event.which;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  submit() {
    if (this.idUsuario) {
      this.actualizar();
    } else {
      this.agregar();
    }
  }

  hidePass = true;
  hideConfirm = true;

  showPwdHints = false;

  togglePass() {
    this.hidePass = !this.hidePass;
  }

  toggleConfirm() {
    this.hideConfirm = !this.hideConfirm;
  }

  pwdHintText = '';
  pwdAllOk = false;
  pwdHintSwap = false;

  onPwdFocus() {
    this.showPwdHints = true;
    const v = this.usuarioForm.get('passwordHash')?.value || '';
    this.updatePwdHint(v);
  }

  onPwdInput(e: any) {
    this.showPwdHints = true;
    const v = e?.target?.value ?? '';
    this.updatePwdHint(v);
  }

  onPwdBlur() {
    const v = this.usuarioForm.get('passwordHash')?.value || '';
    this.updatePwdHint(v);
  }

  private updatePwdHint(pass: string) {
    const v = String(pass || '');

    const lengthOk = v.length > 6 && v.length < 16;
    const caseOk = /[A-Z]/.test(v) && /[a-z]/.test(v);
    const specialOk = /[^a-zA-Z0-9]/.test(v);
    const numberOk = /\d/.test(v);

    let nextText = '';
    let nextAllOk = false;

    if (!caseOk) nextText = 'Al menos una mayúscula y minúsculas.';
    else if (!specialOk) nextText = 'Un caracter no alfanumérico (ejemplo: #?!&).';
    else if (!numberOk) nextText = 'Un número.';
    else if (!lengthOk) nextText = 'Debe tener más de 6 caracteres y menos de 16.';
    else {
      nextText = 'Contraseña Segura';
      nextAllOk = true;
    }

    if (nextText !== this.pwdHintText || nextAllOk !== this.pwdAllOk) {
      this.pwdHintText = nextText;
      this.pwdAllOk = nextAllOk;
      this.pulsePwdHint();
    }
  }

  private pulsePwdHint() {
    this.pwdHintSwap = false;
    setTimeout(() => (this.pwdHintSwap = true), 0);
  }

  confirmHintVisible = false;
  confirmMatch = false;
  confirmHintText = '';
  confirmHintSwap = false;

  onConfirmInput(e: any) {
    const confirmVal = String(e?.target?.value ?? '').trim();
    const passVal = String(this.usuarioForm.get('passwordHash')?.value ?? '').trim();

    if (!confirmVal) {
      this.confirmHintVisible = false;
      this.confirmHintText = '';
      this.confirmMatch = false;
      return;
    }

    if (!this.confirmHintVisible) this.confirmHintVisible = true;

    const match = confirmVal === passVal;
    const nextText = match ? 'Las contraseñas son iguales.' : 'Las contraseñas no coinciden.';

    if (nextText !== this.confirmHintText || match !== this.confirmMatch) {
      this.confirmMatch = match;
      this.confirmHintText = nextText;
      this.pulseConfirmHint();
    }
  }

  onConfirmBlur() {
    const confirmVal = String(this.usuarioForm.get('confirmPassword')?.value ?? '').trim();
    const passVal = String(this.usuarioForm.get('passwordHash')?.value ?? '').trim();

    if (!confirmVal) {
      this.confirmHintVisible = false;
      this.confirmHintText = '';
      this.confirmMatch = false;
      return;
    }

    this.confirmHintVisible = true;

    const match = confirmVal === passVal && passVal.length > 0;
    const nextText = match ? 'Las contraseñas son iguales.' : 'Las contraseñas no coinciden.';

    if (nextText !== this.confirmHintText || match !== this.confirmMatch) {
      this.confirmMatch = match;
      this.confirmHintText = nextText;
      this.pulseConfirmHint();
    }
  }

  private pulseConfirmHint() {
    this.confirmHintSwap = false;
    setTimeout(() => (this.confirmHintSwap = true), 0);
  }

  @ViewChild('logoFileInput') logoFileInput!: ElementRef<HTMLInputElement>;
  logoPreviewUrl: string | ArrayBuffer | null = null;
  logoDragging = false;
  private logoFile: File | null = null;

  private readonly DEFAULT_AVATAR_URL =
    'https://auranet.s3.us-east-2.amazonaws.com/general/user_default.png';
  private readonly MAX_MB = 3;

  private isImage(file: File) {
    return /^image\/(png|jpe?g|webp)$/i.test(file.type);
  }
  private isAllowed(file: File) {
    const okImg = this.isImage(file);
    const okDoc = /(pdf|msword|officedocument|excel)/i.test(file.type);
    return (okImg || okDoc) && file.size <= this.MAX_MB * 1024 * 1024;
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

  private uploadLogoAuto(): void {
    const fd = new FormData();

    if (this.logoFile) {
      fd.append('file', this.logoFile, this.logoFile.name);
    } else {
      fd.append('file', this.DEFAULT_AVATAR_URL);
    }
    fd.append('folder', 'usuarios');
    fd.append('idModule', '2');

    this.usuaService.uploadFile(fd).subscribe({
      next: (res: any) => {
        const url = res?.url ?? res?.Location ?? res?.data?.url ?? '';
        if (url) {
          this.usuarioForm.patchValue({ fotoPerfil: url });
          if (/\.(png|jpe?g|webp|gif|bmp|svg|avif)(\?.*)?$/i.test(url)) {
            this.logoPreviewUrl = url;
          }
        }
      },
      error: (err) => {
        console.error('Error al subir archivo', err);
      },
    });
  }

  openLogoFilePicker() {
    this.logoFileInput.nativeElement.click();
  }

  onLogoDragOver(e: DragEvent) {
    e.preventDefault();
    this.logoDragging = true;
  }

  onLogoDragLeave(_e: DragEvent) {
    this.logoDragging = false;
  }

  onLogoDrop(e: DragEvent) {
    e.preventDefault();
    this.logoDragging = false;
    const f = e.dataTransfer?.files?.[0];
    if (f) this.handleLogoFile(f);
  }

  logoFileName: string | null = null;
  onLogoFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0] || null;
    if (f) this.handleLogoFile(f);
    if (input) input.value = '';
  }

  clearLogoImage(e: Event) {
    e.stopPropagation();
    this.logoPreviewUrl = null;
    this.logoFileName = null;
    this.logoFileInput.nativeElement.value = '';
    this.logoFile = null;
    this.usuarioForm.patchValue({ logotipo: this.DEFAULT_AVATAR_URL });
    this.usuarioForm.get('logotipo')?.setErrors(null);
    this.uploadLogoAuto();
  }

  private handleLogoFile(file: File) {
    if (!this.isAllowed(file)) {
      this.usuarioForm.get('logotipo')?.setErrors({ invalid: true });
      return;
    }

    this.logoFileName = file.name;

    this.loadPreview(file, (url) => (this.logoPreviewUrl = url));
    this.logoFile = file;
    this.usuarioForm.patchValue({ logotipo: file });
    this.usuarioForm.get('logotipo')?.setErrors(null);
    this.uploadLogoAuto();
  }
  agregar() {
    if (this.loading) return;

    this.submitButton = 'Cargando...';
    this.loading = true;

    this.usuarioForm.markAllAsTouched();

    const etiquetas: Record<string, string> = {
      nombre: 'Nombre',
      apellidoPaterno: 'Apellido Paterno',
      telefono: 'Teléfono',
      userName: 'Correo electrónico',
      idRol: 'Rol',
      idCliente: 'Cliente',
      idSala: 'Sala',
      passwordHash: 'Contraseña',
      confirmPassword: 'Confirmar contraseña',
      fotoPerfil: 'Foto de perfil',
      permisosIds: 'Permisos',
    };

    if (this.usuarioForm.invalid) {
      const camposFaltantes: string[] = [];
      Object.keys(this.usuarioForm.controls).forEach((key) => {
        const control = this.usuarioForm.get(key);
        if (control?.errors?.['required']) {
          camposFaltantes.push(etiquetas[key] || key);
        }
      });

      const mensajes: string[] = [...camposFaltantes];
      if (this.usuarioForm.hasError('passwordMismatch')) {
        mensajes.push('Las contraseñas no coinciden');
      }

      const lista = mensajes
        .map(
          (campo, index) => `
      <div style="padding:8px 12px;border-left:4px solid #d9534f;
                  background:#caa8a8;text-align:center;margin-bottom:8px;border-radius:4px;">
        <strong style="color:#b02a37;">${index + 1}. ${campo}</strong>
      </div>`
        )
        .join('');

      this.submitButton = 'Guardar';
      this.loading = false;

      Swal.fire({
        title: '¡Faltan campos obligatorios!',
        background: '#0d121d',
        html: `
      <p style="text-align:center;font-size:15px;margin-bottom:16px;color:white">
        Los siguientes <strong>campos</strong> requieren atención:
      </p>
      <div style="max-height:350px;overflow-y:auto;">${lista}</div>
    `,
        icon: 'error',
        confirmButtonText: 'Entendido',
        customClass: { popup: 'swal2-padding swal2-border' },
      });
      return;
    }


    const {
      confirmPassword,
      permisosIds,
      userName,
      passwordHash,
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      telefono,
      fotoPerfil,
      idRol,
      idCliente,
      idSala,
    } = this.usuarioForm.value;

    const toNumOrNull = (v: any) => (v === null || v === undefined || v === '' ? null : Number(v));

    const payload: any = {
      userName,
      passwordHash,
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      telefono,
      fotoPerfil,
      idRol: toNumOrNull(idRol),
      idCliente: toNumOrNull(idCliente),
      idSala: toNumOrNull(idSala),
      permisosIds: (permisosIds || []).map((x: any) => Number(x)),
    };

    const fotoValue = this.usuarioForm.get('fotoPerfil')?.value;
    payload.fotoPerfil =
      typeof fotoValue === 'string' && fotoValue.trim()
        ? fotoValue
        : 'https://auranet.s3.us-east-2.amazonaws.com/general/user_default.png';

    if (!payload.permisosIds || payload.permisosIds.length === 0) {
      this.submitButton = 'Guardar';
      this.loading = false;
      this.mostrarAlertaPermisos();
      return;
    }

    this.usuaService.agregarUsuario(payload).subscribe({
      next: () => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#0d121d',
          text: `Se agregó un nuevo usuario de manera exitosa.`,
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.regresar();
      },
      error: (error: any) => {
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

  actualizar() {
    if (this.loading) return;

    this.submitButton = 'Cargando...';
    this.loading = true;

    if (!this.inputContrasena) {
      const passCtrl = this.usuarioForm.get('passwordHash');
      const confirmCtrl = this.usuarioForm.get('confirmPassword');
      passCtrl?.clearValidators();
      passCtrl?.updateValueAndValidity({ emitEvent: false });
      confirmCtrl?.clearValidators();
      confirmCtrl?.updateValueAndValidity({ emitEvent: false });
    }

    const etiquetas: Record<string, string> = {
      nombre: 'Nombre',
      apellidoPaterno: 'Apellido Paterno',
      telefono: 'Teléfono',
      userName: 'Correo electrónico',
      idRol: 'Rol',
      idCliente: 'Cliente',
      idSala: 'Sala',
      passwordHash: 'Contraseña',
      confirmPassword: 'Confirmar contraseña',
      fotoPerfil: 'Foto de perfil',
      permisosIds: 'Permisos',
    };

    const camposFaltantes: string[] = [];
    Object.keys(this.usuarioForm.controls).forEach((key) => {
      if (!this.inputContrasena && (key === 'passwordHash' || key === 'confirmPassword')) return;
      const control = this.usuarioForm.get(key);
      if (control?.errors?.['required']) {
        camposFaltantes.push(etiquetas[key] || key);
      }
    });

    const listaMensajes: string[] = [...camposFaltantes];
    if (this.inputContrasena && this.usuarioForm.hasError('passwordMismatch')) {
      listaMensajes.push('Las contraseñas no coinciden');
    }

    if (this.usuarioForm.invalid || listaMensajes.length > 0) {
      this.submitButton = 'Actualizar';
      this.loading = false;

      Swal.fire({
        title: '¡Faltan campos obligatorios!',
        background: '#0d121d',
        html: `
        <p style="text-align: center; font-size: 15px; margin-bottom: 16px; color: white">
          Los siguientes <strong>campos</strong> requieren atención:
        </p>
        <div style="max-height: 350px; overflow-y: auto;">
          ${listaMensajes
            .map(
              (msg, idx) => `
            <div style="padding:8px 12px;border-left:4px solid #d9534f;background:#caa8a8;text-align:center;margin-bottom:8px;border-radius:4px;">
              <strong style="color:#b02a37;">${idx + 1}. ${msg}</strong>
            </div>`
            )
            .join('')}
        </div>`,
        icon: 'error',
        confirmButtonText: 'Entendido',
        customClass: { popup: 'swal2-padding swal2-border' },
      });
      return;
    }

    const {
      confirmPassword,
      permisosIds,
      userName,
      passwordHash,
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      telefono,
      fotoPerfil,
      idRol,
      idCliente,
      idSala,
    } = this.usuarioForm.value;

    const toNumOrNull = (v: any) => (v === null || v === undefined || v === '' ? null : Number(v));

    const payload: any = {
      userName,
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      telefono,
      fotoPerfil,
      idRol: toNumOrNull(idRol),
      idCliente: toNumOrNull(idCliente),
      idSala: toNumOrNull(idSala),
      permisosIds: (permisosIds || []).map((x: any) => Number(x)),
    };

    if (this.inputContrasena && passwordHash) {
      payload.passwordHash = passwordHash;
    }


    if (!payload.permisosIds || payload.permisosIds.length === 0) {
      this.submitButton = 'Actualizar';
      this.loading = false;
      this.mostrarAlertaPermisos();
      return;
    }


    this.usuaService.actualizarUsuario(this.idUsuario, payload).subscribe({
      next: () => {
        this.submitButton = 'Actualizar';
        this.loading = false;

        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#0d121d',
          text: `Los datos del usuario se actualizaron correctamente.`,
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


  private mostrarAlertaPermisos(): void {
    const html = `
      <div style="max-height:350px;overflow-y:auto;">
        <div style="padding:8px 12px;border-left:4px solid #d9534f;
                    background:#caa8a8;text-align:center;margin-bottom:8px;border-radius:4px;">
          <strong style="color:#b02a37;">Debes asignar los permisos correspondientes al usuario.</strong>
        </div>
      </div>
    `;
    Swal.fire({
      title: '¡Faltan permisos!',
      background: '#0d121d',
      html,
      icon: 'warning',
      confirmButtonText: 'De acuerdo',
      showCancelButton: false,
      customClass: { popup: 'swal2-padding swal2-border' },
    });
  }

  regresar() {
    this.route.navigateByUrl('/usuarios');
  }

}
