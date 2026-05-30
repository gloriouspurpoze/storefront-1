import React, { useEffect, useRef, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
} from '../../components/ui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import {
  CheckCircle2,
  CircleOff,
  Copy,
  Eye,
  FolderTree,
  GripVertical,
  Layers,
  MoreVertical,
  Pencil,
  Plus,
  Star,
  Trash2,
} from 'lucide-react'
import type { PlatformService } from '../../services/api/platformServices.service'
import { platformServicesService } from '../../services/api/platformServices.service'
import { SubcategoriesService } from '../../services/api/subcategories.service'
import { appToast } from '../../lib/appToast'
import { cn, formatCurrency } from '../../lib/utils'
import type { CatalogCategoryGroup, SubcategoryLookup } from './platform-services-catalog-utils'

function hasDisplayableBasePrice(v: number | string | undefined | null): boolean {
  if (v == null) return false
  if (typeof v === 'string' && v.trim() === '') return false
  const n = Number(v)
  return !Number.isNaN(n)
}

function displayBasePrice(v: number | string | undefined | null): string {
  if (!hasDisplayableBasePrice(v)) return 'N/A'
  return formatCurrency(Number(v))
}

function SortableDragHandle({
  listeners,
  attributes,
  className,
  title,
}: {
  listeners: ReturnType<typeof useSortable>['listeners']
  attributes: ReturnType<typeof useSortable>['attributes']
  className?: string
  title?: string
}) {
  return (
    <button
      type="button"
      title={title}
      className={cn(
        'touch-none rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground',
        'cursor-grab active:cursor-grabbing',
        className,
      )}
      aria-label={title ?? 'Drag to reorder'}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  )
}

