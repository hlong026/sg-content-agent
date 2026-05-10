import { resolve } from 'path'
import { homedir } from 'os'

export const config = {
  port: parseInt(process.env.PORT || '8649', 10),
  host: process.env.BIND_HOST || '0.0.0.0',
  dataDir: process.env.DATA_DIR || resolve(homedir(), '.sg-content-agent'),
  uploadDir: process.env.UPLOAD_DIR || resolve(homedir(), '.sg-content-agent', 'upload'),
  corsOrigins: process.env.CORS_ORIGINS || '*',
  jwtSecret: process.env.JWT_SECRET || 'sg-content-agent-secret-change-me',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
}
