# 🔒 Diagnóstico de Conformidade LGPD & Privacy by Design — Folium Print

> **Data da Auditoria:** 30 de Setembro de 2026  
> **Sistema Auditado:** Folium Print (Desktop Tauri 2.x + Vite + React 18)  
> **Legislação Aplicável:** Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD), com alterações da Lei nº 13.853/2019  
> **Autoridade Reguladora:** ANPD (Autoridade Nacional de Proteção de Dados)  
> **Classificação Arquitetural:** *Local-First / Zero-Knowledge Client-Side Desktop Tool*

---

## 1. Sumário Executivo

O **Folium Print** foi concebido como uma ferramenta de composição e impressão física de etiquetas e matrizes A4 de operação **local-first**. A avaliação técnica constatou que a aplicação:
- **Não possui servidor centralizado ou serviço de nuvem** de tratamento de dados mantido pelo desenvolvedor.
- **Não implementa telemetria, rastreamento comportamental ou analytics invasivo**.
- **Processa dados de etiquetagem localmente** na memória da aplicação e os encaminha ao subsistema de spooler de impressão nativo do sistema operacional.

Contudo, para atingir a **conformidade estrita com a LGPD e o padrão internacional de *Privacy by Design and by Default* (Art. 46, §2º)**, foram identificados pontos que exigem adequação:
1. **Transferência involuntária de metadados de IP**: Requisições externas para o serviço Google Fonts no `index.html`.
2. **Garantia dos direitos dos titulares no armazenamento local**: Ausência de controle centralizado de visualização, exportação (portabilidade) e purga definitiva de dados no `localStorage`.
3. **Governança sobre a segurança do ciclo de vida dos dados físicos e digitais**: Necessidade de orientações para o operador (Controlador) sobre retenção de dados temporários e descarte de sobras de etiquetas térmicas.

---

## 2. Enquadramento dos Agentes de Tratamento (Art. 5º da LGPD)

| Papel na LGPD | Entidade | Atribuição no Folium Print | Base / Justificativa |
| :--- | :--- | :--- | :--- |
| **Controlador** | **Usuário Final / Empresa Operadora** | Define a finalidade das impressões, cadastra os dados de clientes/destinatários/produtos nas etiquetas e decide sobre o arquivamento ou descarte. | Art. 5º, VI: Pessoa natural ou jurídica a quem competem as decisões referentes ao tratamento de dados pessoais. |
| **Operador Local** | **Colaborador / Operador da Máquina** | Digita os dados no formulário, calibra a impressora e emite as cópias físicas. | Art. 5º, VII: Realiza o tratamento de dados pessoais em nome do controlador. |
| **Fornecedor do Software** | **Mantenedores do Folium Print** | Disponibiliza o software livre sob licença AGPL-3.0. **Não tem acesso, não coleta e não processa** quaisquer dados trafegados nas instâncias do cliente. | Fornecedor de ferramenta técnica autônoma (Zero-Knowledge Provider). |

---

## 3. Mapeamento do Fluxo de Dados (RoPA — Art. 37)

```mermaid
flowchart TD
    subgraph Entrada ["1. Entrada de Dados"]
        User["Operador Humano"]
        Form["Formulário Dinâmico (RAM)"]
        User -->|Digita dados da etiqueta| Form
    end

    subgraph Processamento ["2. Processamento Local"]
        RAM["Memória Volátil (React State)"]
        Engine["JsBarcode / QRCode Local"]
        SVG["Renderizador Vetorial SVG"]
        Form --> RAM
        RAM --> Engine
        Engine --> SVG
    end

    subgraph Persistencia ["3. Persistência Local (Host)"]
        Storage["localStorage do Navegador / Webview"]
        StorageKeys["- Modelos customizados\n- Offsets de calibração\n- Último modelo selecionado"]
        Storage --- StorageKeys
        RAM -.->|Persiste apenas layout/offset| Storage
    end

    subgraph Saida ["4. Dispositivos de Saída"]
        Spooler["Spooler do Sistema Operacional (CUPS / Win32 Spooler)"]
        Printer["Impressora Física (Térmica / Laser / Matricial)"]
        SVG -->|window.print()| Spooler
        Spooler --> Printer
    end

    subgraph Risco_Externo ["5. Tráfego Externo Identificado"]
        CDN["Google Fonts (fonts.googleapis.com)"]
        Browser["Webview / Browser"] -.->|GET font css / woff2| CDN
    end
```

### Ciclo de Vida dos Dados por Categoria:
1. **Dados das Etiquetas (Nomes, CPFs, Endereços, SKUs, Telefones):**
   - **Ciclo:** Efêmero. Permanecem no `useState` e no DOM durante a sessão de trabalho.
   - **Exceção de risco:** Caso o usuário salve modelos personalizados contendo valores padrão preenchidos com dados reais no `VisualTemplateEditorModal`, estes dados ficam salvos em texto plano no `localStorage` sob a chave `folium-custom-templates`.
