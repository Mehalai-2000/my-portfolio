import {
  Component, ElementRef, ViewChild,
  AfterViewInit, OnDestroy, NgZone, Output, EventEmitter, Inject, PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';

@Component({
  selector: 'app-intro',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './intro.component.html',
  styleUrl: './intro.component.css'
})
export class IntroComponent implements AfterViewInit, OnDestroy {

  @ViewChild('introOverlay') overlayRef!: ElementRef<HTMLElement>;
  @ViewChild('walkCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('titleStage') titleStageRef!: ElementRef<HTMLElement>;
  @ViewChild('eyebrowPill') eyebrowRef?: ElementRef<HTMLElement>;
  @ViewChild('nameContainer') nameContainerRef!: ElementRef<HTMLElement>;
  @ViewChild('roleContainer') roleContainerRef!: ElementRef<HTMLElement>;
  @ViewChild('goldFlare') goldFlareRef?: ElementRef<HTMLElement>;
  @ViewChild('ambientAura') auraRef?: ElementRef<HTMLElement>;

  @Output() introComplete = new EventEmitter<void>();

  // ── Name Characters for Individual Cinematic Reveal ─────────────
  readonly nameChars: string[] = [
    'R', 'A', 'M', 'U', 'M', 'A', 'N', 'I', 'M', 'E', 'H', 'A', 'L', 'A', 'I'
  ];

  // ── Frame Configuration: Straight Walking Sequence (Frames 70–142) ──
  // Skip turning (1–69). Start standing straight in center (70). Stop naturally (142).
  readonly START_FRAME = 70;
  readonly STOP_FRAME = 142;
  readonly TOTAL_FRAMES = 142 - 70 + 1; // 73 frames
  private readonly CANVAS_WIDTH = 1920;
  private readonly CANVAS_HEIGHT = 1080;

  // ── State Variables ─────────────────────────────────────────────
  private isBrowser: boolean;
  private timeline: gsap.core.Timeline | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private images: (HTMLImageElement | null)[] = new Array(this.TOTAL_FRAMES).fill(null);
  private loadedIndices = new Set<number>();
  private isSkipped = false;
  isFinished = false;
  private introEmitted = false;
  private lastDrawnFrame = -1;

  constructor(
    private zone: NgZone,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    this.zone.runOutsideAngular(() => {
      this.initCanvas();
      this.preloadAndStartSequence();
    });
  }

  ngOnDestroy(): void {
    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }
  }

  // ── Public Skip Method ──────────────────────────────────────────
  skipIntro(): void {
    if (this.isSkipped || this.isFinished) return;
    this.isSkipped = true;

    if (this.timeline) {
      // Speed up timeline gracefully so it quickly reaches the finish dissolve
      this.timeline.timeScale(4.5);
    } else {
      this.finishIntro();
    }
  }

  // ── Canvas Setup ────────────────────────────────────────────────
  private initCanvas(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    canvas.width = this.CANVAS_WIDTH;
    canvas.height = this.CANVAS_HEIGHT;

    this.ctx = canvas.getContext('2d', { alpha: false });
    if (this.ctx) {
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
    }
  }

  // ── Preload Walk Frames & Launch Sequence ────────────────────────
  private preloadAndStartSequence(): void {
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      this.finishIntro();
      return;
    }

    // Load initial frame (70) immediately to display character standing at a distance
    this.loadFrameImage(0).then(() => {
      this.drawFrame(this.START_FRAME);
    });

    // Load the remaining 72 walking frames in parallel
    const loadPromises: Promise<void>[] = [];
    for (let i = 0; i < this.TOTAL_FRAMES; i++) {
      loadPromises.push(this.loadFrameImage(i));
    }

    // Launch master cinematic sequence once initial buffer is ready
    Promise.all(loadPromises.slice(0, 15)).then(() => {
      requestAnimationFrame(() => {
        this.runCinematicWalkAndReveal();
      });
    });
  }

  // ── Load Single Frame ───────────────────────────────────────────
  private loadFrameImage(index: number): Promise<void> {
    return new Promise((resolve) => {
      const frameNum = this.START_FRAME + index;
      const padded = String(frameNum).padStart(4, '0');
      const img = new Image();

      img.src = `frames/frame_${padded}.webp`;
      img.onload = () => {
        this.images[index] = img;
        this.loadedIndices.add(index);
        resolve();
      };
      img.onerror = () => {
        resolve();
      };
    });
  }

  // ── Render Specific Frame onto Center Canvas ────────────────────
  private drawFrame(frameNumber: number): void {
    if (!this.ctx || frameNumber === this.lastDrawnFrame) return;

    const index = Math.min(this.TOTAL_FRAMES - 1, Math.max(0, frameNumber - this.START_FRAME));
    const img = this.images[index] || this.findNearestLoadedFrame(index);

    if (img && img.complete && img.naturalWidth > 0) {
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);

      // Frame 1920x1080 draws directly 1:1, perfectly centered and preserved
      this.ctx.drawImage(img, 0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
      this.lastDrawnFrame = frameNumber;
    }
  }

  // ── Fallback Frame Search ───────────────────────────────────────
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

  // ── Master Cinematic Walking and Reveal Sequence ────────────────
  private runCinematicWalkAndReveal(): void {
    const overlay = this.overlayRef?.nativeElement;
    const nameCont = this.nameContainerRef?.nativeElement;
    const roleCont = this.roleContainerRef?.nativeElement;
    const eyebrow = this.eyebrowRef?.nativeElement;
    const goldFlare = this.goldFlareRef?.nativeElement;
    const aura = this.auraRef?.nativeElement;

    if (!overlay || !nameCont || !roleCont) return;

    const charSpans = Array.from(nameCont.querySelectorAll<HTMLElement>('.intro-char'));
    const isMobile = window.innerWidth <= 768;

    // Proxy object for smooth frame interpolation
    const walkProxy = { frame: this.START_FRAME };

    // Initial state
    gsap.set(charSpans, { opacity: 0, y: 30, scale: 0.92, filter: 'blur(10px)' });
    gsap.set(roleCont, { opacity: 0, y: 18 });
    if (eyebrow) gsap.set(eyebrow, { opacity: 0, y: 12 });
    if (aura) gsap.set(aura, { opacity: 0.2, scale: 0.9 });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // MASTER CINEMATIC TIMELINE (Total: ~5.6s)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    this.timeline = gsap.timeline({
      onComplete: () => {
        this.finishIntro();
      }
    });

    // ── STEP 1: Ambient Lighting Fade-In (0.0s – 0.5s) ─────────────
    if (aura) {
      this.timeline.to(aura, {
        opacity: 0.5,
        scale: 1.1,
        duration: 1.5,
        ease: 'power2.out'
      }, 0.1);
    }

    // ── STEP 2: Cinematic Center Walk toward Camera (0.2s – 3.0s) ───
    // Animate from Frame 70 (standing straight at distance) to Frame 142 (stopping in center foreground)
    // power1.out creates a realistic human deceleration into the poised stop
    this.timeline.to(walkProxy, {
      frame: this.STOP_FRAME,
      duration: 2.8,
      ease: 'power1.out',
      onUpdate: () => {
        const currentFrame = Math.round(walkProxy.frame);
        this.drawFrame(currentFrame);
      }
    }, 0.2);

    // Ensure the final stop frame (142) is locked cleanly
    this.timeline.add(() => {
      this.drawFrame(this.STOP_FRAME);
    }, 3.0);

    // ── STEP 3: Sequential Golden Name Reveal (3.05s – 3.9s) ────────
    // Letters reveal sequentially with staggered upward motion & gold illumination
    this.timeline.to(charSpans, {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      duration: 0.7,
      stagger: 0.045,
      ease: 'power3.out'
    }, 3.05);

    if (eyebrow) {
      this.timeline.to(eyebrow, {
        opacity: 1,
        y: 0,
        duration: 0.65,
        ease: 'power2.out'
      }, 3.1);
    }

    // Golden flare sweep across typography
    if (goldFlare) {
      this.timeline.fromTo(goldFlare,
        { left: '-25%', opacity: 0 },
        { left: '125%', opacity: 0.9, duration: 0.85, ease: 'power2.inOut' },
        3.6
      );
    }

    // ── STEP 4: Cinematic Role Reveal (3.85s – 4.65s) ───────────────
    // "ANGULAR / FRONTEND DEVELOPER" reveals with letter-spacing expansion
    const targetTracking = isMobile ? '0.18em' : '0.42em';
    this.timeline.to(roleCont, {
      opacity: 1,
      y: 0,
      letterSpacing: targetTracking,
      duration: 0.8,
      ease: 'power2.out'
    }, 3.85);

    // ── STEP 5: Cinematic Hold (4.65s – 5.2s) ───────────────────────
    // Character and full name/role held poised in the center

    // ── STEP 6: Seamless Dissolve into Hero Section (5.2s – 5.9s) ────
    this.timeline.to(overlay, {
      opacity: 0,
      scale: 1.04,
      filter: 'blur(6px)',
      duration: 0.75,
      ease: 'power2.inOut',
      onStart: () => {
        // Trigger the Hero section text entrance right as the intro dissolves
        this.emitIntroComplete();
      }
    }, 5.2);
  }

  // ── Emit Completion Event ───────────────────────────────────────
  private emitIntroComplete(): void {
    if (this.introEmitted) return;
    this.introEmitted = true;
    this.zone.run(() => {
      this.introComplete.emit();
    });
  }

  // ── Finalize & Hide Intro ───────────────────────────────────────
  private finishIntro(): void {
    this.isFinished = true;
    if (this.overlayRef?.nativeElement) {
      this.overlayRef.nativeElement.style.display = 'none';
    }
    this.emitIntroComplete();
  }
}