function SortableServiceRow({
  service,
  onPreview,
  onEdit,
  onDuplicate,
  onToggleActive,
  onToggleFeatured,
  onDelete,
}: {
  service: PlatformService
  onPreview: (s: PlatformService) => void
  onEdit: (s: PlatformService) => void
  onDuplicate: (s: PlatformService) => void
  onToggleActive: (s: PlatformService) => void
  onToggleFeatured: (s: PlatformService) => void
  onDelete: (s: PlatformService) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: service.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-lg border bg-background p-3 shadow-sm transition-colors hover:border-primary/25',
        isDragging && 'z-10 ring-2 ring-primary/30',
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <SortableDragHandle listeners={listeners} attributes={attributes} className="mt-1 shrink-0" />
          <Avatar className="h-11 w-11 shrink-0 rounded-lg">
            {service.image ? <AvatarImage src={service.image} alt="" /> : null}
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
              {service.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-semibold leading-tight">{service.name}</p>
            <p className="truncate text-xs text-muted-foreground">{service.slug}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="text-[10px] capitalize">
                {service.service_type}
              </Badge>
              <Badge
                variant={service.is_active ? 'default' : 'secondary'}
                className="cursor-pointer text-[10px]"
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  void onToggleActive(service)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation()
                    void onToggleActive(service)
                  }
                }}
              >
                {service.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="outline" className="text-[10px] capitalize">
                {service.status}
              </Badge>
              {service.is_featured ? (
                <Badge className="border-bloom-coral/40 bg-bloom-rose text-[10px] text-bloom-coral dark:border-bloom-coral dark:bg-bloom-coral dark:text-bloom-deep">
                  <Star className="mr-1 h-3 w-3" />
                  Featured
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center">
          <div className="text-right">
            <p className="text-lg font-bold tabular-nums text-primary">{displayBasePrice(service.base_price)}</p>
            <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
              <Star className="h-3.5 w-3.5 text-bloom-coral" />
              {service.average_rating ? Number(service.average_rating).toFixed(1) : '0.0'}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1 px-2">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => onPreview(service)}>
                <Eye className="mr-2 h-4 w-4 text-primary" />
                View details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(service)}>
                <Pencil className="mr-2 h-4 w-4 text-bloom-coral" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void onDuplicate(service)}>
                <Copy className="mr-2 h-4 w-4 text-primary" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => void onToggleActive(service)}>
                {service.is_active ? (
                  <>
                    <CircleOff className="mr-2 h-4 w-4 text-destructive" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4 text-storm-deep" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void onToggleFeatured(service)}>
                <Star className="mr-2 h-4 w-4" />
                {service.is_featured ? 'Unfeature' : 'Feature'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(service)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </li>
  )
}

function ServiceSortableList({
  dndContextId,
  services,
  onServicesReordered,
  ...actions
}: {
  dndContextId: string
  services: PlatformService[]
  onServicesReordered: (updates: { id: string; sort_order: number }[]) => void
  onPreview: (s: PlatformService) => void
  onEdit: (s: PlatformService) => void
  onDuplicate: (s: PlatformService) => void
  onToggleActive: (s: PlatformService) => void
  onToggleFeatured: (s: PlatformService) => void
  onDelete: (s: PlatformService) => void
}) {
  const [items, setItems] = useState(services)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setItems(services)
  }, [services])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || saving) return

    const oldIndex = items.findIndex((s) => s.id === active.id)
    const newIndex = items.findIndex((s) => s.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const next = [...items]
    const [moved] = next.splice(oldIndex, 1)
    next.splice(newIndex, 0, moved)
    setItems(next)

    const updates = next.map((s, i) => ({ id: s.id, sort_order: i }))
    setSaving(true)
    try {
      await platformServicesService.reorderServices(updates)
      onServicesReordered(updates)
      appToast('Service order updated', 'success')
    } catch {
      setItems(services)
      appToast('Failed to save service order', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (items.length === 0) {
    return <p className="py-2 text-sm text-muted-foreground">No services in this group.</p>
  }

  return (
    <DndContext
      id={dndContextId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(e) => void handleDragEnd(e)}
    >
      <SortableContext items={items.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {items.map((service) => (
            <SortableServiceRow key={service.id} service={service} {...actions} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

function SortableSubcategoryItem({
  subKey,
  accordionValue,
  canSave,
  header,
  content,
}: {
  subKey: string
  accordionValue: string
  canSave: boolean
  header: React.ReactNode
  content: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: subKey,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  return (
    <AccordionItem value={accordionValue} className={cn('border-border/80', isDragging && 'z-10')}>
      <div ref={setNodeRef} style={style} className="flex items-stretch">
        <SortableDragHandle
          listeners={listeners}
          attributes={attributes}
          className={cn('ml-0.5 mt-3 shrink-0', !canSave && 'opacity-50')}
          title={canSave ? 'Drag to reorder subcategory' : 'Subcategory order cannot be saved yet'}
        />
        <AccordionTrigger className="min-w-0 flex-1 py-3 text-sm hover:bg-muted/50 hover:no-underline">
          {header}
        </AccordionTrigger>
      </div>
      <AccordionContent className="pb-3 pt-0">{content}</AccordionContent>
    </AccordionItem>
  )
}

function SubcategorySortableAccordion({
  cat,
  subcategoryLookup,
  onSubgroupsReordered,
  renderSubgroupContent,
}: {
  cat: CatalogCategoryGroup
  subcategoryLookup: SubcategoryLookup
  onSubgroupsReordered: (updates: { id: string; sort_order: number }[]) => void
  renderSubgroupContent: (sub: CatalogCategoryGroup['subgroups'][number]) => React.ReactNode
}) {
  const sortableSubgroups = cat.subgroups.filter((s) => s.subKey !== '__general__')
  const generalSubgroups = cat.subgroups.filter((s) => s.subKey === '__general__')
  const sortableIds = sortableSubgroups.map((s) => s.subKey)
  const orderFingerprint = sortableSubgroups.map((s) => `${s.subKey}:${s.sortOrder ?? 0}`).join('|')
  const [order, setOrder] = useState(sortableSubgroups)
  const [saving, setSaving] = useState(false)
  const lastFingerprint = useRef(orderFingerprint)

  useEffect(() => {
    if (lastFingerprint.current !== orderFingerprint) {
      lastFingerprint.current = orderFingerprint
      setOrder(sortableSubgroups)
    }
  }, [orderFingerprint, sortableSubgroups])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const resolveSubcategoryId = (sub: CatalogCategoryGroup['subgroups'][number]) => {
    const fromMeta = sub.subcategoryId ?? subcategoryLookup.resolve(cat.categoryKey, sub.subKey)?.id
    if (fromMeta) return fromMeta
    const sample = sub.services[0]
    if (!sample) return undefined
    const catId = String(sample.category_id ?? '').trim().toLowerCase()
    const subId = String(sample.subcategory_id ?? '').trim()
    return (
      subcategoryLookup.resolve(cat.categoryKey, sub.subKey)?.id ??
      (catId ? subcategoryLookup.resolve(catId, sub.subKey)?.id : undefined) ??
      (subId ? subcategoryLookup.resolve(cat.categoryKey, subId)?.id : undefined) ??
      (catId && subId ? subcategoryLookup.resolve(catId, subId)?.id : undefined) ??
      sample.subcategory_id
    )
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || saving) return

    const oldIndex = order.findIndex((s) => s.subKey === active.id)
    const newIndex = order.findIndex((s) => s.subKey === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const previousOrder = order
    const next = arrayMove(order, oldIndex, newIndex)
    setOrder(next)

    const updates: { id: string; sort_order: number }[] = []
    for (let i = 0; i < next.length; i++) {
      const id = resolveSubcategoryId(next[i])
      if (!id) {
        setOrder(previousOrder)
        appToast('Could not match a subcategory record to save order. Reload and try again.', 'error')
        return
      }
      updates.push({ id, sort_order: i })
    }

    setSaving(true)
    try {
      await SubcategoriesService.reorderSubcategories(updates)
      onSubgroupsReordered(updates)
      appToast('Subcategory order updated', 'success')
    } catch {
      setOrder(sortableSubgroups)
      appToast('Failed to save subcategory order', 'error')
    } finally {
      setSaving(false)
    }
  }

  const catSlug = cat.categoryKey.replace(/[^a-zA-Z0-9_-]/g, '_')
  const dndContextId = `catalog-subcats-${catSlug}`

  const subcategoryHeader = (sub: CatalogCategoryGroup['subgroups'][number]) => (
    <div className="flex min-w-0 flex-1 flex-col items-stretch gap-0.5 pr-2 sm:flex-row sm:items-center sm:gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <FolderTree className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="font-medium">{sub.subLabel}</span>
        <Badge variant="outline" className="ml-auto shrink-0 tabular-nums sm:ml-0">
          {sub.services.length}
        </Badge>
      </div>
    </div>
  )

  return (
    <DndContext
      id={dndContextId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(e) => void handleDragEnd(e)}
    >
      <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
        <Accordion type="multiple" className="w-full border-l-2 border-primary/20 pl-3 sm:pl-4">
          {order.map((sub) => (
            <SortableSubcategoryItem
              key={`${cat.categoryKey}::${sub.subKey}`}
              subKey={sub.subKey}
              accordionValue={`sub-${catSlug}__${sub.subKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`}
              canSave={Boolean(resolveSubcategoryId(sub))}
              header={subcategoryHeader(sub)}
              content={renderSubgroupContent(sub)}
            />
          ))}
          {generalSubgroups.map((sub) => (
            <AccordionItem
              key={`${cat.categoryKey}::${sub.subKey}`}
              value={`sub-${catSlug}__${sub.subKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`}
              className="border-border/80"
            >
              <AccordionTrigger className="py-3 text-sm hover:bg-muted/50 hover:no-underline">
                <div className="flex min-w-0 flex-1 flex-col items-stretch gap-0.5 pr-2 sm:flex-row sm:items-center sm:gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <FolderTree className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="font-medium">{sub.subLabel}</span>
                    <Badge variant="outline" className="ml-auto shrink-0 tabular-nums sm:ml-0">
                      {sub.services.length}
                    </Badge>
                  </div>
                  {sub.subKey === '__general__' ? (
                    <span className="text-xs text-muted-foreground sm:ml-8">
                      Assign a subcategory on each service to organize and reorder them.
                    </span>
                  ) : null}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-3 pt-0">{renderSubgroupContent(sub)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </SortableContext>
    </DndContext>
  )
}

export type PlatformServicesCatalogViewProps = {
  loading: boolean
  catalogGroups: CatalogCategoryGroup[]
  truncatedCatalog?: boolean
  servicesShown: number
  totalCount: number
  catalogPageLimit: number
  onOpenTableView: () => void
  onCreate: () => void
  onServicesReordered: (updates: { id: string; sort_order: number }[]) => void
  onSubcategoriesReordered: (updates: { id: string; sort_order: number }[]) => void
  subcategoryLookup: SubcategoryLookup
  onPreview: (s: PlatformService) => void
  onEdit: (s: PlatformService) => void
  onDuplicate: (s: PlatformService) => void
  onToggleActive: (s: PlatformService) => void
  onToggleFeatured: (s: PlatformService) => void
  onDelete: (s: PlatformService) => void
}

export function PlatformServicesCatalogView({
  loading,
  catalogGroups,
  truncatedCatalog,
  servicesShown,
  totalCount,
  catalogPageLimit,
  onOpenTableView,
  onCreate,
  onServicesReordered,
  onSubcategoriesReordered,
  subcategoryLookup,
  onPreview,
  onEdit,
  onDuplicate,
  onToggleActive,
  onToggleFeatured,
  onDelete,
}: PlatformServicesCatalogViewProps) {
  const serviceActions = {
    onPreview,
    onEdit,
    onDuplicate,
    onToggleActive,
    onToggleFeatured,
    onDelete,
  }

  return (
    <div className="space-y-4">
      {truncatedCatalog ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-bloom-coral/40 bg-bloom-rose px-3 py-2 text-sm text-bloom-coral dark:border-bloom-coral dark:bg-bloom-coral/40 dark:text-bloom-deep">
          <span>
            Showing {servicesShown} of {totalCount} services (catalog loads up to {catalogPageLimit}).
          </span>
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-bloom-coral underline dark:text-bloom-deep"
            onClick={onOpenTableView}
          >
            Open table view
          </Button>
          <span className="text-muted-foreground dark:text-bloom-deep/90">for full pagination.</span>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Drag the <GripVertical className="inline h-3.5 w-3.5 align-text-bottom" /> handle to reorder subcategories and
        services. Order is saved automatically.
      </p>

      <Card className="overflow-hidden rounded-xl border shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-muted-foreground">Loading catalog…</div>
          ) : catalogGroups.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <p className="text-muted-foreground">No services match your filters.</p>
              <Button size="sm" onClick={onCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Create service
              </Button>
            </div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {catalogGroups.map((cat) => (
                <AccordionItem
                  key={cat.categoryKey}
                  value={`cat-${cat.categoryKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`}
                  className="border-b border-border/60 px-0"
                >
                  <AccordionTrigger className="rounded-none px-4 py-4 hover:bg-muted/40 hover:no-underline sm:px-6">
                    <div className="flex flex-1 flex-wrap items-center gap-3 text-left">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                        <Layers className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold tracking-tight">{cat.categoryLabel}</p>
                        <p className="text-xs text-muted-foreground">
                          {cat.subgroups.length} subcategor{cat.subgroups.length === 1 ? 'y' : 'ies'} ·{' '}
                          {cat.serviceCount} service{cat.serviceCount === 1 ? '' : 's'}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 tabular-nums">
                        {cat.serviceCount}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-0">
                    <div className="border-t bg-muted/20 px-2 pb-3 pt-2 sm:px-4">
                      <SubcategorySortableAccordion
                        cat={cat}
                        subcategoryLookup={subcategoryLookup}
                        onSubgroupsReordered={onSubcategoriesReordered}
                        renderSubgroupContent={(sub) => (
                          <ServiceSortableList
                            dndContextId={`catalog-svc-${cat.categoryKey.replace(/[^a-zA-Z0-9_-]/g, '_')}__${sub.subKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`}
                            services={sub.services}
                            onServicesReordered={onServicesReordered}
                            {...serviceActions}
                          />
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
