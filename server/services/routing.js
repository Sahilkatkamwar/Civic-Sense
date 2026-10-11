// server/services/routing.js
// Owner: Tanush (Routing & Status Flow)

/**
 * Valid status transitions:
 * submitted → under_review → in_progress → resolved
 * Any non-terminal status can be rejected with a reason.
 * rejected/resolved can be reopened to under_review.
 * submitted cannot jump directly to in_progress or resolved.
 */
const VALID_TRANSITIONS = {
  submitted: ['under_review', 'rejected'],
  under_review: ['in_progress', 'rejected'],
  in_progress: ['resolved', 'under_review', 'rejected'],
  rejected: ['under_review'],
  resolved: ['under_review']
};

/**
 * Human-readable status labels for display
 */
const STATUS_LABELS = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  rejected: 'Rejected'
};

/**
 * Validates if status transition is allowed.
 * Same-status transitions are considered no-ops and are allowed.
 */
function isValidTransition(currentStatus, newStatus) {
  if (currentStatus === newStatus) return true;
  const allowed = VALID_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(newStatus) : false;
}

/**
 * Gets the allowed next statuses for a given current status
 */
function getAllowedTransitions(currentStatus) {
  return VALID_TRANSITIONS[currentStatus] || [];
}

/**
 * Gets default authority for a category from the categories table.
 * Falls back to 'general' if category or authority mapping not found.
 */
function getAuthorityForCategory(db, categoryId) {
  const cat = db.prepare('SELECT authority_id FROM categories WHERE id = ?').get(categoryId);
  return cat ? cat.authority_id : 'general';
}

module.exports = {
  isValidTransition,
  getAllowedTransitions,
  getAuthorityForCategory,
  VALID_TRANSITIONS,
  STATUS_LABELS
};
