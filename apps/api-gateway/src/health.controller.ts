import { Controller, Get } from '@nestjs/common';
import { Public } from '@auth/decorators';

@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  @Get()
  @Public()
  health() {
    return {
      status: 'ok',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  @Get('ready')
  @Public()
  ready() {
    return {
      status: 'ready',
      service: 'api-gateway',
    };
  }

  @Get('live')
  @Public()
  live() {
    return { status: 'alive' };
  }
}
