const colors = {
  reset: '\x1b[0m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

class Logger {
  info(message, ...args) {
    console.log(`${colors.blue}[INFO]${colors.reset}`, message, ...args);
  }
  success(message, ...args) {
    console.log(`${colors.green}[SUCCESS]${colors.reset}`, message, ...args);
  }
  warn(message, ...args) {
    console.log(`${colors.yellow}[WARN]${colors.reset}`, message, ...args);
  }
  error(message, ...args) {
    console.error(`${colors.red}[ERROR]${colors.reset}`, message, ...args);
  }
}

module.exports = new Logger();
