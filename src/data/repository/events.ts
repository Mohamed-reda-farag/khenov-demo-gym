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

const workoutListeners = new Set<Listener>();

/** Fires when a workout starts, ends or is discarded, so Home and Workout can refresh. */
export function onWorkoutChanged(listener: Listener): () => void {
  workoutListeners.add(listener);
  return () => {
    workoutListeners.delete(listener);
  };
}

export function emitWorkoutChanged(): void {
  workoutListeners.forEach((listener) => listener());
}
