import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private theme: 'light' | 'dark' = 'light';

  constructor() {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
    this.setTheme(savedTheme || 'light');
  }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme();
  }

  private applyTheme() {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(this.theme);
    localStorage.setItem('theme', this.theme);
  }

  setTheme(theme: 'dark' | 'light') {
    this.theme = theme;
    this.applyTheme();
  }

  get currentTheme() {
    return this.theme;
  }
}
