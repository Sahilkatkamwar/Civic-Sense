// server/services/alertScheduler.js
// Handles status transitions for scheduled and expired municipal alerts

function runAlertTransitions(db) {
  try {
    const now = new Date().toISOString();

    // 1. Scheduled alerts whose start time has arrived become active
    const activated = db.prepare(`
      UPDATE alerts
      SET status = 'active', updated_at = CURRENT_TIMESTAMP
      WHERE status = 'scheduled' AND starts_at <= ?
    `).run(now);

    // 2. Active alerts whose end time has passed become expired
    const expired = db.prepare(`
      UPDATE alerts
      SET status = 'expired', updated_at = CURRENT_TIMESTAMP
      WHERE status = 'active' AND ends_at IS NOT NULL AND ends_at <= ?
    `).run(now);

    if (activated.changes > 0 || expired.changes > 0) {
      console.log(`[Alert Scheduler] Transitions: ${activated.changes} activated, ${expired.changes} expired.`);
    }
  } catch (err) {
    console.error('[Alert Scheduler] Error running alert transitions:', err);
  }
}

function startAlertScheduler(db) {
  // Run once immediately on server startup
  runAlertTransitions(db);

  // Check every 60 seconds (1 minute)
  const timer = setInterval(() => {
    runAlertTransitions(db);
  }, 60 * 1000);

  if (timer.unref) {
    timer.unref();
  }

  return timer;
}

module.exports = {
  runAlertTransitions,
  startAlertScheduler
};
