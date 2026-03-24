'use client'

import Link from "next/link";
import { useState, useCallback, useRef } from "react";

const SQUARE_SIZE = 48;
const HOVER_DURATION = 500;

const HeroGrid = () => {
    const [activeSquares, setActiveSquares] = useState<Set<number>>(new Set());
    const timersRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
    const containerRef = useRef<HTMLDivElement>(null);
    const [grid, setGrid] = useState({ cols: 0, rows: 0 });

    const handleResize = useCallback((el: HTMLDivElement | null) => {
        if (!el) return;
        containerRef.current = el;
        const observer = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            setGrid({
                cols: Math.ceil(width / SQUARE_SIZE),
                rows: Math.ceil(height / SQUARE_SIZE),
            });
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const handleHover = useCallback((index: number) => {
        setActiveSquares((prev) => new Set(prev).add(index));

        const existing = timersRef.current.get(index);
        if (existing) clearTimeout(existing);

        const timer = setTimeout(() => {
            setActiveSquares((prev) => {
                const next = new Set(prev);
                next.delete(index);
                return next;
            });
            timersRef.current.delete(index);
        }, HOVER_DURATION);

        timersRef.current.set(index, timer);
    }, []);

    const total = grid.cols * grid.rows;

    return (
        <div className="relative h-screen w-screen flex flex-col items-center justify-center">
            <div ref={handleResize} className="absolute inset-0 overflow-hidden">
                <div
                    className="grid w-full h-full"
                    style={{
                        gridTemplateColumns: `repeat(${grid.cols}, ${SQUARE_SIZE}px)`,
                        gridTemplateRows: `repeat(${grid.rows}, ${SQUARE_SIZE}px)`,
                    }}
                >
                    {Array.from({ length: total }, (_, i) => (
                        <div
                            key={i}
                            onMouseEnter={() => handleHover(i)}
                            className="border-[0.5px] border-neutral-900 transition-colors duration-500"
                            style={{
                                backgroundColor: activeSquares.has(i)
                                    ? "var(--primary)"
                                    : "black",
                                transitionDuration: activeSquares.has(i) ? "150ms" : "500ms",
                            }}
                        />
                    ))}
                </div>
            </div>
            <div className="absolute flex flex-col items-center justify-center gap-8 p-6 text-center">
                <h1 className="text-5xl font-bold tracking-tight text-white">
                    Portal
                </h1>
                <p className="max-w-md text-lg text-muted-foreground">
                    Save, organize, and share your bookmarks.
                </p>
                <Link
                    href="/auth/signin"
                    className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                    Sign In
                </Link>
            </div>
        </div>
    );
};

export default HeroGrid;
