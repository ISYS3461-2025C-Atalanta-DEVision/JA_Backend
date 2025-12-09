import { applyDecorators, UseGuards } from "@nestjs/common"
import { OriginGuard } from "../guards/origin.guard";

export const RequiredOrigin = () => {
  return applyDecorators(UseGuards(OriginGuard));
}