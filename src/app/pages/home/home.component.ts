import {
  Component, ElementRef, ViewChild,
  AfterViewInit, OnDestroy, NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements AfterViewInit, OnDestroy {

  @ViewChild('heroSection') heroSectionRef!: ElementRef<HTMLElement>;
  @ViewChild('heroCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('talkVideo') talkVideoRef!: ElementRef<HTMLVideoElement>;

  // ── Component State ─────────────────────────────────────────────
  talkButtonLabel = 'TALK TO ME';
  isTalkPlaying = false;

  // ── Name Characters (Sequential Letter-by-Letter Reveal) ─────────
  readonly nameCharacters: string[] = 'RAMUMANIMEHALAI'.split('');

  // ── Word-Level Staggered Description ────────────────────────────
  readonly descWords: string[] = [
    '"I', 'build', 'modern,', 'responsive,', 'and', 'user-friendly',
    'web', 'experiences', 'with', 'clean', 'code', 'and', 'thoughtful', 'design."'
  ];

  // ── Frame Sequence Constants ───────────────────────────────────
  // 131 frames of clean, forward-walking footage facing directly toward camera
  readonly TOTAL_FRAMES = 131;
  private readonly CANVAS_WIDTH = 1920;
  private readonly CANVAS_HEIGHT = 1080;

  // ── Internal Render & Preload State ─────────────────────────────
  private isBrowser: boolean;
  private images: (HTMLImageElement | null)[] = new Array(this.TOTAL_FRAMES).fill(null);
  private loadedIndices = new Set<number>();
  private ctx: CanvasRenderingContext2D | null = null;
  private targetFrameIndex = 0;
  private currentInterpolatedFrame = 0;
  private lastRenderedIndex = -1;
  private rafId: number | null = null;
  private scrollTriggerInstance: ScrollTrigger | null = null;
  private talkEndedHandler?: () => void;
  private destroyed = false;

  // ── Cinematic Text Animation State ─────────────────────────────
  private entranceTimeline: gsap.core.Timeline | null = null;
  private entrancePlayed = false;
  private fallbackTimer: any = null;

  constructor(private zone: NgZone) {
    this.isBrowser = typeof window !== 'undefined';
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    // Run outside Angular Zone to achieve buttery 60-120fps with zero change detection overhead
    this.zone.runOutsideAngular(() => {
      this.initCanvasAndScroller();
      this.setupIntroAnimationListener();
    });

    this.initTalkVideo();
  }

  ngOnDestroy(): void {
    this.destroyed = true;

    if (this.fallbackTimer) {
      clearTimeout(this.fallbackTimer);
      this.fallbackTimer = null;
    }

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.scrollTriggerInstance) {
      this.scrollTriggerInstance.kill();
      this.scrollTriggerInstance = null;
    }

    if (this.entranceTimeline) {
      this.entranceTimeline.kill();
      this.entranceTimeline = null;
    }

    const talkVideo = this.talkVideoRef?.nativeElement;
    if (talkVideo && this.talkEndedHandler) {
      talkVideo.removeEventListener('ended', this.talkEndedHandler);
      talkVideo.pause();
    }

    this.images.length = 0;
    this.loadedIndices.clear();
  }

  // ── Setup Intro Animation Completed / Skipped Listener ──────────
  private setupIntroAnimationListener(): void {
    // If intro was already finished/skipped in session or doesn't exist
    if ((window as any).__introFinished) {
      this.animateHeroEntrance();
      return;
    }

    // Listen for custom event dispatched by IntroComponent
    const handleIntroDone = () => {
      window.removeEventListener('introAnimationComplete', handleIntroDone);
      this.animateHeroEntrance();
    };
    window.addEventListener('introAnimationComplete', handleIntroDone);

    // Fallback: If intro doesn't fire within 5 seconds, animate hero anyway
    this.fallbackTimer = setTimeout(() => {
      if (!this.entrancePlayed) {
        this.animateHeroEntrance();
      }
    }, 4500);
  }

  // ── Public trigger invoked by AppComponent upon Intro Completion ──
  playCinematicEntrance(): void {
    this.animateHeroEntrance();
  }

  // ── Sequential Animated Typography Reveal (GSAP Timeline) ───────
  private animateHeroEntrance(): void {
    if (this.entrancePlayed || this.destroyed) return;
    this.entrancePlayed = true;

    if (this.fallbackTimer) {
      clearTimeout(this.fallbackTimer);
      this.fallbackTimer = null;
    }

    const hero = this.heroSectionRef?.nativeElement;
    if (!hero) return;

    this.zone.runOutsideAngular(() => {
      const bgTypography = hero.querySelector('.hero-bg-typography') as HTMLElement;
      const salutation = hero.querySelector('.hero-salutation') as HTMLElement;
      const salutationLine = hero.querySelector('.salutation-line') as HTMLElement;
      const nameChars = hero.querySelectorAll('.hero-name-char');
      const titleAngular = hero.querySelector('.hero-title-word--angular') as HTMLElement;
      const titleSep = hero.querySelector('.hero-title-sep') as HTMLElement;
      const titleFrontend = hero.querySelector('.hero-title-word--frontend') as HTMLElement;
      const titleDeveloper = hero.querySelector('.hero-title-word--developer') as HTMLElement;
      const separator = hero.querySelector('.gold-separator') as HTMLElement;
      const descWords = hero.querySelectorAll('.hero-desc-word');
      const btnPrimary = hero.querySelector('.btn-primary') as HTMLElement;
      const btnTalk = hero.querySelector('.btn-talk') as HTMLElement;
      const statusPill = hero.querySelector('.hero-status-pill') as HTMLElement;
      const socialLinks = hero.querySelectorAll('.social-link');
      const editorialBadge = (hero.querySelector('.hero-stats-row') || hero.querySelector('.hero-editorial-badge')) as HTMLElement;
      const scrollIndicator = hero.querySelector('.hero-scroll') as HTMLElement;

      const titleElements = [titleAngular, titleSep, titleFrontend, titleDeveloper].filter(Boolean);

      // Check user reduced motion preference
      const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        gsap.set(
          [bgTypography, salutation, salutationLine, ...Array.from(nameChars), ...titleElements, separator, ...Array.from(descWords), btnPrimary, btnTalk, statusPill, ...Array.from(socialLinks), editorialBadge, scrollIndicator],
          { opacity: 1, x: 0, y: 0, scale: 1, scaleX: 1, filter: 'none', clearProps: 'transform,filter,opacity' }
        );
        return;
      }

      // Initial state: hidden with smooth slide-up offsets
      if (bgTypography) gsap.set(bgTypography, { opacity: 0, scale: 0.95 });
      if (salutation) gsap.set(salutation, { opacity: 0, y: 15 });
      if (salutationLine) gsap.set(salutationLine, { scaleX: 0, transformOrigin: 'left center', opacity: 0 });
      gsap.set(nameChars, { opacity: 0, y: 28, filter: 'blur(6px)' });
      gsap.set(titleElements, { opacity: 0, y: 18 });
      if (separator) gsap.set(separator, { scaleX: 0, transformOrigin: 'left center', opacity: 0 });
      gsap.set(descWords, { opacity: 0, y: 14, filter: 'blur(3px)' });
      gsap.set([btnPrimary, btnTalk].filter(Boolean), { opacity: 0, y: 18, scale: 0.96 });
      if (statusPill) gsap.set(statusPill, { opacity: 0, y: 12 });
      if (socialLinks.length) gsap.set(socialLinks, { opacity: 0, y: 12 });
      if (editorialBadge) gsap.set(editorialBadge, { opacity: 0, x: 20 });
      if (scrollIndicator) gsap.set(scrollIndicator, { opacity: 0, y: 12 });

      this.entranceTimeline = gsap.timeline({
        onComplete: () => {
          gsap.set(
            [salutation, salutationLine, ...Array.from(nameChars), ...titleElements, separator, ...Array.from(descWords), btnPrimary, btnTalk, statusPill, ...Array.from(socialLinks), editorialBadge, scrollIndicator],
            { clearProps: 'transform,filter' }
          );
        }
      });

      // 0.0s: Background PORTFOLIO typography depth reveal
      if (bgTypography) {
        this.entranceTimeline.to(bgTypography, {
          opacity: 0.85,
          scale: 1,
          duration: 1.2,
          ease: 'power2.out'
        }, 0.05);
      }

      // 0.1s: Salutation greeting
      if (salutation) {
        this.entranceTimeline.to(salutation, {
          opacity: 1,
          y: 0,
          duration: 0.55,
          ease: 'power3.out'
        }, 0.1);
      }

      if (salutationLine) {
        this.entranceTimeline.to(salutationLine, {
          scaleX: 1,
          opacity: 1,
          duration: 0.5,
          ease: 'power2.out'
        }, 0.15);
      }

      // 0.3s: Letter-by-letter reveal for RAMUMANIMEHALAI
      this.entranceTimeline.to(nameChars, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.65,
        stagger: 0.035,
        ease: 'power3.out'
      }, 0.3);

      // 0.85s: Title words slide-up
      if (titleElements.length) {
        this.entranceTimeline.to(titleElements, {
          opacity: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.08,
          ease: 'power3.out'
        }, 0.85);
      }

      // 1.2s: Gold separator expands
      if (separator) {
        this.entranceTimeline.to(separator, {
          scaleX: 1,
          opacity: 1,
          duration: 0.6,
          ease: 'power2.inOut'
        }, 1.2);
      }

      // 1.4s: Description words staggered reveal
      if (descWords.length) {
        this.entranceTimeline.to(descWords, {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.45,
          stagger: 0.03,
          ease: 'power2.out'
        }, 1.4);
      }

      // 1.9s: Action buttons
      const buttons = [btnPrimary, btnTalk].filter(Boolean);
      if (buttons.length) {
        this.entranceTimeline.to(buttons, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.55,
          stagger: 0.1,
          ease: 'power3.out'
        }, 1.9);
      }

      // 2.1s: Meta row (status pill + social links)
      if (statusPill) {
        this.entranceTimeline.to(statusPill, {
          opacity: 1,
          y: 0,
          duration: 0.45,
          ease: 'power2.out'
        }, 2.1);
      }

      if (socialLinks.length) {
        this.entranceTimeline.to(socialLinks, {
          opacity: 1,
          y: 0,
          duration: 0.45,
          stagger: 0.06,
          ease: 'power2.out'
        }, 2.18);
      }

      // 2.3s: Editorial badge (desktop)
      if (editorialBadge) {
        this.entranceTimeline.to(editorialBadge, {
          opacity: 1,
          x: 0,
          duration: 0.55,
          ease: 'power2.out'
        }, 2.3);
      }

      // 2.45s: Scroll indicator
      if (scrollIndicator) {
        this.entranceTimeline.to(scrollIndicator, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out'
        }, 2.45);
      }
    });
  }

  // ── Canvas & Scroller Initialization ────────────────────────────
  private initCanvasAndScroller(): void {
    const canvas = this.canvasRef?.nativeElement;
    const hero = this.heroSectionRef?.nativeElement;
    if (!canvas || !hero) return;

    this.ctx = canvas.getContext('2d', { alpha: true });
    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = 'high';
    }

    canvas.width = this.CANVAS_WIDTH;
    canvas.height = this.CANVAS_HEIGHT;

    // Check user reduced motion preference
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      this.loadSingleFrame(0).then(() => this.renderFrame(0));
      return;
    }

    // Load first frame immediately for instant presentation
    this.loadSingleFrame(0).then(() => {
      if (this.destroyed) return;
      this.renderFrame(0);
      this.setupScrollTrigger(hero);
      this.startRenderLoop();
      this.startProgressiveLoading();
    });
  }

  // ── Frame URL Generator ─────────────────────────────────────────
  private getFrameUrl(index: number): string {
    const frameNumber = index + 1;
    const padded = String(frameNumber).padStart(4, '0');
    return `/frames/frame_${padded}.webp`;
  }

  // ── Single Frame Loader ─────────────────────────────────────────
  private loadSingleFrame(index: number): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      if (this.images[index]) {
        resolve(this.images[index]!);
        return;
      }

      const img = new Image();
      img.src = this.getFrameUrl(index);
      img.onload = () => {
        if (this.destroyed) return;
        this.images[index] = img;
        this.loadedIndices.add(index);
        resolve(img);
      };
      img.onerror = () => reject();
    });
  }

  // ── Progressive Frame Loading Strategy ─────────────────────────
  private startProgressiveLoading(): void {
    // Phase 1: Critical head batch (frames 1 to 20) for immediate smooth scrub start
    const criticalBatch: Promise<HTMLImageElement>[] = [];
    for (let i = 1; i < Math.min(21, this.TOTAL_FRAMES); i++) {
      criticalBatch.push(this.loadSingleFrame(i).catch(() => null as any));
    }

    Promise.all(criticalBatch).then(() => {
      if (this.destroyed) return;

      // Phase 2: Keyframe scaffold (every 5th frame across duration)
      const scaffoldIndices: number[] = [];
      for (let i = 21; i < this.TOTAL_FRAMES; i += 5) {
        scaffoldIndices.push(i);
      }
      if (!scaffoldIndices.includes(this.TOTAL_FRAMES - 1)) {
        scaffoldIndices.push(this.TOTAL_FRAMES - 1);
      }

      const loadScaffoldBatch = async () => {
        for (const idx of scaffoldIndices) {
          if (this.destroyed) return;
          await this.loadSingleFrame(idx).catch(() => { });
        }

        // Phase 3: Fill remaining frames
        this.streamRemainingFrames();
      };

      loadScaffoldBatch();
    });
  }

  // ── Stream Remaining Frames in Batches ──────────────────────────
  private streamRemainingFrames(): void {
    const remainingIndices: number[] = [];
    for (let i = 0; i < this.TOTAL_FRAMES; i++) {
      if (!this.loadedIndices.has(i)) {
        remainingIndices.push(i);
      }
    }

    const CONCURRENCY = 6;
    let pointer = 0;

    const loadNext = () => {
      if (this.destroyed || pointer >= remainingIndices.length) return;

      const idx = remainingIndices[pointer++];
      this.loadSingleFrame(idx).then(() => {
        loadNext();
      }).catch(() => {
        loadNext();
      });
    };

    for (let c = 0; c < CONCURRENCY; c++) {
      loadNext();
    }
  }

  // ── GSAP ScrollTrigger Setup ────────────────────────────────────
  private setupScrollTrigger(hero: HTMLElement): void {
    if (this.scrollTriggerInstance) {
      this.scrollTriggerInstance.kill();
    }

    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 991;

    this.scrollTriggerInstance = ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: isMobile ? '+=120%' : '+=250%',
      scrub: true,
      pin: !isMobile,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (this.destroyed) return;
        // Map 0 to 1 directly to frame indexes (0 to TOTAL_FRAMES - 1)
        this.targetFrameIndex = Math.min(
          this.TOTAL_FRAMES - 1,
          Math.max(0, Math.round(self.progress * (this.TOTAL_FRAMES - 1)))
        );
      }
    });

    ScrollTrigger.refresh();
  }

  // ── 60FPS Render Loop with Controlled Interpolation ─────────────
  private startRenderLoop(): void {
    const render = () => {
      if (this.destroyed) return;

      const diff = this.targetFrameIndex - this.currentInterpolatedFrame;
      if (Math.abs(diff) > 0.05) {
        // Responsive lerp without noticeable lag
        this.currentInterpolatedFrame += diff * 0.32;
        const frameToRender = Math.round(this.currentInterpolatedFrame);

        if (frameToRender !== this.lastRenderedIndex) {
          this.renderFrame(frameToRender);
          this.lastRenderedIndex = frameToRender;
        }
      } else if (this.lastRenderedIndex !== this.targetFrameIndex) {
        this.currentInterpolatedFrame = this.targetFrameIndex;
        this.renderFrame(this.targetFrameIndex);
        this.lastRenderedIndex = this.targetFrameIndex;
      }

      this.rafId = requestAnimationFrame(render);
    };

    this.rafId = requestAnimationFrame(render);
  }

  // ── Render Frame on Canvas ──────────────────────────────────────
  private renderFrame(index: number): void {
    if (!this.ctx) return;

    const img = this.images[index] || this.findNearestLoadedFrame(index);
    if (img && img.complete && img.naturalWidth > 0) {
      // Clear canvas with studio pure black
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);

      // Preserve the complete video frame without cropping or stretching
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const canvasRatio = this.CANVAS_WIDTH / this.CANVAS_HEIGHT;

      if (Math.abs(imgRatio - canvasRatio) < 0.002) {
        this.ctx.drawImage(img, 0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
      } else if (imgRatio > canvasRatio) {
        const drawHeight = this.CANVAS_WIDTH / imgRatio;
        const drawY = (this.CANVAS_HEIGHT - drawHeight) / 2;
        this.ctx.drawImage(img, 0, drawY, this.CANVAS_WIDTH, drawHeight);
      } else {
        const drawWidth = this.CANVAS_HEIGHT * imgRatio;
        const drawX = (this.CANVAS_WIDTH - drawWidth) / 2;
        this.ctx.drawImage(img, drawX, 0, drawWidth, this.CANVAS_HEIGHT);
      }
    }
  }

  // ── Nearest Frame Fallback (Zero Blanking) ──────────────────────
  private findNearestLoadedFrame(index: number): HTMLImageElement | null {
    if (this.loadedIndices.size === 0) return null;
    if (this.images[index]) return this.images[index];

    for (let offset = 1; offset < this.TOTAL_FRAMES; offset++) {
      const left = index - offset;
      if (left >= 0 && this.images[left]) return this.images[left];

      const right = index + offset;
      if (right < this.TOTAL_FRAMES && this.images[right]) return this.images[right];
    }

    return null;
  }

  // ── Talk Video Initialization ───────────────────────────────────
  private initTalkVideo(): void {
    const talk = this.talkVideoRef?.nativeElement;
    if (!talk) return;

    talk.preload = 'auto';
    talk.load();

    this.talkEndedHandler = () => {
      this.zone.run(() => {
        this.isTalkPlaying = false;
        this.talkButtonLabel = 'REPLAY INTRODUCTION';
      });

      // Ensure canvas immediately displays the current scroll frame seamlessly
      this.zone.runOutsideAngular(() => {
        this.renderFrame(this.lastRenderedIndex >= 0 ? this.lastRenderedIndex : 0);
      });
    };

    talk.addEventListener('ended', this.talkEndedHandler);
  }

  // ── Talk Button Click Handler ───────────────────────────────────
  onTalkButtonClick(): void {
    if (this.isTalkPlaying) return;
    this.startTalkVideo();
  }

  // ── Start Talk Video ────────────────────────────────────────────
  private startTalkVideo(): void {
    const talk = this.talkVideoRef?.nativeElement;
    if (!talk) return;

    this.talkButtonLabel = 'STARTING...';
    talk.currentTime = 0;
    talk.muted = false;
    talk.playbackRate = 1.0;

    // Listen for the first frame playing before hiding canvas
    talk.addEventListener('playing', () => {
      this.zone.run(() => {
        this.isTalkPlaying = true;
        this.talkButtonLabel = 'LISTENING...';
      });
    }, { once: true });

    talk.play().catch(err => {
      console.warn('Playback error on talk video:', err);
      talk.muted = true;
      talk.play().catch(() => {
        this.zone.run(() => {
          this.isTalkPlaying = false;
          this.talkButtonLabel = 'TALK TO ME';
        });
      });
    });
  }

  // ── Smooth Scroll Navigation ────────────────────────────────────
  scrollTo(sectionId: string, event: Event): void {
    event.preventDefault();
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
