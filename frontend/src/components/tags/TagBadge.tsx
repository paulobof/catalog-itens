import { Badge } from '@/components/ui/Badge'
import type { TagResponse } from '@/lib/api/types'

interface TagBadgeProps {
  tag: TagResponse
}

export function TagBadge({ tag }: TagBadgeProps) {
  return (
    <Badge variant="custom" color={tag.color}>
      {tag.name}
    </Badge>
  )
}
