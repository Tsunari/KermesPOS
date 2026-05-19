import { useEffect } from 'react';

type ParsedHotkey = {
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
  key: string; // event.key value or special 'Space'
};

function parseHotkeyString(h?: string | null): ParsedHotkey | null {
  if (!h) return null;
  const parts = h.split('+').map(p => p.trim()).filter(Boolean);
  const parsed: ParsedHotkey = { ctrl: false, alt: false, shift: false, meta: false, key: '' };
  for (const p of parts) {
    const up = p.toLowerCase();
    if (up === 'control' || up === 'ctrl') parsed.ctrl = true;
    else if (up === 'alt') parsed.alt = true;
    else if (up === 'shift') parsed.shift = true;
    else if (up === 'meta' || up === 'cmd' || up === 'command') parsed.meta = true;
    else parsed.key = p; // last part is key
  }
  if (!parsed.key) return null;
  return parsed;
}

function matches(e: KeyboardEvent, target: ParsedHotkey) {
  if (!target) return false;
  if (e.ctrlKey !== target.ctrl) return false;
  if (e.altKey !== target.alt) return false;
  if (e.shiftKey !== target.shift) return false;
  if (e.metaKey !== target.meta) return false;

  const eventKey = e.key === ' ' ? 'Space' : e.key;
  // Compare case-insensitive for letters
  if (target.key.length === 1) {
    return eventKey.toLowerCase() === target.key.toLowerCase();
  }
  return eventKey === target.key || eventKey.toLowerCase() === target.key.toLowerCase();
}

export default function useHotkey(hotkey: string | undefined | null, handler: (e: KeyboardEvent) => void) {
  useEffect(() => {
    const target = parseHotkeyString(hotkey || null);

    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;

      // Ignore when typing in inputs or contenteditable
      const active = document.activeElement as HTMLElement | null;
      if (active) {
        const tag = active.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || active.isContentEditable) return;
      }

      if (!target) return;
      if (matches(e, target)) {
        e.preventDefault();
        handler(e);
      }
    };

    window.addEventListener('keydown', onKey as any);
    return () => window.removeEventListener('keydown', onKey as any);
  }, [hotkey, handler]);
}
