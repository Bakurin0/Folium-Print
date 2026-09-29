# Plano 002: Unificação e Proteção de Tokens de Duração no Tailwind e Componentes

- **Commit Base:** `60ba95a`
- **Categoria:** Coesão & Tokens
- **Severidade:** ALTA
- **Status:** PENDENTE

---

## 1. Visão Geral e Contexto
No arquivo `tailwind.config.ts`, as classes de duração configuradas são:
- `duration-instant`: 120ms
- `duration-snappy`: 160ms
- `duration-normal`: 200ms
- `duration-modal`: 220ms

No entanto, em vários componentes (`HomeDashboard.tsx` e `ModelsSidebar.tsx`), foram utilizadas classes inexistentes como `duration-160` e `duration-140`. Como essas classes não existem no Tailwind por padrão, o navegador não aplica a duração especificada e recorre ao padrão do Tailwind (150ms) ou falha silenciosamente.

## 2. Padrões e Convenções
- Classes semânticas oficiais: `duration-snappy` (160ms) e `duration-instant` (120ms).
- Salvaguarda defensiva: registrar `140: '140ms'` e `160: '160ms'` diretamente no `tailwind.config.ts` para tolerância a falhas.

## 3. Escopo de Arquivos
- `tailwind.config.ts`
- `src/components/HomeDashboard.tsx`
- `src/components/ModelsSidebar.tsx`
- `src/components/VisualTemplateEditorModal.tsx`

## 4. Instruções Exatas de Implementação

### Passo 1: Atualizar `tailwind.config.ts`
Localizar `transitionDuration` em `tailwind.config.ts`:
```typescript
      transitionDuration: {
        'instant': '120ms',
        'snappy': '160ms',
        'normal': '200ms',
        'modal': '220ms',
      },
```
Atualizar para adicionar aliases defensivos:
```typescript
      transitionDuration: {
        'instant': '120ms',
        'snappy': '160ms',
        'normal': '200ms',
        'modal': '220ms',
        '140': '140ms',
        '160': '160ms',
      },
```

### Passo 2: Padronizar `src/components/HomeDashboard.tsx`
Substituir todas as ocorrências de `duration-160` por `duration-snappy`:
- Linha 51: `transition-all duration-160` -> `transition-all duration-snappy`
- Linha 245: `transition-all duration-160 ease-out` -> `transition-all duration-snappy ease-out`
- Linha 247: `transition-transform duration-160` -> `transition-transform duration-snappy`
- Linha 265: `transition-all duration-160 ease-out` -> `transition-all duration-snappy ease-out`
- Linha 267: `transition-transform duration-160` -> `transition-transform duration-snappy`
- Linha 327: `transition-all duration-160 ease-out` -> `transition-all duration-snappy ease-out`
- Linha 401: `transition-transform duration-160` -> `transition-transform duration-snappy`
- Linha 425: `transition-all duration-160` -> `transition-all duration-snappy`
- Linha 433: `transition-all duration-160` -> `transition-all duration-snappy`

### Passo 3: Padronizar `src/components/ModelsSidebar.tsx`
- Linha 43: `transition-all duration-160` -> `transition-all duration-snappy`
- Linha 146: `duration-140` -> `duration-snappy`

### Passo 4: Padronizar `src/components/VisualTemplateEditorModal.tsx`
- Linha 803: `duration-100 ease-out` -> `duration-instant ease-out`

## 5. Verificação e Teste de Sensação (*Feel-check*)
1. Executar `pnpm build` para confirmar compilação do TypeScript e Vite sem erros.
2. Inspecionar os botões e cards no navegador: a propriedade calculada (*Computed Styles*) deve exibir estritamente `transition-duration: 0.16s` (160ms) com curva `ease-out`.
