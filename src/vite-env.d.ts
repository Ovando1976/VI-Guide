declare module "*.png" {
  const value: string;
  export default value;
}

declare module "*?url" {
  const value: string;
  export default value;
}

interface ImportMetaEnv {
  readonly VITE_MAPBOX_ACCESS_TOKEN?: string;
  readonly VITE_MAPBOX_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
