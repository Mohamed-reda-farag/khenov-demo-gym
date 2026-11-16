import { useCallback, useEffect, useRef, useState } from 'react';

export type ResourceState<T> =
  { status: 'loading' } | { status: 'error'; error: Error } | { status: 'success'; data: T };

/** Loads data on mount and exposes `reload` for retry. Ignores results after unmount. */
export function useAsyncResource<T>(load: () => Promise<T>): {
  state: ResourceState<T>;
  reload: () => void;
} {
  const [state, setState] = useState<ResourceState<T>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const loadRef = useRef(load);

  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    let active = true;
    loadRef
      .current()
      .then((data) => {
        if (active) setState({ status: 'success', data });
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            status: 'error',
            error: error instanceof Error ? error : new Error('Unknown error'),
          });
        }
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  const reload = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((n) => n + 1);
  }, []);
  return { state, reload };
}
