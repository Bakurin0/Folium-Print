# Plano 001: Acessibilidade GSAP e Movimento Reduzido no HomeDashboard

- **Commit Base:** `60ba95a`
- **Categoria:** Acessibilidade / Reduced Motion (Tier 1 & Tier 2)
- **Severidade:** ALTA
- **Status:** PENDENTE

---

## 1. Visão Geral e Contexto
No componente `src/components/HomeDashboard.tsx`, as animações de entrada usam o hook `useGSAP` para orquestrar uma timeline contendo deslocamento no eixo Y (`y: 10`, `y: 12`) e efeitos sequenciais (`stagger`). Atualmente, essa timeline é executada incondicionalmente, ignorando a configuração do sistema operacional `prefers-reduced-motion: reduce`. Usuários com distúrbios vestibulares (náusea/vertigem provocada por movimento de tela) sofrem com animações espaciais desnecessárias.

## 2. Padrões e Convenções do Repositório
- **Biblioteca:** GSAP 3.15+ e `@gsap/react` 2.1+.
- **Padrão de Movimento Reduzido:** Em `src/index.css`, animações com `prefers-reduced-motion: reduce` suprimem deslocamentos espaciais e reduzem durações para $\le 150\text{ms}$ mantendo transições de opacidade pura (Tier 3).
- **Easing:** `--ease-out` (`cubic-bezier(0.23, 1, 0.32, 1)` ou `'power2.out'`).

## 3. Escopo e Limites
- **Arquivos afetados:**
  - `src/components/HomeDashboard.tsx`
- **Fora de escopo:** Modificar a lógica de templates, miniaturas ou manipulação de arquivos.

## 4. Trecho de Código Atual
Em [src/components/HomeDashboard.tsx](file:///home/night/Documentos/Folium-Print/src/components/HomeDashboard.tsx#L98-L129):

```typescript
  // Animação de entrada suave com física tátil Apple/Emil Kowalski
  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      tl.from('.dashboard-hero', {
        opacity: 0,
        y: 10,
        duration: 0.35,
      })
      .from(
        '.quick-action-card',
        {
          opacity: 0,
          y: 12,
          duration: 0.3,
          stagger: 0.06,
        },
        '-=0.18'
      )
      .from(
        '.template-card-item',
        {
          opacity: 0,
          y: 12,
          duration: 0.28,
          stagger: 0.04,
        },
        '-=0.15'
      );
    },
    { scope: containerRef }
  );
```

## 5. Instruções Exatas de Implementação
Substituir o bloco dentro de `useGSAP` em `src/components/HomeDashboard.tsx` utilizando `gsap.matchMedia()`:

```typescript
  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          motionOK: '(prefers-reduced-motion: no-preference)',
          motionReduce: '(prefers-reduced-motion: reduce)',
        },
        (ctx) => {
          const { motionOK } = ctx.conditions as { motionOK: boolean; motionReduce: boolean };

          if (motionOK) {
            // Caminho Normal: Deslocamento vertical elegante com física tátil
            const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

            tl.from('.dashboard-hero', {
              opacity: 0,
              y: 10,
              duration: 0.35,
            })
            .from(
              '.quick-action-card',
              {
                opacity: 0,
                y: 12,
                duration: 0.3,
                stagger: 0.06,
              },
              '-=0.18'
            )
            .from(
              '.template-card-item',
              {
                opacity: 0,
                y: 12,
                duration: 0.28,
                stagger: 0.04,
              },
              '-=0.15'
            );
          } else {
            // Caminho Reduzido: Fade suave sem deslocamento espacial Y (≤ 150ms)
            gsap.from('.dashboard-hero, .quick-action-card, .template-card-item', {
              opacity: 0,
              duration: 0.15,
              ease: 'power1.out',
            });
          }
        }
      );
    },
    { scope: containerRef }
  );
```

## 6. Verificação e Teste de Sensação (*Feel-check*)
1. **Teste em Modo Normal:** Abrir a Home (`npm run dev`). Os elementos do Hero, ações rápidas e cards de templates devem entrar com o fluxo sequencial tátil escalonado.
2. **Teste com Movimento Reduzido:** Emulando `prefers-reduced-motion: reduce` no DevTools (Painel *Rendering* > *Emulate CSS media feature prefers-reduced-motion*):
   - Os cards não devem se deslocar verticalmente.
   - O conteúdo deve surgir suavemente por opacidade em 150ms sem quebra nem sensação de "teleporte".
