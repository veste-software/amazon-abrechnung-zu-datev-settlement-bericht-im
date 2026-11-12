import { handleCheckout, type Env } from '../../server/handlers';

export const onRequestPost = async (ctx: { request: Request; env: Env }): Promise<Response> =>
  handleCheckout(ctx.request, ctx.env);
