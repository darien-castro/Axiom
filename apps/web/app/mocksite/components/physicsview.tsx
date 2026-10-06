'use client';

import { cn } from "@/lib/utils" 

import { useRef, useEffect } from 'react';

export default function PhysicsView({className}: PhysicsViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2 ;
    canvas.height = canvas.offsetHeight * 2 ;
    
    ctx.beginPath();
    ctx.arc(300,100,30,0,2 *Math.PI)
    ctx.strokeStyle = "#ad5c63";
    ctx.lineWidth = 60;
    ctx.stroke();
    ctx.font = "24px serif"
    ctx.fillStyle = "#ffffff"
    ctx.fillText("Hello, World!", 254, 180)
  }, []);

  return (
      <canvas ref={canvasRef} className={cn(className)}></canvas>
  );
}
