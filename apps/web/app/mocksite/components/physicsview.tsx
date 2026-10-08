'use client';
import { cn } from "@/lib/utils"
import { Engine } from "./engine"
import { physNode } from "./engine"

interface Course {
  name: string;
  credits: number;
  gradeLow: boolean;
  assignments: Assignment[];
}

interface Assignment {
  name: string;
  weight: number;
}

function getMouseInput(canvas: HTMLCanvasElement, evt: MouseEvent) {
  const rect = canvas.getBoundingClientRect();
  const x = evt.clientX - rect.left;
  const y = evt.clientY - rect.top;
  return { x, y };
}


import { useRef, useEffect } from 'react';
const MOCK_COURSES: Course[] = [
  { name: "MATH 2164", credits: 3, gradeLow: false, assignments: []},
  { name: "ITCS 2181", credits: 4, gradeLow: true, assignments: [] },
  { name: "ITSC 2100", credits: 3, gradeLow: true, assignments: [] },
  { name: "ENGL 1102", credits: 3, gradeLow: false, assignments: [] },
  { name: "PHYS 2101", credits: 4, gradeLow: false, assignments: [] },
];

export default function PhysicsView({className}: PhysicsViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);


    const engine = new Engine(0.005, { width: canvas.offsetWidth, height: canvas.offsetHeight }, ctx);


    for (const course of MOCK_COURSES) {
       engine.addNode(new physNode(course));
    }

    engine.start();

    const handleMouseMove = (evt: MouseEvent) => {
      const mousePos = getMouseInput(canvas, evt);

      if (engine.setMousePos) {
        if (evt.buttons === 1) {
          engine.setMousePos({ ...mousePos, clicked: true });
        } else {
          engine.setMousePos({ ...mousePos, clicked: false });
        }
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
       engine.stop();
    }
  }, []);

  return (
      <canvas ref={canvasRef} className={cn(className, "w-full h-full bg-[#32364A]")}></canvas>);
}
