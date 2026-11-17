import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { UsuariosService } from 'src/app/shared/services/usuario.service';
import { mensajeError } from 'src/app/shared/utils/api-error';

/**
 * Cambio de contraseña con la sesión normal (ESPECIFICACION_FRONT §7).
 * Se usa cuando el login responde `debeCambiarPassword: true` (contraseña temporal) y desde el perfil.
 * `passwordActual` es obligatorio; la nueva tiene al menos 6 caracteres.
 */
@Component({
  selector: 'app-cambiar-contrasena',
  templateUrl: './cambiar-contrasena.component.html',
  styleUrls: ['../segundo-factor/segundo-factor.component.scss'],
})
export class CambiarContrasenaComponent implements OnInit, OnDestroy {
  passwordActual = '';
  password = '';
  confirmar = '';
  ver = false;
  guardando = false;
  error: string | null = null;

  constructor(private usuarios: UsuariosService, private auth: AuthenticationService, private router: Router) { }

  ngOnDestroy(): void {
    document.body.classList.remove('authentication-bg');
  }

  ngOnInit(): void {
    document.body.classList.add('authentication-bg');
  }

  get valido(): boolean {
    return !!this.passwordActual && (this.password || '').length >= 6 && this.password === this.confirmar && this.password !== this.passwordActual;
  }

  guardar(): void {
    if (!this.valido || this.guardando) return;
    const user: any = this.auth.getUser();
    const userName = user?.userName ?? user?.correo ?? user?.email ?? '';
    this.guardando = true;
    this.error = null;
    this.usuarios.cambiarContrasenaSesion({ userName, password: this.password, passwordActual: this.passwordActual }).subscribe({
      next: () => {
        this.guardando = false;
        this.passwordActual = this.password = this.confirmar = '';
        const u: any = this.auth.getUser();
        if (u) { u.debeCambiarPassword = false; sessionStorage.setItem('user', JSON.stringify(u)); }
        Swal.fire({ background: '#0d121d', icon: 'success', title: '¡Contraseña Actualizada!', text: 'Ya puedes usar el sistema.', confirmButtonText: 'Continuar' });
        this.router.navigate([u?.debeConfigurarSegundoFactor ? '/account/segundo-factor' : '/dashboard']);
      },
      error: (e) => {
        this.guardando = false;
        this.error = mensajeError(e, 'No se pudo cambiar la contraseña.');
      },
    });
  }

  salir(): void {
    this.auth.cleanSession();
    this.router.navigate(['/account/login']);
  }
}
