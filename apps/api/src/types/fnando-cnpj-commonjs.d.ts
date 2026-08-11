declare module '@fnando/cnpj/commonjs/index.js' {
  export function isValid(value: string, strict?: boolean): boolean;
  export function strip(value: string, strict?: boolean): string;
}
