import {
  Component, ElementRef, ViewChild,
  AfterViewInit, OnDestroy, NgZone, Inject, PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface NameCharConfig {
  char: string;
  dir: 'left' | 'right' | 'top' | 'bottom';
  startX: number;
  startY: number;
  rotation: number;
}

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

  // ── Cinematic Multi-Directional Name Characters (15 letters) ────
  readonly nameCharacters: NameCharConfig[] = [
    { char: 'R', dir: 'left', startX: -130, startY: -15, rotation: -16 },
    { char: 'A', dir: 'top', startX: 12, startY: -90, rotation: 14 },
    { char: 'M', dir: 'bottom', startX: -16, startY: 90, rotation: -12 },
    { char: 'U', dir: 'right', startX: 120, startY: 12, rotation: 15 },
    { char: 'M', dir: 'top', startX: -12, startY: -100, rotation: -14 },
    { char: 'A', dir: 'bottom', startX: 16, startY: 85, rotation: 12 },
    { char: 'N', dir: 'left', startX: -115, startY: 10, rotation: -14 },
    { char: 'I', dir: 'top', startX: 0, startY: -110, rotation: 8 },
    { char: 'M', dir: 'right', startX: 130, startY: -16, rotation: 16 },
    { char: 'E', dir: 'bottom', startX: -12, startY: 95, rotation: -12 },
    { char: 'H', dir: 'top', startX: 14, startY: -90, rotation: 12 },
    { char: 'A', dir: 'left', startX: -120, startY: -12, rotation: -15 },
    { char: 'L', dir: 'bottom', startX: 12, startY: 90, rotation: 12 },
    { char: 'A', dir: 'right', startX: 125, startY: 14, rotation: 16 },
    { char: 'I', dir: 'top', startX: -6, startY: -100, rotation: -8 }
  ];

  // ── Word-Level Staggered Description ────────────────────────────
  readonly descWords: string[] = [
    '"I', 'build', 'modern,', 'responsive,', 'and', 'user-friendly',
    'web', 'experiences', 'with', 'clean', 'code', 'and', 'thoughtful', 'design."'
  ];

  // ── Frame Sequence Constants ───────────────────────────────────
  // Skip the turning animation (frames 1–69) and begin directly from straight-walking pose (frame 70)
  readonly START_FRAME = 70;
  readonly END_FRAME = 580;
  readonly TOTAL_FRAMES = 580 - 70 + 1; // 511 frames
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

  constructor(
    private zone: NgZone,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    // Run canvas initialization outside Angular zone for max 60-120fps performance
    this.zone.runOutsideAngular(() => {
      this.initCanvasAndScroller();

      // Pre-position animated elements to prevent initial visual flash
      requestAnimationFrame(() => {
        this.prepareElementsForEntrance();
      });
    });

    this.initTalkVideo();

    // Fallback safety: If intro doesn't trigger entrance within 7.5s, play automatically
    this.fallbackTimer = setTimeout(() => {
      if (!this.entrancePlayed) {
        this.playCinematicEntrance();
      }
    }, 7500);
  }

  ngOnDestroy(): void {
    this.destroyed = true;

    if (this.fallbackTimer) {
      clearTimeout(this.fallbackTimer);
      this.fallbackTimer = null;
    }

    if (this.entranceTimeline) {
      this.entranceTimeline.kill();
      this.entranceTimeline = null;
    }

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.scrollTriggerInstance) {
      this.scrollTriggerInstance.kill();
      this.scrollTriggerInstance = null;
    }

    const talkVideo = this.talkVideoRef?.nativeElement;
    if (talkVideo && this.talkEndedHandler) {
      talkVideo.removeEventListener('ended', this.talkEndedHandler);
      talkVideo.pause();
    }

    this.images.length = 0;
    this.loadedIndices.clear();
  }

  // ── Prepare Elements Initial Hidden State ───────────────────────
  private prepareElementsForEntrance(): void {
    const hero = this.heroSectionRef?.nativeElement;
    if (!hero) return;

    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      this.showStaticElements();
      return;
    }

    const salutation = hero.querySelector('.hero-salutation');
    const salutationLine = hero.querySelector('.salutation-line');
    const nameChars = hero.querySelectorAll<HTMLElement>('.hero-name-char');
    const titleAngular = hero.querySelector<HTMLElement>('.hero-title-word--angular');
    const titleSep = hero.querySelector<HTMLElement>('.hero-title-sep');
    const titleFrontend = hero.querySelector<HTMLElement>('.hero-title-word--frontend');
    const titleDeveloper = hero.querySelector<HTMLElement>('.hero-title-word--developer');
    const separator = hero.querySelector<HTMLElement>('.gold-separator');
    const descWords = hero.querySelectorAll<HTMLElement>('.hero-desc-word');
    const btnPrimary = hero.querySelector<HTMLElement>('.btn-primary');
    const btnTalk = hero.querySelector<HTMLElement>('.btn-talk');
    const socialLinks = hero.querySelectorAll<HTMLElement>('.hero-socials .social-link');
    const scrollIndicator = hero.querySelector<HTMLElement>('.hero-scroll');

    // Salutation
    if (salutation) gsap.set(salutation, { opacity: 0, x: -30 });
    if (salutationLine) gsap.set(salutationLine, { scaleX: 0, opacity: 0 });

    // Name characters: multi-directional flying start points
    nameChars.forEach((el, idx) => {
      const cfg = this.nameCharacters[idx] || { startX: 0, startY: 30, rotation: 0 };
      gsap.set(el, {
        x: cfg.startX,
        y: cfg.startY,
        rotation: cfg.rotation,
        opacity: 0,
        scale: 0.85,
        filter: 'blur(8px)'
      });
    });

    // Title words (Angular/Frontend left, Developer right)
    if (titleAngular) gsap.set(titleAngular, { x: -65, opacity: 0, scale: 0.94, filter: 'blur(6px)' });
    if (titleSep) gsap.set(titleSep, { scale: 0.3, opacity: 0 });
    if (titleFrontend) gsap.set(titleFrontend, { x: -55, opacity: 0, scale: 0.94, filter: 'blur(6px)' });
    if (titleDeveloper) gsap.set(titleDeveloper, { x: 65, opacity: 0, scale: 0.94, filter: 'blur(6px)' });
    if (separator) gsap.set(separator, { scaleX: 0, opacity: 0 });

    // Description words (alternating bottom & left)
    descWords.forEach((word, idx) => {
      const isEven = idx % 2 === 0;
      gsap.set(word, {
        y: isEven ? 22 : 0,
        x: isEven ? 0 : -18,
        opacity: 0,
        filter: 'blur(4px)'
      });
    });

    // Buttons & Socials
    if (btnPrimary) gsap.set(btnPrimary, { y: 28, opacity: 0, scale: 0.94 });
    if (btnTalk) gsap.set(btnTalk, { y: 28, opacity: 0, scale: 0.94 });
    if (socialLinks.length) gsap.set(socialLinks, { y: 20, opacity: 0, scale: 0.9 });
    if (scrollIndicator) gsap.set(scrollIndicator, { y: 15, opacity: 0 });
  }

  // ── Show Static Elements (Reduced Motion or Instant Fallback) ──
  private showStaticElements(): void {
    const hero = this.heroSectionRef?.nativeElement;
    if (!hero) return;

    const allAnimated = hero.querySelectorAll(
      '.hero-salutation, .salutation-line, .hero-name-char, .hero-title-word, .hero-title-sep, .gold-separator, .hero-desc-word, .btn-primary, .btn-talk, .social-link, .hero-scroll'
    );
    gsap.set(allAnimated, {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      filter: 'none',
      clearProps: 'all'
    });
  }

  // ── Play Cinematic Advanced Text Entrance Timeline ──────────────
  playCinematicEntrance(): void {
    if (this.entrancePlayed || this.destroyed || !this.isBrowser) return;
    this.entrancePlayed = true;

    if (this.fallbackTimer) {
      clearTimeout(this.fallbackTimer);
      this.fallbackTimer = null;
    }

    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      this.showStaticElements();
      return;
    }

    const hero = this.heroSectionRef?.nativeElement;
    if (!hero) return;

    this.zone.runOutsideAngular(() => {
      const salutation = hero.querySelector('.hero-salutation');
      const salutationLine = hero.querySelector('.salutation-line');
      const nameChars = hero.querySelectorAll<HTMLElement>('.hero-name-char');
      const titleAngular = hero.querySelector<HTMLElement>('.hero-title-word--angular');
      const titleSep = hero.querySelector<HTMLElement>('.hero-title-sep');
      const titleFrontend = hero.querySelector<HTMLElement>('.hero-title-word--frontend');
      const titleDeveloper = hero.querySelector<HTMLElement>('.hero-title-word--developer');
      const separator = hero.querySelector<HTMLElement>('.gold-separator');
      const descWords = hero.querySelectorAll<HTMLElement>('.hero-desc-word');
      const btnPrimary = hero.querySelector<HTMLElement>('.btn-primary');
      const btnTalk = hero.querySelector<HTMLElement>('.btn-talk');
      const socialLinks = hero.querySelectorAll<HTMLElement>('.hero-socials .social-link');
      const scrollIndicator = hero.querySelector<HTMLElement>('.hero-scroll');

      this.entranceTimeline = gsap.timeline({
        onComplete: () => {
          // Clear animation transform props to guarantee 100% crisp CSS hover and subpixel rendering
          gsap.set(
            [salutation, salutationLine, ...Array.from(nameChars), titleAngular, titleSep, titleFrontend, titleDeveloper, separator, ...Array.from(descWords), btnPrimary, btnTalk, ...Array.from(socialLinks), scrollIndicator],
            { clearProps: 'transform,filter,opacity' }
          );
        }
      });

      // ── 0.0 – 0.5s: Hero Background & Salutation Appear ──────────
      if (salutation) {
        this.entranceTimeline.to(salutation, {
          opacity: 1,
          x: 0,
          duration: 0.6,
          ease: 'power2.out'
        }, 0.2);
      }

      if (salutationLine) {
        this.entranceTimeline.to(salutationLine, {
          scaleX: 1,
          opacity: 1,
          duration: 0.5,
          ease: 'power2.out'
        }, 0.25);
      }

      // ── 0.5 – 1.5s: Name Flies In Character by Character ─────────
      // Entering from Left, Right, Top, and Bottom with subtle rotation
      nameChars.forEach((charEl, idx) => {
        this.entranceTimeline!.to(charEl, {
          x: 0,
          y: 0,
          rotation: 0,
          opacity: 1,
          scale: 1,
          filter: 'blur(0px)',
          duration: 0.85,
          ease: 'power3.out'
        }, 0.5 + idx * 0.045);
      });

      // ── 1.5 – 2.2s: Professional Title Multi-Directional Entry ────
      if (titleAngular) {
        this.entranceTimeline.to(titleAngular, {
          x: 0,
          opacity: 1,
          scale: 1,
          filter: 'blur(0px)',
          duration: 0.68,
          ease: 'power2.out'
        }, 1.5);
      }

      if (titleSep) {
        this.entranceTimeline.to(titleSep, {
          scale: 1,
          opacity: 1,
          duration: 0.4,
          ease: 'back.out(2)'
        }, 1.6);
      }

      if (titleFrontend) {
        this.entranceTimeline.to(titleFrontend, {
          x: 0,
          opacity: 1,
          scale: 1,
          filter: 'blur(0px)',
          duration: 0.68,
          ease: 'power2.out'
        }, 1.65);
      }

      if (titleDeveloper) {
        this.entranceTimeline.to(titleDeveloper, {
          x: 0,
          opacity: 1,
          scale: 1,
          filter: 'blur(0px)',
          duration: 0.72,
          ease: 'power2.out'
        }, 1.75);
      }

      if (separator) {
        this.entranceTimeline.to(separator, {
          scaleX: 1,
          opacity: 1,
          duration: 0.55,
          ease: 'power2.out'
        }, 1.85);
      }

      // ── 2.2 – 3.2s: Description Word-by-Word Staggered Reveal ────
      descWords.forEach((wordEl, idx) => {
        this.entranceTimeline!.to(wordEl, {
          x: 0,
          y: 0,
          opacity: 1,
          filter: 'blur(0px)',
          duration: 0.55,
          ease: 'power2.out'
        }, 2.2 + idx * 0.045);
      });

      // ── 3.2 – 4.0s: Action Buttons & Social Icons Animate In ──────
      if (btnPrimary) {
        this.entranceTimeline.to(btnPrimary, {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.65,
          ease: 'back.out(1.5)'
        }, 3.2);
      }

      if (btnTalk) {
        this.entranceTimeline.to(btnTalk, {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.65,
          ease: 'back.out(1.5)'
        }, 3.35);
      }

      if (socialLinks.length) {
        this.entranceTimeline.to(socialLinks, {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power2.out'
        }, 3.55);
      }

      // ── 4.0 – 4.5s: Final Subtle Settling & Scroll Indicator ──────
      if (scrollIndicator) {
        this.entranceTimeline.to(scrollIndicator, {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out'
        }, 3.9);
      }
    });
  }

  // ── Canvas & Scroller Initialization ────────────────────────────
  private initCanvasAndScroller(): void {
    const canvas = this.canvasRef?.nativeElement;
    const hero = this.heroSectionRef?.nativeElement;
    if (!canvas || !hero) return;

    // Use alpha: false for direct GPU blitting without transparency overhead
    this.ctx = canvas.getContext('2d', { alpha: false });
    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = 'high';
    }

    canvas.width = this.CANVAS_WIDTH;
    canvas.height = this.CANVAS_HEIGHT;

    // Check for user reduced motion preference
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
    const frameNumber = this.START_FRAME + index;
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
    // Phase 1: Critical head batch (frames 1 to 24) for immediate smooth scroll start
    const criticalBatch: Promise<HTMLImageElement>[] = [];
    for (let i = 1; i < Math.min(25, this.TOTAL_FRAMES); i++) {
      criticalBatch.push(this.loadSingleFrame(i).catch(() => null as any));
    }

    Promise.all(criticalBatch).then(() => {
      if (this.destroyed) return;

      // Phase 2: Keyframe timeline scaffold (every 10th frame across entire duration)
      const scaffoldIndices: number[] = [];
      for (let i = 25; i < this.TOTAL_FRAMES; i += 10) {
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

        // Phase 3: Fill remaining intermediate frames progressively
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

    this.scrollTriggerInstance = ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: '+=300%',
      scrub: true,
      pin: true,
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
        this.currentInterpolatedFrame += diff * 0.28;
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

      // Preserve the complete video frame without any cropping or stretching
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

    // Listen for the first frame actually playing before hiding canvas (prevents black flash)
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
