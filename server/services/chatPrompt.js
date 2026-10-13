// server/services/chatPrompt.js

const BASE_SYSTEM_PROMPT = `You are Civic Assistant, the helper inside Civic Sense, an app where citizens report municipal issues
(potholes, garbage, overgrown trees, hanging cables, dead animals, other), the report is routed to the
responsible municipal department, and the citizen can track its status.

What you can help with:
- Explaining how to report an issue and which category fits a situation.
- Explaining the statuses: submitted, under review, in progress, resolved, rejected.
- Explaining that duplicate reports in the same area are merged and that more reports raise priority.
- Reporting the facts about a complaint or alert ONLY when they are provided to you in the context below.
- Giving basic safety tips (for example: never touch hanging cables, keep away from dead animals).

Rules:
- Never invent complaint statuses, dates, phone numbers, helpline numbers or department names.
  If you do not have the information, say so and tell the user to use the Track page.
- For anything dangerous or urgent, tell the user to keep distance and contact local emergency
  services, then offer to guide them to report it in the app.
- Reply in the same language the user writes in (English, Hindi or Marathi).
- Keep answers short (under 120 words), friendly and practical.
- You cannot submit or edit complaints yourself. Point users to the Report page.
- Politely decline requests unrelated to civic issues or this app.`;

/**
 * Builds system prompt with live verified facts from the database.
 */
function buildContextualSystemPrompt(db, { latestUserMessage = '', wardId = null }) {
  let contextParts = [];

  // 1. Complaint ID regex lookup: CS-YYYY-XXXXX or CS-YYYY-DEMO-XX
  const complaintIdMatch = latestUserMessage.match(/CS-\d{4}-[\w-]+/i);
  if (complaintIdMatch) {
    const rawId = complaintIdMatch[0].toUpperCase();
    const complaint = db.prepare(`
      SELECT c.id, c.status, c.priority_level, c.created_at,
             cat.name as category_name, a.name as authority_name,
             (SELECT note FROM status_history WHERE complaint_id = c.id ORDER BY created_at DESC LIMIT 1) as latest_note
      FROM complaints c
      JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN authorities a ON c.authority_id = a.id
      WHERE UPPER(c.id) = ?
    `).get(rawId);

    if (complaint) {
      contextParts.push(`Live Database Fact for Complaint #${complaint.id}:
- Current Status: ${complaint.status}
- Category: ${complaint.category_name}
- Priority Level: ${complaint.priority_level}
- Assigned Department: ${complaint.authority_name || 'Municipal Field Operations'}
- Latest Status Note: ${complaint.latest_note || 'Pending review by municipal field engineers'}
- Lodged Date: ${complaint.created_at}`);
    } else {
      contextParts.push(`Complaint Lookup Fact for ID "${rawId}": No complaint with this ID exists in the municipal registry.`);
    }
  }

  // 2. Active alerts context for ward / city-wide
  if (wardId) {
    try {
      const activeAlerts = db.prepare(`
        SELECT DISTINCT a.title_en, a.type, a.severity, a.starts_at, a.ends_at
        FROM alerts a
        LEFT JOIN alert_wards aw ON a.id = aw.alert_id
        WHERE a.status = 'active'
          AND (a.all_wards = 1 OR aw.ward_id = ?)
        LIMIT 5
      `).all(wardId);

      if (activeAlerts.length > 0) {
        const alertSummaries = activeAlerts.map(
          (a) => `- [${a.severity.toUpperCase()}] ${a.title_en} (Effective: ${a.starts_at})`
        ).join('\n');

        contextParts.push(`Live Active Civic Alerts Context (Ward ${wardId} and City-wide):
${alertSummaries}`);
      } else {
        contextParts.push(`Live Active Civic Alerts Context: No active alerts currently affecting ward ${wardId}.`);
      }
    } catch (err) {
      console.error('Error fetching alert context for prompt:', err);
    }
  }

  if (contextParts.length > 0) {
    return `${BASE_SYSTEM_PROMPT}\n\n=== VERIFIED LIVE DATABASE CONTEXT ===\n${contextParts.join('\n\n')}\n=== END OF CONTEXT ===`;
  }

  return BASE_SYSTEM_PROMPT;
}

module.exports = {
  BASE_SYSTEM_PROMPT,
  buildContextualSystemPrompt
};
