import {
  Component, HostListener, AfterViewInit, OnDestroy, Inject, PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

interface NavItem {
  id: string;
  label: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements AfterViewInit, OnDestroy {

  isScrolled = false;
  activeSection = 'home';
  isMobileMenuOpen = false;

  readonly navItems: NavItem[] = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'skills', label: 'Skills' },
    { id: 'experience', label: 'Experience' },
    { id: 'projects', label: 'Projects' },
    { id: 'contact', label: 'Contact' },
  ];

  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.checkScrollPosition();
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser && this.isMobileMenuOpen) {
      document.body.style.overflow = '';
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (!this.isBrowser) return;
    this.checkScrollPosition();
  }

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (this.isMobileMenuOpen) {
      this.closeMobileMenu();
    }
  }

  private checkScrollPosition(): void {
    this.isScrolled = window.scrollY > 24;

    // Detect active section based on scroll offset
    const scrollPos = window.scrollY + 140;

    for (let i = this.navItems.length - 1; i >= 0; i--) {
      const item = this.navItems[i];
      const element = document.getElementById(item.id);
      if (element) {
        const top = element.offsetTop;
        const height = element.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          this.activeSection = item.id;
          return;
        }
      }
    }

    if (window.scrollY < 200) {
      this.activeSection = 'home';
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (this.isBrowser) {
      document.body.style.overflow = this.isMobileMenuOpen ? 'hidden' : '';
    }
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
    if (this.isBrowser) {
      document.body.style.overflow = '';
    }
  }

  scrollTo(targetId: string, event?: Event): void {
    if (event) {
      event.preventDefault();
    }

    this.closeMobileMenu();

    if (!this.isBrowser) return;

    const target = document.getElementById(targetId);
    if (target) {
      const headerOffset = 76;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth'
      });

      this.activeSection = targetId;
    }
  }
}
