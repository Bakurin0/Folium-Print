# Plano 004: Escopo Específico de Transições para Performance (Adeus ao transition-all)

- **Commit Base:** `60ba95a`
- **Categoria:** Performance & Fluidez de Renderização (60/120fps)
- **Severidade:** MÉDIA
- **Status:** PENDENTE

---

## 1. Visão Geral e Contexto
O uso indiscriminado da classe `transition-all` em campos de texto, inputs numéricos e botões força o navegador a monitorar e interpolar qualquer propriedade CSS que seja alterada (incluindo `padding`, `margin`, `width`, `height`, `border-width`), disparando cálculos dispendiosos de layout (*reflow*) e repintura (*repaint*).
De acordo com os princípios de Emil Kowalski, transições de interface devem ser restritas exclusivamente às propriedades que mudam:
- Mudança de cor, borda ou fundo: `transition-colors duration-instant` ou `duration-snappy`.
- Compressão e clique: `transition-transform duration-instant`.
- Ocultação/Exibição: `transition-opacity duration-snappy`.

## 2. Escopo de Arquivos
- `src/components/VisualTemplateEditorModal.tsx`
- `src/components/ThermalCopiesOptions.tsx`
- `src/components/InspectorPanel.tsx`

## 3. Instruções Exatas de Implementação

### Passo 1: `src/components/VisualTemplateEditorModal.tsx`
Substituir `transition-all` em inputs de texto e números por `transition-colors`:
- Linhas 871, 884, 895, 936, 993, 1014, 1035, 1049, 1066, 1080, 1100, 1110, 1124, 1155, 1169:
  Substituir `outline-none transition-all` por `outline-none transition-colors duration-instant`.
- Em botões da barra superior (linhas 566, 578):
  Substituir `active:scale-95 transition-all` por `active:scale-[0.97] transition-transform duration-instant`.

### Passo 2: `src/components/ThermalCopiesOptions.tsx`
- Linhas 41 e 58:
  Substituir `transition-all duration-instant` nos botões de incremento/decremento por `transition-colors transition-transform duration-instant`.
- Linha 76:
  Substituir `transition-all duration-instant` nos botões de cópias rápidas por `transition-colors transition-transform duration-instant`.

### Passo 3: `src/components/InspectorPanel.tsx`
- Linhas 106, 124, 142, 160:
  Substituir `transition-all` por `transition-colors duration-instant`.
- Linhas 263, 273:
  Substituir `transition-all` por `transition-colors duration-instant`.

## 4. Verificação e Teste de Sensação (*Feel-check*)
1. Abrir a ferramenta de medição de desempenho do Chrome DevTools (aba *Performance* > *Rendering* > *Paint Flashing*).
2. Focar e digitar rapidamente nos campos do inspetor e do editor visual: apenas a área imediata da borda/foco deve registrar pintura, sem repintura global dos nós irmãos.
3. A digitação deve parecer instantânea, com zero latência perceptível no teclado.
