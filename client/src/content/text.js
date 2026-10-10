// client/src/content/text.js
// Owner: Gagare (Static text, guidance, and FAQ content)

export const howItWorksSteps = [
  {
    step: 1,
    title: 'Spot',
    icon: '👀',
    description: 'Notice a pothole, open garbage dump, dangling wire, or fallen tree in your neighborhood.'
  },
  {
    step: 2,
    title: 'Snap',
    icon: '📸',
    description: 'Take a clear photograph. Our perceptual hash engine checks if someone already snapped it nearby.'
  },
  {
    step: 3,
    title: 'Submit',
    icon: '📍',
    description: 'Confirm GPS coordinates, add a short note, and submit directly to the responsible authority.'
  },
  {
    step: 4,
    title: 'Track',
    icon: '🔍',
    description: 'Receive your unique tracking code. Follow status updates as municipal teams resolve the issue.'
  }
];

export const aboutText = {
  title: 'About Civic Sense',
  content: 'Civic Sense is an intelligent municipal issue reporting platform engineered for rapid civic accountability. By pairing automated duplicate detection and computer-assisted photo hashing with dynamic priority scoring, we help municipal departments eliminate duplicate noise, triage high-risk hazards immediately, and keep citizens informed every step of the way.'
};

export const faqs = [
  {
    question: 'Is my complaint anonymous?',
    answer: 'Yes! Civic Sense does not require personal credentials or phone numbers to report an issue. Your report is tied exclusively to the geographic coordinates and photo evidence.'
  },
  {
    question: 'What if multiple people report the same issue?',
    answer: 'Our smart duplicate engine compares photo perceptual hashes (dHash) and GPS distance within 50 meters. If a report matches an existing open issue, it automatically merges them, increments the report counter, and boosts the priority level.'
  },
  {
    question: 'How is the priority level calculated?',
    answer: 'The system computes an algorithmic score based on category hazard severity (1-5), the cumulative number of citizen reports, days elapsed, and photo verification.'
  },
  {
    question: 'How long does resolution take?',
    answer: 'Critical emergencies (like hanging electrical cables) are dispatched immediately. Standard road and sanitation issues are typically inspected within 24 to 48 hours.'
  },
  {
    question: 'Can I track the progress without an account?',
    answer: 'Yes! Simply save your Complaint ID (e.g. CS-2026-00001) generated upon submission and enter it anytime into the Track page.'
  }
];
