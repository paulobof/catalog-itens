'use client'

import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { createProduct, updateProduct } from '@/lib/api/products'
import { createTag } from '@/lib/api/tags'
import { uploadPhoto, deletePhoto } from '@/lib/api/photos'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { showToast } from '@/components/ui/Toast'
import { PhotoUploadZone, type PhotoSlot } from '@/components/photos/PhotoUploadZone'
import { TagPicker } from '@/components/tags/TagPicker'
import type {
  ProductDetail,
  TagResponse,
  LocationSummary,
  CreateProductRequest,
} from '@/lib/api/types'

interface ProductFormData {
  name: string
  description: string
}

interface LocationEntry {
  locationId: string
  locationName: string
  roomName: string
  quantity: number
}

interface ProductFormProps {
  product?: ProductDetail
  allTags: TagResponse[]
  allLocations: LocationSummary[]
  defaultLocationId?: string
}

function createEmptySlots(): PhotoSlot[] {
  return [
    { file: null, existingUrl: null, existingId: null, progress: null },
    { file: null, existingUrl: null, existingId: null, progress: null },
    { file: null, existingUrl: null, existingId: null, progress: null },
  ]
}

const MIN_QTY = 1
const MAX_QTY = 99999

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  )
}

function MoveIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 9l-3 3 3 3" />
      <path d="M2 12h13" />
      <path d="M19 15l3-3-3-3" />
      <path d="M22 12H9" />
    </svg>
  )
}

