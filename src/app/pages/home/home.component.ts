import {
  Component, ElementRef, ViewChild,
  AfterViewInit, OnDestroy, NgZone, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements AfterViewInit, OnDestroy {

  @ViewChild('mainVideo') mainVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('talkVideo') talkVideoRef!: ElementRef<HTMLVideoElement>;

  // ── Video & Audio States ───────────────────────────────────────
  showPlayHint = false;
  talkButtonLabel = 'TALK TO ME';
  isTalkPlaying = false;
  autoplayBlocked = false;

  private destroyed = false;

  constructor(private zone: NgZone) { }

  ngAfterViewInit(): void {
    this.initMainVideo();
    this.preloadTalkVideo();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.pauseAll();
  }

  // ── Main Video Sequence ────────────────────────────────────────
  private initMainVideo(): void {
    const v = this.mainVideoRef?.nativeElement;
    if (!v) return;

    v.muted = true;
    v.loop = false;
    v.preload = 'auto';
    v.playsInline = true;

    const onReady = () => {
      this.playMain();
    };

    if (v.readyState >= 2) {
      onReady();
    } else {
      v.addEventListener('loadeddata', onReady, { once: true });
    }

    // When the cinematic sequence finishes: freeze on the exact final seated frame
    v.addEventListener('ended', () => {
      this.zone.run(() => {
        this.showPlayHint = false;
        if (isFinite(v.duration) && v.duration > 0) {
          v.currentTime = Math.max(0, v.duration - 0.05);
        }
        v.pause();
      });
    });

    v.addEventListener('error', () => {
      this.zone.run(() => {
        this.showPlayHint = true;
      });
    });
  }

  private playMain(): void {
    const v = this.mainVideoRef?.nativeElement;
    if (!v) return;

    v.muted = true;
    const playPromise = v.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.zone.run(() => {
            this.autoplayBlocked = false;
            this.showPlayHint = false;
          });
        })
        .catch(() => {
          // If browser policy requires a user click to start
          this.zone.run(() => {
            this.autoplayBlocked = true;
            this.showPlayHint = true;
          });
        });
    }
  }

  onStageClick(): void {
    if (this.autoplayBlocked || this.showPlayHint) {
      this.autoplayBlocked = false;
      this.showPlayHint = false;
      this.playMain();
    }
  }

  // ── Talk To Me Video (with Audio) ──────────────────────────────
  private preloadTalkVideo(): void {
    const v = this.talkVideoRef?.nativeElement;
    if (!v) return;

    v.preload = 'auto';
    v.playsInline = true;
    v.muted = false;

    v.addEventListener('ended', () => {
      this.zone.run(() => {
        this.onTalkEnded();
      });
    });

    v.addEventListener('error', () => {
      this.zone.run(() => {
        this.isTalkPlaying = false;
        this.talkButtonLabel = 'TALK TO ME';
      });
    });
  }

  onTalkButtonClick(): void {
    // Prevent repeated clicks while the introduction is actively playing
    if (this.isTalkPlaying) return;
    this.startTalk();
  }

  private startTalk(): void {
    const main = this.mainVideoRef?.nativeElement;
    const talk = this.talkVideoRef?.nativeElement;
    if (!main || !talk) return;

    main.pause();
    main.classList.add('video-hidden');
    talk.classList.remove('video-hidden');
    talk.currentTime = 0;
    talk.muted = false;

    talk.play()
      .then(() => {
        this.zone.run(() => {
          this.isTalkPlaying = true;
          this.talkButtonLabel = 'SPEAKING...';
        });
      })
      .catch((err) => {
        console.warn('Playback error or policy restriction:', err);
        main.classList.remove('video-hidden');
        talk.classList.add('video-hidden');
        this.zone.run(() => {
          this.isTalkPlaying = false;
          this.talkButtonLabel = 'TALK TO ME';
        });
      });
  }

  private onTalkEnded(): void {
    const main = this.mainVideoRef?.nativeElement;
    const talk = this.talkVideoRef?.nativeElement;
    if (!main || !talk) return;

    // Transition back to main video frozen on its final resting seated frame
    if (isFinite(main.duration) && main.duration > 0) {
      main.currentTime = Math.max(0, main.duration - 0.05);
    }

    talk.classList.add('video-hidden');
    main.classList.remove('video-hidden');

    this.isTalkPlaying = false;
    this.talkButtonLabel = 'REPLAY INTRODUCTION';
  }

  private pauseAll(): void {
    try { this.mainVideoRef?.nativeElement.pause(); } catch { }
    try { this.talkVideoRef?.nativeElement.pause(); } catch { }
  }

  // ── Smooth Scroll Helper ───────────────────────────────────────
  scrollTo(id: string, e: Event): void {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  @HostListener('window:blur')
  onBlur(): void {
    // Optionally pause audio speech if user switches window
    if (this.isTalkPlaying) {
      const talk = this.talkVideoRef?.nativeElement;
      if (talk) {
        talk.pause();
        this.onTalkEnded();
      }
    }
  }
}
