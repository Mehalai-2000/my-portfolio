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

interface TimelineMilestone {
  period: string;
  dateRange: string;
  role: string;
  company: string;
  location: string;
  statusBadge: string;
  isCurrent: boolean;
  description: string;
  highlights: string[];
  tags: string[];
}

interface SkillCategory {
  domain: string;
  icon: string;
  description: string;
  skills: string[];
}

interface HighlightStat {
  target: number;
  suffix: string;
  prefix?: string;
  label: string;
  sublabel: string;
  currentDisplay: number;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent implements AfterViewInit, OnDestroy {

  @ViewChild('aboutContainer') aboutContainerRef!: ElementRef<HTMLElement>;
  @ViewChild('timelineTrack') timelineTrackRef!: ElementRef<HTMLElement>;
  @ViewChild('timelineFill') timelineFillRef!: ElementRef<HTMLElement>;

  private triggers: ScrollTrigger[] = [];
  private destroyed = false;
  private isBrowser: boolean;

  // ── Animated Numerical Stats ──────────────────────────────────────────
  readonly stats: HighlightStat[] = [
    { target: 3, suffix: '+', label: 'Years Experience', sublabel: 'Enterprise Frontend & UI Engineering', currentDisplay: 0 },
    { target: 5, suffix: '+', label: 'Production Apps', sublabel: 'Scalable Web & Mobile Architectures', currentDisplay: 0 },
    { target: 100, suffix: '%', label: 'Clean Architecture', sublabel: 'Modular, Testable & Type-Safe Code', currentDisplay: 0 },
    { target: 60, suffix: ' FPS', label: 'Smooth Performance', sublabel: 'Optimized Animations & Web Vitals', currentDisplay: 0 }
  ];

  // ── Scroll-Driven Career Timeline ─────────────────────────────────────
  readonly milestones: TimelineMilestone[] = [
    {
      period: '2024 — PRESENT',
      dateRange: 'October 2024 — Present',
      role: 'Application Engineer',
      company: 'Datasirpi',
      location: 'Chennai, India',
      statusBadge: 'CURRENT ROLE · ENTERPRISE SYSTEMS',
      isCurrent: true,
      description: 'Spearheading core frontend architecture and building enterprise-grade Angular applications. Focused on engineering reusable design systems, reactive state flows, and mission-critical workflows with high reliability.',
      highlights: [
        'Architected modular, scalable component libraries in Angular and TypeScript for multi-tenant applications',
        'Engineered complex reactive state orchestrations using RxJS and modern Angular Signals',
        'Optimized bundle size, lazy-loading strategies, and Core Web Vitals to sustain high-traffic performance',
        'Collaborated directly with backend, DevOps, and UX designers to deliver polished, resilient features'
      ],
      tags: ['Angular', 'TypeScript', 'RxJS', 'Signals', 'Clean Architecture', 'SCSS', 'REST APIs']
    },
    {
      period: '2023 — 2024',
      dateRange: 'May 2023 — September 2024',
      role: 'Junior Frontend Developer',
      company: 'Zoi Fintech Private Limited',
      location: 'Tamil Nadu, India',
      statusBadge: 'PRODUCTION FINTECH PLATFORMS',
      isCurrent: false,
      description: 'Developed responsive user interfaces and integrated secure financial RESTful endpoints. Focused on precision implementation of Figma design systems, cross-browser compatibility, and seamless user interaction.',
      highlights: [
        'Built real-time financial dashboards and transaction interfaces with Angular, TypeScript, and responsive CSS',
        'Engineered dynamic client-side form validations and secure authentication interceptors',
        'Enhanced UI rendering performance across mobile, tablet, and high-DPI desktop viewports',
        'Participated in agile sprints, peer code reviews, and continuous frontend deployment workflows'
      ],
      tags: ['Angular', 'TypeScript', 'JavaScript', 'REST APIs', 'Tailwind CSS', 'Figma to Code', 'Git']
    }
  ];

  // ── Interactive Tech Stack Categories ─────────────────────────────────
  readonly skillCategories: SkillCategory[] = [
    {
      domain: 'Core Frameworks & Languages',
      icon: 'code',
      description: 'Modern component-driven web frameworks, strictly typed languages, and reactive primitives.',
      skills: ['Angular', 'TypeScript', 'JavaScript (ES6+)', 'React', 'React Native', 'Next.js']
    },
    {
      domain: 'State & Reactive Architecture',
      icon: 'cpu',
      description: 'Unidirectional data flows, complex async stream processing, and modular architecture.',
      skills: ['RxJS', 'NgRx', 'Angular Signals', 'REST APIs', 'Micro Frontends']
    },
    {
      domain: 'Styling & Design Systems',
      icon: 'layout',
      description: 'Pixel-perfect responsive design, motion choreography, and fluid design systems.',
      skills: ['HTML5', 'CSS3', 'SCSS', 'Tailwind CSS', 'Responsive Web Design', 'GSAP Animations']
    },
    {
      domain: 'Ecosystem, Testing & Tooling',
      icon: 'terminal',
      description: 'Enterprise build systems, continuous integration, version control, and debugging tools.',
      skills: ['Git & GitHub', 'npm / Vite / Webpack', 'Chrome DevTools', 'Jasmine & Karma', 'Agile / Scrum']
    }
  ];

  // ── Floating Orbital Badges ───────────────────────────────────────────
  readonly orbitalTags: string[] = [
    'Angular Specialist',
    'TypeScript 5.x',
    'Reactive Streams',
    'Angular Signals',
    'Clean Architecture',
    'Micro Frontends',
    'Pixel Perfection'
  ];

  constructor(
    private zone: NgZone,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    this.zone.runOutsideAngular(() => {
      // Small timeout to ensure DOM layout is completely settled
      setTimeout(() => {
        this.initAllAnimations();
      }, 100);
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.triggers.forEach(trigger => trigger.kill());
    this.triggers = [];
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // GSAP SCROLL & INTERACTION ORCHESTRATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  private initAllAnimations(): void {
    if (this.destroyed) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      // Set all stats to target immediately for accessibility
      this.stats.forEach(s => s.currentDisplay = s.target);
      return;
    }

    const container = this.aboutContainerRef?.nativeElement;
    if (!container) return;

    this.initHeadlineMaskReveals(container);
    this.initScrollTimelineProgress(container);
    this.initMilestonesStagger(container);
    this.initAnimatedCounters(container);
    this.initTechCard3DTilt(container);
    this.initOrbitalParallax(container);
  }

  /**
   * 1. Character/Line Mask Entrance Animation
   */
  private initHeadlineMaskReveals(container: HTMLElement): void {
    const maskElements = container.querySelectorAll('.mask-reveal-inner');
    if (!maskElements.length) return;

    const trigger = ScrollTrigger.create({
      trigger: container.querySelector('.intro-hero-block'),
      start: 'top 80%',
      once: true,
      onEnter: () => {
        if (this.destroyed) return;
        gsap.to(maskElements, {
          yPercent: 0,
          duration: 1.1,
          stagger: 0.12,
          ease: 'power3.out'
        });
      }
    });
    this.triggers.push(trigger);
  }

  /**
   * 2. Progressive Scroll-Driven Timeline Progress Line
   */
  private initScrollTimelineProgress(container: HTMLElement): void {
    const timelineEl = container.querySelector('#experience');
    const fillEl = this.timelineFillRef?.nativeElement;
    if (!timelineEl || !fillEl) return;

    const trigger = ScrollTrigger.create({
      trigger: timelineEl,
      start: 'top 70%',
      end: 'bottom 85%',
      scrub: 0.6,
      onUpdate: (self) => {
        if (this.destroyed || !fillEl) return;
        fillEl.style.transform = `scaleY(${self.progress})`;
      }
    });
    this.triggers.push(trigger);
  }

  /**
   * 3. Milestone Nodes Scroll Stagger & Active Glow
   */
  private initMilestonesStagger(container: HTMLElement): void {
    const milestoneNodes = container.querySelectorAll('.milestone-article');
    milestoneNodes.forEach((node) => {
      const trigger = ScrollTrigger.create({
        trigger: node as HTMLElement,
        start: 'top 80%',
        once: true,
        onEnter: () => {
          if (this.destroyed) return;
          node.classList.add('is-in-view');
          gsap.fromTo(node,
            { opacity: 0, y: 35 },
            { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' }
          );
        }
      });
      this.triggers.push(trigger);
    });
  }

  /**
   * 4. Animated Numerical Counters
   */
  private initAnimatedCounters(container: HTMLElement): void {
    const statsContainer = container.querySelector('.stats-strip-wrapper');
    if (!statsContainer) return;

    const trigger = ScrollTrigger.create({
      trigger: statsContainer,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        if (this.destroyed) return;
        this.stats.forEach((stat) => {
          const counterObj = { val: 0 };
          gsap.to(counterObj, {
            val: stat.target,
            duration: 2.2,
            ease: 'power2.out',
            onUpdate: () => {
              this.zone.run(() => {
                stat.currentDisplay = Math.round(counterObj.val);
              });
            }
          });
        });
      }
    });
    this.triggers.push(trigger);
  }

  /**
   * 5. Interactive 3D Tilt on Tech Stack Cards
   */
  private initTechCard3DTilt(container: HTMLElement): void {
    const cards = container.querySelectorAll<HTMLElement>('.tech-domain-card');
    cards.forEach((card) => {
      const handleMouseMove = (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -6;
        const rotateY = ((x - centerX) / centerX) * 6;

        card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
        card.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
        card.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);
      };

      const handleMouseLeave = () => {
        card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      };

      card.addEventListener('mousemove', handleMouseMove);
      card.addEventListener('mouseleave', handleMouseLeave);
    });
  }

  /**
   * 6. Orbital Parallax on Floating Decorative Badges
   */
  private initOrbitalParallax(container: HTMLElement): void {
    const floatingBadges = container.querySelectorAll<HTMLElement>('.orbital-chip');
    if (!floatingBadges.length) return;

    floatingBadges.forEach((badge, idx) => {
      const speed = (idx % 2 === 0 ? 1 : -1) * (15 + idx * 8);
      const trigger = ScrollTrigger.create({
        trigger: container.querySelector('.developer-story-section'),
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.2,
        onUpdate: (self) => {
          if (this.destroyed) return;
          const yMove = self.progress * speed;
          badge.style.transform = `translate3d(0, ${yMove}px, 0)`;
        }
      });
      this.triggers.push(trigger);
    });
  }

  // ── Navigation Link Smooth Scroller ────────────────────────────────────
  scrollTo(sectionId: string, event: Event): void {
    event.preventDefault();
    if (!this.isBrowser) return;

    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