export function ProductForm({
  product,
  allTags,
  allLocations,
  defaultLocationId,
}: ProductFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const isEditing = !!product

  const [photoSlots, setPhotoSlots] = useState<PhotoSlot[]>(() => {
    if (product?.photos) {
      const slots = createEmptySlots()
      product.photos.forEach((p, i) => {
        if (i < 3) {
          slots[i] = {
            file: null,
            existingUrl: p.url,
            existingId: p.id,
            progress: null,
          }
        }
      })
      return slots
    }
    return createEmptySlots()
  })

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    product?.tags.map((t) => t.id) ?? [],
  )
  const [localTags, setLocalTags] = useState<TagResponse[]>(allTags)

  const [locationEntries, setLocationEntries] = useState<LocationEntry[]>(() => {
    if (product?.locations) {
      return product.locations.map((l) => ({
        locationId: l.locationId,
        locationName: l.locationName,
        roomName: l.roomName,
        quantity: l.quantity,
      }))
    }
    if (defaultLocationId) {
      const loc = allLocations.find((l) => l.id === defaultLocationId)
      if (loc) {
        return [
          {
            locationId: loc.id,
            locationName: loc.name,
            roomName: loc.roomName,
            quantity: 1,
          },
        ]
      }
    }
    return []
  })

  const [selectedLocationId, setSelectedLocationId] = useState('')

  const [moveFromId, setMoveFromId] = useState<string | null>(null)
  const [moveToId, setMoveToId] = useState<string>('')
  const [moveQty, setMoveQty] = useState<number>(1)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    defaultValues: {
      name: product?.name ?? '',
      description: product?.description ?? '',
    },
  })

  async function handleCreateTag(name: string): Promise<TagResponse> {
    const newTag = await createTag({ name, color: null })
    setLocalTags((prev) => [...prev, newTag])
    return newTag
  }

  function addLocationEntry() {
    if (!selectedLocationId) return
    const loc = allLocations.find((l) => l.id === selectedLocationId)
    if (!loc) return
    if (locationEntries.some((e) => e.locationId === selectedLocationId)) return

    setLocationEntries((prev) => [
      ...prev,
      {
        locationId: loc.id,
        locationName: loc.name,
        roomName: loc.roomName,
        quantity: 1,
      },
    ])
    setSelectedLocationId('')
  }

  function setLocationQuantity(locationId: string, quantity: number) {
    const clamped = Math.min(MAX_QTY, Math.max(MIN_QTY, quantity))
    setLocationEntries((prev) =>
      prev.map((e) =>
        e.locationId === locationId ? { ...e, quantity: clamped } : e,
      ),
    )
  }

  function incrementLocation(locationId: string) {
    setLocationEntries((prev) =>
      prev.map((e) =>
        e.locationId === locationId
          ? { ...e, quantity: Math.min(MAX_QTY, e.quantity + 1) }
          : e,
      ),
    )
  }

  function decrementLocation(locationId: string) {
    setLocationEntries((prev) =>
      prev.map((e) =>
        e.locationId === locationId
          ? { ...e, quantity: Math.max(MIN_QTY, e.quantity - 1) }
          : e,
      ),
    )
  }

  function removeLocationEntry(locationId: string) {
    setLocationEntries((prev) => prev.filter((e) => e.locationId !== locationId))
  }

  function openMoveModal(fromLocationId: string) {
    const source = locationEntries.find((e) => e.locationId === fromLocationId)
    if (!source) return
    setMoveFromId(fromLocationId)
    setMoveToId('')
    setMoveQty(source.quantity)
  }

  function closeMoveModal() {
    setMoveFromId(null)
    setMoveToId('')
    setMoveQty(1)
  }

  function confirmMove() {
    if (!moveFromId || !moveToId || moveFromId === moveToId) return
    const source = locationEntries.find((e) => e.locationId === moveFromId)
    if (!source) return
    const qty = Math.min(Math.max(1, moveQty), source.quantity)

    const destination = allLocations.find((l) => l.id === moveToId)
    if (!destination) return

    setLocationEntries((prev) => {
      const updated: LocationEntry[] = []
      let destinationMerged = false

      for (const entry of prev) {
        if (entry.locationId === moveFromId) {
          const remaining = entry.quantity - qty
          if (remaining > 0) {
            updated.push({ ...entry, quantity: remaining })
          }
          continue
        }
        if (entry.locationId === moveToId) {
          updated.push({
            ...entry,
            quantity: Math.min(MAX_QTY, entry.quantity + qty),
          })
          destinationMerged = true
          continue
        }
        updated.push(entry)
      }

      if (!destinationMerged) {
        updated.push({
          locationId: destination.id,
          locationName: destination.name,
          roomName: destination.roomName,
          quantity: qty,
        })
      }

      return updated
    })

    closeMoveModal()
  }

  async function onSubmit(data: ProductFormData) {
    setSubmitting(true)

    try {
      const payload: CreateProductRequest = {
        name: data.name.trim(),
        description: data.description.trim() || null,
        tagIds: selectedTagIds,
        locations: locationEntries.map((e) => ({
          locationId: e.locationId,
          quantity: e.quantity,
        })),
      }

      let productId: string

      if (isEditing) {
        const updated = await updateProduct(product.id, payload)
        productId = updated.id
      } else {
        const created = await createProduct(payload)
        productId = created.id
      }

      for (let i = 0; i < photoSlots.length; i++) {
        const slot = photoSlots[i]
        if (!slot || slot.file === null) continue

        setPhotoSlots((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, progress: 0 } : s)),
        )

        const interval = setInterval(() => {
          setPhotoSlots((prev) =>
            prev.map((s, idx) =>
              idx === i && s.progress !== null && s.progress < 90
                ? { ...s, progress: s.progress + 10 }
                : s,
            ),
          )
        }, 100)

        try {
          await uploadPhoto('product', productId, slot.file)
        } finally {
          clearInterval(interval)
          setPhotoSlots((prev) =>
            prev.map((s, idx) => (idx === i ? { ...s, progress: 100 } : s)),
          )
        }
      }

      showToast(
        isEditing
          ? 'Produto atualizado com sucesso!'
          : 'Produto criado com sucesso!',
        'success',
      )
      window.location.href = `/products/${productId}`
    } catch (err) {
      console.error('Erro ao salvar produto:', err)
      const msg = err instanceof Error ? err.message : 'Erro ao salvar. Tente novamente.'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const availableLocations = allLocations.filter(
    (l) => !locationEntries.some((e) => e.locationId === l.id),
  )

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex min-w-0 flex-col gap-6 pb-10"
    >
      <fieldset className="flex min-w-0 flex-col gap-4">
        <legend className="mb-2 text-sm font-bold text-barbie-text/70 uppercase tracking-wider">
          Informações básicas
        </legend>
        <Input
          label="Nome"
          placeholder="ex: Furadeira Bosch"
          error={errors.name?.message}
          {...register('name', {
            required: 'Nome é obrigatório',
            maxLength: { value: 150, message: 'Máximo 150 caracteres' },
          })}
        />
        <Textarea
          label="Descrição (opcional)"
          placeholder="ex: Modelo GSB 13 RE, bivolt, com maleta"
          rows={3}
          {...register('description', {
            maxLength: { value: 1000, message: 'Máximo 1000 caracteres' },
          })}
        />
      </fieldset>

      <fieldset className="min-w-0">
        <legend className="mb-2 text-sm font-bold text-barbie-text/70 uppercase tracking-wider">
          Fotos
        </legend>
        <PhotoUploadZone slots={photoSlots} onChange={setPhotoSlots} onDeleteExisting={(id) => deletePhoto(id).catch(() => {})} />
      </fieldset>

      <fieldset className="min-w-0">
        <legend className="mb-2 text-sm font-bold text-barbie-text/70 uppercase tracking-wider">
          Tags
        </legend>
        <TagPicker
          allTags={localTags}
          selectedIds={selectedTagIds}
          onChange={setSelectedTagIds}
          onCreateTag={handleCreateTag}
          label=""
        />
      </fieldset>

      <fieldset className="min-w-0">
        <legend className="mb-2 text-sm font-bold text-barbie-text/70 uppercase tracking-wider">
          Locais de armazenamento
        </legend>

        {locationEntries.length > 0 && (
          <ul className="mb-3 flex min-w-0 flex-col gap-2">
            {locationEntries.map((entry) => (
              <li
                key={entry.locationId}
                className="flex min-w-0 flex-col gap-2 rounded-xl border border-barbie-accent/30 bg-barbie-surface p-3"
              >
                <div className="flex min-w-0 items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-barbie-text">
                      {entry.locationName}
                    </span>
                    <span className="text-xs text-barbie-text/50">
                      {entry.roomName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLocationEntry(entry.locationId)}
                    aria-label={`Remover ${entry.locationName}`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                  >
                    <TrashIcon />
                  </button>
                </div>
                <div className="flex min-w-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => decrementLocation(entry.locationId)}
                    disabled={entry.quantity <= MIN_QTY}
                    aria-label={`Diminuir quantidade em ${entry.locationName}`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-barbie-accent bg-white text-lg font-bold leading-none text-barbie-dark hover:bg-barbie-bg-soft disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    −
                  </button>
                  <label
                    htmlFor={`qty-${entry.locationId}`}
                    className="sr-only"
                  >
                    Quantidade em {entry.locationName}
                  </label>
                  <input
                    id={`qty-${entry.locationId}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={entry.quantity}
                    onChange={(e) => {
                      const parsed = parseInt(
                        e.target.value.replace(/[^0-9]/g, ''),
                        10,
                      )
                      if (Number.isNaN(parsed)) return
                      setLocationQuantity(entry.locationId, parsed)
                    }}
                    className="w-12 shrink-0 rounded-lg border border-barbie-accent bg-white px-1 py-1 text-center text-sm tabular-nums focus:border-barbie-primary focus:outline-none focus:ring-1 focus:ring-barbie-primary/30"
                  />
                  <button
                    type="button"
                    onClick={() => incrementLocation(entry.locationId)}
                    disabled={entry.quantity >= MAX_QTY}
                    aria-label={`Aumentar quantidade em ${entry.locationName}`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-barbie-accent bg-white text-lg font-bold leading-none text-barbie-dark hover:bg-barbie-bg-soft disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    +
                  </button>
                  <div className="flex-1" aria-hidden="true" />
                  {allLocations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => openMoveModal(entry.locationId)}
                      aria-label={`Mover itens de ${entry.locationName}`}
                      className="flex h-8 shrink-0 items-center gap-1 rounded-lg border border-barbie-accent bg-white px-2 text-xs font-semibold text-barbie-dark hover:bg-barbie-bg-soft"
                    >
                      <MoveIcon />
                      <span>Mover</span>
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {availableLocations.length > 0 && (
          <div className="flex min-w-0 gap-2">
            <label htmlFor="location-select" className="sr-only">
              Selecionar local
            </label>
            <select
              id="location-select"
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-barbie-accent bg-white px-3 py-2 text-sm text-barbie-text focus:border-barbie-primary focus:outline-none focus:ring-2 focus:ring-barbie-primary/30"
            >
              <option value="">Adicionar local...</option>
              {availableLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.roomName} — {loc.name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addLocationEntry}
              disabled={!selectedLocationId}
            >
              Adicionar
            </Button>
          </div>
        )}
      </fieldset>

      <Button type="submit" loading={submitting} fullWidth size="lg">
        {isEditing ? 'Salvar alterações' : 'Criar produto'}
      </Button>

      <Modal
        open={moveFromId !== null}
        onClose={closeMoveModal}
        title="Mover itens"
      >
        {(() => {
          const source = moveFromId
            ? locationEntries.find((e) => e.locationId === moveFromId)
            : null
          if (!source) return null
          const destinationOptions = allLocations.filter(
            (l) => l.id !== moveFromId,
          )
          const clampedQty = Math.min(
            Math.max(1, moveQty || 1),
            source.quantity,
          )
          return (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-barbie-text/70">
                Movendo de <strong>{source.locationName}</strong>{' '}
                <span className="text-barbie-text/50">
                  ({source.roomName})
                </span>
                . Há <strong>{source.quantity}</strong> unidade
                {source.quantity !== 1 ? 's' : ''} disponíve
                {source.quantity !== 1 ? 'is' : 'l'}.
              </p>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="move-destination"
                  className="text-sm font-semibold text-barbie-text"
                >
                  Destino
                </label>
                <select
                  id="move-destination"
                  value={moveToId}
                  onChange={(e) => setMoveToId(e.target.value)}
                  className="w-full rounded-xl border border-barbie-accent bg-white px-4 py-2.5 text-sm text-barbie-text focus:border-barbie-primary focus:outline-none focus:ring-2 focus:ring-barbie-primary/30"
                >
                  <option value="">Selecione um local...</option>
                  {destinationOptions.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.roomName} — {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="move-qty"
                  className="text-sm font-semibold text-barbie-text"
                >
                  Quantidade a mover
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setMoveQty((q) => Math.max(1, (q || 1) - 1))
                    }
                    disabled={clampedQty <= 1}
                    aria-label="Diminuir quantidade a mover"
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-barbie-accent bg-white text-lg font-bold leading-none text-barbie-dark hover:bg-barbie-bg-soft disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    −
                  </button>
                  <input
                    id="move-qty"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={moveQty}
                    onChange={(e) => {
                      const parsed = parseInt(
                        e.target.value.replace(/[^0-9]/g, ''),
                        10,
                      )
                      if (Number.isNaN(parsed)) {
                        setMoveQty(1)
                        return
                      }
                      setMoveQty(
                        Math.min(source.quantity, Math.max(1, parsed)),
                      )
                    }}
                    className="w-20 rounded-lg border border-barbie-accent bg-white px-2 py-2 text-center text-base tabular-nums focus:border-barbie-primary focus:outline-none focus:ring-2 focus:ring-barbie-primary/30"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setMoveQty((q) =>
                        Math.min(source.quantity, (q || 0) + 1),
                      )
                    }
                    disabled={clampedQty >= source.quantity}
                    aria-label="Aumentar quantidade a mover"
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-barbie-accent bg-white text-lg font-bold leading-none text-barbie-dark hover:bg-barbie-bg-soft disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => setMoveQty(source.quantity)}
                    className="ml-auto rounded-lg border border-barbie-accent bg-white px-2 py-1 text-xs font-semibold text-barbie-dark hover:bg-barbie-bg-soft"
                  >
                    Tudo
                  </button>
                </div>
                <p className="text-xs text-barbie-text/50">
                  {clampedQty === source.quantity
                    ? 'Remove completamente este local do produto.'
                    : `Restarão ${source.quantity - clampedQty} no local atual.`}
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={closeMoveModal}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  fullWidth
                  onClick={confirmMove}
                  disabled={!moveToId}
                >
                  Mover
                </Button>
              </div>
            </div>
          )
        })()}
      </Modal>
    </form>
  )
}
