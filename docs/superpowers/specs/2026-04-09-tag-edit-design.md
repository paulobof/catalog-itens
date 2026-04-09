# Tag Edit — Design

**Date:** 2026-04-09
**Status:** Draft — pending implementation
**Scope:** Frontend only (backend + API client already in place)

## Problem

Users can create and delete tags in the `/tags` page, but there is no way to edit an existing tag's name or color. The backend endpoint `PUT /api/v1/tags/{id}` and the frontend API client `updateTag()` are already implemented — only the UI is missing.

## Goals

- Allow editing a tag's `name` and `color` without losing its associations with products.
- Keep the interaction consistent with the rest of the Barbie-themed UI.
- Use a **centered modal dialog** for the edit form (not the existing bottom-sheet variant of `Modal`).

## Non-goals

- Frontend unit tests for this feature. The frontend has no test harness today and adding one is out of scope.
- Dirty-check / confirmation prompt when closing with unsaved changes. The edit is small enough that this would be overkill.
- Surfacing the backend's validation messages verbatim (e.g., name conflict 409). A generic error toast is acceptable for v1.
- Bulk edit or reordering of tags.

## Architecture

Change is **frontend-only**, touching three existing files and adding two new ones:

| File | Change |
|---|---|
| `frontend/src/components/ui/Modal.tsx` | Add `variant?: 'sheet' \| 'centered'` prop |
| `frontend/src/app/globals.css` | Add `@keyframes scale-in` + `.animate-scale-in` class |
| `frontend/src/components/tags/constants.ts` | **New** — export `DEFAULT_COLORS` (extracted from `TagsManager`) |
| `frontend/src/components/tags/EditTagDialog.tsx` | **New** — centered modal with edit form |
| `frontend/src/components/tags/TagsManager.tsx` | Add pencil button + wire `EditTagDialog`, import `DEFAULT_COLORS` from constants |

No backend, API client, or type changes needed — `updateTag()`, `UpdateTagRequest`, and `TagResponse` already exist.

## Components

### `Modal.tsx` — refactor

Add a `variant` prop with default `'sheet'` so all existing callers (`ProductForm`, `CatalogBrowser`, `LocationForm`, etc.) continue to work unchanged.

```tsx
interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children?: React.ReactNode
  className?: string
  variant?: 'sheet' | 'centered'  // new, default 'sheet'
}
```

Variant differences (applied via `cn()`):

| | `sheet` (current) | `centered` (new) |
|---|---|---|
| Outer container | `flex flex-col justify-end` | `flex items-center justify-center` |
| Inner container | `rounded-t-3xl max-h-[85vh] animate-slide-up` | `rounded-3xl max-w-md mx-4 max-h-[85vh] animate-scale-in` |
| Drag handle | shown | hidden |

Everything else stays: focus trap, Escape key handling, `document.body.style.overflow` lock, backdrop click to close, close button.

### `globals.css` — new animation

```css
@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}

.animate-scale-in {
  animation: scale-in 0.2s ease-out forwards;
}
```

### `constants.ts` — shared color palette

Extracts the current `DEFAULT_COLORS` array from `TagsManager.tsx` into a shared module so both the create form (in `TagsManager`) and the new `EditTagDialog` import from the same source of truth.

```ts
// frontend/src/components/tags/constants.ts
export const DEFAULT_COLORS = [
  '#ec407a', '#f06292', '#e91e63', '#9c27b0', '#3f51b5',
  '#2196f3', '#009688', '#4caf50', '#ff9800', '#795548',
] as const
```

### `EditTagDialog.tsx` — new

```tsx
interface EditTagDialogProps {
  tag: TagResponse | null              // null = closed
  onClose: () => void
  onUpdated: (tag: TagResponse) => void
}
```

- `open = tag !== null`.
- Renders `<Modal variant="centered" title="Editar tag" open={open} onClose={onClose}>`.
- Uses `useForm<{ name: string; color: string }>` with `defaultValues: { name: '', color: DEFAULT_COLORS[0] }`.
- `useEffect` on `tag` runs `reset({ name: tag.name, color: tag.color ?? DEFAULT_COLORS[0] })` whenever a new tag is passed in — ensures the form reflects the tag being edited.
- Form body mirrors the "Nova tag" section in `TagsManager`: `<Input label="Nome" ... />`, color palette (map over `DEFAULT_COLORS`), `<input type="color">` for custom, `<Badge>` preview.
- Submit flow:
  1. `setSubmitting(true)`
  2. `await updateTag(tag.id, { name: data.name.trim(), color: data.color || null })`
  3. On success: `showToast('Tag atualizada', 'success')` → `onUpdated(updated)` → `onClose()`
  4. On error: `showToast('Erro ao atualizar tag', 'error')` → modal stays open
  5. `setSubmitting(false)` in `finally`
