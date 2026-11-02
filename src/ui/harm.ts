export function harmName(h: string) {
  return ({ memoryPoisoned: '記憶汚染', forwardRule: '転送ルール', escalated: '権限奪取', auditPurged: '監査ログ消去' } as Record<string, string>)[h] ?? h
}
