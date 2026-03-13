import { useEffect, useState } from "react";

export default function OfflineNotice() {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);

  useEffect(() => {
    function handleOnline() {
      setOnline(true);
    }

    function handleOffline() {
      setOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (online) {
    return null;
  }

  return (
    <div className="offline-banner" role="status" aria-live="polite">
      You are offline. Browsing works from cache, but checkout, login, and AI actions need internet.
    </div>
  );
}
