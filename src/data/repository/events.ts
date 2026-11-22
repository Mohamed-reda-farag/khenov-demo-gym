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

const membershipListeners = new Set<Listener>();

/** Fires after a renewal, so every screen showing the membership can refresh. */
export function onMembershipChanged(listener: Listener): () => void {
  membershipListeners.add(listener);
  return () => {
    membershipListeners.delete(listener);
  };
}

export function emitMembershipChanged(): void {
  membershipListeners.forEach((listener) => listener());
}

const notificationListeners = new Set<Listener>();

/** Fires when a notification arrives or is read, so the bell and the inbox stay in step. */
export function onNotificationsChanged(listener: Listener): () => void {
  notificationListeners.add(listener);
  return () => {
    notificationListeners.delete(listener);
  };
}

export function emitNotificationsChanged(): void {
  notificationListeners.forEach((listener) => listener());
}

const profileListeners = new Set<Listener>();

/** Fires after the member edits their name or initials. */
export function onProfileChanged(listener: Listener): () => void {
  profileListeners.add(listener);
  return () => {
    profileListeners.delete(listener);
  };
}

export function emitProfileChanged(): void {
  profileListeners.forEach((listener) => listener());
}
