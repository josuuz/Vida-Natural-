import 'server-only';

/**
 * Limitador simples em memória, por IP e por rota.
 *
 * Suficiente para conter abuso trivial num único processo. Se o site for para
 * múltiplas instâncias, troque por Redis/Upstash mantendo esta assinatura.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;

function clientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return request.headers.get('x-real-ip') ?? 'local';
}

export function rateLimit(request: Request, scope: string, limitPerMinute: number) {
  const key = `${scope}:${clientIp(request)}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    // limpeza preguiçosa para o mapa não crescer sem limite
    if (buckets.size > 5000) {
      for (const [entryKey, entry] of buckets) if (entry.resetAt <= now) buckets.delete(entryKey);
    }
    return true;
  }

  bucket.count += 1;
  return bucket.count <= limitPerMinute;
}
