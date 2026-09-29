# Plano 003: Transição Fluida de Abertura e Fechamento das Barras Laterais

- **Commit Base:** `60ba95a`
- **Categoria:** Física & Desmonte / Suavidade de Painéis
- **Severidade:** ALTA
- **Status:** PENDENTE

---

## 1. Visão Geral e Contexto
Atualmente, em `src/components/ModelsSidebar.tsx` e `src/components/InspectorPanel.tsx`, os componentes declaram classes de transição CSS (`transition-all duration-snappy ease-out`), porém possuem a instrução:
```typescript
if (!isOpen) return null;
```
Quando o usuário pressiona `Cmd+B`, `Cmd+I` ou clica nos botões da barra superior, o React remove o componente do DOM instantaneamente. Isso impede que a transição de fechamento ocorra (causando um "corte seco" / teleporte visual), além de recriar todo o estado interno a cada abertura.

## 2. Decisão Arquitetural (Aprovada)
- **Técnica de Colapso Suave com Container Fixo Interno:**
  Manter o elemento no DOM com `overflow-hidden`.
  - O `<aside>` externo anima a largura entre `w-0` e `w-72 xl:w-80` (ou `w-80 xl:w-96`), além de alternar a borda e opacidade.
  - Um `<div>` interno mantém a largura fixa exata (`w-72 xl:w-80` / `w-80 xl:w-96`), impedindo que o texto, botões e controles sejam espremidos durante o movimento de fechar/abrir.
  - Adicionar `aria-hidden={!isOpen}` e `pointer-events-none` quando fechado para preservar acessibilidade.

## 3. Escopo de Arquivos
- `src/components/ModelsSidebar.tsx`
- `src/components/InspectorPanel.tsx`

## 4. Instruções Exatas de Implementação

### Passo 1: `src/components/ModelsSidebar.tsx`
Remover a cláusula `if (!isOpen) return null;` (linha 124) e estruturar o retorno com container fixo interno:

```tsx
  return (
    <aside
      aria-label="Biblioteca de Modelos"
      aria-hidden={!isOpen}
      className={`h-full border-black/[0.06] bg-[#fbfbfa] flex flex-col shrink-0 z-20 transition-all duration-snappy ease-out select-none overflow-hidden ${
        isOpen
          ? 'w-72 xl:w-80 border-r opacity-100 pointer-events-auto'
          : 'w-0 border-r-0 opacity-0 pointer-events-none'
      }`}
    >
      <div className="w-72 xl:w-80 h-full flex flex-col shrink-0">
        {/* Conteúdo existente da barra lateral (header, busca, lista, rodapé) */}
        ...
      </div>
    </aside>
  );
```

### Passo 2: `src/components/InspectorPanel.tsx`
Remover a cláusula `if (!isOpen) return null;` (linha 82) e estruturar o retorno com container fixo interno:

```tsx
  return (
    <aside
      aria-label="Inspetor de Configurações"
      aria-hidden={!isOpen}
      className={`h-full border-black/[0.06] bg-surface-card flex flex-col shrink-0 z-20 transition-all duration-snappy ease-out select-none overflow-hidden ${
        isOpen
          ? 'w-80 xl:w-96 border-l opacity-100 pointer-events-auto'
          : 'w-0 border-l-0 opacity-0 pointer-events-none'
      }`}
    >
      <div className="w-80 xl:w-96 h-full flex flex-col shrink-0">
        {/* Conteúdo existente do painel de ajustes (abas, form, painéis de calibração) */}
        ...
      </div>
    </aside>
  );
```

## 5. Verificação e Teste de Sensação (*Feel-check*)
1. Pressionar os atalhos de teclado repetidamente: `Ctrl/Cmd + B` e `Ctrl/Cmd + I`.
2. A barra deve deslizar para fora e para dentro suavemente em 160ms (`--ease-out`), empurrando a área central do canvas de maneira orgânica e contínua.
3. Não deve haver quebra de layout no texto nem distorção dos campos enquanto a barra se fecha.
4. Quando fechada, inspecionar via leitor de tela ou DevTools: o foco do teclado não pode entrar em elementos com `pointer-events-none` e `aria-hidden="true"`.
