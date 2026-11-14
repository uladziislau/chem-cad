import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideRouter } from '@angular/router';
import { routes } from '../../../angular/app.routes';

async function createHarness(url: string) {
  return RouterTestingHarness.create(url);
}

describe('Classroom routing', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    });
  });

  it('list page renders lesson cards linking to /classroom/lesson/:id', async () => {
    const harness = await createHarness('/classroom/lessons');
    harness.detectChanges();
    const el = harness.routeNativeElement!;
    const links = el.querySelectorAll('a[href*="/classroom/lesson/"]');
    expect(links.length).toBeGreaterThan(0);
    expect(links[0].getAttribute('href')).toMatch(/lesson\//);
  });

  it('lesson/:id resolves and renders the lesson', async () => {
    const harness = await createHarness('/classroom/lesson/intro_0');
    harness.detectChanges();
    const el = harness.routeNativeElement!;
    expect(el.querySelector('h1')).toBeTruthy();
    expect(el.textContent).toContain('Лабораторный стол');
  });

  it('unknown lesson id shows not-found state', async () => {
    const harness = await createHarness('/classroom/lesson/ghost');
    harness.detectChanges();
    const el = harness.routeNativeElement!;
    expect(el.textContent).toContain('Урок не найден');
  });
});
