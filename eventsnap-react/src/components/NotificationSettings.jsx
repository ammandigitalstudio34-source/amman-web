import { useEffect, useState } from "react";
import {
  enablePushNotifications, isPushSupported, removeDeviceToken, syncPushNotifications,
} from "../notifications";

export default function NotificationSettings({ user }) {
  const isAppleMobile = typeof navigator !== "undefined"
    && (/iPhone|iPad|iPod/.test(navigator.userAgent)
      || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
  const [supported, setSupported] = useState(null);
  const [permission, setPermission] = useState("default");
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const available = await isPushSupported();
        if (!active) return;
        setSupported(available);
        if (!available) return;

        setPermission(Notification.permission);
        if (Notification.permission === "granted") {
          const registered = await syncPushNotifications(user);
          if (active) setEnabled(registered);
        }
      } catch (syncError) {
        if (active) {
          setSupported(false);
          setError(`Could not register this device: ${syncError.message}`);
        }
      }
    };
    check();
    return () => { active = false; };
  }, [user]);

  const enable = async () => {
    setBusy(true);
    setError("");
    try {
      await enablePushNotifications(user);
      setPermission(Notification.permission);
      setEnabled(true);
    } catch (enableError) {
      setPermission(typeof Notification === "undefined" ? "default" : Notification.permission);
      setError(enableError.message);
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    setError("");
    try {
      await removeDeviceToken(user, { disable: true });
      setEnabled(false);
    } catch (disableError) {
      setError(`Could not disable notifications: ${disableError.message}`);
    } finally {
      setBusy(false);
    }
  };

  const status = supported === false
    ? "Not supported in this browser"
    : supported === null
      ? "Checking browser support…"
      : permission === "denied"
        ? "Blocked in browser settings"
        : enabled
          ? "Enabled on this device"
          : permission === "granted"
            ? "Permission granted, notifications disabled"
            : "Not enabled";

  return (
    <section className="push-settings" aria-labelledby="push-settings-title">
      <div className="push-settings-copy">
        <h4 id="push-settings-title">Notification settings</h4>
        <p>Get updates about function requests, confirmations, cancellations, and messages.</p>
        <span className={`push-status${enabled ? " is-enabled" : ""}`} aria-live="polite">{status}</span>
        {permission === "denied" && supported && (
          <p className="push-help">Change notification permission in your browser's site settings, then reload this page.</p>
        )}
        {isAppleMobile && (
          <p className="push-help">On iPhone or iPad, add EventSnap to your Home Screen and open it there to receive notifications (iOS/iPadOS 16.4 or later). Allow notifications when prompted.</p>
        )}
        {error && <p className="push-error" role="alert">{error}</p>}
      </div>
      <div className="push-settings-actions">
        {enabled
          ? (
            <button type="button" className="push-button push-button-muted" onClick={disable} disabled={busy}>
              {busy ? "Updating…" : "Disable"}
            </button>
          ) : (
            <button type="button" className="push-button" onClick={enable} disabled={busy || supported !== true || permission === "denied"}>
              {busy ? "Enabling…" : "Enable notifications"}
            </button>
          )}
      </div>
    </section>
  );
}
