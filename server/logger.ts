// logger5.ts
import pino from 'pino';

const logger = pino({
  timestamp: false,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      // Don't worry about truncate — just stringify in the caller
    },
  },
});

export default logger;
