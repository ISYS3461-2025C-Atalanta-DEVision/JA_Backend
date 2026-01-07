import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  @Get()
  health() {
    return {
      status: 'ok',
      service: 'education-service',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  @Get('ready')
  ready() {
    return {
      status: 'ready',
      service: 'education-service',
    };
  }

  @Get('live')
  live() {
    return { status: 'alive' };
  }
}
