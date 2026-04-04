import { getTags } from '@/lib/api/tags'
import { PageHeader } from '@/components/layout/PageHeader'
import { TagsManager } from '@/components/tags/TagsManager'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Tags' }

export default async function TagsPage() {
  const tags = await getTags()

  return (
    <div>
      <PageHeader title="Tags" />
      <div className="px-4 py-4">
        <TagsManager initialTags={tags} />
      </div>
    </div>
  )
}
