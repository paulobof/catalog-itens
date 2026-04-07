'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { createTag, deleteTag } from '@/lib/api/tags'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/Input'
import { showToast } from '@/components/ui/Toast'
import type { TagResponse } from '@/lib/api/types'

interface TagsManagerProps {
  initialTags: TagResponse[]
}

interface CreateTagFormData {
  name: string
  color: string
}

const DEFAULT_COLORS = [
  '#ec407a',
  '#f06292',
  '#e91e63',
  '#9c27b0',
  '#3f51b5',
  '#2196f3',
  '#009688',
  '#4caf50',
  '#ff9800',
  '#795548',
]

export function TagsManager({ initialTags }: TagsManagerProps) {
  const [tags, setTags] = useState<TagResponse[]>(initialTags)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pendingTag, setPendingTag] = useState<TagResponse | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateTagFormData>({
    defaultValues: { name: '', color: DEFAULT_COLORS[0] ?? '#ec407a' },
  })

  const colorValue = watch('color')

  async function onSubmit(data: CreateTagFormData) {
    setSubmitting(true)
    try {
      const created = await createTag({
        name: data.name.trim(),
        color: data.color || null,
      })
      setTags((prev) => [...prev, created])
      reset({ name: '', color: DEFAULT_COLORS[0] ?? '#ec407a' })
      showToast('Tag criada com sucesso!', 'success')
    } catch {
      showToast('Erro ao criar tag.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmDeleteTag() {
    if (!pendingTag) return
    setDeletingId(pendingTag.id)
    try {
      await deleteTag(pendingTag.id)
      setTags((prev) => prev.filter((t) => t.id !== pendingTag.id))
      showToast(`Tag "${pendingTag.name}" removida.`, 'info')
      setPendingTag(null)
    } catch {
      showToast('Erro ao remover tag.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Criar nova tag">
        <h2 className="mb-3 text-sm font-bold text-barbie-text/70 uppercase tracking-wider">
          Nova tag
        </h2>
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-3"
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
                {watch('name') || 'Tag'}
              </Badge>
            </div>
          )}

          <Button type="submit" loading={submitting} variant="primary">
            Criar tag
          </Button>
        </form>
      </section>

      <section aria-label="Tags existentes">
        <h2 className="mb-3 text-sm font-bold text-barbie-text/70 uppercase tracking-wider">
          Tags ({tags.length})
        </h2>

        {tags.length === 0 ? (
          <p className="text-sm text-barbie-text/50">
            Nenhuma tag criada ainda.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li key={tag.id} className="flex items-center gap-1">
                <Badge variant="custom" color={tag.color}>
                  {tag.name}
                </Badge>
                <button
                  type="button"
                  onClick={() => setPendingTag(tag)}
                  disabled={deletingId === tag.id}
                  aria-label={`Remover tag ${tag.name}`}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-xs text-barbie-text/30 hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={pendingTag !== null}
        title="Remover tag?"
        description={
          pendingTag && (
            <p>
              A tag <strong>{pendingTag.name}</strong> será desassociada de
              todos os produtos. Essa ação não pode ser desfeita.
            </p>
          )
        }
        confirmLabel="Remover"
        destructive
        onConfirm={confirmDeleteTag}
        onCancel={() => setPendingTag(null)}
      />
    </div>
  )
}
