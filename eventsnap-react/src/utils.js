import { useCallback, useEffect, useRef, useState } from "react";
import { CITIES } from "./data";

const ALIAS = {
  "": "home", top: "home", categories: "home", pros: "about", faq: "contact",
  photographers: "photographers", post: "post", board: "board", how: "how",
  about: "about", contact: "contact", admin: "admin",
};
export const PAGES = ["home", "photographers", "post", "board", "how", "about", "contact", "admin"];

const routeFromLocation = () => {
  const path = window.location.pathname.replace(/\/+$/, "").split("/").pop()?.toLowerCase() || "";
  if (path && path !== "index.html" && ALIAS[path]) return ALIAS[path];
  const hash = window.location.hash.replace(/^#\/?/, "").split(/[?&]/)[0].toLowerCase();
  return ALIAS[hash] || "home";
};

export function useRoute() {
  const [page, setPage] = useState(routeFromLocation);
  useEffect(() => {
    const update = () => setPage(routeFromLocation());
    window.addEventListener("hashchange", update);
    window.addEventListener("popstate", update);
    return () => {
      window.removeEventListener("hashchange", update);
      window.removeEventListener("popstate", update);
    };
  }, []);
  return page;
}

export function goPage(page) {
  window.location.hash = page === "home" ? "#/" : `#/${page}`;
}

export function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function inr(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

export function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts.length === 1 ? parts[0].slice(0, 2) : `${parts[0][0]}${parts[parts.length - 1][0]}`).toUpperCase();
}

export function hhmm(timestamp) {
  return new Date(timestamp).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export function dayLabel(timestamp) {
  return new Date(timestamp).toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

export function daysUntil(date) {
  const target = new Date(`${date}T00:00:00`);
  if (Number.isNaN(target.getTime())) return Number.POSITIVE_INFINITY;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function fmtTime(time) {
  const [hours, minutes] = String(time || "").split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return "";
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

const distanceKm = (a, b) => {
  const radians = (degrees) => degrees * Math.PI / 180;
  const dLat = radians(b[0] - a[0]), dLon = radians(b[1] - a[1]);
  const lat1 = radians(a[0]), lat2 = radians(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

export function km(fromCity, toCity) {
  const from = CITIES[fromCity], to = CITIES[toCity];
  return from && to ? Math.round(distanceKm(from, to)) : Number.POSITIVE_INFINITY;
}

export function nearestCity(latitude, longitude) {
  const point = [latitude, longitude];
  return Object.entries(CITIES).reduce((nearest, [city, coordinates]) => (
    distanceKm(point, coordinates) < nearest.distance
      ? { city, distance: distanceKm(point, coordinates) }
      : nearest
  ), { city: "Chennai", distance: Number.POSITIVE_INFINITY }).city;
}

export function useImageExists(src) {
  const [exists, setExists] = useState(false);
  useEffect(() => {
    let active = true;
    setExists(false);
    if (!src) return () => { active = false; };
    const image = new Image();
    image.onload = () => { if (active) setExists(true); };
    image.onerror = () => { if (active) setExists(false); };
    image.src = src;
    return () => { active = false; image.onload = null; image.onerror = null; };
  }, [src]);
  return exists;
}

export function readPhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read the selected image."));
    };
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });
}

const readStoredValue = (key, fallback) => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (error) {
    console.error(`Could not read saved data for "${key}".`, error);
    return fallback;
  }
};

export function useStored(key, fallback) {
  const [value, setValue] = useState(() => readStoredValue(key, fallback));
  const valueRef = useRef(value);
  const lastRawRef = useRef(null);
  const fallbackRef = useRef(fallback);
  valueRef.current = value;
  fallbackRef.current = fallback;

  const setStored = useCallback((nextValue) => {
    const next = typeof nextValue === "function" ? nextValue(valueRef.current) : nextValue;
    valueRef.current = next;
    setValue(next);
    try {
      const raw = JSON.stringify(next);
      window.localStorage.setItem(key, raw);
      lastRawRef.current = raw;
      window.dispatchEvent(new Event("eventsnap-storage"));
    } catch (error) {
      console.error(`Could not save data for "${key}".`, error);
    }
  }, [key]);

  useEffect(() => {
    const sync = () => {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw === lastRawRef.current) return;
        lastRawRef.current = raw;
        const latest = raw === null ? fallbackRef.current : JSON.parse(raw);
        valueRef.current = latest;
        setValue(latest);
      } catch (error) {
        console.error(`Could not sync saved data for "${key}".`, error);
      }
    };
    try {
      lastRawRef.current = window.localStorage.getItem(key);
    } catch (error) {
      console.error(`Could not watch saved data for "${key}".`, error);
    }
    window.addEventListener("storage", sync);
    window.addEventListener("eventsnap-storage", sync);
    const timer = window.setInterval(sync, 500);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", sync);
      window.removeEventListener("eventsnap-storage", sync);
    };
  }, [key]);

  return [value, setStored];
}
