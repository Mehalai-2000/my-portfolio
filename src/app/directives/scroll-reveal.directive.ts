import { Directive, ElementRef, AfterViewInit, OnDestroy, Input } from '@angular/core';

@Directive({
    standalone: true,
    selector: '.reveal'
})
export class ScrollRevealDirective implements AfterViewInit, OnDestroy {
    @Input() threshold = 0.1;

    private observer: IntersectionObserver | undefined;

    constructor(private el: ElementRef) { }

    ngAfterViewInit() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    // Optional: Stop observing once revealed
                    this.observer?.unobserve(entry.target);
                }
            });
        }, {
            threshold: this.threshold,
            rootMargin: '0px 0px -100px 0px' // Trigger when element is 100px into the viewport
        });

        this.observer.observe(this.el.nativeElement);
    }

    ngOnDestroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}
