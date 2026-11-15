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

  // ── Frame Sequence Constants ───────────────────────────────────
  readonly TOTAL_FRAMES = 580;
  private readonly CANVAS_WIDTH = 1920;
  private readonly CANVAS_HEIGHT = 1080;

  // ── Internal Render & Preload State ─────────────────────────────
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

  constructor(private zone: NgZone) { }

  ngAfterViewInit(): void {
    // Run entirely outside Angular Zone to achieve 60-120fps with zero change detection overhead
    this.zone.runOutsideAngular(() => {
      this.initCanvasAndScroller();
    });

    this.initTalkVideo();
  }

  ngOnDestroy(): void {
    this.destroyed = true;

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
    const padded = String(index + 1).padStart(4, '0');
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
        if (this.destroyed || this.isTalkPlaying) return;
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

      if (!this.isTalkPlaying) {
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

    talk.muted = false;
    talk.playbackRate = 1.0;

    this.talkEndedHandler = () => {
      this.zone.run(() => {
        this.isTalkPlaying = false;
        this.talkButtonLabel = 'REPLAY INTRODUCTION';
      });

      // Ensure canvas re-renders the current scroll position
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

    this.isTalkPlaying = true;
    this.talkButtonLabel = 'LISTENING...';

    talk.currentTime = 0;
    talk.muted = false;
    talk.playbackRate = 1.0;

    talk.play().catch(err => {
      console.warn('Playback error on talk video:', err);
      talk.muted = true;
      talk.play().catch(() => { });
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
