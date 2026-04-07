'use client'

import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { createLocation, updateLocation } from '@/lib/api/locations'
import { uploadPhoto, deletePhoto } from '@/lib/api/photos'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { showToast } from '@/components/ui/Toast'
import { PhotoUploadZone, type PhotoSlot } from '@/components/photos/PhotoUploadZone'
import type { LocationSummary, RoomSummary, PhotoResponse } from '@/lib/api/types'

interface LocationFormData {
  roomId: string
  name: string
  description: string
}

interface LocationFormProps {
  location?: LocationSummary
  rooms: RoomSummary[]
  defaultRoomId?: string
  existingPhotos?: PhotoResponse[]
}

function createEmptySlots(): PhotoSlot[] {
  return [
    { file: null, existingUrl: null, existingId: null, progress: null },
    { file: null, existingUrl: null, existingId: null, progress: null },
    { file: null, existingUrl: null, existingId: null, progress: null },
  ]
}

export function LocationForm({
  location,
  rooms,
  defaultRoomId,
  existingPhotos,
}: LocationFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const isEditing = !!location

  const [photoSlots, setPhotoSlots] = useState<PhotoSlot[]>(() => {
    if (existingPhotos && existingPhotos.length > 0) {
      const slots = createEmptySlots()
      existingPhotos.forEach((p, i) => {
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LocationFormData>({
    defaultValues: {
      roomId: location?.roomId ?? defaultRoomId ?? '',
      name: location?.name ?? '',
      description: location?.description ?? '',
    },
  })

  async function onSubmit(data: LocationFormData) {
    setSubmitting(true)
    try {
      let locationId: string

      if (isEditing) {
        await updateLocation(location.id, {
          name: data.name.trim(),
          description: data.description.trim() || null,
        })
        locationId = location.id
      } else {
        const created = await createLocation({
          roomId: data.roomId,
          name: data.name.trim(),
          description: data.description.trim() || null,
        })
        locationId = created.id
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
          await uploadPhoto('location', locationId, slot.file)
        } finally {
          clearInterval(interval)
          setPhotoSlots((prev) =>
            prev.map((s, idx) => (idx === i ? { ...s, progress: 100 } : s)),
          )
        }
      }

      showToast(
        isEditing ? 'Local atualizado com sucesso!' : 'Local criado com sucesso!',
        'success',
      )
      window.location.href = `/locations/${locationId}`
    } catch {
      showToast('Erro ao salvar local. Tente novamente.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4"
    >
      {!isEditing && (
        <div className="flex flex-col gap-1">
          <label
            htmlFor="roomId"
            className="text-sm font-semibold text-barbie-text"
          >
            Cômodo
          </label>
          <select
            id="roomId"
            className="w-full rounded-xl border border-barbie-accent bg-white px-4 py-2.5 text-barbie-text focus:border-barbie-primary focus:outline-none focus:ring-2 focus:ring-barbie-primary/30"
            {...register('roomId', { required: 'Selecione um cômodo' })}
          >
            <option value="">Selecione um cômodo...</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
          {errors.roomId && (
            <p role="alert" className="text-xs text-red-600">
              {errors.roomId.message}
            </p>
          )}
        </div>
      )}

      <Input
        label="Nome"
        placeholder="ex: Guarda-roupa superior"
        error={errors.name?.message}
        {...register('name', {
          required: 'Nome é obrigatório',
          maxLength: { value: 100, message: 'Máximo 100 caracteres' },
        })}
      />

      <Textarea
        label="Descrição (opcional)"
        placeholder="ex: Prateleira de cima, lado direito"
        rows={3}
        {...register('description', {
          maxLength: { value: 500, message: 'Máximo 500 caracteres' },
        })}
      />

      <PhotoUploadZone slots={photoSlots} onChange={setPhotoSlots} onDeleteExisting={(id) => deletePhoto(id).catch(() => {})} />

      <Button type="submit" loading={submitting} fullWidth>
        {isEditing ? 'Salvar alterações' : 'Criar local'}
      </Button>
    </form>
  )
}
