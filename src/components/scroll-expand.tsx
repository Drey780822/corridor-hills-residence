import React, { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import "./scroll-expand.css";

const clamp = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v);

const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
};

type ConfigKey =
  | "startWidth"
  | "startHeight"
  | "startRadius"
  | "endRadius"
  | "mediaZoom"
  | "scrollDistance"
  | "holdDistance"
  | "smoothing"
  | "overlayScrim"
  | "useWindowScroll"
  | "enabled";

export interface ScrollExpandProps {
  src?: string;
  mediaType?: "image" | "video";
  poster?: string;
  alt?: string;
  title?: string;
  scrollHint?: string;
  startWidth?: number;
  startHeight?: number;
  startRadius?: number;
  endRadius?: number;
  mediaZoom?: number;
  scrollDistance?: number;
  holdDistance?: number;
  smoothing?: number;
  overlayScrim?: number;
  useWindowScroll?: boolean;
  enabled?: boolean;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export const ScrollExpand: React.FC<ScrollExpandProps> = ({
  src = "",
  mediaType = "image",
  poster = "",
  alt = "",
  title = "",
  scrollHint = "",
  startWidth = 55,
  startHeight = 65,
  startRadius = 10,
  endRadius = 0,
  mediaZoom = 1.2,
  scrollDistance = 1.0,
  holdDistance = 0.25,
  smoothing = 0.08,
  overlayScrim = 0.55,
  useWindowScroll = true,
  enabled = true,
  children,
  className = "",
  style,
}) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const mediaRef = useRef<HTMLImageElement & HTMLVideoElement>(null);
  const titleRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const scrimRef = useRef<HTMLDivElement | null>(null);
  const hintRef = useRef<HTMLDivElement | null>(null);

  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const check = () => {
      setIsReducedMotion(mql.matches);
    };
    mql.addEventListener("change", check);
    return () => {
      mql.removeEventListener("change", check);
    };
  }, []);

  const propsRef = useRef<Required<Pick<ScrollExpandProps, ConfigKey>>>({
    startWidth,
    startHeight,
    startRadius,
    endRadius,
    mediaZoom,
    scrollDistance,
    holdDistance,
    smoothing,
    overlayScrim,
    useWindowScroll,
    enabled,
  });

  propsRef.current = {
    startWidth,
    startHeight,
    startRadius,
    endRadius,
    mediaZoom,
    scrollDistance,
    holdDistance,
    smoothing,
    overlayScrim,
    useWindowScroll,
    enabled,
  };

  const applyProgress = useCallback((p: number) => {
    const frame = frameRef.current;
    const media = mediaRef.current;
    if (!frame || !media) return;
    const c = propsRef.current;

    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    const initialW = isMobile ? Math.max(c.startWidth, 84) : c.startWidth;
    const initialH = isMobile ? Math.max(c.startHeight, 62) : c.startHeight;
    const w = initialW + (100 - initialW) * e;
    const h = initialH + (100 - initialH) * e;
    const ix = Math.max(0, (100 - w) / 2);
    const iy = Math.max(0, (100 - h) / 2);
    const r = c.startRadius + (c.endRadius - c.startRadius) * e;
    frame.style.clipPath = `inset(${iy}% ${ix}% ${iy}% ${ix}% round ${r}px)`;

    media.style.transform = `scale(${c.mediaZoom + (1 - c.mediaZoom) * e})`;

    if (scrimRef.current) scrimRef.current.style.opacity = `${c.overlayScrim * e}`;

    if (titleRef.current) {
      const out = smoothstep(0.35, 0.85, p);
      titleRef.current.style.opacity = `${1 - out}`;
      titleRef.current.style.transform = `translate3d(0, ${-25 * out}px, 0) scale(${1 + 0.05 * out})`;
    }

    if (hintRef.current) {
      const gone = smoothstep(0, 0.15, p);
      hintRef.current.style.opacity = `${1 - gone}`;
      hintRef.current.style.transform = `translate3d(0, ${8 * gone}px, 0)`;
    }

    if (overlayRef.current) {
      const inn = smoothstep(0.65, 1, p);
      overlayRef.current.style.opacity = `${inn}`;
      overlayRef.current.style.transform = `translate3d(0, ${16 * (1 - inn)}px, 0)`;
    }
  }, []);

  useEffect(() => {
    if (isReducedMotion) return;
    const root = rootRef.current;
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!root || !track || !stage) return;

    let raf = 0;
    let current = 0;
    let target = 0;
    let stageH = 0;
    let running = false;

    const measure = () => {
      const c = propsRef.current;
      stageH = c.useWindowScroll ? window.innerHeight : root.clientHeight;
      if (stageH <= 0) return;
      stage.style.height = `${stageH}px`;
      track.style.height = `${stageH * (1 + Math.max(0, c.scrollDistance) + Math.max(0, c.holdDistance))}px`;

      const w = root.clientWidth || stageH;
      stage.style.setProperty("--se-title-size", `${clamp(w * 0.075, 24, 76)}px`);
    };

    const readProgress = () => {
      const c = propsRef.current;
      if (!c.enabled) return 1;
      const span = stageH * Math.max(0.01, c.scrollDistance);
      if (c.useWindowScroll) {
        const top = track.getBoundingClientRect().top;
        return clamp(-top / span, 0, 1);
      }
      return clamp(root.scrollTop / span, 0, 1);
    };

    const tick = () => {
      const c = propsRef.current;
      const k = c.smoothing <= 0 ? 1 : 1 - Math.exp(-1 / (60 * c.smoothing));
      current += (target - current) * k;
      if (Math.abs(target - current) < 0.0004) {
        current = target;
        running = false;
      }
      applyProgress(current);
      raf = running ? requestAnimationFrame(tick) : 0;
    };

    const kick = () => {
      if (running) return;
      running = true;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      target = readProgress();
      if (propsRef.current.smoothing <= 0) {
        current = target;
        applyProgress(current);
        return;
      }
      kick();
    };

    const onResize = () => {
      measure();
      target = readProgress();
      current = target;
      applyProgress(current);
    };

    measure();
    target = readProgress();
    current = target;
    applyProgress(current);

    const scroller = useWindowScroll ? window : root;
    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(root);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
  }, [applyProgress, useWindowScroll, isReducedMotion]);

  // Simplified responsive view on reduced motion
  if (isReducedMotion) {
    return (
      <div
        className={`relative w-full overflow-hidden rounded-xl my-8 ${className}`.trim()}
        style={style}
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-foreground">
          {mediaType === "video" ? (
            <video
              className="h-full w-full object-cover"
              src={src}
              poster={poster}
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img className="h-full w-full object-cover" src={src} alt={alt} loading="lazy" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.09_0.04_252/0.8)] via-transparent to-[oklch(0.09_0.04_252/0.4)]" />
          {title && (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
              <h2 className="text-2xl font-extrabold uppercase tracking-tight text-white sm:text-3xl">
                {title}
              </h2>
            </div>
          )}
          {children && (
            <div className="absolute inset-x-0 bottom-0 p-6 text-center">{children}</div>
          )}
        </div>
      </div>
    );
  }

  const media =
    mediaType === "video" ? (
      <video
        ref={mediaRef}
        className="scroll-expand__media"
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
      />
    ) : (
      <img ref={mediaRef} className="scroll-expand__media" src={src} alt={alt} draggable={false} />
    );

  return (
    <div
      ref={rootRef}
      className={`scroll-expand ${useWindowScroll ? "" : "scroll-expand--scroller"} ${className}`.trim()}
      style={style}
    >
      <div ref={trackRef} className="scroll-expand__track">
        <div ref={stageRef} className="scroll-expand__stage">
          <div ref={frameRef} className="scroll-expand__frame">
            {media}
            <div ref={scrimRef} className="scroll-expand__scrim" />
            {children ? (
              <div ref={overlayRef} className="scroll-expand__overlay">
                {children}
              </div>
            ) : null}
          </div>
          {title ? (
            <div ref={titleRef} className="scroll-expand__title">
              {title}
            </div>
          ) : null}
          {scrollHint ? (
            <div ref={hintRef} className="scroll-expand__hint">
              {scrollHint}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ScrollExpand;
