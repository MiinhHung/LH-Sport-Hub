"use client";

import * as React from "react";

import { DURATION, KEYS, segmentAt } from "@/components/intro/athlete-rig";

/**
 * Bảng soi pose của nhân vật màn mở đầu. Bật bằng `/?debug=1`.
 *
 * Không chạy lại animation riêng: bắt đúng các CSS animation `rg-*` đang
 * gắn trên rig rồi tự cầm đồng hồ (rAF), gán `currentTime` cho tất cả.
 * Nên thứ đang soi chính là thứ người dùng thấy, chỉ chậm hơn hoặc đứng yên.
 */
export function IntroDebug({ root }: { root: React.RefObject<HTMLElement | null> }) {
  const [playing, setPlaying] = React.useState(true);
  const [speed, setSpeed] = React.useState(0.25);
  const [loop, setLoop] = React.useState(true);
  const [joints, setJoints] = React.useState(true);

  const clock = React.useRef({ t: 0, playing: true, speed: 0.25, loop: true });
  const sliderRef = React.useRef<HTMLInputElement>(null);
  const labelRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    Object.assign(clock.current, { playing, speed, loop });
  }, [playing, speed, loop]);

  React.useEffect(() => {
    const html = document.documentElement;
    if (joints) html.setAttribute("data-rig-joints", "");
    else html.removeAttribute("data-rig-joints");
    return () => html.removeAttribute("data-rig-joints");
  }, [joints]);

  React.useEffect(() => {
    const athlete = root.current?.querySelector<HTMLElement>(".intro-athlete");
    if (!athlete) return;
    const anims = () =>
      athlete
        .getAnimations({ subtree: true })
        .filter((a) => a instanceof CSSAnimation && a.animationName.startsWith("rg-"));

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const c = clock.current;
      // Kẹp bước thời gian: tab ẩn rồi quay lại không nhảy cóc.
      const dt = Math.min(64, now - last);
      last = now;
      if (c.playing && !document.hidden) {
        c.t += dt * c.speed;
        if (c.t >= DURATION) c.t = c.loop ? c.t % DURATION : DURATION;
      }
      for (const a of anims()) {
        a.pause();
        a.currentTime = c.t;
      }
      if (sliderRef.current) sliderRef.current.value = String(Math.round(c.t));
      if (labelRef.current) {
        labelRef.current.textContent = `${Math.round(c.t)}ms · ${segmentAt(c.t).to.name}`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [root]);

  const scrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    clock.current.t = Number(e.target.value);
    setPlaying(false);
  };

  const btn =
    "rounded-md border border-white/20 px-2.5 py-1 text-[12px] font-semibold hover:border-gold-300";

  return (
    <div className="pointer-events-auto absolute top-3 right-3 left-3 z-10 rounded-xl border border-white/15 bg-navy-950/90 p-3 font-mono text-[12px] text-white shadow-2xl sm:left-auto sm:w-[420px]">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <strong className="text-gold-300">RIG DEBUG</strong>
        <button type="button" className={btn} onClick={() => setPlaying((p) => !p)}>
          {playing ? "Dừng" : "Chạy"}
        </button>
        {[0.1, 0.25, 0.5, 1].map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={speed === s}
            className={`${btn} ${speed === s ? "border-gold-300 text-gold-300" : ""}`}
            onClick={() => setSpeed(s)}
          >
            ×{s}
          </button>
        ))}
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} />
          lặp
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={joints} onChange={(e) => setJoints(e.target.checked)} />
          khớp
        </label>
      </div>
      <input
        ref={sliderRef}
        type="range"
        min={0}
        max={DURATION}
        step={1}
        defaultValue={0}
        onChange={scrub}
        aria-label="Tua dòng thời gian"
        className="w-full accent-[#e8c56a]"
      />
      <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1">
        <span ref={labelRef} className="mr-auto text-gold-200" />
        {KEYS.slice(0, -1).map((k) => (
          <button
            key={k.at}
            type="button"
            title={k.name}
            className="text-white/60 underline-offset-2 hover:text-white hover:underline"
            onClick={() => {
              clock.current.t = k.at;
              setPlaying(false);
            }}
          >
            {k.at}
          </button>
        ))}
      </div>
    </div>
  );
}