- Footer: `Cancelar` (secondary button → `onClose`) + `Salvar` (primary, `loading={submitting}`).

### `TagsManager.tsx` — changes

- Import `DEFAULT_COLORS` from `./constants` (remove local copy).
- Import `EditTagDialog`.
- New state: `const [editingTag, setEditingTag] = useState<TagResponse | null>(null)`.
- In the tag list `<li>`, add a pencil button **between** the badge and the ✕ button:

```tsx
<button
  type="button"
  onClick={() => setEditingTag(tag)}
  aria-label={`Editar tag ${tag.name}`}
  className="flex h-5 w-5 items-center justify-center rounded-full text-xs text-barbie-text/30 hover:bg-barbie-bg-soft hover:text-barbie-primary"
>
  ✏️
</button>
```

- Render `<EditTagDialog tag={editingTag} onClose={() => setEditingTag(null)} onUpdated={handleTagUpdated} />` next to the existing `ConfirmDialog`.
- `handleTagUpdated`:

```ts
function handleTagUpdated(updated: TagResponse) {
  setTags((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
}
```

## Data flow

```
click ✏️                              →  setEditingTag(tag)
EditTagDialog (tag !== null)          →  Modal opens, form reset to tag values
user edits name/color → clicks Salvar →  setSubmitting(true)
                                         updateTag(tag.id, {name, color})
success                               →  toast ✓
                                         onUpdated(updated) → setTags(prev.map(...))
                                         onClose() → editingTag = null → modal closes
error                                 →  toast ✗ → modal stays open, user can retry
Esc / overlay click / Cancelar        →  onClose() without saving
```

## Error handling and edge cases

| Case | Behavior |
|---|---|
| Empty name / name > 50 chars | Client-side validation blocks submit (same rules as create) |
| Backend 409 (name conflict) | Generic error toast; modal stays open |
| Backend 404 (tag deleted in another tab) | Error toast; modal stays open (acceptable — rare) |
| Network failure | Error toast; modal stays open; user can retry |
| Submit while loading | `Button` is `disabled` via `loading` prop — no double submission |
| Esc / overlay click during loading | Allowed — request may complete in background; optimistic refresh on next page load |
| Color is empty string | Sent as `null` to the backend (matches `CreateTagRequest` behavior) |
| Mobile viewport < 400px wide | `max-w-md mx-4` keeps 16px gutters; modal stays readable |

## Testing

- **Backend:** already covered by existing Spring Boot tests for `PUT /api/v1/tags/{id}`.
- **Frontend:** no unit tests (project has none today; introducing a framework is out of scope).
- **Manual verification checklist:**
  - [ ] Create tag → click ✏️ → rename → save → list updates in place (no reload).
  - [ ] Edit only color → save → badge and products using the tag reflect new color after reload.
  - [ ] Empty name on submit → validation blocks, error inline.
  - [ ] Name > 50 chars → validation blocks.
  - [ ] Esc closes without saving.
  - [ ] Click on dark overlay closes without saving.
  - [ ] Cancel button closes without saving.
  - [ ] Mobile (narrow viewport): modal is centered, doesn't overflow, color picker works.
  - [ ] Focus returns to pencil button after closing.
  - [ ] `ProductForm` modal and other existing modals still behave as bottom sheets (regression check for the `variant` default).

## Risks

- **Regression in existing modals** if the default `variant` is accidentally changed or the `cn()` merging is wrong. Mitigated by manual smoke test of one existing modal (e.g., `ProductForm`) before merging.
- **Animation jank on low-end devices** from `animate-scale-in`. Duration is short (0.2s), single property combo, should be fine.

## Out of scope (future work)

- Parse backend validation errors and show field-level messages (e.g., "Nome já existe").
- Drag-to-reorder tags.
- Bulk operations.
- Unit / component tests for the Tags feature — would require introducing Vitest or similar to the frontend first.
