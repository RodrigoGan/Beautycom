import { useState } from "react"
import { cn } from "@/lib/utils"
import { CATEGORY_ICONS } from "@/lib/constants"

interface SelectionChipProps {
  label: string
  selected: boolean
  onToggle: (selected: boolean) => void
  disabled?: boolean
}

function SelectionChip({ label, selected, onToggle, disabled = false }: SelectionChipProps) {
  const icon = CATEGORY_ICONS[label as keyof typeof CATEGORY_ICONS] || "✨"
  
  return (
    <button
      type="button"
      onClick={() => !disabled && onToggle(!selected)}
      disabled={disabled}
      className={cn(
        "px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 border-2",
        "hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/20",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
        "flex items-center gap-2",
        selected
          ? "bg-gradient-hero text-white border-primary/30 shadow-beauty-glow"
          : "bg-background/80 text-foreground border-primary/10 hover:border-primary/30 hover:bg-gradient-card/50 backdrop-blur-sm"
      )}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </button>
  )
}

interface SelectionChipsProps {
  items: string[]
  selectedItems: string[]
  onSelectionChange: (selectedItems: string[]) => void
  title?: string
  subtitle?: string
  disabled?: boolean
  maxSelections?: number
  className?: string
}

export function SelectionChips({
  items,
  selectedItems,
  onSelectionChange,
  title,
  subtitle,
  disabled = false,
  maxSelections,
  className = ""
}: SelectionChipsProps) {
  const handleToggle = (item: string) => {
    if (disabled) return

    const newSelection = selectedItems.includes(item)
      ? selectedItems.filter(selected => selected !== item)
      : maxSelections && selectedItems.length >= maxSelections
        ? selectedItems
        : [...selectedItems, item]

    onSelectionChange(newSelection)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {title && (
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <SelectionChip
            key={item}
            label={item}
            selected={selectedItems.includes(item)}
            onToggle={() => handleToggle(item)}
            disabled={disabled}
          />
        ))}
      </div>
      
      {maxSelections && (
        <p className="text-xs text-muted-foreground text-center">
          {selectedItems.length}/{maxSelections} selecionados
        </p>
      )}
    </div>
  )
} 