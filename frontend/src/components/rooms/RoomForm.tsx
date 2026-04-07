'use client'

import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { createRoom, updateRoom } from '@/lib/api/rooms'
import { uploadPhoto, deletePhoto } from '@/lib/api/photos'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { showToast } from '@/components/ui/Toast'
import { PhotoUploadZone, type PhotoSlot } from '@/components/photos/PhotoUploadZone'
import type { RoomSummary, CreateRoomRequest, PhotoResponse } from '@/lib/api/types'

interface RoomFormData {
  name: string
  description: string
}

interface RoomFormProps {
  room?: RoomSummary
  existingPhotos?: PhotoResponse[]
}

function createEmptySlots(): PhotoSlot[] {
  return [
    { file: null, existingUrl: null, existingId: null, progress: null },
    { file: null, existingUrl: null, existingId: null, progress: null },
    { file: null, existingUrl: null, existingId: null, progress: null },
  ]
}

export function RoomForm({ room, existingPhotos }: RoomFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const isEditing = !!room

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
  } = useForm<RoomFormData>({
    defaultValues: {
      name: room?.name ?? '',
      description: room?.description ?? '',
    },
  })

  async function onSubmit(data: RoomFormData) {
    setSubmitting(true)
    try {
      const payload: CreateRoomRequest = {
        name: data.name.trim(),
        description: data.description.trim() || null,
      }

      let roomId: string

      if (isEditing) {
        await updateRoom(room.id, payload)
        roomId = room.id
      } else {
        const created = await createRoom(payload)
        roomId = created.id
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
          await uploadPhoto('room', roomId, slot.file)
        } finally {
          clearInterval(interval)
          setPhotoSlots((prev) =>
            prev.map((s, idx) => (idx === i ? { ...s, progress: 100 } : s)),
          )
        }
      }

      showToast(
        isEditing ? 'Cômodo atualizado com sucesso!' : 'Cômodo criado com sucesso!',
        'success',
      )
      window.location.href = `/rooms/${roomId}`
    } catch (err) {
      console.error('Erro ao salvar cômodo:', err)
      const msg = err instanceof Error ? err.message : 'Erro ao salvar. Tente novamente.'
      showToast(msg, 'error')
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
      <Input
        label="Nome"
        placeholder="ex: Sala de estar"
        error={errors.name?.message}
        {...register('name', {
          required: 'Nome é obrigatório',
          maxLength: { value: 100, message: 'Máximo 100 caracteres' },
        })}
      />
      <Textarea
        label="Descrição (opcional)"
        placeholder="ex: Inclui sofá, estante e TV"
        rows={3}
        {...register('description', {
          maxLength: { value: 500, message: 'Máximo 500 caracteres' },
        })}
      />
      <PhotoUploadZone slots={photoSlots} onChange={setPhotoSlots} onDeleteExisting={(id) => deletePhoto(id).catch(() => {})} />
      <Button type="submit" loading={submitting} fullWidth>
        {isEditing ? 'Salvar alterações' : 'Criar cômodo'}
      </Button>
    </form>
  )
}
