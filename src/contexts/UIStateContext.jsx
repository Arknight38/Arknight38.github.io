import { createContext, useContext, useReducer, useCallback, useMemo } from 'react';

// Initial state
const initialState = {
  // Overlay state
  overlay: {
    isOpen: false,
    content: null,
    data: null,
  },
  // Active route context
  activeRoute: '/profile',
  // Selected/active cards
  activeCard: null,
  hoveredCard: null,
  // Animation coordination
  isAnimating: false,
  animationDirection: null, // 'forward' | 'backward'
  // Focus states
  focusedElement: null,
  // Navigation locked state (during transitions)
  navLocked: false,
};

// Action types
const ACTIONS = {
  SET_OVERLAY: 'SET_OVERLAY',
  CLOSE_OVERLAY: 'CLOSE_OVERLAY',
  SET_ACTIVE_ROUTE: 'SET_ACTIVE_ROUTE',
  SET_ACTIVE_CARD: 'SET_ACTIVE_CARD',
  SET_HOVERED_CARD: 'SET_HOVERED_CARD',
  SET_ANIMATING: 'SET_ANIMATING',
  SET_FOCUSED_ELEMENT: 'SET_FOCUSED_ELEMENT',
  SET_NAV_LOCKED: 'SET_NAV_LOCKED',
};

// Reducer
function uiStateReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_OVERLAY:
      return {
        ...state,
        overlay: {
          isOpen: true,
          content: action.payload.content,
          data: action.payload.data || null,
        },
      };
    case ACTIONS.CLOSE_OVERLAY:
      return {
        ...state,
        overlay: {
          isOpen: false,
          content: null,
          data: null,
        },
      };
    case ACTIONS.SET_ACTIVE_ROUTE:
      return {
        ...state,
        activeRoute: action.payload,
      };
    case ACTIONS.SET_ACTIVE_CARD:
      return {
        ...state,
        activeCard: action.payload,
      };
    case ACTIONS.SET_HOVERED_CARD:
      return {
        ...state,
        hoveredCard: action.payload,
      };
    case ACTIONS.SET_ANIMATING:
      return {
        ...state,
        isAnimating: action.payload.isAnimating,
        animationDirection: action.payload.direction || null,
      };
    case ACTIONS.SET_FOCUSED_ELEMENT:
      return {
        ...state,
        focusedElement: action.payload,
      };
    case ACTIONS.SET_NAV_LOCKED:
      return {
        ...state,
        navLocked: action.payload,
      };
    default:
      return state;
  }
}

// Context
const UIStateContext = createContext(null);

// Provider
export function UIStateProvider({ children }) {
  const [state, dispatch] = useReducer(uiStateReducer, initialState);

  // Actions
  const openOverlay = useCallback((content, data) => {
    dispatch({ type: ACTIONS.SET_OVERLAY, payload: { content, data } });
  }, []);

  const closeOverlay = useCallback(() => {
    dispatch({ type: ACTIONS.CLOSE_OVERLAY });
  }, []);

  const setActiveRoute = useCallback((route) => {
    dispatch({ type: ACTIONS.SET_ACTIVE_ROUTE, payload: route });
  }, []);

  const setActiveCard = useCallback((cardId) => {
    dispatch({ type: ACTIONS.SET_ACTIVE_CARD, payload: cardId });
  }, []);

  const setHoveredCard = useCallback((cardId) => {
    dispatch({ type: ACTIONS.SET_HOVERED_CARD, payload: cardId });
  }, []);

  const setAnimating = useCallback((isAnimating, direction) => {
    dispatch({ type: ACTIONS.SET_ANIMATING, payload: { isAnimating, direction } });
  }, []);

  const setFocusedElement = useCallback((element) => {
    dispatch({ type: ACTIONS.SET_FOCUSED_ELEMENT, payload: element });
  }, []);

  const setNavLocked = useCallback((locked) => {
    dispatch({ type: ACTIONS.SET_NAV_LOCKED, payload: locked });
  }, []);

  // Memoized context value
  const value = useMemo(
    () => ({
      state,
      actions: {
        openOverlay,
        closeOverlay,
        setActiveRoute,
        setActiveCard,
        setHoveredCard,
        setAnimating,
        setFocusedElement,
        setNavLocked,
      },
    }),
    [state, openOverlay, closeOverlay, setActiveRoute, setActiveCard, setHoveredCard, setAnimating, setFocusedElement, setNavLocked]
  );

  return <UIStateContext.Provider value={value}>{children}</UIStateContext.Provider>;
}

// Hook
export function useUIState() {
  const context = useContext(UIStateContext);
  if (!context) {
    throw new Error('useUIState must be used within a UIStateProvider');
  }
  return context;
}

// Selectors for memoization
export function useOverlayState() {
  const { state } = useUIState();
  return state.overlay;
}

export function useActiveRoute() {
  const { state } = useUIState();
  return state.activeRoute;
}

export function useActiveCard() {
  const { state } = useUIState();
  return state.activeCard;
}

export function useIsAnimating() {
  const { state } = useUIState();
  return state.isAnimating;
}
