import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { catchError, EMPTY } from 'rxjs';
import { AuthenticationService } from '../../../core/services/auth.service';
import { Credentials } from '../../../entities/Credentials';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  animations: []
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;
  emailForm!: FormGroup;
  verifyForm!: FormGroup;

  credentials!: Credentials;
  textLogin: string = 'Iniciar Sesión';
  submitted = false;
  error = '';
  returnUrl: string = '/';
  loading: boolean = false;

  type: 'password' | 'text' = 'password';
  hide = true;

  step: 'login' | 'email' | 'otp' | 'mfa' = 'login';

  otp: string[] = ['', '', '', '', '', ''];
  resendDisabled = false;
  resendSeconds = 60;
  private resendTimer?: number;
  resendMsg: string | null = null;

  constructor(
    private router: Router,
    private auth: AuthenticationService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.initForms();
    document.body.setAttribute('class', 'authentication-bg');
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  ngOnDestroy() {
    document.body.classList.remove('authentication-bg');
    if (this.resendTimer) clearInterval(this.resendTimer as any);
  }

  get f() { return this.loginForm.controls; }

  myFunctionPasswordCurrent() {
    this.type = this.type === 'password' ? 'text' : 'password';
  }

  initForms() {
    this.loginForm = this.fb.group({
      userName: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });

    this.emailForm = this.fb.group({
      userName: ['', [Validators.required, Validators.email]]
    });

    this.verifyForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  onSubmit(e?: Event) {
    e?.preventDefault();
    e?.stopPropagation();
    this.submitted = true;
    if (this.loginForm.invalid || this.loading) return;

    this.loading = true;
    this.textLogin = 'Cargando...';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    this.credentials = this.loginForm.value;

    this.auth.authenticate(this.credentials).pipe(
      catchError((error) => {
        this.loading = false;
        this.textLogin = 'Iniciar Sesión';
        Swal.fire({
          background: '#0d121d',
          icon: 'error',
          title: '¡Ops!',
          text: error.error,
          confirmButtonText: 'Entendido',
          allowOutsideClick: false,
          allowEscapeKey: false
        });
        return EMPTY;
      })
    ).subscribe((result: any) => {
      this.loading = false;
      this.textLogin = 'Iniciar Sesión';
      // Segundo factor activo: no llega token, llega un desafío (§13.1).
      if (result?.segundoFactor === 'requerido' && result?.tokenDesafio) {
        this.tokenDesafio = result.tokenDesafio;
        this.codigoMfa = '';
        this.errorMfa = null;
        this.step = 'mfa';
        this.cdr.detectChanges();
        setTimeout(() => document.querySelector<HTMLInputElement>('#mfaCodigo')?.focus(), 0);
        return;
      }
      this.finalizarLogin(result);
    });
  }

  /* ===== Segundo factor (§13.1) ===== */
  tokenDesafio: string | null = null;
  codigoMfa = '';
  errorMfa: string | null = null;

  /** 6 dígitos de la app o un código de respaldo XXXX-XXXX. */
  get codigoMfaValido(): boolean {
    const c = (this.codigoMfa || '').trim().toUpperCase();
    return /^\d{6}$/.test(c) || /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(c);
  }

  onVerificarMfa(e?: Event) {
    e?.preventDefault();
    if (!this.tokenDesafio || !this.codigoMfaValido || this.loading) return;
    this.loading = true;
    this.errorMfa = null;
    this.auth.validarSegundoFactor({ tokenDesafio: this.tokenDesafio, codigo: this.codigoMfa.trim().toUpperCase() }).subscribe({
      next: (result: any) => {
        this.loading = false;
        this.tokenDesafio = null;
        this.finalizarLogin(result);
      },
      error: (err: any) => {
        this.loading = false;
        this.codigoMfa = '';
        // 401 sin código = el desafío venció (5 min): volver al paso 1.
        if (err?.status === 401 && !err?.codigo) {
          this.cancelarMfa();
          Swal.fire({ background: '#0d121d', icon: 'warning', title: '¡Tiempo Agotado!', text: 'El código expiró. Vuelve a iniciar sesión.', confirmButtonText: 'Entendido' });
          return;
        }
        this.errorMfa = err?.codigo === 'CODIGO_2FA_USADO'
          ? 'Ese código ya se usó. Espera el siguiente en tu app.'
          : (err?.error || 'Código incorrecto.');
        this.cdr.markForCheck();
      }
    });
  }

  cancelarMfa() {
    this.tokenDesafio = null;
    this.codigoMfa = '';
    this.errorMfa = null;
    this.step = 'login';
  }

  /** Guarda la sesión y decide a dónde ir (§7 debeCambiarPassword, §13.2 debeConfigurarSegundoFactor). */
  private finalizarLogin(result: any) {
    const permisosIds = (result?.permisos ?? []).map((p: any) => String(p.idPermiso ?? p));
    result.permisos = permisosIds;
    this.auth.setData(result);

    if (result?.debeCambiarPassword) {
      Swal.fire({ background: '#0d121d', icon: 'info', title: 'Cambia tu Contraseña', text: 'Por seguridad debes cambiar tu contraseña antes de continuar.', confirmButtonText: 'Continuar', allowOutsideClick: false });
      this.router.navigate(['/account/cambiar-contrasena']);
      return;
    }
    if (result?.debeConfigurarSegundoFactor) {
      Swal.fire({ background: '#0d121d', icon: 'info', title: 'Configura tu Segundo Factor', text: 'Tu rol requiere una app autenticadora para entrar al sistema.', confirmButtonText: 'Continuar', allowOutsideClick: false });
      this.router.navigate(['/account/segundo-factor']);
      return;
    }
    Swal.fire({
      background: '#0d121d',
      icon: 'success',
      title: '¡Apuesta Ganadora!',
      text: 'Has entrado al sistema correctamente.',
      confirmButtonText: 'Continuar',
      allowOutsideClick: false,
      allowEscapeKey: false
    });
    this.router.navigate(['/dashboard']);

  }

  openEmailStep() {
    this.step = 'email';
    this.resendMsg = null;
    this.otp = ['', '', '', '', '', ''];
    this.verifyForm.reset({ codigo: '' });
    this.cdr.markForCheck();
  }

  backToLogin() {
    this.step = 'login';
    this.resendMsg = null;
    this.clearResend();
    this.cdr.markForCheck();
  }

  goToOtpStep() {
    this.step = 'otp';
    this.resendMsg = null;
    this.otp = ['', '', '', '', '', ''];
    this.verifyForm.reset({ codigo: '' });
    this.cdr.detectChanges();
    setTimeout(() => {
      const first = document.querySelector<HTMLInputElement>('#otp-box-0');
      first?.focus();
      first?.select?.();
    }, 0);
  }

  onSendEmail(e?: Event) {
    e?.preventDefault();
    e?.stopPropagation();
    if (this.emailForm.invalid || this.loading) return;
    this.loading = true;

    const payload = { userName: this.emailForm.get('userName')!.value };

    this.auth.recuperarAcceso(payload).subscribe({
      next: (msg: string) => {
        this.loading = false;
        Swal.fire({
          background: '#0d121d',
          color: 'white',
          icon: 'success',
          title: '¡Operación Exitosa!',
          text: msg || 'Se ha enviado a tu correo el código de verificación.',
          confirmButtonText: 'Confirmar',
          allowOutsideClick: false,
          allowEscapeKey: false
        }).then(() => {
          this.startResendCountdown();
          this.resendMsg = null;
          this.goToOtpStep();
        });
      },
      error: async (err) => {
        const msg = await this.getErrorMessage(err);
        this.loading = false;
        Swal.fire({
          background: '#0d121d',
          icon: 'error',
          title: '¡Ops!',
          text: msg,
          confirmButtonText: 'Entendido',
          allowOutsideClick: false,
          allowEscapeKey: false
        });
      }
    });
  }

  onOtpInput(e: Event, i: number) {
    const input = e.target as HTMLInputElement;
    const v = (input.value || '').replace(/\D/g, '').slice(0, 1);
    input.value = v;
    this.otp[i] = v;
    if (v && i < 5) {
      const next = document.querySelector<HTMLInputElement>(`#otp-box-${i + 1}`);
      next?.focus();
      next?.select?.();
    }
    const joined = this.otp.join('');
    if (joined.length === 6) {
      this.verifyForm.patchValue({ codigo: joined }, { emitEvent: false });
    }
  }

  onOtpKeydown(e: KeyboardEvent, i: number) {
    const input = e.target as HTMLInputElement;
    if (e.key === 'Backspace' && !input.value && i > 0) {
      const prev = document.querySelector<HTMLInputElement>(`#otp-box-${i - 1}`);
      prev?.focus();
      prev?.select?.();
      return;
    }
    if (!/^\d$/.test(e.key) && e.key !== 'Backspace' && e.key.length === 1) {
      e.preventDefault();
    }
  }

  onVerify(e?: Event) {
    e?.preventDefault();
    e?.stopPropagation();
    this.verifyForm.patchValue({ codigo: this.otp.join('') }, { emitEvent: false });
    this.verifyForm.markAllAsTouched();
    this.verifyForm.updateValueAndValidity();
    if (this.verifyForm.invalid) {
      Swal.fire({
        background: '#0d121d',
        icon: 'warning',
        title: '¡Ops!',
        html: `
          <p style="text-align:center;font-size:15px;margin-bottom:16px;">
            Los siguientes <strong>campos obligatorios</strong> están vacíos o son inválidos.<br>
            Por favor complétalos antes de continuar:
          </p>
          <div style="max-height:350px;overflow-y:auto;">
            <div style="padding:8px 12px;border-left:4px solid #d9534f;background:#f2d7d5;text-align:center;margin-bottom:8px;border-radius:4px;">
              <strong style="color:#b02a37;">1. Código de Verificación (6 dígitos)</strong>
            </div>
          </div>
        `,
        confirmButtonText: 'Entendido',
        allowOutsideClick: false,
        allowEscapeKey: false
      });
      return;
    }

    if (this.loading) return;
    this.loading = true;

    const codigo = (this.verifyForm.get('codigo')!.value || '').toString().trim();

    this.auth.reenviarCodigo({ userName: this.emailForm.get('userName')!.value, codigo }).subscribe({
      next: (msg: string) => {
        this.loading = false;
        this.otp = ['', '', '', '', '', ''];
        this.verifyForm.reset({ codigo: '' }, { emitEvent: false });
        Swal.fire({
          background: '#0d121d',
          icon: 'success',
          title: '¡Operación Exitosa!',
          text: msg || 'Código validado correctamente. Tu cuenta fue verificada.',
          confirmButtonText: 'Entendido',
          allowOutsideClick: false,
          allowEscapeKey: false
        }).then(() => {
          this.backToLogin();
        });
      },
      error: async (err) => {
        this.loading = false;
        const msg = await this.getErrorMessage(err);
        Swal.fire({
          background: '#0d121d',
          icon: 'error',
          title: '¡Ops!',
          text: msg,
          confirmButtonText: 'Entendido',
          allowOutsideClick: false,
          allowEscapeKey: false
        });
      }
    });
  }

  onResend() {
    if (this.resendDisabled || this.loading) return;
    if (this.emailForm.invalid) return;

    this.loading = true;
    const payload = { userName: this.emailForm.get('userName')!.value };

    this.auth.recuperarAcceso(payload).subscribe({
      next: (msg: string) => {
        this.loading = false;
        this.startResendCountdown();
        this.resendMsg = msg || 'Se ha reenviado el correo con tu código de verificación.';
        this.cdr.markForCheck();
      },
      error: async (err) => {
        const msg = await this.getErrorMessage(err);
        this.loading = false;
        Swal.fire({
          background: '#0d121d',
          icon: 'error',
          title: '¡Ops!',
          text: msg,
          confirmButtonText: 'Entendido',
          allowOutsideClick: false,
          allowEscapeKey: false
        });
      }
    });
  }

  private startResendCountdown() {
    this.clearResend();
    this.resendDisabled = true;
    this.resendSeconds = 60;
    this.resendTimer = setInterval(() => {
      this.resendSeconds -= 1;
      if (this.resendSeconds <= 0) {
        this.clearResend();
      }
      this.cdr.markForCheck();
    }, 1000) as unknown as number;
  }

  private clearResend() {
    if (this.resendTimer) clearInterval(this.resendTimer as any);
    this.resendTimer = undefined;
    this.resendDisabled = false;
  }

  private async getErrorMessage(err: any): Promise<string> {
    if (err?.status === 0 && !err?.error) return 'No hay conexión con el servidor (status 0). Verifica tu red.';
    if (err?.error instanceof Blob) {
      try {
        const txt = await err.error.text();
        if (txt) return txt;
      } catch { }
    }
    if (typeof err?.error === 'string' && err.error.trim()) return err.error;
    if (typeof err?.message === 'string' && err.message.trim()) return err.message;
    if (err?.error?.message) return String(err.error.message);
    if (err?.error?.errors) {
      const e = err.error.errors;
      if (Array.isArray(e)) return e.filter(Boolean).join('\n');
      if (typeof e === 'object') {
        const lines: string[] = [];
        for (const k of Object.keys(e)) {
          const val = e[k];
          if (Array.isArray(val)) lines.push(`${k}: ${val.join(', ')}`);
          else if (val) lines.push(`${k}: ${val}`);
        }
        if (lines.length) return lines.join('\n');
      }
    }
    const statusLine = err?.status ? `HTTP ${err.status}${err.statusText ? ' ' + err.statusText : ''}` : '';
    return statusLine || 'Error desconocido';
  }
}
