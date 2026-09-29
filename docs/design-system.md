# Folium Print - Premium Utilitarian Minimalism UI Specification

## Visão Geral

O Design System do **Folium Print** segue o protocolo **Premium Utilitarian Minimalism & Editorial UI**: uma interface refinada inspirada em ferramentas de workspace de alto padrão, orientada a documentos, contraste térmico/papel e uso sistemático de **cores como recurso escasso**.

---

## 1. Paleta de Cores: 5 Spot Accents & Muted Pastels

A paleta solicitada `["#ffbe0b", "#fb5607", "#ff006e", "#8338ec", "#3a86ff"]` é tratada com rigor editorial: **cores saturadas nunca cobrem áreas inteiras**, sendo aplicadas como pontos de foco (*spot dots* de 6px a 8px) ou suavizadas em pastéis lavados para chips, tags e metadados.

| Cor Spot | Hex | Pastel de Fundo | Cor do Texto | Função Semântica |
| :--- | :--- | :--- | :--- | :--- |
| **Amber Gold** | `#ffbe0b` | `#FBF3DB` | `#956400` | Calibração mecânica de offset e alertas leves |
| **Blaze Orange** | `#fb5607` | `#FFEDD5` | `#9A3412` | Mensagens de atenção (*warning*), campos críticos |
| **Neon Pink** | `#ff006e` | `#FDEBEC` | `#9F2F2D` | Modelos customizados (*Custom*), campos obrigatórios |
| **Blue Violet** | `#8338ec` | `#F3E8FF` | `#6B21A8` | Etiquetas de folha A4, botão "Novo Modelo" |
| **Azure Blue** | `#3a86ff` | `#E1F3FE` | `#1F6C9F` | Ação principal (*Print*), etiquetas térmicas, código de barras |

---

## 2. Superfícies Monocromáticas Quentes & Regra de 1px

- **Fundo da Aplicação (`--surface-app`):** `#F7F6F3` (Off-white / osso quente)
- **Superfícies de Conteúdo (`--surface-card`):** `#FFFFFF` (Branco puro)
- **Divisores Estruturais (`--border-default`):** `#EAEAEA` (*Regra estrita de 1px solid*)
- **Tipografia Primária (`--foreground-primary`):** `#111111` (Carvão profundo; jamais preto absoluto `#000000`)
- **Tipografia Secundária (`--foreground-secondary`):** `#555552`
- **Tipografia Muted (`--foreground-muted`):** `#787774`

---

## 3. Tipografia Editorial

- **Fonte Principal (UI & Formulários):** `'Geist Sans', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif`
- **Fonte Monoespaçada (Metadados, Dimensões e Atalhos):** `'Geist Mono', 'SF Mono', 'JetBrains Mono', monospace`
- Proibição absoluta de fontes genéricas de SaaS (Inter, Roboto, Open Sans).

---

## 4. Matriz de Componentes Minimalistas

| Componente | Especificação Visual |
| :--- | :--- |
| **Botão Primário (Disparar Impressão)** | Sólido `#111111`, texto branco, raio sutil `rounded-[6px]`, sem drop shadow. Ponto spot `bg-azure-blue` de 6px. Efeito de clique `active:scale-[0.98]`. |
| **Botões Secundários** | Fundo branco `bg-surface-card`, borda `border-[#EAEAEA]`, hover `#F7F6F3`, raio `rounded-[6px]`. |
| **Tags de Categoria & Status** | Fundo pastel lavado + borda sutil + texto de alto contraste + ponto spot centralizado (ex: `bg-pastel-blue-bg text-pastel-blue-text border-pastel-blue-border`). |
| **Badge de Offset Mecânico** | `bg-pastel-gold-bg text-pastel-gold-text border-pastel-gold-border` com ponto `bg-amber-gold`. |
| **Atalhos de Teclado** | Renderizados com `<kbd>` físicos: borda `#EAEAEA`, fundo `#F7F6F3`, raio `rounded-[4px]`, tipografia mono. |
