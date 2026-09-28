/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License.
*/

import React, { useEffect, useRef } from 'react';

// Lightweight 2D star field inspired by the Cosmic Broth homepage.
// It deliberately uses Canvas 2D instead of WebGL so it remains reliable
// on low-end devices and behind restrictive browser/GPU environments.
const SiteBackgroundStars = ({ count = 500 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext('2d');
    if (!context) return undefined;

    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let stars = [];
    let maxRadius = 0;
    let minRadius = 0;
    let maxSpeed = 0;
    let minSpeed = 0;

    const resize = () => {
      const previousWidth = width;
      const previousHeight = height;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      width = window.innerWidth * pixelRatio;
      height = window.innerHeight * pixelRatio;
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      maxRadius = ((window.innerWidth + window.innerHeight) / 2000) * pixelRatio;
      minRadius = maxRadius / 5;
      maxSpeed = ((window.innerWidth + window.innerHeight) / 8000) * pixelRatio;
      minSpeed = maxSpeed / 10;

      if (previousWidth && previousHeight) {
        const scaleX = width / previousWidth;
        const scaleY = height / previousHeight;
        stars.forEach((star) => {
          star.x *= scaleX;
          star.y *= scaleY;
        });
      }
    };

    const createStars = () => {
      stars = Array.from({ length: Math.max(0, count) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        speedX: Math.random() * (maxSpeed - minSpeed) + minSpeed,
        speedY: Math.random() * (maxSpeed - minSpeed) + minSpeed,
        directionX: Math.random() > 0.5 ? -1 : 1,
        directionY: Math.random() > 0.5 ? -1 : 1,
        radius: Math.random() * (maxRadius - minRadius) + minRadius,
        alpha: Math.random(),
      }));
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      stars.forEach((star) => {
        star.x += star.speedX * star.directionX;
        star.y += star.speedY * star.directionY;
        star.alpha += (Math.random() - 0.5) * 0.2;
        star.alpha = Math.max(0, Math.min(1, star.alpha));

        if (star.x < star.radius * 2 || star.x > width + star.radius * 2) {
          star.directionX = -star.directionX;
        }
        if (star.y < star.radius * 2 || star.y > height + star.radius * 2) {
          star.directionY = -star.directionY;
        }

        context.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        context.beginPath();
        context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        context.fill();
      });
      animationFrame = window.requestAnimationFrame(draw);
    };

    resize();
    createStars();
    window.addEventListener('resize', resize);
    animationFrame = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
    };
  }, [count]);

  return <canvas ref={canvasRef} className='site-background-stars' aria-hidden='true' />;
};

export default SiteBackgroundStars;
