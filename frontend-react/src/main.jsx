import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'

// Prevent showing caret when clicking non-editable text: blur active editable before focus changes
function SetupBlurOnClick() {
  useEffect(() => {
    const onMouseDown = (e) => {
      // If the click target is an input-like element or contenteditable, do nothing
      const target = e.target;
      const tag = (target && target.tagName) || '';
      const isEditableTag = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable;
      if (!isEditableTag) {
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
          // Blur the previously focused editable to remove the caret
          active.blur();
        }
      }
    };

    // capture phase so we blur before the browser focuses the clicked element
    document.addEventListener('mousedown', onMouseDown, true);
    return () => document.removeEventListener('mousedown', onMouseDown, true);
  }, []);

  return null;
}

function SetupIbeamLogic() {
  useEffect(() => {
    // Helper to decide if an element is interactive/editable
    const isInteractive = (el) => {
      if (!el || el.nodeType !== 1) return false;
      try {
        return el.matches('input, textarea, select, button, a, [role="button"], [contenteditable], [tabindex]') || el.closest && el.closest('a,button,input,textarea,select,[role="button"]');
      } catch (e) {
        return false;
      }
    };

    const onPointerMove = (e) => {
      const t = e.target;
      const hoveredInteractive = isInteractive(t);
      const active = document.activeElement;
      const activeEditable = active && active.matches && active.matches('input,textarea,[contenteditable]');

      // If there is an active editable element, always keep caret visible
      if (activeEditable) {
        document.body.classList.remove('hide-ibeam');
        return;
      }

      // If hovering over non-interactive content, hide the I-beam to avoid showing caret cursor
      if (!hoveredInteractive) {
        document.body.classList.add('hide-ibeam');
      } else {
        document.body.classList.remove('hide-ibeam');
      }
    };

    // Use capture so the logic runs early
      const onPointerOver = (e) => {
        const t = e.target;
        const hoveredInteractive = isInteractive(t);
        const active = document.activeElement;
        const activeEditable = active && active.matches && active.matches('input,textarea,[contenteditable]');

        // If there is an active editable element, always keep caret visible
        if (activeEditable) {
          document.body.classList.remove('hide-ibeam');
          return;
        }

        // If pointer is over non-interactive content, hide the I-beam; otherwise show it
        if (!hoveredInteractive) {
          document.body.classList.add('hide-ibeam');
        } else {
          document.body.classList.remove('hide-ibeam');
        }
      };

      // Use capture so the logic runs early. Only listen to pointerover to reduce event frequency.
      document.addEventListener('pointerover', onPointerOver, true);

    // Ensure class removed on focus so inputs always show caret
    const onFocusIn = (e) => {
      const t = e.target;
      if (t && t.matches && t.matches('input,textarea,[contenteditable]')) {
        document.body.classList.remove('hide-ibeam');
      }
    };
    document.addEventListener('focusin', onFocusIn, true);

    return () => {
      document.removeEventListener('pointermove', onPointerMove, true);
      document.removeEventListener('pointerover', onPointerOver, true);
      document.removeEventListener('focusin', onFocusIn, true);
    };
  }, []);

  return null;
}

// Register Service Worker for PWA - vite-plugin-pwa handles this automatically
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('🔄 New content available, please refresh.')
  },
  onOfflineReady() {
    console.log('✅ App ready to work offline!')
  },
  onRegistered(registration) {
    console.log('✅ PWA Service Worker registered')
  },
  onRegisterError(error) {
    console.log('❌ Service Worker registration failed:', error)
  }
})

createRoot(document.getElementById('root')).render(
  <>
    <SetupBlurOnClick />
    <SetupIbeamLogic />
    <App />
  </>
)
