//      _/\_     _/\_
//  ___/    \___/    \___
// <_o_  human fish (olm) _o_>
/// <reference types="../worker-configuration.d.ts" />

declare module "h3" {
  interface H3EventContext {
    cf: CfProperties;
    cloudflare: {
      request: Request;
      env: Env;
      context: ExecutionContext;
    };
  }
}

export {};
