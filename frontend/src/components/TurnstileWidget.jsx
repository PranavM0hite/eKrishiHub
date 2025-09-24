import { useEffect, useRef } from 'react';

export default function TurnstileWidget({ siteKey, onVerify, theme = 'light' }) {
  const ref = useRef(null);

  useEffect(() => {
    const tryRender = () => {
      if (!window.turnstile || !ref.current || ref.current.dataset.rendered) return;
      ref.current.dataset.rendered = '1';
      window.turnstile.render(ref.current, {
        sitekey: siteKey,
        theme,
        callback: (token) => onVerify?.(token),
        'expired-callback': () => onVerify?.(''),
        'error-callback': () => onVerify?.(''),
      });
    };
    tryRender();
    const t = setInterval(tryRender, 300);
    setTimeout(() => clearInterval(t), 4000);
    return () => clearInterval(t);
  }, [siteKey, onVerify, theme]);

  return <div ref={ref} className="cf-turnstile" />;
}
