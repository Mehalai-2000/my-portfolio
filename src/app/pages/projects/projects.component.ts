import {
  Component, ElementRef, ViewChild,
  AfterViewInit, OnDestroy, NgZone, Inject, PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export interface ProjectItem {
  id: string;
  num: string;
  title: string;
  category: string;
  role: string;
  image: string;
  description: string;
  status: string;
  tech: string[];
  link?: string;
  github?: string;
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.css'
})
export class ProjectsComponent implements AfterViewInit, OnDestroy {

  @ViewChild('projectsRoot') projectsRootRef!: ElementRef<HTMLElement>;

  private triggers: ScrollTrigger[] = [];
  private destroyed = false;
  private isBrowser: boolean;

  readonly projects: ProjectItem[] = [
    {
      id: 'jade-wealth',
      num: '01',
      title: 'Jade Wealth Management',
      category: 'Mobile Application · Fintech',
      role: 'Frontend & UI Architecture',
      image: 'assets/mock.png',
      description: 'A comprehensive wealth management mobile application engineered for real-time portfolio monitoring, dynamic asset allocation tracking, and secure financial management, providing users with actionable insights and seamless control over their investments.',
      status: 'Production Architecture',
      tech: ['React Native', 'Expo', 'REST API', 'TypeScript', 'State Management']
    },
    {
      id: 'zubelife-banking',
      num: '02',
      title: 'ZubeLife',
      category: 'Web Platform · Digital Banking',
      role: 'UI Development & Integration',
      image: 'assets/fintuit-image.png',
      description: 'A modern digital banking web application to manage accounts, transactions, multi-tier budgets, and savings goals. Includes tabs for account overview, expense visualization, and real-time updates. Contributed to responsive UI design, component optimization, and testing.',
      status: 'Fintech Web Application',
      tech: ['Angular', 'Bootstrap', 'REST API', 'TypeScript', 'Reactive Forms']
    },
    {
      id: 'ar-crm',
      num: '03',
      title: 'AR CRM',
      category: 'Mobile System · Financial CRM',
      role: 'Frontend Engineering',
      image: 'assets/CRM.png',
    description: 'A high-impact CRM application designed for managing shares, stocks, mutual funds, and SIP portfolios, enabling efficient client portfolio tracking, advisor workflows, and multi-tier account management.',
    status: 'Enterprise Portfolio Management',
    tech: ['React Native', 'Expo', 'REST API', 'JavaScript', 'Financial Analytics']
    }
  ];

constructor(
  private zone: NgZone,
  @Inject(PLATFORM_ID) platformId: object
) {
  this.isBrowser = isPlatformBrowser(platformId);
}

ngAfterViewInit(): void {
  if(!this.isBrowser) return;

  this.zone.runOutsideAngular(() => {
    setTimeout(() => {
      this.initProjectAnimations();
    }, 100);
  });
}

ngOnDestroy(): void {
  this.destroyed = true;
  this.triggers.forEach(t => t.kill());
  this.triggers = [];
}

  private initProjectAnimations(): void {
  if(this.destroyed) return;

  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(prefersReducedMotion) return;

  const root = this.projectsRootRef?.nativeElement;
  if(!root) return;

  // Header entrance
  const header = root.querySelector('.projects-editorial-header');
  if(header) {
    const headerTrigger = ScrollTrigger.create({
      trigger: header,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        if (this.destroyed) return;
        gsap.fromTo(header.querySelectorAll('.animate-header-elem'),
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.9, stagger: 0.15, ease: 'power3.out' }
        );
      }
    });
    this.triggers.push(headerTrigger);
  }

    // Showcase Project Rows Entrance & Image Clip-Path Parallax
    const projectShowcaseRows = root.querySelectorAll('.project-showcase-row');
  projectShowcaseRows.forEach((row, idx) => {
    const imgContainer = row.querySelector('.project-media-frame') as HTMLElement;
    const contentContainer = row.querySelector('.project-editorial-details') as HTMLElement;
    const img = row.querySelector('.project-showcase-img') as HTMLElement;

    const rowTrigger = ScrollTrigger.create({
      trigger: row,
      start: 'top 78%',
      once: true,
      onEnter: () => {
        if (this.destroyed) return;
        row.classList.add('is-revealed');

        if (imgContainer) {
          gsap.fromTo(imgContainer,
            { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)', opacity: 0 },
            { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', opacity: 1, duration: 1.2, ease: 'power3.inOut' }
          );
        }

        if (contentContainer) {
          gsap.fromTo(contentContainer,
            { opacity: 0, y: 40 },
            { opacity: 1, y: 0, duration: 1.0, delay: 0.25, ease: 'power3.out' }
          );
        }
      }
    });
    this.triggers.push(rowTrigger);

    // Subtle Image Parallax on scroll
    if (img && row) {
      const parallaxTrigger = ScrollTrigger.create({
        trigger: row,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.2,
        onUpdate: (self) => {
          if (this.destroyed) return;
          const yPercent = (self.progress - 0.5) * 16;
          img.style.transform = `scale(1.08) translateY(${yPercent}%)`;
        }
      });
      this.triggers.push(parallaxTrigger);
    }
  });

  // 3D Tilt on Hover for project media frames
  projectShowcaseRows.forEach((row) => {
    const card = row.querySelector<HTMLElement>('.project-media-frame');
    if (!card) return;

    const onMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    };

    const onMouseLeave = () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    };

    card.addEventListener('mousemove', onMouseMove);
    card.addEventListener('mouseleave', onMouseLeave);
  });
}

scrollTo(sectionId: string, event: Event): void {
  event.preventDefault();
  if(!this.isBrowser) return;

  const el = document.getElementById(sectionId);
  if(el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
}
