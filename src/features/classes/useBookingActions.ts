import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useToast } from '@/components/ui/Toast';
import { bookingRepository } from '@/data/repository';
import type { ClassSessionView } from '@/data/types';
import { useFormat } from '@/lib/format';
import { haptics } from '@/lib/haptics';

import { bookingErrorMessage } from './errors';
import { optimisticView, type BookingAction } from './optimistic';
import { useClassText } from './useClassText';

export interface ActionHandlers {
  /** Called at once with the expected result, before the request finishes. */
  onOptimistic: (next: ClassSessionView) => void;
  /** Called with the real result, or with the original view when the request failed. */
  onSettled: (view: ClassSessionView) => void;
  /** Called after a successful booking, to show the confirmation. */
  onBooked?: (view: ClassSessionView) => void;
}

/**
 * Book, cancel and waitlist actions with optimistic updates, haptics, error messages and Undo
 * toasts. The repository enforces every rule; this only reacts to its answer.
 */
export function useBookingActions(toastOffset?: number) {
  const { t } = useTranslation();
  const toast = useToast();
  const text = useClassText();
  const format = useFormat();
  const [busy, setBusy] = useState(false);

  const fail = useCallback(
    (error: unknown) => {
      toast.show({
        tone: 'error',
        message: bookingErrorMessage(t, error),
        bottomOffset: toastOffset,
      });
    },
    [t, toast, toastOffset],
  );

  const undoCancel = useCallback(
    async (sessionId: string, handlers: ActionHandlers) => {
      try {
        handlers.onSettled(await bookingRepository.undoCancel(sessionId));
        haptics.success();
        toast.show({ tone: 'success', message: t('toast.undone'), bottomOffset: toastOffset });
      } catch (error) {
        fail(error);
      }
    },
    [fail, t, toast, toastOffset],
  );

  const undoJoinWaitlist = useCallback(
    async (sessionId: string, handlers: ActionHandlers) => {
      try {
        handlers.onSettled(await bookingRepository.leaveWaitlist(sessionId));
        toast.show({ tone: 'success', message: t('toast.undone'), bottomOffset: toastOffset });
      } catch (error) {
        fail(error);
      }
    },
    [fail, t, toast, toastOffset],
  );

  const undoBooking = useCallback(
    async (sessionId: string, handlers: ActionHandlers) => {
      try {
        handlers.onSettled(await bookingRepository.undoBook(sessionId));
        toast.show({ tone: 'info', message: t('toast.bookingUndone'), bottomOffset: toastOffset });
      } catch (error) {
        fail(error);
      }
    },
    [fail, t, toast, toastOffset],
  );

  const run = useCallback(
    async (action: BookingAction, view: ClassSessionView, handlers: ActionHandlers) => {
      setBusy(true);
      handlers.onOptimistic(optimisticView(view, action));
      try {
        const result = await bookingRepository[action](view.id);
        handlers.onSettled(result);
        if (action === 'book') {
          haptics.success();
          handlers.onBooked?.(result);
        } else if (action === 'cancel') {
          toast.show({
            message: t('toast.cancelled', { name: text.name(view) }),
            actionLabel: t('toast.undo'),
            onAction: () => void undoCancel(view.id, handlers),
            durationMs: 6000,
            bottomOffset: toastOffset,
          });
        } else if (action === 'joinWaitlist') {
          haptics.success();
          toast.show({
            tone: 'success',
            message: t('toast.waitlistJoined', {
              positionText: format.number(result.waitlistPosition ?? 0),
            }),
            actionLabel: t('toast.undo'),
            onAction: () => void undoJoinWaitlist(view.id, handlers),
            durationMs: 6000,
            bottomOffset: toastOffset,
          });
        } else {
          toast.show({ tone: 'info', message: t('toast.waitlistLeft'), bottomOffset: toastOffset });
        }
      } catch (error) {
        handlers.onSettled(view);
        fail(error);
      } finally {
        setBusy(false);
      }
    },
    [fail, format, t, text, toast, toastOffset, undoCancel, undoJoinWaitlist],
  );

  return { run, undoBooking, busy };
}
