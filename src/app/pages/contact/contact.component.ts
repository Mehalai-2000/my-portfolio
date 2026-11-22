import {
  Component, ElementRef, ViewChild,
  AfterViewInit, OnDestroy, NgZone, Inject, PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmailService } from '../../services/email.service';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent implements AfterViewInit, OnDestroy {

  @ViewChild('contactRoot') contactRootRef!: ElementRef<HTMLElement>;

  contactForm: FormGroup;
  isLoading = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  copiedEmail = false;

  readonly emailAddress = 'ramumeha2000@gmail.com';
  readonly locationText = 'Tirunelveli, Tamil Nadu, India';
  readonly linkedinUrl = 'https://www.linkedin.com/in/ramumanimehalai1111/';
  readonly githubUrl = 'https://github.com/';

  private triggers: ScrollTrigger[] = [];
  private destroyed = false;
  private isBrowser: boolean;

  constructor(
    private fb: FormBuilder,
    private emailService: EmailService,
    private zone: NgZone,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', [Validators.required, Validators.minLength(3)]],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

    ngAfterViewInit(): void {
      if(!this.isBrowser) return;

      this.zone.runOutsideAngular(() => {
        setTimeout(() => {
          this.initContactAnimations();
        }, 100);
      });
    }

    ngOnDestroy(): void {
      this.destroyed = true;
      this.triggers.forEach(t => t.kill());
      this.triggers = [];
    }

  private initContactAnimations(): void {
    if (this.destroyed) return;

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const root = this.contactRootRef?.nativeElement;
    if (!root) return;

    const leftCol = root.querySelector('.contact-info-column');
    const rightCol = root.querySelector('.contact-form-column');

    const trigger = ScrollTrigger.create({
      trigger: root.querySelector('.contact-split-grid'),
      start: 'top 80%',
      once: true,
      onEnter: () => {
        if (this.destroyed) return;
        if (leftCol) {
          gsap.fromTo(leftCol,
            { opacity: 0, x: -40 },
            { opacity: 1, x: 0, duration: 1.0, ease: 'power3.out' }
          );
        }
        if (rightCol) {
          gsap.fromTo(rightCol,
            { opacity: 0, x: 40 },
            { opacity: 1, x: 0, duration: 1.0, delay: 0.15, ease: 'power3.out' }
          );
        }
      }
    });
    this.triggers.push(trigger);
  }

  // ── Copy email helper ─────────────────────────────────────────────────
  copyEmail(): void {
    if (!this.isBrowser) return;

    navigator.clipboard.writeText(this.emailAddress).then(() => {
      this.copiedEmail = true;
      setTimeout(() => {
        this.copiedEmail = false;
      }, 3000);
    }).catch(() => {
      // Fallback
    });
  }

  // ── Form Submission with EmailJS ──────────────────────────────────────
  async onSubmit(): Promise<void> {
    this.successMessage = null;
    this.errorMessage = null;

    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      this.errorMessage = 'Please complete all required fields with valid information.';
      setTimeout(() => {
      if (!this.destroyed) this.errorMessage = null;
    }, 4000);
    return;
  }

    this.isLoading = true;
const formValues = this.contactForm.value;

try {
  const currentTime = new Date().toLocaleString();

  await this.emailService.sendEmail({
    name: formValues.name,
    time: currentTime,
    message: formValues.message,
    reply_to: formValues.email,
    subject: formValues.subject
  });

  this.successMessage = 'Your message has been delivered successfully. I will get back to you shortly!';
  this.contactForm.reset();

  setTimeout(() => {
  if (!this.destroyed) this.successMessage = null;
}, 6000);

    } catch (error) {
  console.error('EmailJS send error:', error);
  this.errorMessage = 'Failed to deliver message via automated gateway. Please email me directly at ' + this.emailAddress;
} finally {
  this.isLoading = false;
}
  }

  // Helper getters for validation styling in template
  get isNameInvalid(): boolean {
  const c = this.contactForm.get('name');
  return !!(c && c.invalid && (c.dirty || c.touched));
}

  get isEmailInvalid(): boolean {
  const c = this.contactForm.get('email');
  return !!(c && c.invalid && (c.dirty || c.touched));
}

  get isSubjectInvalid(): boolean {
  const c = this.contactForm.get('subject');
  return !!(c && c.invalid && (c.dirty || c.touched));
}

  get isMessageInvalid(): boolean {
  const c = this.contactForm.get('message');
  return !!(c && c.invalid && (c.dirty || c.touched));
}
}
