import { DndContext, PointerSensor, TouchSensor, KeyboardSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ReactNode } from 'react'
import { reorder } from '../lib/planning'

function Row<T extends { id: string }>({ item, children }: { item: T; children: (handle: ReactNode) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id })
  const handle = <span className="drag" aria-label="Ziehen zum Umsortieren" {...attributes} {...listeners}>⠿</span>
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>{children(handle)}</div>
}

export default function SortableList<T extends { id: string }>(props: {
  items: T[]; onReorder: (next: T[]) => void; children: (item: T, handle: ReactNode) => ReactNode
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  function end(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return
    const from = props.items.findIndex(i => i.id === e.active.id)
    const to = props.items.findIndex(i => i.id === e.over!.id)
    if (from >= 0 && to >= 0) props.onReorder(reorder(props.items, from, to))
  }
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={end}>
      <SortableContext items={props.items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        {props.items.map(it => <Row key={it.id} item={it}>{h => props.children(it, h)}</Row>)}
      </SortableContext>
    </DndContext>
  )
}
