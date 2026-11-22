import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

const DEVELOPER_FRAME_SRC = 'https://6afb5a5fbac4d.site123.me/';

interface DeveloperFrameModalProps {
  open: boolean;
  onClose: () => void;
}

export function DeveloperFrameModal({ open, onClose }: DeveloperFrameModalProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open) {
      setLoaded(false);
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex flex-col bg-white dark:bg-[#16161A]"
      role="dialog"
      aria-modal="true"
      aria-label="صفحة المطور داخل المنصة"
      dir="rtl"
    >
      <div className="relative h-full w-full overflow-hidden bg-white dark:bg-[#16161A]">
        {!loaded && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-1 overflow-hidden bg-neutral-200 dark:bg-neutral-800">
            <div className="h-full w-1/2 animate-pulse bg-[#E31B23]" />
          </div>
        )}

        <iframe
          src={DEVELOPER_FRAME_SRC}
          title="صفحة المطور HOSSAM AHMED"
          onLoad={() => setLoaded(true)}
          className="h-full w-full border-0 bg-white"
          allow="clipboard-write; fullscreen"
          referrerPolicy="no-referrer"
        />

        <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-10 flex h-[2cm] items-center justify-center bg-black px-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#E31B23] px-5 text-xs font-bold text-white shadow-lg transition-colors hover:bg-[#B5121B] sm:text-sm"
          >
            <ArrowRight className="h-4 w-4" />
            <span>العودة إلى المنصة</span>
          </button>
        </div>
      </div>
    </div>
  );
}
