import { useEffect, useRef, useId } from 'react';

/**
 * Hook to manage history state for dialogs/modals.
 * Pushes a state when opened so the Android Back button closes the dialog
 * instead of navigating to the previous page.
 */
export function useDialogHistory(isOpen: boolean, onClose: () => void) {
  const dialogId = useId();
  const isBackButtonClicked = useRef(false);
  const onCloseRef = useRef(onClose);

  // Keep ref updated to avoid stale closures
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // Push a new state when the dialog opens
    // We preserve the existing history state to avoid breaking routers
    const currentState = (window.history.state as Record<string, unknown> | null) ?? {};
    window.history.pushState({ ...currentState, dialogId }, '');

    const handlePopState = (e: PopStateEvent) => {
      // When the user presses the back button, the browser pops our pushed state.
      // The new current state (e.state) will no longer have our dialogId.
      const state = e.state as Record<string, unknown> | null;
      if (state?.dialogId !== dialogId) {
        isBackButtonClicked.current = true;
        onCloseRef.current();
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);

      // If the dialog was closed by a UI action (e.g. clicking a "Close" button),
      // our pushed state is still at the top of the history stack.
      // We need to pop it programmatically.
      if (!isBackButtonClicked.current) {
        const hState = window.history.state as Record<string, unknown> | null;
        if (hState?.dialogId === dialogId) {
          window.history.back();
        }
      }
      isBackButtonClicked.current = false;
    };
  }, [isOpen, dialogId]);
}
