import { useEffect } from "react";
import { useOnlineStatus } from "../hooks/use-online-status";
import { syncOutboxQueue } from "../lib/maintenance-service";
import { WifiOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function OfflineBanner() {
  const { isOnline, wasOffline } = useOnlineStatus();

  useEffect(() => {
    if (isOnline && wasOffline) {
      toast.info("Connection restored. Checking for pending reports to sync...");
      syncOutboxQueue().then((syncedCount) => {
        if (syncedCount > 0) {
          toast.success(`Successfully submitted ${syncedCount} pending maintenance report(s)!`);
        }
      });
    }
  }, [isOnline, wasOffline]);

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md backdrop-blur-md"
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>
        You&apos;re offline. Your reports and drafts are saved on this device and will be submitted
        when you reconnect.
      </span>
      <RefreshCw className="h-3.5 w-3.5 animate-spin opacity-75" />
    </div>
  );
}
