# Plano 006: Transição Suave com Cross-Fade entre Home e Prancheta de Edição

- **Commit Base:** `60ba95a`
- **Categoria:** Oportunidades Perdidas & Polimento Desktop
- **Severidade:** MÉDIA
- **Status:** PENDENTE

---

## 1. Visão Geral e Contexto
No arquivo `src/App.tsx`, a alternância entre a tela de boas-vindas (`HomeDashboard`) e a prancheta de trabalho (`StudioCanvas` dentro de `main#main-content`) é feita por uma condição booleana direta (`isHomeOpen ? <HomeDashboard /> : <main ...>`).
Essa troca instantânea sem transição gera uma quebra visual brusca, incompatível com a sensação de um aplicativo nativo desktop fluido no padrão macOS / Folium.

## 2. Decisão Arquitetural (Aprovada)
- Criar a classe utilitária `.animate-view-fade` em `src/index.css`:
  - Duração de 150ms com curva de física tátil `var(--ease-out)`.
  - Leve deslocamento vertical de entrada: `translateY(6px)` para `translateY(0)`.
  - Sobrescrita de acessibilidade (`prefers-reduced-motion: reduce`): suprimir o deslocamento e manter apenas a interpolação pura de opacidade (Tier 3).
- Aplicar a classe nos contêineres principais de visualização em `src/App.tsx`.

## 3. Escopo de Arquivos
- `src/index.css`
- `src/App.tsx`

## 4. Instruções Exatas de Implementação

### Passo 1: `src/index.css`
Adicionar os keyframes e a classe utilitária logo abaixo de `.animate-modal-enter`:

```css
/* Transição fluida de visão (Home vs Prancheta de Trabalho) */
@keyframes viewFadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-view-fade {
  animation: viewFadeIn 150ms var(--ease-out) forwards;
}

@media (prefers-reduced-motion: reduce) {
  .animate-view-fade {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}
```

### Passo 2: `src/App.tsx`
Localizar a renderização de `HomeDashboard` e `<main id="main-content">` (linhas 260 a 280):

1. Envolver o `HomeDashboard` em um container animado (ou aplicar a classe no seu container raiz):
   ```tsx
   {isHomeOpen ? (
     <div className="flex-1 flex flex-col overflow-hidden animate-view-fade">
       <HomeDashboard
         currentTemplate={currentTemplate}
         customTemplates={customTemplates}
         onSelectTemplate={handleSelectTemplate}
         onOpenCreateModal={() => {
           setEditingTemplate(null);
           setIsEditorOpen(true);
         }}
         onImportTemplate={(def) => {
           const saved = saveTemplate(def);
           handleSelectTemplate(saved.id);
         }}
         onDeleteCustomTemplate={handleDeleteCustomTemplate}
         onDuplicateTemplate={handleDuplicateTemplate}
         onReturnToEditor={() => setIsHomeOpen(false)}
         showToast={showToast}
       />
     </div>
   ) : (
     <main id="main-content" className="flex-1 flex overflow-hidden relative animate-view-fade">
       ...
     </main>
   )}
   ```

## 5. Verificação e Teste de Sensação (*Feel-check*)
1. Pressionar o botão "Home" na barra superior ou o atalho de teclado para alternar entre a Home e o Editor.
2. A nova tela deve se acomodar de forma suave em 150ms com leve elevação orgânica, sem cintilação (*flicker*).
3. Com `prefers-reduced-motion: reduce` ativo, a troca não deve ter deslocamento Y, mantendo a transição limpa.
