import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { LucideAngularModule, ArrowUpRight, File, Home, Menu, UserCheck, Sun, Moon, Download, X, Github, Linkedin } from "lucide-angular";
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes),
  importProvidersFrom(LucideAngularModule.pick({ File, Home, Menu, UserCheck, ArrowUpRight, Sun, Moon, Download, X, Github, Linkedin }))
  ]
};
