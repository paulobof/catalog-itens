'use client'

import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { createRoom, updateRoom } from '@/lib/api/rooms'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { showToast } from '@/components/ui/Toast'
import type { RoomSummary, CreateRoomRequest } from '@/lib/api/types'

interface RoomFormData {
  name: string
  description: string
}

interface RoomFormProps {
  room?: RoomSummary
}

export function RoomForm({ room }: RoomFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const isEditing = !!room

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
      if (isEditing) {
        await updateRoom(room.id, payload)
        showToast('Cômodo atualizado com sucesso!', 'success')
        window.location.href = `/rooms/${room.id}`
      } else {
        const created = await createRoom(payload)
        showToast('Cômodo criado com sucesso!', 'success')
        window.location.href = `/rooms/${created.id}`
      }
    } catch {
      showToast('Erro ao salvar cômodo. Tente novamente.', 'error')
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
      <Button type="submit" loading={submitting} fullWidth>
        {isEditing ? 'Salvar alterações' : 'Criar cômodo'}
      </Button>
    </form>
  )
}
