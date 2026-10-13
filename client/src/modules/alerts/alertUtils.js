// client/src/modules/alerts/alertUtils.js

export function getOrCreateClientId() {
  let id = localStorage.getItem('cs_client_id');
  if (!id) {
    id = 'cs_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
    localStorage.setItem('cs_client_id', id);
  }
  return id;
}
