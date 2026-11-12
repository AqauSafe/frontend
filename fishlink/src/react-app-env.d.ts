declare namespace NodeJS {
  interface ProcessEnv {
    readonly REACT_APP_API_URL?: string;
    readonly PUBLIC_URL?: string;
    readonly NODE_ENV?: string;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};
