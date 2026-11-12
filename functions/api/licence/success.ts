import { handleSuccess, type Env } from '../../../server/handlers';

export const onRequestGet = async (ctx: { request: Request; env: Env }): Promise<Response> =>
  handleSuccess(ctx.request, ctx.env.LICENCES);
