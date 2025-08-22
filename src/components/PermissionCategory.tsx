import React from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface Permission {
  key: string
  label: string
  description?: string
}

interface PermissionCategoryProps {
  title: string
  icon: string
  permissions: Permission[]
  selectedPermissions: Record<string, boolean>
  onPermissionChange: (key: string, checked: boolean) => void
  onSelectAll?: () => void
  onClearAll?: () => void
  isExpanded: boolean
  onToggle: () => void
}

export const PermissionCategory: React.FC<PermissionCategoryProps> = ({
  title,
  icon,
  permissions,
  selectedPermissions,
  onPermissionChange,
  onSelectAll,
  onClearAll,
  isExpanded,
  onToggle
}) => {
  const selectedCount = permissions.filter(p => selectedPermissions[p.key]).length
  const totalCount = permissions.length
  
  return (
    <div className="border rounded-lg bg-card">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{title}</span>
              <Badge variant="secondary" className="text-xs">
                {selectedCount}/{totalCount}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedCount === 0 ? 'Nenhuma permissão selecionada' :
               selectedCount === totalCount ? 'Todas as permissões selecionadas' :
               `${selectedCount} de ${totalCount} permissões selecionadas`}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      
      {isExpanded && (
        <div className="border-t bg-muted/30">
          {/* Ações em massa */}
          {(onSelectAll || onClearAll) && (
            <div className="p-3 border-b bg-background/50 flex gap-2">
              {onSelectAll && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSelectAll}
                  disabled={selectedCount === totalCount}
                  className="text-xs h-7"
                >
                  Selecionar Todas
                </Button>
              )}
              {onClearAll && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearAll}
                  disabled={selectedCount === 0}
                  className="text-xs h-7"
                >
                  Limpar Todas
                </Button>
              )}
            </div>
          )}
          
          {/* Lista de permissões */}
          <div className="p-3 space-y-2">
            {permissions.map((permission) => (
              <div key={permission.key} className="flex items-start space-x-3 p-2 rounded-md hover:bg-background/50">
                <Checkbox
                  id={permission.key}
                  checked={selectedPermissions[permission.key] || false}
                  onCheckedChange={(checked) => onPermissionChange(permission.key, checked as boolean)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <label 
                    htmlFor={permission.key} 
                    className="text-sm font-medium cursor-pointer block"
                  >
                    {permission.label}
                  </label>
                  {permission.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {permission.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
