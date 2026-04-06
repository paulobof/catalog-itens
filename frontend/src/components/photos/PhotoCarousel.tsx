'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils/cn'
import type { PhotoResponse } from '@/lib/api/types'

interface PhotoCarouselProps {
  photos: PhotoResponse[]
  productName: string
}

export function PhotoCarousel({ photos, productName }: PhotoCarouselProps) {
  const [current, setCurrent] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const regionRef = useRef<HTMLDivElement>(null)

  const total = photos.length

  const prev = useCallback(() => {
    setCurrent((c) => (c === 0 ? total - 1 : c - 1))
  }, [total])

  const next = useCallback(() => {
    setCurrent((c) => (c === total - 1 ? 0 : c + 1))
  }, [total])

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    const el = regionRef.current
    if (el) {
      el.addEventListener('keydown', handleKey)
      return () => el.removeEventListener('keydown', handleKey)
    }
  }, [prev, next])

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const endX = e.changedTouches[0]?.clientX
    if (endX === undefined) return
    const delta = endX - touchStartX.current
    if (delta > 50) prev()
    else if (delta < -50) next()
    touchStartX.current = null
  }

  if (total === 0) return null

  return (
    <div
      ref={regionRef}
      role="region"
      aria-label="Fotos do produto"
      aria-roledescription="carousel"
      tabIndex={0}
      className="relative select-none overflow-hidden outline-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides */}
      <div className="relative h-72 bg-barbie-bg-soft">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            aria-label={`Foto ${index + 1} de ${total} de ${productName}`}
            aria-roledescription="slide"
            aria-hidden={index !== current}
            className={cn(
              'absolute inset-0 transition-opacity duration-300',
              index === current
                ? 'opacity-100'
                : 'opacity-0 pointer-events-none',
            )}
          >
            <Image
              src={photo.url}
              alt={`${productName} — foto ${index + 1}`}
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-contain"
            />
          </div>
        ))}
      </div>

      {/* Prev / Next buttons */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Foto anterior"
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 text-barbie-dark shadow backdrop-blur-sm transition-colors hover:bg-white active:bg-barbie-bg-soft"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={next}
            aria-label="Próxima foto"
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 text-barbie-dark shadow backdrop-blur-sm transition-colors hover:bg-white active:bg-barbie-bg-soft"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      )}

      {/* Dots indicator */}
      {total > 1 && (
        <div
          className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2"
          role="tablist"
          aria-label="Indicador de fotos"
        >
          {photos.map((_, index) => (
            <button
              key={index}
              role="tab"
              aria-selected={index === current}
              aria-label={`Foto ${index + 1} de ${total}`}
              onClick={() => setCurrent(index)}
              className={cn(
                'h-2 rounded-full transition-all duration-200',
                index === current
                  ? 'w-6 bg-barbie-primary'
                  : 'w-2 bg-white/70 hover:bg-white',
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
