import { Component, AfterViewInit, ElementRef, Renderer2, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-about',
  imports: [LucideAngularModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent implements AfterViewInit, OnDestroy {
  private routerSub?: Subscription;

  constructor(
    private elRef: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private router: Router
  ) {}

  ngAfterViewInit() {
    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.router.url.includes('about')) {
          this.triggerAnimationWithDelay();
        }
      });
  }

  private triggerAnimationWithDelay() {
  const host = this.elRef.nativeElement;

  // ⛔ If navbar requested delay, skip router-triggered animation
  if (host.hasAttribute('data-nav-delay')) {
    return;
  }

  const revealEls: HTMLElement[] = Array.from(
    host.querySelectorAll('.reveal, .stagger-item')
  );

  revealEls.forEach(el => this.renderer.removeClass(el, 'visible'));

  setTimeout(() => {
    this.playRevealAnimation();
  }, 5000);
}


  private playRevealAnimation() {
    const host = this.elRef.nativeElement;
    const revealEls: HTMLElement[] = Array.from(
      host.querySelectorAll('.reveal, .stagger-item')
    );

    revealEls.forEach((el, index) => {
      setTimeout(() => {
        this.renderer.addClass(el, 'visible');
      }, index * 250); // Smooth stagger animation
    });
  }

  ngOnDestroy() {
    if (this.routerSub) this.routerSub.unsubscribe();
  }
}
