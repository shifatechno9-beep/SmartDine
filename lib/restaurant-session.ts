export const RESTAURANT_SLUG_KEY = "smartdine-restaurant-slug";
const CHANGE_EVENT = "smartdine-restaurant-slug";

export function getStoredRestaurantSlug() {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(RESTAURANT_SLUG_KEY);
  return value && value.trim() ? value.trim() : null;
}

export function setStoredRestaurantSlug(slug: string) {
  window.localStorage.setItem(RESTAURANT_SLUG_KEY, slug);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeRestaurantSlug(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
  };
}
