import { Component, HostListener, AfterViewInit } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { LucideAngularModule } from 'lucide-angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [LucideAngularModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements AfterViewInit {
  isDarkMode = false;
  activeSection = 'home';
  isMobileMenuOpen = false;
  navbarEntered = false;

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  constructor(public themeService: ThemeService) { }

  isScrolled = false;

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 20;

    const sections: string[] = ['home', 'about', 'services', 'skills', 'projects', 'contact'];
    let currentSection = this.activeSection;

    for (const section of sections) {
      const element = document.getElementById(section);
      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.top <= 120 && rect.bottom >= 120) {
          currentSection = section;
          break;
        }
      }
    }

    if (this.activeSection !== currentSection) {
      this.activeSection = currentSection;
    }
  }

  ngAfterViewInit(): void {
    // Trigger navbar entrance animation
    setTimeout(() => {
      this.navbarEntered = true;
    }, 100);

    const anchors = document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]');

    anchors.forEach(anchor => {
      anchor.addEventListener('click', (e: Event) => {
        e.preventDefault();
        const targetId = anchor.getAttribute('href')!;
        const target = document.querySelector(targetId);

        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });

          this.activeSection = targetId.replace('#', '');
        }
      });
    });

    setTimeout(() => this.onWindowScroll());
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    document.documentElement.classList.toggle('dark', this.isDarkMode);
  }
}
