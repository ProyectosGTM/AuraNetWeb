import { TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { TRADUCCIONES_ES } from './traducciones-es';

/**
 * Cargador de traducciones sin petición HTTP: siempre entrega el español
 * empaquetado en el bundle, así ya no se descarga assets/i18n/es.json.
 */
export class StaticTranslateLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<Record<string, unknown>> {
    return of(TRADUCCIONES_ES);
  }
}
