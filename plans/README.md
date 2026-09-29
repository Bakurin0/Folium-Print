# Roteiro de Execução de Melhorias de Animação

Este índice organiza todos os planos de refinamento de animações, física tátil e acessibilidade baseados na filosofia de Emil Kowalski para o **Folium-Print**.

- **Commit Base:** `60ba95a`
- **Total de Planos:** 6

---

## Tabela de Planos e Status

| Plano | Título | Severidade | Dependência | Status |
| :--- | :--- | :--- | :--- | :--- |
| [001](001-gsap-reduced-motion-homedashboard.md) | Acessibilidade GSAP e Movimento Reduzido no HomeDashboard | ALTA | Nenhuma | ✅ Concluído |
| [002](002-duration-tokens-unification.md) | Unificação e Proteção de Tokens de Duração no Tailwind e Componentes | ALTA | Nenhuma | ✅ Concluído |
| [003](003-collapsible-sidebars-fluid-transitions.md) | Transição Fluida de Abertura e Fechamento das Barras Laterais | ALTA | Nenhuma | ✅ Concluído |
| [004](004-performance-scoped-transitions.md) | Escopo Específico de Transições para Performance (Remover transition-all) | MÉDIA | Plano 002 | ✅ Concluído |
| [005](005-tactile-physics-and-drag-overlay.md) | Física Tátil de Botões e Suavização do Overlay de Arquivos | MÉDIA | Plano 002 | ✅ Concluído |
| [006](006-view-crossfade-home-editor.md) | Transição Suave com Cross-Fade entre Home e Prancheta de Edição | MÉDIA | Plano 002 | ✅ Concluído |

---

## Ordem Recomendada de Execução
1. **Passo 1 (Base e Acessibilidade):** Executar [Plano 001](001-gsap-reduced-motion-homedashboard.md) e [Plano 002](002-duration-tokens-unification.md). Isso estabiliza a escala de tempos no Tailwind e elimina gatilhos vestibulares na Home.
2. **Passo 2 (Estrutura e Painéis):** Executar [Plano 003](003-collapsible-sidebars-fluid-transitions.md) para resolver o maior ponto de atrito visual (as barras laterais de modelos e inspetor).
3. **Passo 3 (Performance & Polimento Tátil):** Executar os Planos [004](004-performance-scoped-transitions.md), [005](005-tactile-physics-and-drag-overlay.md) e [006](006-view-crossfade-home-editor.md).
