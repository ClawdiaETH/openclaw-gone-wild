'use client';

import { useEffect, useState } from 'react';

let toastFn: ((msg: string) => void) | null = null;

export function showToast(msg: string) {
  toastFn?.(msg);
}

export function Toast() {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    toastFn = (msg: string) => {
      setMessage(msg);
      setVisible(true);
      setTimeout(() => setVisible(false), 2500);
    };
    return () => { toastFn = null; };
  }, []);

  return (
    <div
      className="fixed bottom-6 left-1/2 z-[500] -translate-x-1/2 whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-5 py-2.5 text-sm font-semibold shadow-lg transition-transform duration-300"
      style={{ transform: `translateX(-50%) translateY(${visible ? '0' : '100px'})` }}
    >
      {message}
    </div>
  );
}
