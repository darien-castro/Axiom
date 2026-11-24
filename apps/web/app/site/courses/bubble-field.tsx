"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import styles from "./workload.module.css";

export default function BubbleField({ children, layoutKey }: { children: ReactNode; layoutKey: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const entered = useRef(false);

  useLayoutEffect(() => {
    const field = ref.current;
    if (!field) return;
    const bodies = Array.from(field.querySelectorAll("button"), (button) => ({
      button, originX: 0, originY: 0, x: 0, y: 0, radius: 0, vx: 0, vy: 0,
    }));
    type Body = typeof bodies[number];
    let drag: { body: Body; id: number; startX: number; startY: number; x: number; y: number; time: number; moved: boolean } | null = null;
    let suppressClick = false;
    let frame = 0;
    let previous = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const entrances: Animation[] = [];
    let disposed = false;
    function reveal() {
      entered.current = true;
      delete field!.dataset.entering;
      entrances.forEach((animation) => animation.cancel());
    }
    let assetsReady = false;
    let inView = false;
    let entranceTimer: number | undefined;
    function scheduleEntrance() {
      window.clearTimeout(entranceTimer);
      if (assetsReady && inView && !document.hidden && !entered.current && !disposed) {
        entranceTimer = window.setTimeout(enter, 180);
      }
    }
    const visibleButtons = new Set<Element>();
    const visibility = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.intersectionRatio >= 0.25) visibleButtons.add(entry.target);
        else visibleButtons.delete(entry.target);
      }
      inView = visibleButtons.size > 0;
      scheduleEntrance();
    }, { threshold: 0.25 });
    async function waitForFonts() {
      await document.fonts.ready;
      assetsReady = true;
      scheduleEntrance();
    }
    async function enter() {
      if (disposed || entered.current) return;
      visibility.disconnect();
      if (reducedMotion.matches) { reveal(); return; }
      entered.current = true;
      field!.dataset.entering = "running";
      bodies.forEach(({ button }, index) => {
        const fromLeft = button.offsetLeft + button.offsetWidth / 2 <= field!.clientWidth / 2;
        const offset = fromLeft ? -button.offsetLeft - button.offsetWidth : field!.clientWidth - button.offsetLeft;
        entrances.push(button.animate([
          { transform: `translateX(${offset}px)`, opacity: 0 },
          { transform: "translateX(0)", opacity: 1 },
        ], { duration: 900, delay: Math.min(index, 6) * 75, easing: "cubic-bezier(.25,.65,.3,1)", fill: "backwards" }));
      });
      await Promise.allSettled(entrances.map((animation) => animation.finished));
      if (!disposed) delete field!.dataset.entering;
    }
    if (!entered.current && !reducedMotion.matches) {
      field.dataset.entering = "waiting";
      bodies.forEach(({ button }) => visibility.observe(button));
      document.addEventListener("visibilitychange", scheduleEntrance);
      if (document.readyState === "complete") void waitForFonts();
      else window.addEventListener("load", waitForFonts, { once: true });
    } else entered.current = true;
    field.addEventListener("focusin", reveal);
    reducedMotion.addEventListener("change", reveal);

    function measure() {
      for (const b of bodies) {
        b.radius = b.button.offsetWidth / 2;
        b.x = b.originX = b.button.offsetLeft + b.radius;
        b.y = b.originY = b.button.offsetTop + b.radius;
        b.vx = b.vy = 0;
        b.button.style.translate = "";
      }
    }

    function step(time: number) {
      frame = 0;
      const dt = previous ? Math.min(2, (time - previous) / 16.67) : 1;
      previous = time;
      let moving = false;
      const width = ref.current!.clientWidth;
      const height = ref.current!.clientHeight;
      for (const b of bodies) {
        if (b === drag?.body) continue;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.vx *= 0.96 ** dt;
        b.vy *= 0.96 ** dt;
      }
      for (let i = 0; i < bodies.length; i++) {
        const a = bodies[i];
        for (const b of bodies.slice(i + 1)) {
          const dx = b.x - a.x, dy = b.y - a.y;
          const distance = Math.hypot(dx, dy);
          const overlap = a.radius + b.radius - distance;
          if (overlap < 0.1) continue;
          const nx = distance ? dx / distance : 1, ny = distance ? dy / distance : 0;
          const shareA = a === drag?.body ? 0 : b === drag?.body ? 1 : 0.5;
          const shareB = 1 - shareA;
          const impulse = Math.max(0, (a.vx - b.vx) * nx + (a.vy - b.vy) * ny) * 1.65;
          a.x -= nx * overlap * shareA;
          a.y -= ny * overlap * shareA;
          b.x += nx * overlap * shareB;
          b.y += ny * overlap * shareB;
          a.vx -= nx * impulse * shareA;
          a.vy -= ny * impulse * shareA;
          b.vx += nx * impulse * shareB;
          b.vy += ny * impulse * shareB;
        }
      }
      for (const b of bodies) {
        const x = Math.max(b.radius, Math.min(width - b.radius, b.x));
        const y = Math.max(b.radius, Math.min(height - b.radius, b.y));
        if (x !== b.x) b.vx *= -0.65;
        if (y !== b.y) b.vy *= -0.65;
        b.x = x;
        b.y = y;
        b.button.style.translate = (x - b.originX) + "px " + (y - b.originY) + "px";
        if (reducedMotion.matches || Math.hypot(b.vx, b.vy) < 0.08) b.vx = b.vy = 0;
        if (b !== drag?.body && (b.vx || b.vy)) moving = true;
      }
      if (moving) frame = requestAnimationFrame(step);
      else previous = 0;
    }
    function animate() {
      if (!frame) frame = requestAnimationFrame(step);
    }
    function down(e: PointerEvent) {
      reveal();
      if (drag || e.button !== 0) return;
      suppressClick = false;
      const body = bodies.find(({ button }) => button.contains(e.target as Node));
      if (!body) return;
      body.vx = body.vy = 0;
      body.button.setPointerCapture(e.pointerId);
      drag = { body, id: e.pointerId, startX: e.clientX, startY: e.clientY, x: e.clientX, y: e.clientY, time: e.timeStamp, moved: false };
    }
    function move(e: PointerEvent) {
      if (!drag || drag.id !== e.pointerId) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < 4) return;
      drag.moved = true;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      const dt = Math.max(1, (e.timeStamp - drag.time) / 16.67);
      drag.body.x += dx;
      drag.body.y += dy;
      drag.body.vx = Math.max(-20, Math.min(20, dx / dt));
      drag.body.vy = Math.max(-20, Math.min(20, dy / dt));
      drag.x = e.clientX;
      drag.y = e.clientY;
      drag.time = e.timeStamp;
      animate();
    }
    function end(e: PointerEvent) {
      if (!drag || drag.id !== e.pointerId) return;
      suppressClick = drag.moved;
      if (e.timeStamp - drag.time > 90 || reducedMotion.matches || e.type !== "pointerup") drag.body.vx = drag.body.vy = 0;
      drag = null;
      animate();
    }
    function click(e: MouseEvent) {
      if (suppressClick && e.detail) e.stopPropagation();
      suppressClick = false;
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(field);
    bodies.forEach(({ button }) => observer.observe(button));
    field.addEventListener("pointerdown", down);
    field.addEventListener("pointermove", move);
    field.addEventListener("pointerup", end);
    field.addEventListener("lostpointercapture", end);
    field.addEventListener("click", click, true);
    return () => {
      disposed = true;
      delete field.dataset.entering;
      entrances.forEach((animation) => animation.cancel());
      visibility.disconnect();
      window.clearTimeout(entranceTimer);
      document.removeEventListener("visibilitychange", scheduleEntrance);
      window.removeEventListener("load", waitForFonts);
      field.removeEventListener("focusin", reveal);
      reducedMotion.removeEventListener("change", reveal);
      observer.disconnect();
      cancelAnimationFrame(frame);
      field.removeEventListener("pointerdown", down);
      field.removeEventListener("pointermove", move);
      field.removeEventListener("pointerup", end);
      field.removeEventListener("lostpointercapture", end);
      field.removeEventListener("click", click, true);
    };
  }, [layoutKey]);

  return <div ref={ref} className={styles.bubbles}>{children}</div>;
}
