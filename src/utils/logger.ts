/**
 * 统一日志工具
 * - 生产环境自动禁用 debug 级别日志
 * - 支持日志级别控制
 */

interface LoggerOptions {
  prefix?: string;
  enabled?: boolean;
}

const isDev = import.meta.env.DEV;

/**
 * 创建带前缀的日志器
 */
export function createLogger(prefix: string, options: LoggerOptions = {}) {
  const { enabled = true } = options;

  return {
    debug: (msg: string, ...args: unknown[]) => {
      if (isDev && enabled) {
        console.log(`[${prefix}] ${msg}`, ...args);
      }
    },
    info: (msg: string, ...args: unknown[]) => {
      if (enabled) {
        console.log(`[${prefix}] ${msg}`, ...args);
      }
    },
    warn: (msg: string, ...args: unknown[]) => {
      if (enabled) {
        console.warn(`[${prefix}] ${msg}`, ...args);
      }
    },
    error: (msg: string, ...args: unknown[]) => {
      if (enabled) {
        console.error(`[${prefix}] ${msg}`, ...args);
      }
    },
  };
}

/**
 * 默认日志器
 */
export const logger = {
  debug: (msg: string, ...args: unknown[]) => {
    if (isDev) {
      console.log(`[DEBUG] ${msg}`, ...args);
    }
  },
  info: (msg: string, ...args: unknown[]) => {
    console.log(`[INFO] ${msg}`, ...args);
  },
  warn: (msg: string, ...args: unknown[]) => {
    console.warn(`[WARN] ${msg}`, ...args);
  },
  error: (msg: string, ...args: unknown[]) => {
    console.error(`[ERROR] ${msg}`, ...args);
  },
};

export default logger;
