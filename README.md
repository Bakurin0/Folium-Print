<div align="center">
  <img src="Blue Folder.ico" width="80" alt="Folium Print Logo">

  # Folium Print

  *Composição vetorial e impressão física com calibração milimétrica de etiquetas e folhas A4*

  [![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
  [![Platform](https://img.shields.io/badge/Platform-Linux%20%7C%20Windows%20%7C%20macOS-lightgrey.svg)](#)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](#)
  [![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)](#)
  [![Tauri](https://img.shields.io/badge/Tauri-2.x-24C8DB?logo=tauri&logoColor=white)](#)

  [Recursos](#recursos) • [Arquitetura](#arquitetura) • [Instalação](#instalação-e-execução) • [Calibração](#calibração-mecânica)

</div>

---

**Folium Print** é uma ferramenta desktop para diagramação e impressão de etiquetas térmicas e folhas matriciais A4 com controle milimétrico de coordenadas ($x, y$), margens e sangria.

Todo o cálculo de layout, vetores SVG e geração de códigos de barras (Code 128, EAN-13, QR Code) roda localmente no cliente, sem requisições externas ou dependência de serviços em nuvem.

## Recursos

- **Pré-visualização WYSIWYG em escala real**: Renderização dinâmica sincronizada com os campos do formulário.
- **Calibração de tração mecânica**: Ajuste milimétrico de offset nos eixos $X$ e $Y$ para compensar desvios de alimentação física do papel.
- **Simbologia de código de barras e QR Code local**: Geração vetorial offline de Code 128, EAN-13, EAN-8, Code 39 e QR Code via canvas/SVG.
- **Suporte a mídias industriais e de escritório**:
  - Folhas A4 matriciais com seleção de posição inicial para aproveitamento de etiquetas restantes.
  - Bobinas térmicas contínuas ou destacáveis com controle de corte.
- **Editor visual integrado**: Criação e customização de modelos com caixas arrastáveis e suporte a vetores SVG de logotipo.
- **Acessibilidade e física tátil**: Conformidade com WCAG 2.2 AA (foco visível, navegação por teclado e semântica ARIA) e física de interface inspirada na filosofia de Emil Kowalski.

## Arquitetura

O sistema organiza o fluxo entre entrada de dados, motor milimétrico e despacho de impressão:

```mermaid
flowchart TD
    subgraph UI ["Interface (React + Tailwind CSS)"]
        Form["Formulário Dinâmico"]
        Selector["Seletor de Modelos"]
        CalibControls["Painel de Calibração (mm)"]
    end

    subgraph State ["Estado Local (Hooks & Storage)"]
        AppStore["Estado Central (useState / useMemo)"]
        LocalStorage["Persistência Local (Offsets & Custom Templates)"]
    end

    subgraph Engine ["Motor de Composição"]
        UnitCalc["Conversor de Unidades (mm ↔ px @ 96 DPI)"]
        CodeEngine["Geradores Vetoriais (JsBarcode & QRCode)"]
        SVGRenderer["Renderizador DOM / SVG"]
    end

    subgraph Output ["Dispositivo de Saída"]
        ScreenPreview["Preview na Tela"]
        PrintService["Spooler / Diálogo de Impressão"]
    end

    UI --> AppStore
    AppStore <--> LocalStorage
    AppStore --> UnitCalc
    UnitCalc --> CodeEngine
    CodeEngine --> SVGRenderer
    SVGRenderer --> ScreenPreview
    SVGRenderer --> PrintService
```

## Instalação e Execução

### Pré-requisitos

- [Node.js](https://nodejs.org/) versão 18 LTS ou superior
- Gerenciador [pnpm](https://pnpm.io/) (recomendado) ou npm

### Desenvolvimento

```bash
# 1. Instalar dependências
pnpm install

# 2. Iniciar servidor Vite local
pnpm dev

# 3. Executar com ambiente de desktop Tauri (opcional)
pnpm tauri dev
```

### Compilação

Para validar tipagem TypeScript e gerar os assets de produção:

```bash
pnpm build
```

## Calibração Mecânica

Em impressoras térmicas ou folhas adesivas pré-cortadas, tolerâncias mecânicas da tração do rolo podem deslocar o início da impressão.

1. **Ajuste de Escala:** No diálogo de impressão do sistema operacional, mantenha a escala em **100% (Tamanho Real)**. Desative opções automáticas como "Ajustar à página" ou "Encolher para caber".
2. **Offset Fino:** Utilize a aba **Calibração** no painel lateral para somar ou subtrair frações de milímetro nos eixos horizontal e vertical até alinhar o conteúdo exatamente à faca do papel adesivo.