2. **Dados de Configuração Técnica:**
   - Offsets milimétricos ($x, y$), marcas de corte e seleção de papel não configuram dados pessoais (Art. 5º, I).

---

## 4. Matriz de Gaps e Plano de Mitigação

| ID | Item Auditado | Artigo LGPD | Severidade | Diagnóstico Atual | Ação de Remediação |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GAP-01** | Carregamento de Google Fonts via CDN externa | **Art. 33 a 36** (Transferência Internacional) & **Art. 6º, VI** | 🔴 **ALTA** | O `index.html` requisita fontes de `fonts.googleapis.com` e `fonts.gstatic.com`, transmitindo o endereço IP do usuário para servidores da Google nos EUA. | Auto-hospedar as fontes `Geist` localmente no projeto (`woff2`) e restringir o CSP para `font-src 'self' data:`. |
| **GAP-02** | Gestão e Expurgo de Dados no `localStorage` | **Art. 18, V e VI** (Portabilidade e Eliminação) | 🟡 **MÉDIA** | Não há interface para o operador auditar o que está armazenado nem botão de purga completa dos dados locais com 1 clique. | Criar modal de **Gerenciamento de Privacidade e Dados Locais** com opções de limpar histórico, zerar templates e exportar backups limpos. |
| **GAP-03** | Risco de Dados Pessoais em Templates Salvos | **Art. 6º, III** (Necessidade) & **Art. 46** | 🟡 **MÉDIA** | Ao salvar modelos personalizados, campos de exemplo (`defaultValue`) podem conter dados pessoais de clientes reais. | Adicionar aviso no editor e função de sanitização/limpeza de dados sensíveis antes de salvar ou exportar modelos. |
| **GAP-04** | Documentação e Transparência Local | **Art. 9º** (Transparência) & **Art. 46, §2º** | 🟢 **BAIXA** | O usuário não possui um termo acessível no próprio app esclarecendo que a ferramenta é offline e local-first. | Adicionar link/aba "Privacidade & LGPD" acessível no rodapé ou menu de configurações com o aviso de Privacy by Design. |
| **GAP-05** | Descarte Físico de Etiquetas Impressas | **Art. 46** (Segurança e Boas Práticas) | 🟢 **BAIXA** | Etiquetas térmicas e bobinas de teste descartadas intactas em lixo comum representam risco físico de vazamento. | Incluir recomendação de descarte seguro (fragmentação de mídias adesivas contendo PII) no manual de boas práticas do sistema. |

---

## 5. Princípios Fundamentais Aplicados ao Folium Print (Art. 6º)

1. **Finalidade (Inciso I):** Os dados digitados destinam-se única e exclusivamente à impressão material requisitada pelo operador.
2. **Adequação e Necessidade (Incisos II e III):** A ferramenta não exige cadastro de conta, e-mail, telemetria ou envio de estatísticas para funcionar.
3. **Livre Acesso e Qualidade dos Dados (Incisos IV e V):** O operador tem total controle visual e em tempo real dos dados inseridos no painel WYSIWYG antes do envio à impressora.
4. **Transparência (Inciso VI):** O código é aberto (AGPL-3.0), permitindo auditoria completa do comportamento de rede e persistência.
5. **Segurança e Prevenção (Incisos VII e VIII):** Ausência intencional de servidores intermediários, eliminando pontos de ataque de exfiltração remota.
6. **Não Discriminação e Responsabilização (Incisos IX e X):** O software opera com neutralidade técnica sem algoritmos de profiling.

---

## 6. Recomendações Técnicas Imediatas

### 6.1 Auto-hospedagem de Fontes (Isolamento de Rede 100% Offline)
Substituir as referências remotas no [index.html](file:///home/night/Documentos/Folium-Print/index.html#L11-L16) por fontes locais empacotadas no bundle:
```html
<!-- Eliminar pré-conexões externas -->
<!-- Adicionar fontes locais em src/assets/fonts/ e carregar via CSS local -->
```

Ajustar a diretiva Content-Security-Policy (CSP) para bloquear qualquer tentativa de conexão externa não autorizada:
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob:; connect-src 'self';" />
```

### 6.2 Implementação do Painel de Privacidade e Gestão de Dados
Adicionar ao menu ou rodapé um componente acessível que forneça:
1. Indicador de status: `Modo 100% Offline e Privado (Zero-Knowledge)`.
2. Tabela de chaves salvas no `localStorage` com contagem de bytes.
3. Botão "Exportar dados (JSON)".
4. Botão "Limpar todos os dados locais e redefinir".

---

## 7. Conclusão

O **Folium Print** possui uma arquitetura local-first altamente favorável à conformidade com a LGPD, distinguindo-se de soluções em nuvem que centralizam dados de clientes. Com a resolução da dependência externa de fontes (GAP-01) e a implementação de controles claros de purga e transparência local (GAP-02 e GAP-04), a aplicação atinge conformidade plena com os preceitos de **Privacy by Design**, garantindo segurança jurídica e técnica aos seus operadores e usuários.
