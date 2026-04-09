'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { updateTag } from '@/lib/api/tags'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { showToast } from '@/components/ui/Toast'
import type { TagResponse } from '@/lib/api/types'
import { DEFAULT_COLORS } from './constants'

interface EditTagDialogProps {
  tag: TagResponse | null
  onClose: () => void
  onUpdated: (tag: TagResponse) => void
}

interface EditTagFormData {
  name: string
  color: string
}

export function EditTagDialog({ tag, onClose, onUpdated }: EditTagDialogProps) {
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditTagFormData>({
    defaultValues: { name: '', color: DEFAULT_COLORS[0] },
  })

  useEffect(() => {
    if (tag) {
      reset({
        name: tag.name,
        color: tag.color ?? DEFAULT_COLORS[0],
      })
    }
  }, [tag, reset])

  const colorValue = watch('color')
  const nameValue = watch('name')

  async function onSubmit(data: EditTagFormData) {
    if (!tag) return
    setSubmitting(true)
    try {
      const updated = await updateTag(tag.id, {
        name: data.name.trim(),
        color: data.color || null,
      })
      showToast('Tag atualizada com sucesso!', 'success')
      onUpdated(updated)
      onClose()
    } catch {
      showToast('Erro ao atualizar tag.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={tag !== null}
      onClose={submitting ? () => {} : onClose}
      title="Editar tag"
      variant="centered"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-4"
      >
        <Input
          label="Nome"
          placeholder="ex: Ferramentas"
          error={errors.name?.message}
          {...register('name', {
            required: 'Nome é obrigatório',
            maxLength: { value: 50, message: 'Máximo 50 caracteres' },
          })}
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-barbie-text">Cor</label>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Selecionar cor ${color}`}
                aria-pressed={colorValue === color}
                onClick={() => setValue('color', color)}
                style={{ backgroundColor: color }}
                className={`h-8 w-8 rounded-full border-2 transition-transform ${
                  colorValue === color
                    ? 'scale-125 border-white shadow-md'
                    : 'border-transparent hover:scale-110'
                }`}
              />
            ))}
            <input
              type="color"
              {...register('color')}
              aria-label="Cor personalizada"
              className="h-8 w-8 cursor-pointer rounded-full border-0 bg-transparent p-0"
            />
          </div>
        </div>

        {colorValue && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-barbie-text/60">Preview:</span>
            <Badge variant="custom" color={colorValue}>
              {nameValue || 'Tag'}
            </Badge>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="primary" fullWidth loading={submitting}>
            Salvar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
