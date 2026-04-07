'use client'

import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { createProduct, updateProduct } from '@/lib/api/products'
import { createTag } from '@/lib/api/tags'
import { uploadPhoto, deletePhoto } from '@/lib/api/photos'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
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

  function updateLocationQuantity(locationId: string, quantity: number) {
    setLocationEntries((prev) =>
      prev.map((e) => (e.locationId === locationId ? { ...e, quantity } : e)),
    )
  }

  function removeLocationEntry(locationId: string) {
    setLocationEntries((prev) => prev.filter((e) => e.locationId !== locationId))
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
                className="flex min-w-0 items-center gap-2 rounded-xl border border-barbie-accent/30 bg-barbie-surface px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-barbie-text">
                    {entry.locationName}
                  </span>
                  <span className="text-xs text-barbie-text/50">
                    {entry.roomName}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <label
                    htmlFor={`qty-${entry.locationId}`}
                    className="sr-only"
                  >
                    Quantidade em {entry.locationName}
                  </label>
                  <input
                    id={`qty-${entry.locationId}`}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={99999}
                    value={entry.quantity}
                    onChange={(e) =>
                      updateLocationQuantity(
                        entry.locationId,
                        Math.max(1, parseInt(e.target.value, 10) || 1),
                      )
                    }
                    className="w-14 rounded-lg border border-barbie-accent bg-white px-1 py-1 text-center text-sm focus:border-barbie-primary focus:outline-none focus:ring-1 focus:ring-barbie-primary/30"
                  />
                  <button
                    type="button"
                    onClick={() => removeLocationEntry(entry.locationId)}
                    aria-label={`Remover ${entry.locationName}`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-barbie-text/40 hover:bg-red-50 hover:text-red-500"
                  >
                    ✕
                  </button>
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
    </form>
  )
}
