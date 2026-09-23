import { useEffect, useState } from "react";
import type { AssetPointer } from "@/components/media-slideshow-types";

interface MediaSlideshowProps {
  images: AssetPointer[];
  interval?: number;
  alt: string;
}

/**
 * Crossfade slideshow: cycles through the given images, holding each
 * on screen for `interval` ms before dissolving into the next.
 * Pauses entirely for users who prefer reduced motion.
 */
export function MediaSlideshow({ images, interval = 5000, alt }: MediaSlideshowProps) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % images.length);
    }, interval);
    return () => window.clearInterval(id);
  }, [images.length, interval]);

  return (
    <div className="media-slideshow">
      {images.map((image, index) => (
        <img
          key={image.url}
          src={image.url}
          alt={index === 0 ? alt : ""}
          aria-hidden={index !== active}
          className={index === active ? "is-active" : ""}
          loading={index === 0 ? "eager" : "lazy"}
        />
      ))}
    </div>
  );
}
