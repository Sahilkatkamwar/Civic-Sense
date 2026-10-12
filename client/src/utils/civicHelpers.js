// client/src/utils/civicHelpers.js
// Civic-Sense Platform Utility & Metadata Engine
import {
  AlertTriangle,
  Trash2,
  Trees,
  Zap,
  AlertOctagon,
  FileQuestion,
  CheckCircle2,
  Clock,
  Wrench,
  Search,
  XCircle
} from 'lucide-react';

/**
 * Category Metadata Map with Lucide icons and Department classifications
 */
export const CATEGORY_CONFIG = {
  pothole: {
    id: 'pothole',
    name: 'Potholes & Road Damage',
    shortName: 'Pothole',
    icon: AlertTriangle,
    color: '#d97706',
    bgColor: '#fef3c7',
    borderColor: '#fde68a',
    department: 'Roads & Infrastructure',
    authorityId: 'roads',
    severityWeight: 4,
    description: 'Road craters, asphalt erosion, sunken trenches, and pavement defects.',
    recommendedAction: 'Dispatch cold-mix patch crew and setup road barricades.'
  },
  garbage: {
    id: 'garbage',
    name: 'Garbage Dump & Waste',
    shortName: 'Garbage',
    icon: Trash2,
    color: '#059669',
    bgColor: '#d1fae5',
    borderColor: '#a7f3d0',
    department: 'Solid Waste Management',
    authorityId: 'sanitation',
    severityWeight: 3,
    description: 'Overflowing community bins, illegal roadside dumping, uncollected trash heaps.',
    recommendedAction: 'Deploy sanitation compactor truck and sanitize neighborhood spot.'
  },
  tree: {
    id: 'tree',
    name: 'Overgrown / Fallen Trees',
    shortName: 'Fallen Tree',
    icon: Trees,
    color: '#16a34a',
    bgColor: '#dcfce7',
    borderColor: '#bbf7d0',
    department: 'Horticulture & Parks',
    authorityId: 'garden',
    severityWeight: 3,
    description: 'Fallen boughs, heavy broken limbs blocking lanes or touching utility wires.',
    recommendedAction: 'Dispatch tree pruning team with mechanical chainsaw unit.'
  },
  cable: {
    id: 'cable',
    name: 'Hanging / Live Cables',
    shortName: 'Live Cable',
    icon: Zap,
    color: '#dc2626',
    bgColor: '#fee2e2',
    borderColor: '#fecaca',
    department: 'Electrical & Lighting',
    authorityId: 'electrical',
    severityWeight: 5,
    description: 'Snapped, dangling, or sparking high-voltage wires posing electrocution hazard.',
    recommendedAction: 'URGENT: Isolate power feeder circuit and dispatch emergency line truck.'
  },
  animal: {
    id: 'animal',
    name: 'Dead / Injured Animals',
    shortName: 'Dead Animal',
    icon: AlertOctagon,
    color: '#ea580c',
    bgColor: '#ffedd5',
    borderColor: '#fed7aa',
    department: 'Animal Welfare & Control',
    authorityId: 'animal_control',
    severityWeight: 4,
    description: 'Deceased stray animal carcasses on public thoroughfares requiring sanitary removal.',
    recommendedAction: 'Dispatch bio-hazard sanitary recovery vehicle for rapid disposal.'
  },
  other: {
    id: 'other',
    name: 'Other Infrastructure Defects',
    shortName: 'Infrastructure',
    icon: FileQuestion,
    color: '#0b2545',
    bgColor: '#eef3f9',
    borderColor: '#b8cbe0',
    department: 'General Municipal Cell',
    authorityId: 'general',
    severityWeight: 2,
    description: 'Broken sidewalks, missing manholes, dark streetlights, drainage blockages.',
    recommendedAction: 'Assign civic field inspector to evaluate site repairs.'
  }
};

/**
 * Returns configuration for a category with safe fallback
 */
export function getCategoryConfig(categoryId) {
  if (!categoryId) return CATEGORY_CONFIG.other;
  const key = String(categoryId).toLowerCase();
  return CATEGORY_CONFIG[key] || CATEGORY_CONFIG.other;
}

/**
 * Priority Level Metadata
 */
export const PRIORITY_CONFIG = {
  critical: {
    level: 'critical',
    label: 'Critical Risk',
    shortLabel: 'Critical',
    color: '#dc2626',
    bgColor: '#fef2f2',
    borderColor: '#fecaca',
    badgeClass: 'badge-critical',
    description: 'Immediate threat to public safety. Immediate field response required.'
  },
  high: {
    level: 'high',
    label: 'High Priority',
    shortLabel: 'High',
    color: '#ea580c',
    bgColor: '#fff7ed',
    borderColor: '#fed7aa',
    badgeClass: 'badge-high',
    description: 'Significant public hazard or clustered reports. Fast-track inspection.'
  },
  medium: {
    level: 'medium',
    label: 'Medium Priority',
    shortLabel: 'Medium',
    color: '#d97706',
    bgColor: '#fffbeb',
    borderColor: '#fef3c7',
    badgeClass: 'badge-medium',
    description: 'Moderate civic issue. Scheduled for standard municipal queue.'
  },
  low: {
    level: 'low',
    label: 'Low Priority',
    shortLabel: 'Low',
    color: '#166534',
    bgColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    badgeClass: 'badge-low',
    description: 'Minor cosmetic defect or single report. Monitored for recurrence.'
  }
};

export function getPriorityConfig(level) {
  if (!level) return PRIORITY_CONFIG.low;
  const key = String(level).toLowerCase();
  return PRIORITY_CONFIG[key] || PRIORITY_CONFIG.low;
}

/**
 * Status Metadata
 */
export const STATUS_CONFIG = {
  submitted: {
    status: 'submitted',
    label: 'Submitted',
    icon: Clock,
    color: '#64748b',
    bgColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    stepIndex: 1
  },
  under_review: {
    status: 'under_review',
    label: 'Under Review',
    icon: Search,
    color: '#0284c7',
    bgColor: '#f0f9ff',
    borderColor: '#bae6fd',
    stepIndex: 2
  },
  in_progress: {
    status: 'in_progress',
    label: 'In Progress',
    icon: Wrench,
    color: '#d97706',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
    stepIndex: 3
  },
  resolved: {
    status: 'resolved',
    label: 'Resolved',
    icon: CheckCircle2,
    color: '#16a34a',
    bgColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    stepIndex: 4
  },
  rejected: {
    status: 'rejected',
    label: 'Rejected',
    icon: XCircle,
    color: '#dc2626',
    bgColor: '#fef2f2',
    borderColor: '#fecaca',
    stepIndex: 0
  }
};

export function getStatusConfig(status) {
  if (!status) return STATUS_CONFIG.submitted;
  const key = String(status).toLowerCase();
  return STATUS_CONFIG[key] || STATUS_CONFIG.submitted;
}

/**
 * Format date nicely
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return 'Recently';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export function formatFullDateTime(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}

/**
 * Great-circle distance between two GPS coordinates in meters
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}
