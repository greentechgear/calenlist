import { useState, useCallback } from 'react';
import debounce from 'lodash/debounce';

export function useDelayedHover(delay = 200) {
  const [isVisible, setIsVisible] = useState(false);

  const hide = useCallback(
    debounce(() => {
      setIsVisible(false);
    }, delay),
    []
  );

  const show = useCallback(() => {
    hide.cancel();
    setIsVisible(true);
  }, [hide]);

  const handleMouseEnter = useCallback(() => {
    show();
  }, [show]);

  const handleMouseLeave = useCallback(() => {
    hide();
  }, [hide]);

  return {
    isVisible,
    handleMouseEnter,
    handleMouseLeave
  };
}