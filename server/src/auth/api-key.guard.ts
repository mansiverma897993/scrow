import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { headers: Record<string, unknown> }>();
    const headerKey = (request.headers['x-scrow-api-key'] ?? '') as string;

    const expected = this.config.get<string>('SCROW_API_KEYS')?.trim();
    if (!expected) {
      // If no key configured, allow in local dev.
      return true;
    }

    // Support comma-separated keys.
    const allowed = expected
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    if (!headerKey || !allowed.includes(headerKey)) {
      throw new UnauthorizedException('Invalid or missing x-scrow-api-key');
    }
    return true;
  }
}

