

/// <reference types="vite/client" />

declare module '*.svg' {
  const content: any;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}

declare module '*.ico' {
  const content: string;
  export default content;
}

declare module '*.bmp' {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_POLL_KEY: string;
  readonly VITE_BIGMODEL_API_KEY: string;
  readonly VITE_GEMINI_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Declare process for Vite's define replacement of environment variables.
 */
interface OracleProcessEnv {
  API_KEY: string;
  POLLINATIONS_API_KEY: string;
  BIGMODEL_API_KEY: string;
  [key: string]: string | undefined;
}

interface OracleProcess {
  env: OracleProcessEnv;
}

// @ts-ignore - Fix: Avoid redeclaration error if process is already defined in the environment.
declare var process: OracleProcess;
