declare namespace NodeJS {
  interface ProcessEnv {
    readonly REACT_APP_API_URL?: string;
    readonly REACT_APP_CUSTOMER_SERVICE_WHATSAPP?: string;
    readonly REACT_APP_CUSTOMER_SERVICE_PHONE?: string;
    readonly REACT_APP_CUSTOMER_SERVICE_EMAIL?: string;
    readonly REACT_APP_CUSTOMER_SERVICE_HOURS?: string;
    readonly PUBLIC_URL?: string;
    readonly NODE_ENV?: string;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};
