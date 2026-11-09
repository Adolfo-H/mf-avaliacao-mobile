/**
 * Cache apenas em memória, por usuário, para miniaturas PRIVADAS.
 * Nenhum token, CPF, imagem ou dado clínico é persistido no navegador.
 * Máximo três fotos solicitadas ao mesmo tempo (evita rajadas N+1).
 */
const TTL_MS = 90_000;
const MAX_ENTRIES = 24;
const MAX_IN_FLIGHT = 3;

type Entry = { src: string | null; until: number };
const cache = new Map<string, Entry>();
const inflight = new Map<string, Promise<string | null>>();
const queue: Array<() => void> = [];
let active = 0;
let generation = 0;

function schedule<T>(job: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const start = () => {
      active += 1;
      void job().then(resolve, reject).finally(() => {
        active -= 1;
        const next = queue.shift();
        if (next) next();
      });
    };
    if (active < MAX_IN_FLIGHT) start();
    else queue.push(start);
  });
}

export function getMFStudentThumbnail(
  uuid: string,
  userId: number,
  loader: () => Promise<string | null>,
): Promise<string | null> {
  const key = `${userId}:${uuid}`;
  const entry = cache.get(key);
  if (entry && entry.until > Date.now()) {
    cache.delete(key);
    cache.set(key, entry);
    return Promise.resolve(entry.src);
  }
  const existing = inflight.get(key);
  if (existing) return existing;
  const requestedGeneration = generation;
  let task: Promise<string | null>;
  task = schedule(loader).then(src => {
    if (requestedGeneration === generation) {
      cache.delete(key);
      cache.set(key, { src, until: Date.now() + (src ? TTL_MS : 10_000) });
      while (cache.size > MAX_ENTRIES) {
        const first = cache.keys().next().value;
        if (first === undefined) break;
        cache.delete(first);
      }
    }
    return src;
  }).finally(() => {
    if (inflight.get(key) === task) inflight.delete(key);
  });
  inflight.set(key, task);
  return task;
}

/** Chamar após upload/remover foto, evitando a miniatura anterior. */
export function invalidateMFStudentThumbnail(uuid: string): void {
  generation += 1;
  for (const key of cache.keys()) {
    if (key.endsWith(`:${uuid}`)) cache.delete(key);
  }
  for (const key of inflight.keys()) {
    if (key.endsWith(`:${uuid}`)) inflight.delete(key);
  }
}

/** Chamar em logout; não manter fotos do usuário anterior na memória. */
export function clearMFStudentThumbnails(): void {
  generation += 1;
  cache.clear();
  inflight.clear();
}
