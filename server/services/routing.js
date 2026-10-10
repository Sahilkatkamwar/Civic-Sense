// server/services/routing.js

const VALID_TRANSITIONS = {
  submitted: ['under_review', 'in_progress', 'rejected'],
  under_review: ['in_progress', 'rejected'],
  in_progress: ['resolved', 'under_review', 'rejected'],
  rejected: ['under_review'],
  resolved: ['under_review']
};

/**
 * Validates if status transition is allowed
 */
function isValidTransition(currentStatus, newStatus) {
  if (currentStatus === newStatus) return true;
  const allowed = VALID_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(newStatus) : false;
}

/**
 * Gets default authority for a category
 */
function getAuthorityForCategory(db, categoryId) {
  const cat = db.prepare('SELECT authority_id FROM categories WHERE id = ?').get(categoryId);
  return cat ? cat.authority_id : 'general';
}

module.exports = {
  isValidTransition,
  getAuthorityForCategory,
  VALID_TRANSITIONS
};
