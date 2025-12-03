import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { environment } from '../environments/environment.development';
import { JwtModule } from '@auth0/angular-jwt';
import { ServerErrorsInterceptor } from './interceptor/server-error.interceptor';

export function tokenGetter(){
    return sessionStorage.getItem(environment.TOKEN_NAME);
}

// URL base de tu backend para configuración de seguridad (solo hostname)
const RAILWAY_HOST = 'restaurant-backend-production-7291.up.railway.app';
const RAILWAY_HOST_PROTOCOL = `https://${RAILWAY_HOST}`;

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        provideHttpClient(withInterceptorsFromDi()),
        importProvidersFrom(
            JwtModule.forRoot({
                config: {
                    tokenGetter: tokenGetter,
                    // 1. Dominio permitido: Solo el hostname (sin https://)
                    allowedDomains: [RAILWAY_HOST], 
                    // 2. Ruta deshabilitada: Usar la URL completa con HTTPS
                    disallowedRoutes: [`${RAILWAY_HOST_PROTOCOL}/login/forget`], 
                },
            }),
        ),
        {
            provide: HTTP_INTERCEPTORS,
            useClass: ServerErrorsInterceptor,
            multi: true
        }
    ]
};