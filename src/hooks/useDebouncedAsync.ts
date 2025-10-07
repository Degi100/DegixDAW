import { useRef, useCallback } from 'react';

/**
 * Debounced async function pro Key (z.B. chatId).
 * Nur der letzte Aufruf pro Key wird nach delay ausgeführt.
 * Rückgabe ist ein Promise des letzten Calls.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebouncedAsync<T extends (...args: any[]) => Promise<any>>(
  asyncFn: T,
  delay: number = 300
) {
  type ResolveType = (value: ReturnType<T> | PromiseLike<ReturnType<T>>) => void;
  type RejectType = (reason?: unknown) => void;
  
  // Map: key -> Timeout
  const timeouts = useRef(new Map<string, NodeJS.Timeout>());
  // Map: key -> Promise resolve/reject
  const resolvers = useRef(new Map<string, { resolve: ResolveType; reject: RejectType }>());

  const debounced = useCallback(
    (key: string, ...args: Parameters<T>) => {
      // Clear previous timeout for this key
      if (timeouts.current.has(key)) {
        clearTimeout(timeouts.current.get(key));
        timeouts.current.delete(key);
        // Reject previous promise
        if (resolvers.current.has(key)) {
          resolvers.current.get(key)?.reject('debounced');
          resolvers.current.delete(key);
        }
      }
      // Return a new promise for this call
      return new Promise<ReturnType<T>>((resolve, reject) => {
        resolvers.current.set(key, { resolve, reject });
        const timeout = setTimeout(async () => {
          try {
            const result = await asyncFn(...args);
            resolve(result as ReturnType<T>);
          } catch (err) {
            reject(err);
          } finally {
            timeouts.current.delete(key);
            resolvers.current.delete(key);
          }
        }, delay);
        timeouts.current.set(key, timeout);
      });
    },
    [asyncFn, delay]
  );

  return debounced;
}
