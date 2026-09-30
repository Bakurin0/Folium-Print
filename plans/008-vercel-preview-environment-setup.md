# Plano 008: Configuração e Suporte a Ambientes de Preview na Vercel

## 1. Visão Geral
Este documento descreve a configuração e o suporte a **Ambientes de Preview (Pré-produção)** na Vercel para o **Folium-Print**, permitindo validação contínua de branches e pull requests com geração automática de URLs de teste, roteamento SPA e compatibilidade com a **Vercel Toolbar**.

- **Referência:** [Vercel Environments Documentation](https://vercel.com/docs/deployments/environments#preview-environment-pre-production)
- **Status:** ✅ Concluído

---

## 2. Arquitetura de Ambientes na Vercel

| Ambiente | Gatilho | Propósito | URL |
| :--- | :--- | :--- | :--- |
| **Local Development** | `pnpm run dev` | Desenvolvimento rápido em máquina local | `http://localhost:5173` |
| **Preview (Pré-produção)** | Push em branch não-main ou Pull Request | Homologação, QA e revisão com Vercel Toolbar | `*-git-[branch]-[scope].vercel.app` |
| **Production** | Push/Merge na branch `main` | Versão final entregue aos usuários finais | Domínio de produção oficial |

---

## 3. Arquivos Configurados

1. **`vercel.json`**:
   - `rewrites`: Redireciona todas as rotas `/(.*)` para `/index.html` garantindo funcionamento do SPA sem erros 404 em navegações profundas.
   - `headers`:
     - Cache imutável (`Cache-Control: public, max-age=31536000, immutable`) para `/assets/*`.
     - `X-Content-Type-Options: nosniff`.
     - `X-Frame-Options: SAMEORIGIN` (compatível com visualizações seguras e iframes).
     - `Referrer-Policy: strict-origin-when-cross-origin`.
     - `Permissions-Policy` bloqueando recursos sensíveis de hardware.
2. **`.vercelignore`**:
   - Otimiza uploads e tempo de build na nuvem, excluindo `src-tauri/`, relatórios em PDF/Python e arquivos locais.
3. **`vite.config.ts` & `src/vite-env.d.ts`**:
   - Injeta `import.meta.env.VITE_VERCEL_ENV` e `import.meta.env.VITE_VERCEL_GIT_COMMIT_REF`.
4. **`index.html`**:
   - CSP ajustado para permitir a injeção da **Vercel Toolbar** em builds de preview (`https://vercel.live`, `wss://*.vercel.live`, `https://assets.vercel.com`).
5. **`src/components/UnifiedToolbar.tsx`**:
   - Exibe badge tátil pulsante de **Preview** apenas quando executado em ambiente de pré-produção.

---

## 4. Guia de Vinculação e Uso

### Vincular Repositório à Vercel (CLI)
```bash
# 1. Instalar Vercel CLI (caso necessário)
pnpm i -g vercel

# 2. Vincular projeto local ao dashboard da Vercel
vercel link

# 3. Disparar deploy de Preview manual (opcional)
vercel

# 4. Disparar deploy de Produção manual (opcional)
vercel --prod
```

### Deploy Automático via Git
Qualquer push para uma branch secundária ou abertura de Pull Request no GitHub/GitLab dispara automaticamente um deploy de **Preview** com sua própria URL imutável e Vercel Toolbar habilitada para inspeção visual e comentários.
