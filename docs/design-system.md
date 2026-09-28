# Folium Print - Design System Specification

## Visão Geral

O Design System do **Folium Print** utiliza tokens semânticos simples diretamente integrados ao Tailwind CSS e alternância de temas (Claro / Escuro), sem camadas redundantes de abstração.

---

## 1. Arquitetura de Tokens

- **Variáveis CSS Semânticas:** [`src/styles/tokens.css`](file:///home/night/Documentos/Folium-Print/src/styles/tokens.css)
- **Configuração Tailwind:** [`tailwind.config.ts`](file:///home/night/Documentos/Folium-Print/tailwind.config.ts)

---

## 2. Tokens Semânticos

Suporta alternância de tema através de classes `.dark` ou atributo `[data-theme='dark']`:

| Token Semântico | Tema Claro | Tema Escuro | Finalidade |
| :--- | :--- | :--- | :--- |
| `--surface-app` | `#f8fafc` | `#020617` | Fundo principal da aplicação desktop |
| `--surface-card` | `#ffffff` | `#0f172a` | Painéis laterais, modais e containers |
| `--surface-subtle` | `#f1f5f9` | `#1e293b` | Superfícies secundárias e botões sutis |
| `--surface-canvas` | `#e2e8f0` | `#090d16` | Fundo da área do visualizador |
| `--foreground-primary` | `#0f172a` | `#f8fafc` | Títulos e textos de alta ênfase |
| `--foreground-secondary` | `#475569` | `#94a3b8` | Textos de apoio e labels |
| `--foreground-muted` | `#94a3b8` | `#64748b` | Placeholders e textos desabilitados |
| `--border-default` | `#cbd5e1` | `#334155` | Bordas padrão de containers e inputs |
| `--color-primary` | `#2563eb` | `#3b82f6` | Ações principais e botões de destaque |
| `--color-focus-ring` | `#3b82f6` | `#60a5fa` | Anel de foco acessível |

---

## 3. Matriz de Estados de Componentes

| Componente | Default | Hover | Active | Focus | Disabled |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Botão Primário** | `bg-primary text-white` | `bg-primary-hover` | `bg-primary-active` | `ring-2 ring-primary-ring` | `opacity-50 pointer-events-none` |
| **Input Numérico (mm)** | `border-border bg-surface-card` | `border-strong` | — | `ring-2 ring-primary-ring` | `bg-surface-subtle text-muted` |
| **Etiqueta no Canvas** | `bg-white shadow-md` | `shadow-lg` | — | `outline outline-2 outline-primary` | — |

---

## 4. Regras de Uso no Desenvolvimento

1. **Utilize as classes utilitárias do Tailwind**: classes como `bg-surface-card`, `text-foreground-primary`, `bg-primary` já estão mapeadas para as variáveis de tema.
2. **Separação de Medidas Físicas vs. Tela**:
   - Medidas de interface desktop utilizam a escala padrão de `rem`/`px` do Tailwind.
   - Medidas de etiquetas e impressão utilizam exclusivamente grandezas milimétricas (`mm`) com conversão tipada no core.
