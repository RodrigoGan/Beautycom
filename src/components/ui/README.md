# Componentes UI

## BackButton Component

Um componente reutilizável de botão "Voltar" com design elegante e funcionalidade de scroll para o topo.

### Uso Básico

```tsx
import { BackButton } from "@/components/ui/back-button"

// Uso padrão
<BackButton />

// Com variantes
<BackButton variant="outline" size="sm" />

// Com texto customizado
<BackButton>Voltar ao Início</BackButton>
```

### Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `variant` | `"default" \| "ghost" \| "outline"` | `"ghost"` | Variante do botão |
| `size` | `"sm" \| "default" \| "lg"` | `"default"` | Tamanho do botão |
| `className` | `string` | `""` | Classes CSS adicionais |
| `children` | `React.ReactNode` | `"Voltar"` | Texto do botão |

### Funcionalidades

- **Navegação**: Volta para a página anterior usando `navigate(-1)`
- **Scroll para o topo**: Automaticamente scrolla para o topo da página
- **Animações**: Efeito hover com escala e movimento da seta
- **Responsivo**: Funciona em todos os tamanhos de tela

---

## SelectionChips Component

Um componente moderno de seleção múltipla usando chips elegantes, perfeito para substituir checkboxes básicos.

### Uso Básico

```tsx
import { SelectionChips } from "@/components/ui/selection-chips"
import { BEAUTY_CATEGORIES } from "@/lib/constants"

const [selectedItems, setSelectedItems] = useState<string[]>([])

<SelectionChips
  items={BEAUTY_CATEGORIES}
  selectedItems={selectedItems}
  onSelectionChange={setSelectedItems}
  title="Preferências"
  subtitle="Selecione suas preferências (pode escolher mais de uma)"
/>
```

### Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `items` | `string[]` | - | Lista de itens para seleção |
| `selectedItems` | `string[]` | - | Itens atualmente selecionados |
| `onSelectionChange` | `(items: string[]) => void` | - | Callback quando seleção muda |
| `title` | `string` | - | Título da seção |
| `subtitle` | `string` | - | Subtítulo explicativo |
| `disabled` | `boolean` | `false` | Desabilita a seleção |
| `maxSelections` | `number` | - | Limite máximo de seleções |
| `className` | `string` | `""` | Classes CSS adicionais |

### Funcionalidades

- **Design Moderno**: Chips elegantes com gradientes e sombras
- **Animações**: Hover com escala e transições suaves
- **Responsivo**: Grid de 2 colunas que se adapta
- **Acessibilidade**: Suporte completo a teclado e screen readers
- **Limite de Seleções**: Opcional com contador visual
- **Estados Visuais**: Selecionado, hover, disabled

### Exemplos de Uso

#### Preferências de Usuário
```tsx
<SelectionChips
  items={BEAUTY_CATEGORIES}
  selectedItems={preferences}
  onSelectionChange={setPreferences}
  title="Preferências"
  subtitle="Selecione suas preferências (pode escolher mais de uma)"
/>
```

#### Habilidades de Profissional
```tsx
<SelectionChips
  items={BEAUTY_CATEGORIES}
  selectedItems={skills}
  onSelectionChange={setSkills}
  title="Habilidades"
  subtitle="Selecione suas habilidades profissionais"
  maxSelections={5}
/>
```

#### Filtros de Busca
```tsx
<SelectionChips
  items={BEAUTY_CATEGORIES}
  selectedItems={filters}
  onSelectionChange={setFilters}
  title="Filtrar por Categoria"
  className="mb-6"
/>
```

### Constantes

As categorias de beleza estão centralizadas em `@/lib/constants`:

```tsx
import { BEAUTY_CATEGORIES, BeautyCategory } from "@/lib/constants"

// Lista completa de categorias
console.log(BEAUTY_CATEGORIES)

// Tipo TypeScript para categorias
const category: BeautyCategory = "Cabelos Femininos"
```

---

## Instalação

Os componentes já estão disponíveis em `@/components/ui/` e podem ser importados diretamente em qualquer página. 