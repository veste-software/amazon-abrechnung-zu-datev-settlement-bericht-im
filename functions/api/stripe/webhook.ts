import { handleWebhook, type Env } from '../../../server/handlers';

export const onRequestPost = async (ctx: { request: Request; env: Env }): Promise<Response> =>
  handleWebhook(ctx.request, ctx.env);
