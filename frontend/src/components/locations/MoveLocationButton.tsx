'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { showToast } from '@/components/ui/Toast'
import { updateLocation } from '@/lib/api/locations'
import type { LocationDetail, RoomSummary } from '@/lib/api/types'

interface MoveLocationButtonProps {
  location: LocationDetail
  rooms: RoomSummary[]
}

export function MoveLocationButton({ location, rooms }: MoveLocationButtonProps) {
  const [open, setOpen] = useState(false)
  const [selectedRoomId, setSelectedRoomId] = useState(location.roomId)
  const [saving, setSaving] = useState(false)
  const [, startTransition] = useTransition()
  const router = useRouter()

  const otherRooms = rooms.filter((r) => r.id !== location.roomId)

  async function handleMove() {
    if (!selectedRoomId || selectedRoomId === location.roomId) {
      setOpen(false)
      return
    }
    setSaving(true)
    try {
      await updateLocation(location.id, {
        roomId: selectedRoomId,
        name: location.name,
        description: location.description,
      })
      const destName = rooms.find((r) => r.id === selectedRoomId)?.name ?? 'cômodo'
      showToast(`Local movido para ${destName}`, 'success')
      setOpen(false)
      startTransition(() => {
        router.refresh()
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao mover o local'
      showToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (otherRooms.length === 0) return null

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSelectedRoomId(location.roomId)
          setOpen(true)
        }}
        className="rounded-xl px-3 py-1.5 text-sm font-semibold text-barbie-primary hover:bg-barbie-bg-soft"
      >
        Mover
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Mover "${location.name}" para outro cômodo`}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-barbie-text/70">
            Atualmente em <strong>{location.roomName}</strong>. Escolha o novo cômodo:
          </p>

          <ul className="flex flex-col gap-2" role="radiogroup" aria-label="Cômodo destino">
            {otherRooms.map((room) => {
              const selected = selectedRoomId === room.id
              return (
                <li key={room.id}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                      selected
                        ? 'border-barbie-primary bg-barbie-bg-soft font-semibold text-barbie-text'
                        : 'border-barbie-accent/30 bg-white text-barbie-text hover:bg-barbie-bg-light'
                    }`}
                  >
                    <span className="truncate">{room.name}</span>
                    {selected && (
                      <span
                        aria-hidden="true"
                        className="ml-2 shrink-0 text-barbie-primary"
                      >
                        ✓
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              fullWidth
              onClick={handleMove}
              loading={saving}
              disabled={
                saving ||
                !selectedRoomId ||
                selectedRoomId === location.roomId
              }
            >
              Mover
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
