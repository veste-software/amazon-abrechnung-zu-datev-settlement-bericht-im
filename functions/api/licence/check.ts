import { handleCheck, type Env } from '../../../server/handlers';

export const onRequestPost = async (ctx: { request: Request; env: Env }): Promise<Response> =>
  handleCheck(ctx.request, ctx.env.LICENCES);
