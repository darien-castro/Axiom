'use client';
import { cn } from "@/lib/utils"
import { Engine } from "./engine"
import { physNode } from "./engine"

interface Course {
  name: string;
  credits: number;
  assignments: Assignment[];
}

interface Assignment {
  name: string;
  weight: number;
}

import { useRef, useEffect } from 'react';
// Add some mock data at the top of your file
const MOCK_COURSES: Course[] = [
  { name: "MATH 2164", credits: 3, assignments: [] },
  { name: "ITCS 2181", credits: 4, assignments: [] },
  { name: "ITSC 2100", credits: 3, assignments: [] },
  { name: "ENGL 1102", credits: 3, assignments: [] },
  { name: "PHYS 2101", credits: 4, assignments: [] },
];

export default function PhysicsView({className}: PhysicsViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fix Canvas DPI scaling for sharp text
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Pass the actual CSS width/height to the engine, not the multiplied resolution
    const engine = new Engine(0.005, { width: canvas.offsetWidth, height: canvas.offsetHeight }, ctx);

    // Add the mock data
    for (const course of MOCK_COURSES) {
       engine.addNode(new physNode(course));
    }

    engine.start();

    // CRITICAL: Cleanup the animation when React unmounts
    return () => {
       engine.stop();
    }
  }, []);

  return (
      <canvas ref={canvasRef} className={cn(className, "w-full h-full bg-black")}></canvas>
  );
}
