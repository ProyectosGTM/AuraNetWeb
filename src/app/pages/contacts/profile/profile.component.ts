import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { slideDownFadeAnimation } from 'src/app/core/slide-down-fade.animation';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { UsuariosService } from 'src/app/shared/services/usuario.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  animations: [fadeInRightAnimation, slideDownFadeAnimation],
})
export class ProfileComponent implements OnInit {

  user: any = null;
  nombreCompleto = '';
  nombreClienteCompleto = '';
  ultimoLoginFormateado = '';
  fechaCreacionFormateada = '';

  mostrarPanelContrasena = false;
  passwordForm: FormGroup;
  cambiandoContrasena = false;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private authService: AuthenticationService,
    private usuarioService: UsuariosService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.passwordForm = this.fb.group({
      contraseñaActual: ['', [Validators.required, Validators.minLength(6)]],
      nuevaContrasena: ['', [Validators.required, Validators.minLength(6)]],
      confirmarContrasena: ['', [Validators.required]]
    }, { validators: this.passwordsMatchValidator });
  }

  passwordsMatchValidator(formGroup: FormGroup) {
    const nueva = formGroup.get('nuevaContrasena')?.value;
    const confirmar = formGroup.get('confirmarContrasena')?.value;
    return nueva === confirmar ? null : { passwordMismatch: true };
  }

  ngOnInit(): void {
    this.cargarPerfil();
  }

  private cargarPerfil(): void {
    try {
      this.user = this.authService.getUser();
      if (!this.user) {
        this.router.navigate(['/login']);
        return;
      }

      const partes = [
        this.user.nombre,
        this.user.apellidoPaterno,
        this.user.apellidoMaterno && this.user.apellidoMaterno !== 'null' ? this.user.apellidoMaterno : null
      ].filter(Boolean);
      this.nombreCompleto = partes.join(' ') || 'Usuario';

      const partesCliente = [
        this.user.nombreCliente,
        this.user.apellidoPaternoCliente,
        this.user.apellidoMaternoCliente && this.user.apellidoMaternoCliente !== 'null' ? this.user.apellidoMaternoCliente : null
      ].filter(Boolean);
      this.nombreClienteCompleto = partesCliente.join(' ') || '—';

      this.ultimoLoginFormateado = this.formatearFecha(this.user.ultimoLogin);
      this.fechaCreacionFormateada = this.formatearFecha(this.user.fechaCreacion);
    } catch {
      this.router.navigate(['/login']);
    }
  }

  private formatearFecha(fecha: any): string {
    if (!fecha) return '—';
    try {
      const d = new Date(fecha);
      return isNaN(d.getTime()) ? '—' : d.toLocaleString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '—';
    }
  }

  get fotoPerfilUrl(): string {
    return this.user?.fotoPerfil || this.user?.imagenPerfil || null;
  }

  togglePanelContrasena(): void {
    this.mostrarPanelContrasena = !this.mostrarPanelContrasena;
    if (!this.mostrarPanelContrasena) {
      this.passwordForm.reset();
    }
  }

  guardarContrasena(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      const msg = this.passwordForm.hasError('passwordMismatch')
        ? 'La nueva contraseña y la confirmación no coinciden.'
        : 'Completa todos los campos correctamente (mínimo 6 caracteres).';
      Swal.fire({
        title: 'Revisa los datos',
        text: msg,
        icon: 'warning',
        background: '#0d121d',
        confirmButtonColor: '#e40041'
      });
      return;
    }

    this.cambiandoContrasena = true;
    const payload = {
      contraseñaActual: this.passwordForm.get('contraseñaActual')?.value,
      contraseñaNueva: this.passwordForm.get('nuevaContrasena')?.value
    };

    this.usuarioService.actualizarContrasena(Number(this.user.id), payload).subscribe({
      next: () => {
        Swal.fire({
          title: '¡Contraseña actualizada!',
          text: 'Tu contraseña ha sido cambiada correctamente.',
          icon: 'success',
          background: '#0d121d',
          confirmButtonColor: '#e40041'
        });
        this.passwordForm.reset();
        this.mostrarPanelContrasena = false;
      },
      error: (err) => {
        const mensaje = err?.error?.message || err?.error || 'No se pudo actualizar la contraseña. Verifica que la contraseña actual sea correcta.';
        Swal.fire({
          title: 'Error',
          text: mensaje,
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#e40041'
        });
      },
      complete: () => {
        this.cambiandoContrasena = false;
      }
    });
  }

}
