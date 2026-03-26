import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type OverlayStatus = 'pending' | 'success' | 'error';

interface TransactionPendingOverlayProps {
  isVisible: boolean;
  status?: OverlayStatus;
  txHash?: string;
  message?: string;
  subMessage?: string;
  onDismiss?: () => void;
}

const explorerBase =
  (import.meta.env.VITE_STELLAR_EXPLORER_TX_URL as string | undefined) ||
  'https://stellar.expert/explorer/testnet/tx/';

export function TransactionPendingOverlay({
  isVisible,
  status = 'pending',
  txHash,
  message,
  subMessage,
  onDismiss,
}: TransactionPendingOverlayProps) {
  const defaultMessages = {
    pending: {
      title: 'Broadcasted to Stellar',
      subtitle: 'Your transaction is being processed on-chain. This may take a few seconds.',
    },
    success: {
      title: 'Transaction Confirmed',
      subtitle: 'Your transaction has been successfully processed.',
    },
    error: {
      title: 'Transaction Failed',
      subtitle: 'There was an issue processing your transaction.',
    },
  };

  const content = {
    title: message || defaultMessages[status].title,
    subtitle: subMessage || defaultMessages[status].subtitle,
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none"
          aria-live="polite"
          aria-label={content.title}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-sm mx-4 bg-surface border border-hi rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#14F195] via-[#7B61FF] to-[#14F195] bg-[length:200%_100%] animate-[gradient-shift_2s_ease-in-out_infinite]" />

            <div className="p-8 flex flex-col items-center text-center">
              <div className="relative mb-6">
                {status === 'pending' && (
                  <div className="w-20 h-20 rounded-full border-4 border-accent/20 flex items-center justify-center bg-accent/5">
                    <Loader2 className="w-10 h-10 text-accent animate-spin" />
                  </div>
                )}
                {status === 'success' && (
                  <div className="w-20 h-20 rounded-full border-4 border-emerald-500/30 flex items-center justify-center bg-emerald-500/10">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </div>
                )}
                {status === 'error' && (
                  <div className="w-20 h-20 rounded-full border-4 border-red-500/30 flex items-center justify-center bg-red-500/10">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                  </div>
                )}

                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-bg border-2 border-accent flex items-center justify-center">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-accent"
                  >
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path
                      d="M12 6v6l4 2"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

              <h2 className="text-xl font-black tracking-tight mb-2">{content.title}</h2>
              <p className="text-sm text-muted leading-relaxed mb-4">{content.subtitle}</p>

              {txHash && (
                <div className="w-full p-3 bg-black/20 border border-hi rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">
                    Transaction Hash
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <code className="font-mono text-xs text-text break-all">
                      {txHash.slice(0, 12)}...{txHash.slice(-8)}
                    </code>
                    <a
                      href={`${explorerBase}${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-accent hover:text-accent/80 transition-colors"
                      aria-label="View transaction on explorer"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  </div>
                </div>
              )}

              {status === 'pending' && (
                <div className="mt-6 flex items-center gap-2 text-xs text-muted">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <span>Settling on Stellar network...</span>
                </div>
              )}

              {(status === 'success' || status === 'error') && onDismiss && (
                <button
                  onClick={onDismiss}
                  className="mt-6 px-6 py-2.5 bg-accent/20 text-accent border border-accent/40 rounded-xl text-sm font-bold hover:bg-accent hover:text-black transition-all"
                >
                  Dismiss
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default TransactionPendingOverlay;
