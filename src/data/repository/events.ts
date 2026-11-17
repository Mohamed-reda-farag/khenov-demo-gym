type Listener = () => void;

const listeners = new Set<Listener>();

/** Lets screens refresh when bookings change anywhere in the app. Returns an unsubscribe. */
export function onBookingsChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitBookingsChanged(): void {
  listeners.forEach((listener) => listener());
}
