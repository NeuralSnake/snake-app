import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import * as THREE from 'three'
import FOG from 'vanta/dist/vanta.fog.min'

export default function LandingPage() {
  const [fogEffect, setFogEffect] = useState<any>(null)
  const vantaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!fogEffect && vantaRef.current) {
      const effect = FOG({
        el: vantaRef.current,
        THREE,
        highlightColor: 0x00ff88,
        midtoneColor: 0x007744,
        lowlightColor: 0x001100,
        baseColor: 0x000000,
        blurFactor: 0.6,
        speed: 1.5,
        zoom: 1.0
      })
      setFogEffect(effect)
    }
    return () => {
      if (fogEffect) fogEffect.destroy()
    }
  }, [fogEffect])

  return (
    <div className="relative min-h-screen w-full text-green-100 font-sans">
      {/*
        VANTA BACKGROUND
        1. Absolutely positioned within the parent.
        2. z-0 so it’s "behind" but not behind the body background.
        3. pointer-events-none so clicks pass through to your nav/links.
      */}
      <div
        ref={vantaRef}
        className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none"
      />

      {/* NAVIGATION (z-10 to appear above the background) */}
      <nav className="relative z-10 flex items-center justify-between p-4">
        <div className="text-green-300 font-bold text-xl">
          Neural Snake
        </div>

        {/* Right side (GitHub / Twitter links) */}
        <div className="flex items-center space-x-4">
          <a
            href="https://github.com/YourGitHubUsername"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-300 hover:text-green-400 transition"
          >
            GitHub
          </a>
          <a
            href="https://twitter.com/YourTwitterHandle"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-300 hover:text-green-400 transition"
          >
            Twitter
          </a>
        </div>
      </nav>

      {/* HERO SECTION (also z-10) */}
      <header className="relative z-10 flex flex-col items-center justify-center text-center min-h-screen px-4">
        <h1
          className="
            text-6xl md:text-8xl font-extrabold
            text-transparent bg-clip-text
            bg-gradient-to-r from-lime-400 via-green-300 to-green-500
            drop-shadow-[0_0_8px_rgba(0,255,0,0.8)]
            mb-6
          "
        >
          Neural Snake
        </h1>

        <p className="max-w-2xl text-lg md:text-xl text-green-100 leading-relaxed mb-10">
          Experience an AI-driven evolution of the classic Snake game...
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/app">
            <button
              className="
                px-6 py-3
                bg-gradient-to-r
                from-lime-500 to-green-600
                text-black font-semibold
                rounded-lg shadow-md
                hover:scale-105 hover:shadow-lg
                transition
              "
            >
              Open App
            </button>
          </Link>
          <a
            href="https://"
            target="_blank"
            rel="noopener noreferrer"
            className="
              px-6 py-3
              border border-green-400
              text-green-400
              rounded-lg
              hover:bg-green-600 hover:text-white
              hover:scale-105 hover:shadow-lg
              transition
            "
          >
            Documentation
          </a>
        </div>
      </header>
    </div>
  )
}
