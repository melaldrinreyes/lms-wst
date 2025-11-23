// Clear PWA Cache Script
// Run this in browser console to clear all caches

(async function clearPWACache() {
  console.log('🧹 Clearing PWA Caches...');
  
  // Clear all caches
  const cacheNames = await caches.keys();
  console.log('Found caches:', cacheNames);
  
  for (const cacheName of cacheNames) {
    await caches.delete(cacheName);
    console.log('✅ Deleted cache:', cacheName);
  }
  
  // Clear localStorage
  console.log('🧹 Clearing localStorage (except user/token)...');
  const user = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  localStorage.clear();
  if (user) localStorage.setItem('user', user);
  if (token) localStorage.setItem('token', token);
  
  // Unregister service workers
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
      console.log('✅ Unregistered service worker');
    }
  }
  
  console.log('✅ All caches cleared! Please refresh the page.');
  console.log('🔄 Reloading...');
  
  setTimeout(() => {
    window.location.reload();
  }, 1000);
})();
