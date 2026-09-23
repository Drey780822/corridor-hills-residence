import * as React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CarouselItem {
  id: number | string;
  url: string;
  title: string;
  alt?: string;
}

const DEFAULT_CORRIDOR_HILLS_ITEMS: CarouselItem[] = [
  {
    id: 1,
    url: "/images/w.jpg",
    title: "Corridor Hills Residence",
    alt: "Corridor Hills Residence sports court and student community",
  },
  {
    id: 2,
    url: "/images/r.jpg",
    title: "Corridor Hills Residence",
    alt: "Corridor Hills Residence architecture and grounds",
  },
  {
    id: 3,
    url: "/images/pic5.jpg",
    title: "Corridor Hills Residence",
    alt: "Corridor Hills Residence residential pathways",
  },
  {
    id: 4,
    url: "/images/pic11.jpg",
    title: "Corridor Hills Residence",
    alt: "Corridor Hills Residence student facilities and living spaces",
  },
  {
    id: 5,
    url: "/images/t.jpg",
    title: "Corridor Hills Residence",
    alt: "Corridor Hills Residence peaceful evening atmosphere",
  },
];

export interface ThumbnailCarouselProps {
  items?: CarouselItem[];
  className?: string;
}

export function ThumbnailCarousel({
  items = DEFAULT_CORRIDOR_HILLS_ITEMS,
  className,
}: ThumbnailCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  const handleSelect = (index: number) => {
    if (index === currentIndex) return;
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Drag and swipe handling
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50;
    const velocityThreshold = 300;

    if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      handleNext();
    } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      handlePrev();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev]);

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    const activeThumb = thumbnailRefs.current[currentIndex];
    if (activeThumb) {
      activeThumb.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [currentIndex]);

  const currentItem = items[currentIndex];

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: "0%",
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      aria-label="Corridor Hills Residence Image Carousel"
      className={cn("w-full focus:outline-none select-none", className)}
    >
      {/* Main Image Stage - Strict 400px height */}
      <div
        className="relative w-full overflow-hidden rounded-xl bg-slate-950 shadow-xl"
        style={{ height: "400px", width: "100%" }}
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.25 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 h-[400px] w-full cursor-grab active:cursor-grabbing"
            style={{ height: "400px", width: "100%" }}
          >
            <img
              src={currentItem.url}
              alt={currentItem.alt || currentItem.title}
              draggable={false}
              className="h-[400px] w-full object-cover"
              style={{
                height: "400px",
                width: "100%",
                objectFit: "cover",
                aspectRatio: "unset",
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Bottom Title Overlay */}
        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-5 pt-12 pointer-events-none">
          <p className="text-[11px] font-mono uppercase tracking-wider text-teal-300">
            Tshwane University of Technology
          </p>
          <h4 className="text-base font-semibold text-white tracking-tight">{currentItem.title}</h4>
        </div>

        {/* Navigation Buttons: Previous */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous image"
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition-all hover:bg-black/75 hover:scale-105 active:scale-95 border border-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Navigation Buttons: Next */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next image"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition-all hover:bg-black/75 hover:scale-105 active:scale-95 border border-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Thumbnails Row */}
      {/* Active: 120px, Inactive: 35px, Height: 80px */}
      <div className="mt-3 flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
        {items.map((item, index) => {
          const isActive = index === currentIndex;
          return (
            <motion.button
              key={item.id}
              ref={(el) => {
                thumbnailRefs.current[index] = el;
              }}
              type="button"
              onClick={() => handleSelect(index)}
              aria-label={`Select image ${index + 1}: ${item.title}`}
              aria-current={isActive ? "true" : undefined}
              animate={{
                width: isActive ? 120 : 35,
                opacity: isActive ? 1 : 0.6,
              }}
              transition={{
                type: "spring",
                stiffness: 350,
                damping: 30,
              }}
              className={cn(
                "relative flex-shrink-0 cursor-pointer overflow-hidden rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400",
                isActive
                  ? "ring-2 ring-[#10A080] shadow-md shadow-teal-950/40"
                  : "hover:opacity-90 hover:brightness-105",
              )}
              style={{
                height: "80px",
              }}
            >
              <img
                src={item.url}
                alt={item.alt || item.title}
                draggable={false}
                className="h-[80px] w-full object-cover"
                style={{
                  height: "80px",
                  width: "100%",
                  objectFit: "cover",
                  aspectRatio: "unset",
                }}
              />
              {isActive && (
                <div className="absolute inset-0 border-2 border-[#10A080] rounded-lg pointer-events-none" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default ThumbnailCarousel;
