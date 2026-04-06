'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils/cn'

const MAX_PHOTOS = 3
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp']

export interface PhotoSlot {
  file: File | null
  existingUrl: string | null
  existingId: string | null
  progress: number | null
}

interface PhotoUploadZoneProps {
  slots: PhotoSlot[]
  onChange: (slots: PhotoSlot[]) => void
  onDeleteExisting?: (photoId: string) => void
  error?: string
}

function EmptySlotIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
      className="text-barbie-accent"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  )
}

export function PhotoUploadZone({ slots, onChange, onDeleteExisting, error }: PhotoUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const blobUrlsRef = useRef<string[]>([])

  // Manage blob URLs: create them when slots change, revoke old ones on cleanup
  const previewUrls = slots.map((slot) => {
    if (slot.existingUrl) return slot.existingUrl
    if (slot.file) {
      const url = URL.createObjectURL(slot.file)
      blobUrlsRef.current.push(url)
      return url
    }
    return null
  })

  useEffect(() => {
    const urls = blobUrlsRef.current
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
      blobUrlsRef.current = []
    }
  }, [slots])

  const activeSlots = slots.filter(
    (s) => s.file !== null || s.existingId !== null,
  )
  const hasRoom = activeSlots.length < MAX_PHOTOS

  function validateFile(file: File): string | null {
    if (!ACCEPTED_MIME.includes(file.type)) {
      return `Tipo não suportado: ${file.type}. Use JPEG, PNG ou WebP.`
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo 5MB.`
    }
    return null
  }

  const addFiles = useCallback(
    (files: File[]) => {
      setValidationError(null)
      const newSlots = [...slots]
      const emptyIndices = newSlots
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => s.file === null && s.existingId === null)
        .map(({ i }) => i)

      let added = 0
      for (const file of files) {
        if (emptyIndices.length === 0 || added >= emptyIndices.length) {
          setValidationError(`Máximo de ${MAX_PHOTOS} fotos atingido.`)
          break
        }
        const err = validateFile(file)
        if (err) {
          setValidationError(err)
          break
        }
        const idx = emptyIndices[added]
        if (idx !== undefined) {
          newSlots[idx] = {
            file,
            existingUrl: null,
            existingId: null,
            progress: null,
          }
        }
        added++
      }

      if (added > 0) onChange(newSlots)
    },
    [slots, onChange],
  )

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    addFiles(files)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    setDragOverSlot(null)
    const files = Array.from(e.dataTransfer.files)
    addFiles(files)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  function removeSlot(index: number) {
    const slot = slots[index]
    if (slot?.existingId && onDeleteExisting) {
      onDeleteExisting(slot.existingId)
    }
    const newSlots = [...slots]
    newSlots[index] = {
      file: null,
      existingUrl: null,
      existingId: null,
      progress: null,
    }
    onChange(newSlots)
  }

  function handleSlotDragStart(e: React.DragEvent, fromIndex: number) {
    e.dataTransfer.setData('text/plain', String(fromIndex))
  }

  function handleSlotDrop(e: React.DragEvent, toIndex: number) {
    e.preventDefault()
    e.stopPropagation()
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10)
    if (fromIndex === toIndex) return
    const newSlots = [...slots]
    const from = newSlots[fromIndex]
    const to = newSlots[toIndex]
    if (from !== undefined && to !== undefined) {
      newSlots[fromIndex] = to
      newSlots[toIndex] = from
    }
    onChange(newSlots)
    setDragOverSlot(null)
  }

  const displayError = error ?? validationError

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-barbie-text">
        Fotos (máx. {MAX_PHOTOS})
      </label>

      <div
        role="button"
        tabIndex={0}
        aria-label="Área para upload de fotos. Clique ou arraste arquivos aqui."
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => hasRoom && fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && hasRoom) {
            fileInputRef.current?.click()
          }
        }}
        className={cn(
          'grid grid-cols-3 gap-3 rounded-2xl border-2 border-dashed p-3 transition-colors',
          dragging
            ? 'border-barbie-primary bg-barbie-bg-soft'
            : 'border-barbie-accent bg-barbie-surface hover:border-barbie-primary',
          !hasRoom && 'cursor-default opacity-80',
          displayError && 'border-red-400',
        )}
      >
        {slots.map((slot, index) => {
          const isEmpty = slot.file === null && slot.existingId === null
          const previewUrl = previewUrls[index] ?? null

          return (
            <div
              key={index}
              draggable={!isEmpty}
              onDragStart={(e) => !isEmpty && handleSlotDragStart(e, index)}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverSlot(index)
              }}
              onDragLeave={() => setDragOverSlot(null)}
              onDrop={(e) => !isEmpty && handleSlotDrop(e, index)}
              aria-label={
                isEmpty
                  ? `Slot ${index + 1} de foto — vazio`
                  : `Slot ${index + 1} de foto — ${slot.file?.name ?? 'foto existente'}. Arraste para reordenar.`
              }
              className={cn(
                'relative aspect-square overflow-hidden rounded-xl border',
                isEmpty
                  ? 'border-barbie-accent/50 bg-barbie-bg-soft flex items-center justify-center'
                  : 'border-barbie-accent cursor-grab active:cursor-grabbing',
                dragOverSlot === index &&
                  !isEmpty &&
                  'ring-2 ring-barbie-primary',
              )}
            >
              {isEmpty ? (
                <EmptySlotIcon />
              ) : (
                <>
                  {previewUrl && (
                    <Image
                      src={previewUrl}
                      alt={`Preview foto ${index + 1}`}
                      fill
                      sizes="(max-width: 640px) 30vw, 120px"
                      className="object-cover"
                      unoptimized={!!slot.file}
                    />
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeSlot(index)
                    }}
                    aria-label={`Remover foto ${index + 1}`}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white text-xs hover:bg-black/80"
                  >
                    ✕
                  </button>

                  {slot.progress !== null && (
                    <div className="absolute inset-x-0 bottom-0 bg-black/30 px-1 py-0.5">
                      <div
                        role="progressbar"
                        aria-valuenow={slot.progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Upload da foto ${index + 1}: ${slot.progress}%`}
                        style={{ width: `${slot.progress}%` }}
                        className="h-1.5 rounded-full bg-barbie-primary transition-all duration-300"
                      />
                    </div>
                  )}

                  <div className="absolute left-1 top-1 opacity-60" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                      <circle cx="9" cy="6" r="2" />
                      <circle cx="9" cy="12" r="2" />
                      <circle cx="9" cy="18" r="2" />
                      <circle cx="15" cy="6" r="2" />
                      <circle cx="15" cy="12" r="2" />
                      <circle cx="15" cy="18" r="2" />
                    </svg>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={handleFileInputChange}
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={handleFileInputChange}
      />

      {hasRoom && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-barbie-accent bg-white px-3 py-2 text-sm font-semibold text-barbie-text hover:border-barbie-primary hover:bg-barbie-bg-soft transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            Tirar foto
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-barbie-accent bg-white px-3 py-2 text-sm font-semibold text-barbie-text hover:border-barbie-primary hover:bg-barbie-bg-soft transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Escolher arquivo
          </button>
        </div>
      )}

      {displayError && (
        <p role="alert" className="text-xs text-red-600">
          {displayError}
        </p>
      )}

      <p className="text-xs text-barbie-text/50">
        JPEG, PNG ou WebP. Máximo 5MB por foto. Arraste para reordenar.
      </p>
    </div>
  )
}
