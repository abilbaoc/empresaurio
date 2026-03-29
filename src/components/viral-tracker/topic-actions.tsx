'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteTopic, updateTopicStatus } from '@/app/actions/viral-topics'
import { buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TopicStatus } from '@/lib/types'

const STATUS_TRANSITIONS: Record<TopicStatus, { value: TopicStatus; label: string }[]> = {
  new: [{ value: 'in_review', label: 'Mover a En revisión' }, { value: 'archived', label: 'Archivar' }],
  in_review: [{ value: 'approved', label: 'Aprobar' }, { value: 'archived', label: 'Archivar' }],
  approved: [{ value: 'scripted', label: 'Marcar como guionizado' }, { value: 'archived', label: 'Archivar' }],
  scripted: [{ value: 'archived', label: 'Archivar' }],
  archived: [{ value: 'new', label: 'Restaurar' }],
}

interface TopicActionsProps {
  topicId: string
  status: TopicStatus
}

export function TopicActions({ topicId, status }: TopicActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('¿Eliminar este topic?')) return
    setLoading(true)
    await deleteTopic(topicId)
    setLoading(false)
  }

  async function handleStatusChange(newStatus: TopicStatus) {
    setLoading(true)
    await updateTopicStatus(topicId, newStatus)
    setLoading(false)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={loading}
        className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-8 w-8')}
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(`/viral-tracker/${topicId}`)}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        {STATUS_TRANSITIONS[status].map((t) => (
          <DropdownMenuItem key={t.value} onClick={() => handleStatusChange(t.value)}>
            {t.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
