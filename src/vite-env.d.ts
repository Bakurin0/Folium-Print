/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VERCEL_ENV?: string;
  readonly VITE_VERCEL_GIT_COMMIT_REF?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
