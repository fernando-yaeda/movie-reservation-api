import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { Request } from 'express';

const getCurrentUserByContext = (context: ExecutionContext): unknown => {
  const request = context.switchToHttp().getRequest<Request>();
  return request.user;
};

export const GetCurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => getCurrentUserByContext(ctx),
);
