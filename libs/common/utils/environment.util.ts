import { join } from "path";
import { Environments } from "../enums/environment.enum";

export class EnvUtil {
  static getNodeEnv(): string {
    return process.env.NODE_ENV ?? 'development';
  }
  static isProduction(): boolean {
    return this.getNodeEnv() === Environments.Production;
  }
  static isDevelopment(): boolean {
    return this.getNodeEnv() === Environments.Development;
  }
  static isStaging(): boolean {
    return this.getNodeEnv() === Environments.Staging;
  }
  /**
   * Get the path to the environment file
   * @param appRoot - Optional app root directory path. If provided, returns absolute path to app-specific env file.
   * @returns Path to .env.{environment} file
   */
  static getPathEnv(appRoot?: string): string {
    const envFileName = '.env.' + this.getNodeEnv();
    if (appRoot) {
      return join(appRoot, envFileName);
    }
    return envFileName;
  }
}
