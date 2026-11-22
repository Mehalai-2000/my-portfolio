import {
  Component, ElementRef, ViewChild,
  AfterViewInit, OnDestroy, NgZone, Output, EventEmitter, Inject, PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';

interface LetterData {
  char: string;
  id: string;
  targetSlotIndex?: number;
}

@Component({
  selector: 'app-intro',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './intro.component.html',
  styleUrl: './intro.component.css'
})
export class IntroComponent implements AfterViewInit, OnDestroy {

  @ViewChild('introOverlay') overlayRef!: ElementRef<HTMLElement>;
  @ViewChild('nameContainer') nameContainerRef!: ElementRef<HTMLElement>;
  @ViewChild('portfolioContainer') portfolioContainerRef!: ElementRef<HTMLElement>;
  @ViewChild('ambientAura') auraRef!: ElementRef<HTMLElement>;
  @ViewChild('metaPill') metaPillRef?: ElementRef<HTMLElement>;
  @ViewChild('subtext') subtextRef?: ElementRef<HTMLElement>;
  @ViewChild('impactRing') impactRingRef?: ElementRef<HTMLElement>;

  @Output() introComplete = new EventEmitter<void>();

  private isBrowser: boolean;
  private timeline: gsap.core.Timeline | null = null;
  private isSkipped = false;
  isFinished = false;
  private introEmitted = false;

  private emitIntroComplete(): void {
    if (this.introEmitted) return;
    this.introEmitted = true;
    this.zone.run(() => {
      this.introComplete.emit();
    });
  }

  // The Initial Name: RAMUMANIMEHALAI (15 letters)
  readonly nameLetters: LetterData[] = [
    { char: 'R', id: 'n-0', targetSlotIndex: 2 }, // Direct match: 'R' in PORTFOLIO
    { char: 'A', id: 'n-1' },                      // Detaches & tumbles down
    { char: 'M', id: 'n-2' },                      // Detaches & tumbles down
    { char: 'U', id: 'n-3' },                      // Detaches & tumbles down
    { char: 'M', id: 'n-4' },                      // Detaches & tumbles down
    { char: 'A', id: 'n-5' },                      // Detaches & tumbles down
    { char: 'N', id: 'n-6' },                      // Detaches & tumbles down
    { char: 'I', id: 'n-7', targetSlotIndex: 7 }, // The Signature Drop: 'I' in PORTFOLIO
    { char: 'M', id: 'n-8' },                      // Detaches & tumbles down
    { char: 'E', id: 'n-9' },                      // Detaches & tumbles down
    { char: 'H', id: 'n-10' },                     // Detaches & tumbles down
    { char: 'A', id: 'n-11' },                     // Detaches & tumbles down
    { char: 'L', id: 'n-12', targetSlotIndex: 6 }, // Direct match: 'L' in PORTFOLIO
    { char: 'A', id: 'n-13' },                     // Detaches & tumbles down
    { char: 'I', id: 'n-14' }                      // Detaches & tumbles down
  ];

  // The Target Word: PORTFOLIO (9 letters)
  readonly portfolioLetters: LetterData[] = [
    { char: 'P', id: 'p-0' }, // Index 0: Drops in from top
    { char: 'O', id: 'p-1' }, // Index 1: Drops in from top
    { char: 'R', id: 'p-2' }, // Index 2: Arrives from source 'R'
    { char: 'T', id: 'p-3' }, // Index 3: Drops straight down with heavy impact
    { char: 'F', id: 'p-4' }, // Index 4: Drops in from top
    { char: 'O', id: 'p-5' }, // Index 5: Drops in from top
    { char: 'L', id: 'p-6' }, // Index 6: Arrives from source 'L'
    { char: 'I', id: 'p-7' }, // Index 7: High-altitude vertical drop & landing rebound
    { char: 'O', id: 'p-8' }  // Index 8: Drops in from top-right
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
      // Ensure layout and fonts have completed rendering
      requestAnimationFrame(() => {
        setTimeout(() => {
          this.runCinematicSequence();
        }, 80);
      });
    });
  }

  ngOnDestroy(): void {
    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }
  }

  skipIntro(): void {
    if (this.isSkipped || this.isFinished) return;
    this.isSkipped = true;

    if (this.timeline) {
      this.timeline.timeScale(4);
    }
  }

  private runCinematicSequence(): void {
    const overlay = this.overlayRef?.nativeElement;
    const nameCont = this.nameContainerRef?.nativeElement;
    const portCont = this.portfolioContainerRef?.nativeElement;
    const aura = this.auraRef?.nativeElement;
    const metaPill = this.metaPillRef?.nativeElement;
    const subtext = this.subtextRef?.nativeElement;
    const impactRing = this.impactRingRef?.nativeElement;

    if (!overlay || !nameCont || !portCont) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      this.finishIntro();
      return;
    }

    const nameSpans = Array.from(nameCont.querySelectorAll<HTMLElement>('.name-char'));
    const portSpans = Array.from(portCont.querySelectorAll<HTMLElement>('.port-char'));

    // Initial styling states
    gsap.set(portSpans, { opacity: 0 });
    gsap.set(nameSpans, { opacity: 0, y: 35, filter: 'blur(8px)', scale: 0.95 });
    if (metaPill) gsap.set(metaPill, { opacity: 0, y: -15 });
    if (subtext) gsap.set(subtext, { opacity: 0, y: 15 });

    // Calculate physical relative coordinate deltas
    const rSource = nameSpans[0];   // 'R'
    const rTarget = portSpans[2];   // 'R' in PORTFOLIO
    const rSRect = rSource.getBoundingClientRect();
    const rTRect = rTarget.getBoundingClientRect();
    const rDx = rTRect.left - rSRect.left;
    const rDy = rTRect.top - rSRect.top;

    const lSource = nameSpans[12];  // 'L'
    const lTarget = portSpans[6];   // 'L' in PORTFOLIO
    const lSRect = lSource.getBoundingClientRect();
    const lTRect = lTarget.getBoundingClientRect();
    const lDx = lTRect.left - lSRect.left;
    const lDy = lTRect.top - lSRect.top;

    const iSource = nameSpans[7];   // 'I'
    const iTarget = portSpans[7];   // 'I' in PORTFOLIO
    const iSRect = iSource.getBoundingClientRect();
    const iTRect = iTarget.getBoundingClientRect();
    const iDx = iTRect.left - iSRect.left;
    const iDy = iTRect.top - iSRect.top;

    // Dispersing non-matching character elements
    const dispersingIndices = [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 13, 14];
    const dispersingSpans = dispersingIndices.map(idx => nameSpans[idx]);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // MASTER CINEMATIC TIMELINE (Total: ~4.6s)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    this.timeline = gsap.timeline({
      onComplete: () => {
        this.finishIntro();
      }
    });

    // ── STEP 1: Name Reveal (0.0s – 1.0s) ──────────────────────────────
    this.timeline.to(nameSpans, {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      duration: 0.8,
      stagger: 0.04,
      ease: 'power3.out'
    }, 0.0);

    if (metaPill) {
      this.timeline.to(metaPill, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power2.out'
      }, 0.2);
    }

    if (subtext) {
      this.timeline.to(subtext, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power2.out'
      }, 0.3);
    }

    if (aura) {
      this.timeline.to(aura, {
        opacity: 0.65,
        scale: 1.15,
        duration: 1.2,
        ease: 'power2.out'
      }, 0.2);
    }

    // ── STEP 2: Hold & Pre-Break Anticipation (1.0s – 1.4s) ────────────
    // Letters hold calmly in place

    // ── STEP 3: Letters Detach & Kinetic Motion (1.4s – 2.8s) ───────────

    // A) Non-matching letters lift slightly, then tumble downward under gravity
    dispersingSpans.forEach((span, i) => {
      const upwardHop = -12 - (i % 3) * 6; // -12 to -24px
      const tumbleY = 240 + (i % 4) * 35; // 240 to 345px down
      const tumbleRot = (i % 2 === 0 ? 1 : -1) * (20 + (i * 4) % 25); // -40deg to +40deg
      const tumbleX = (i % 2 === 0 ? 1 : -1) * (15 + (i * 3) % 30);

      // Micro-lift
      this.timeline!.to(span, {
        y: upwardHop,
        duration: 0.18,
        ease: 'power1.out'
      }, 1.4 + (i * 0.02));

      // Gravity tumble downwards
      this.timeline!.to(span, {
        y: tumbleY,
        x: tumbleX,
        rotation: tumbleRot,
        opacity: 0,
        scale: 0.55,
        filter: 'blur(6px)',
        duration: 0.75,
        ease: 'power2.in'
      }, 1.58 + (i * 0.02));
    });

    // B) Matching Letter 'R' (Index 0 -> PORTFOLIO[2])
    // Detaches, lifts, tilts, slides across, lands with overshoot bounce
    this.timeline.to(rSource, {
      y: -28,
      rotation: -10,
      duration: 0.25,
      ease: 'power2.out'
    }, 1.45);

    this.timeline.to(rSource, {
      x: rDx,
      y: rDy,
      rotation: 0,
      duration: 1.1,
      ease: 'back.out(1.4)'
    }, 1.7);

    // Switch to target crisp element
    this.timeline.to(rTarget, { opacity: 1, duration: 0.1 }, 2.75);
    this.timeline.to(rSource, { opacity: 0, duration: 0.1 }, 2.75);

    // C) Matching Letter 'L' (Index 12 -> PORTFOLIO[6])
    // Detaches, lifts, tilts, slides left across, lands with overshoot bounce
    this.timeline.to(lSource, {
      y: -24,
      rotation: 8,
      duration: 0.25,
      ease: 'power2.out'
    }, 1.5);

    this.timeline.to(lSource, {
      x: lDx,
      y: lDy,
      rotation: 0,
      duration: 1.05,
      ease: 'back.out(1.4)'
    }, 1.75);

    // Switch to target crisp element
    this.timeline.to(lTarget, { opacity: 1, duration: 0.1 }, 2.75);
    this.timeline.to(lSource, { opacity: 0, duration: 0.1 }, 2.75);

    // D) ★ THE SIGNATURE FALLING "I" EFFECT (Index 7 -> PORTFOLIO[7]) ★
    // 1. Launches HIGH up into the sky above the word stage
    this.timeline.to(iSource, {
      y: -280,
      x: iDx,
      rotation: -6,
      scale: 1.15,
      duration: 0.52,
      ease: 'power2.out'
    }, 1.4);

    // 2. Zenith hold for 0.12s
    // 3. PLUMMETS STRAIGHT DOWN UNDER GRAVITY ACCELERATION
    this.timeline.to(iSource, {
      y: iDy,
      rotation: 0,
      scale: 1,
      duration: 0.42,
      ease: 'power3.in'
    }, 2.04);

    // 4. IMPACT REBOUND & SETTLE
    this.timeline.to(iSource, {
      y: iDy - 14,
      duration: 0.14,
      ease: 'power1.out'
    }, 2.46);

    this.timeline.to(iSource, {
      y: iDy,
      duration: 0.18,
      ease: 'bounce.out'
    }, 2.6);

    // 5. Impact flash ring expansion & target handoff
    if (impactRing) {
      this.timeline.fromTo(impactRing,
        { scale: 0.2, opacity: 1 },
        { scale: 2.8, opacity: 0, duration: 0.45, ease: 'power2.out' },
        2.46
      );
    }

    this.timeline.to(iTarget, { opacity: 1, duration: 0.1 }, 2.75);
    this.timeline.to(iSource, { opacity: 0, duration: 0.1 }, 2.75);

    // E) Target Word Incoming Letters: P, O, T, F, O, O
    // Each letter drops into place from above with gravity & bounce
    const incomingConfigs = [
      { span: portSpans[0], startY: -210, startX: -30, rot: -14, startTime: 1.85 }, // P
      { span: portSpans[1], startY: -240, startX: -10, rot: 12, startTime: 1.95 },  // O
      { span: portSpans[3], startY: -260, startX: 0, rot: -8, startTime: 2.0 },     // T (heavy drop)
      { span: portSpans[4], startY: -220, startX: 10, rot: 10, startTime: 2.1 },    // F
      { span: portSpans[5], startY: -250, startX: -15, rot: -12, startTime: 2.15 }, // O
      { span: portSpans[8], startY: -230, startX: 30, rot: 15, startTime: 2.2 }     // O
    ];

    incomingConfigs.forEach(cfg => {
      // Set initial drop position
      gsap.set(cfg.span, {
        y: cfg.startY,
        x: cfg.startX,
        rotation: cfg.rot,
        opacity: 0,
        scale: 0.9
      });

      // Gravity plunge & overshoot rebound
      this.timeline!.to(cfg.span, {
        y: 0,
        x: 0,
        rotation: 0,
        opacity: 1,
        scale: 1,
        duration: 0.65,
        ease: 'back.out(1.6)'
      }, cfg.startTime);
    });

    // ── STEP 4: Word Lock & Golden Flare Sweep (2.8s – 3.6s) ───────────
    // Subtle whole-word lock impact pulse
    this.timeline.to(portCont, {
      scale: 1.03,
      duration: 0.4,
      ease: 'power2.out'
    }, 2.8);

    this.timeline.to(portCont, {
      scale: 1.0,
      duration: 0.4,
      ease: 'power2.inOut'
    }, 3.2);

    // Golden light flare sweep across PORTFOLIO
    const flare = overlay.querySelector('.gold-flare-sweep');
    if (flare) {
      this.timeline.fromTo(flare,
        { left: '-25%', opacity: 0 },
        { left: '125%', opacity: 0.9, duration: 0.75, ease: 'power2.inOut' },
        2.85
      );
    }

    // ── STEP 5: Hold Word PORTFOLIO (3.6s – 4.2s) ──────────────────────
    // Viewer sees the final locked PORTFOLIO typography

    // ── STEP 6: Smooth Dissolve into Hero Section (4.2s – 4.9s) ────────
    this.timeline.to(overlay, {
        opacity: 0,
        scale: 1.06,
        filter: 'blur(6px)',
        duration: 0.75,
        ease: 'power2.inOut',
        onStart: () => {
          this.emitIntroComplete();
        }
      }, 4.2);
    }

  private finishIntro(): void {
    this.isFinished = true;
    if (this.overlayRef?.nativeElement) {
      this.overlayRef.nativeElement.style.display = 'none';
    }
    this.emitIntroComplete();
  }
}
