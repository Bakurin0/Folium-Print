# Plano 007: Adequação Técnica à LGPD e Privacy by Design

- **Categoria:** Privacidade / Conformidade LGPD (Lei nº 13.709/2018)
- **Severidade:** ALTA
- **Status:** CONCLUÍDO
- **Documento de Referência:** [docs/LGPD_CONFORMIDADE.md](file:///home/night/Documentos/Folium-Print/docs/LGPD_CONFORMIDADE.md)

---

## 1. Visão Geral e Contexto
O Folium Print opera como uma ferramenta desktop local-first sem serviços em nuvem ou banco de dados remoto. No entanto, o `index.html` realiza chamadas externas ao Google Fonts (`fonts.googleapis.com` e `fonts.gstatic.com`), o que transfere endereços IP para servidores nos EUA sem necessidade funcional. Além disso, os dados persistidos no `localStorage` do operador (incluindo modelos que podem conter dados de exemplo de destinatários e offsets) necessitam de mecanismos explícitos de auditoria, exportação (portabilidade - Art. 18, V) e exclusão/purga (Art. 18, VI).

Este plano detalha as alterações de código necessárias para consolidar o Folium Print em regime 100% offline e em conformidade estrita com o princípio de Privacy by Design (Art. 46, §2º da LGPD).

---

## 2. Padrões e Convenções do Repositório
- **Ambiente:** Vite 6 + React 18 + TypeScript + Tailwind CSS.
- **Isolamento de Rede:** CSP restrito a `connect-src 'self'`, `font-src 'self' data:`.
- **Persistência:** LocalStorage com tipagem segura e tratamento com try/catch.
- **Acessibilidade:** Padrões WCAG 2.2 AA (foco visível, navegação por teclado e semântica ARIA).
- **Idioma das Mensagens:** Português do Brasil (pt-BR).

---

## 3. Escopo e Limites
- **Arquivos a Modificar/Criar:**
  - `index.html`: Remoção de links do Google Fonts e ajuste no Content-Security-Policy.
  - `src/index.css`: Inclusão de tipografia local ou `@font-face` auto-hospedado com fallbacks nativos (`system-ui`, `-apple-system`, `sans-serif`).
  - `src/components/PrivacySettingsModal.tsx` *(Novo)*: Modal de auditoria e controle do `localStorage` (visualização de chaves, exportação de backup e botão de purga total).
  - `src/components/Header.tsx` ou `src/components/HomeDashboard.tsx`: Ponto de entrada acessível para o modal de privacidade e dados locais.
  - `src/utils/sanitization.ts` *(Novo)*: Utilitário para higienização de modelos salvos e remoção de dados pessoais sensíveis em `defaultValue`.
- **Fora de escopo:** Modificar a lógica de geração de códigos de barra ou cálculos milimétricos de offsets.

---

## 4. Fases de Execução

### Fase 1: Isolamento de Rede e Auto-hospedagem de Fontes (GAP-01)
1. **Modificar `index.html`:**
   - Remover as tags `<link rel="preconnect" href="https://fonts.googleapis.com">` e `<link rel="preconnect" href="https://fonts.gstatic.com">`.
   - Remover `<link href="https://fonts.googleapis.com/css2?family=Geist...>` do cabeçalho.
   - Atualizar a meta tag de CSP:
     ```html
     <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob:; connect-src 'self';" />
     ```
2. **Atualizar `src/index.css` e `tailwind.config.ts`:**
   - Configurar pilha de fontes robusta com fallback nativo do sistema (`Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`) ou empacotar arquivos `.woff2` locais em `public/fonts/`.

### Fase 2: Gestão de Dados Locais e Portabilidade (GAP-02)
1. **Desenvolver o componente `PrivacySettingsModal.tsx`:**
   - Exibir lista das chaves ativas do `localStorage` utilizadas pelo sistema:
     - `folium-custom-templates`
     - `folium-color-settings`
     - `folium-crop-marks`
     - `folium-paper-selection`
     - `folium-offset-*`
     - `folium-last-active-template`
   - Exibir tamanho aproximado ocupado em bytes.
   - Fornecer botão **"Exportar Todos os Dados (JSON)"** para atender ao direito de portabilidade (Art. 18, V).
   - Fornecer botão de perigo **"Limpar Todos os Dados e Redefinir"** com diálogo de confirmação dupla para atender ao direito de eliminação (Art. 18, VI).

### Fase 3: Sanitização de Dados em Modelos (GAP-03)
1. **Criar helper `src/utils/sanitization.ts`:**
   - Ao exportar ou duplicar templates, oferecer opção de "Anonimizar valores de teste" substituindo nomes, CPFs e telefones por placeholders sintéticos (`Ex: Nome do Cliente`, `000.000.000-00`).

### Fase 4: Transparência e Aviso Privacy by Design (GAP-04)
1. **Adicionar no rodapé / modal informativo:**
   - Texto de garantia de privacidade: *"Folium Print opera em modo 100% offline e local-first. Nenhum dado digitado ou impresso trafega pela internet."*
   - Link direto para a visualização do arquivo `docs/LGPD_CONFORMIDADE.md`.

---

## 5. Critérios de Aceite e Verificação
- [ ] O inspetor de rede do navegador / Tauri não dispara nenhuma requisição HTTP externa para domínios de terceiros (`google.com`, `googleapis.com`, etc.).
- [ ] O Content-Security-Policy (CSP) não permite fontes ou scripts externos.
- [ ] O usuário consegue visualizar todas as informações persistidas localmente no modal de dados.
- [ ] O botão de purga apaga todos os registros de `folium-*` e reinicia a aplicação para o estado de fábrica de forma íntegra.
- [ ] O comando `pnpm build` passa sem erros de compilação ou de tipagem TypeScript.
