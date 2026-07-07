function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function initFadeUpObserver() {
  const els = document.querySelectorAll<HTMLElement>(".fade-up:not(.tl-step)");
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const parent = entry.target.parentElement;
        if (!parent) return;
        const siblings = Array.from(parent.children).filter(
          (el) =>
            el.classList.contains("fade-up") &&
            !el.classList.contains("tl-step")
        );
        const idx = siblings.indexOf(entry.target);
        setTimeout(() => entry.target.classList.add("visible"), idx * 90);
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.1 }
  );
  els.forEach((el) => obs.observe(el));
  return obs;
}

export function initTimelineObserver() {
  const observers: IntersectionObserver[] = [];
  document.querySelectorAll<HTMLElement>(".tl-step").forEach((el) => {
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !el.dataset.animated) {
          el.dataset.animated = "1";
          const delay = parseInt(el.getAttribute("data-delay") || "0");
          setTimeout(() => el.classList.add("visible"), delay);
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -20px 0px" }
    );
    obs.observe(el);
    observers.push(obs);
  });
  return observers;
}

export function initCounterObserver() {
  const observers: IntersectionObserver[] = [];
  document
    .querySelectorAll<HTMLElement>("[data-count],[data-count-decimal]")
    .forEach((el) => {
      const obs = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) runCounter(el);
        },
        { threshold: 0.5 }
      );
      obs.observe(el);
      observers.push(obs);
    });
  return observers;
}

function runCounter(el: HTMLElement) {
  if (el.dataset.animated) return;
  el.dataset.animated = "1";
  const isDecimal = el.hasAttribute("data-count-decimal");
  const suffix = el.getAttribute("data-suffix") || "";
  const prefix = el.getAttribute("data-prefix") || "";
  const formatted = el.getAttribute("data-formatted");
  const duration = 1500;
  const start = performance.now();

  if (isDecimal) {
    const from = parseFloat(el.getAttribute("data-from") || "0");
    const to = parseFloat(el.getAttribute("data-count-decimal") || "0");
    (function step(now: number) {
      const p = Math.min((now - start) / duration, 1);
      el.textContent = (from + (to - from) * easeOutCubic(p)).toFixed(1) + suffix;
      if (p < 1) requestAnimationFrame(step);
    })(start);
    return;
  }

  const from = parseInt(el.getAttribute("data-from") || "0");
  const to = parseInt(el.getAttribute("data-count") || "0");
  (function step(now: number) {
    const p = Math.min((now - start) / duration, 1);
    const val = Math.round(from + (to - from) * easeOutExpo(p));
    el.textContent =
      p === 1 && formatted
        ? prefix + formatted + suffix
        : prefix + val.toLocaleString("pt-BR") + suffix;
    if (p < 1) requestAnimationFrame(step);
  })(start);
}

export function initSerpPositionObserver() {
  const serpPos = document.querySelector<HTMLElement>(".sr-pos[data-count]");
  if (!serpPos) return null;
  const target = parseInt(serpPos.getAttribute("data-count") || "32");
  const obs = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !serpPos.dataset.animated) {
        serpPos.dataset.animated = "1";
        const dur = 2000;
        const s = performance.now();
        (function step(now: number) {
          const p = Math.min((now - s) / dur, 1);
          const ease =
            p < 0.75
              ? easeOutCubic(p / 0.75) * 0.9
              : 0.9 + easeOutExpo((p - 0.75) / 0.25) * 0.1;
          serpPos.textContent = String(Math.max(1, Math.round(ease * target)));
          if (p < 1) requestAnimationFrame(step);
        })(s);
      }
    },
    { threshold: 0.6 }
  );
  obs.observe(serpPos);
  return obs;
}

export function initRankingBarsObserver() {
  const bars = document.querySelectorAll<HTMLElement>(".rank-bar");
  if (!bars.length) return null;
  const obs = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        bars.forEach((bar, i) => {
          const w = bar.getAttribute("data-width");
          const isRed = bar.dataset.you === "true";
          setTimeout(
            () => {
              bar.style.width = w + "%";
            },
            isRed ? bars.length * 180 + 600 : i * 180
          );
        });
      }
    },
    { threshold: 0.3 }
  );
  obs.observe(bars[0]);
  return obs;
}

export function initGaugeObserver() {
  const gauge = document.querySelector<SVGCircleElement>(".score-gauge-fill");
  if (!gauge) return null;
  gauge.style.strokeDashoffset = "314";
  gauge.style.transition = "none";
  const targetOffset = gauge.getAttribute("data-target-offset") || "119";
  const obs = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !gauge.dataset.animated) {
        gauge.dataset.animated = "1";
        setTimeout(() => {
          gauge.style.transition =
            "stroke-dashoffset 1.8s cubic-bezier(0.4,0,0.2,1)";
          gauge.style.strokeDashoffset = targetOffset;
        }, 300);
      }
    },
    { threshold: 0.5 }
  );
  obs.observe(gauge);
  return obs;
}

export function initHeatmapObserver() {
  const cells = document.querySelectorAll<HTMLElement>(".hmap-grid .hc");
  if (!cells.length) return null;
  const obs = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !(entries[0].target as HTMLElement).dataset.hmAnimated) {
        (entries[0].target as HTMLElement).dataset.hmAnimated = "1";
        cells.forEach((cell, i) => {
          const savedBg = getComputedStyle(cell).backgroundColor;
          cell.style.background = "rgba(255,255,255,0.04)";
          cell.style.transform = "scale(0.6)";
          cell.style.transition = `all 0.35s ease ${i * 22}ms`;
          setTimeout(() => {
            cell.style.background = savedBg;
            cell.style.transform = "scale(1)";
          }, 150 + i * 22);
        });
      }
    },
    { threshold: 0.4 }
  );
  obs.observe(cells[0]);
  return obs;
}

export function initSerpRowsObserver() {
  const observers: IntersectionObserver[] = [];
  document.querySelectorAll<HTMLElement>(".sr").forEach((row, i) => {
    row.style.opacity = "0";
    row.style.transform = "translateX(-12px)";
    row.style.transition = `opacity 0.4s ease ${i * 120 + 200}ms,transform 0.4s ease ${i * 120 + 200}ms`;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          row.style.opacity = "1";
          row.style.transform = "translateX(0)";
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(row);
    observers.push(obs);
  });
  return observers;
}
