# Plano 005: Física Tátil de Botões e Suavização do Overlay de Arquivos

- **Commit Base:** `60ba95a`
- **Categoria:** Física Tátil & Propósito da Animação
- **Severidade:** MÉDIA
- **Status:** PENDENTE

---

## 1. Visão Geral e Contexto
1. **Compressão Tátil Excessiva:** Em `src/components/ThermalCopiesOptions.tsx` e `src/components/HomeDashboard.tsx`, alguns botões de ação e incremento utilizam `active:scale-90` (redução de 10%). Em botões pequenos de 24 a 32 pixels, essa escala deforma o ícone e gera uma sensação de "afundamento exagerado". O padrão tátil do projeto e da filosofia de Emil Kowalski para micro-botões é uma compressão firme e precisa entre `0.96` e `0.97`.
2. **Animação Contínua Distrativa (Bounce):** No overlay de arrastar arquivos de `HomeDashboard.tsx:213`, o ícone `<Upload />` utiliza `animate-bounce`. Esse movimento repetitivo vertical de 25% gera fadiga visual, viola o princípio de foco de ferramentas profissionais e se enquadra como gatilho de Tier 1 no critério WCAG 2.2.2.

## 2. Escopo de Arquivos
- `src/components/HomeDashboard.tsx`
- `src/components/ThermalCopiesOptions.tsx`

## 3. Instruções Exatas de Implementação

### Passo 1: `src/components/HomeDashboard.tsx`
1. **Remover o Bounce:** Na linha 213:
   ```tsx
   // ANTES:
   <Upload className="w-12 h-12 text-[#3a86ff] animate-bounce" />

   // DEPOIS (Pulso calmo de opacidade com escala estável):
   <Upload className="w-12 h-12 text-[#3a86ff] animate-pulse transition-transform duration-snappy" strokeWidth={1.75} />
   ```
2. **Normalizar a Escala de Botões:**
   - Linha 368 (Botão Duplicar modelo): Substituir `active:scale-90` por `active:scale-[0.96]`.
   - Linha 379 (Botão Excluir modelo): Substituir `active:scale-90` por `active:scale-[0.96]`.

### Passo 2: `src/components/ThermalCopiesOptions.tsx`
- Linhas 41 e 58 (Botões de decremento `-` e incremento `+`):
  Substituir `active:scale-90` por `active:scale-[0.96]`.
- Linha 76 (Chips de seleção rápida de cópias 1x, 2x, 5x, 10x):
  Substituir `active:scale-95` por `active:scale-[0.97]`.

## 4. Verificação e Teste de Sensação (*Feel-check*)
1. Clicar repetidamente nos botões de incremento de cópias térmicas: a resposta ao clique deve parecer um interruptor mecânico de alta precisão (firme e sem distorção visual do glifo `+` e `-`).
2. Arrastar um arquivo sobre a janela: o overlay azul deve apresentar um visual calmo e profissional, com o ícone pulsando sutilmente em opacidade em vez de saltar na tela.
