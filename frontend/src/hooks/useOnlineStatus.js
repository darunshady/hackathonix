import { useState, useEffect } from "react";

/**
 * Custom hook that tracks the browser's online/offline status.
 * Re-renders the consuming component whenever connectivity changes.
 *
 * @returns {boolean} `true` when navigator.onLine is true
 */
export default function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return online;
}
