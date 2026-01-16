/**
 * Process Capture Module - CTAD Integration
 *
 * Captures AI creative process data (prompt iterations, rejections, selections)
 * and submits to CTAD backend for RLHF training data collection.
 */

import { STORAGE_KEYS, CTAD_API_URL, TIER_THRESHOLDS } from '@/shared/constants';
import type { Platform, OptimizationMode } from '@/shared/types';
import type { ContributorTier } from '@/shared/constants';
import { generateId } from '@/shared/utils';

// ============================================================================
// Types
// ============================================================================

export interface PromptVersionRecord {
  id: string;
  content: string;
  timestamp: string;
  parentId: string | null;
  mode: OptimizationMode | 'manual';
  platform: Platform;
  metadata?: {
    presetId?: string;
    preferenceContext?: string;
    platformParams?: Record<string, unknown>;
    originalPrompt?: string;
  };
}

export interface RejectedOutputRecord {
  id: string;
  promptVersionId: string;
  timestamp: string;
  reason?: 'poor-quality' | 'wrong-style' | 'doesnt-match' | 'too-generic' | 'technical-issue' | 'other';
  customFeedback?: string;
}

export interface SelectedOutputRecord {
  id: string;
  promptVersionId: string;
  timestamp: string;
  likeReason?: 'great-style' | 'perfect-colors' | 'matches-intent' | 'unique' | 'technical-quality' | 'other';
  customFeedback?: string;
  outputHash?: string;
}

export interface CaptureSession {
  id: string;
  platform: Platform;
  startedAt: string;
  endedAt?: string;
  promptVersions: PromptVersionRecord[];
  rejectedOutputs: RejectedOutputRecord[];
  selectedOutput?: SelectedOutputRecord;
  consentGiven: boolean;
  contributorId?: string;
}

export interface ContributorStats {
  totalContributions: number;
  totalPoints: number;
  currentTier: ContributorTier;
  tasteScore: number;
  expertiseTags: string[];
  consentEnabled: boolean;
}

export interface ContributorReward {
  pointsEarned: number;
  newTotal: number;
  tierChange?: {
    from: ContributorTier;
    to: ContributorTier;
  };
  qualityMultiplier: number;
  rarityBonus: number;
}

export interface CTADSettings {
  apiUrl: string;
  apiKey?: string;
  enabled: boolean;
}

// ============================================================================
// Session Management
// ============================================================================

let activeSession: CaptureSession | null = null;

/**
 * Start a new capture session for a platform
 */
export async function startCaptureSession(platform: Platform): Promise<CaptureSession> {
  // End any existing session first
  if (activeSession) {
    await endCaptureSession();
  }

  // Get contributor info
  const contributorId = await getContributorId();
  const consentEnabled = await isConsentEnabled();

  activeSession = {
    id: generateId(),
    platform,
    startedAt: new Date().toISOString(),
    promptVersions: [],
    rejectedOutputs: [],
    consentGiven: consentEnabled,
    contributorId: consentEnabled ? contributorId : undefined,
  };

  // Persist to storage
  await chrome.storage.local.set({
    [STORAGE_KEYS.CAPTURE_SESSION]: activeSession,
  });

  console.log('[Refyn Capture] Session started:', activeSession.id, 'Platform:', platform);
  return activeSession;
}

/**
 * Log a prompt version to the current session
 */
export async function logPromptVersion(
  content: string,
  mode: OptimizationMode | 'manual',
  parentId: string | null = null,
  metadata?: PromptVersionRecord['metadata']
): Promise<PromptVersionRecord | null> {
  if (!activeSession) {
    console.warn('[Refyn Capture] No active session - starting one');
    return null;
  }

  const version: PromptVersionRecord = {
    id: generateId(),
    content,
    timestamp: new Date().toISOString(),
    parentId,
    mode,
    platform: activeSession.platform,
    metadata,
  };

  activeSession.promptVersions.push(version);
  await persistSession();

  console.log('[Refyn Capture] Logged prompt version:', version.id, 'Mode:', mode);
  return version;
}

/**
 * Log a rejection (delete/dislike action)
 */
export async function logRejection(
  promptVersionId: string,
  reason?: RejectedOutputRecord['reason'],
  customFeedback?: string
): Promise<RejectedOutputRecord | null> {
  if (!activeSession) {
    console.warn('[Refyn Capture] No active session');
    return null;
  }

  const rejection: RejectedOutputRecord = {
    id: generateId(),
    promptVersionId,
    timestamp: new Date().toISOString(),
    reason,
    customFeedback,
  };

  activeSession.rejectedOutputs.push(rejection);
  await persistSession();

  console.log('[Refyn Capture] Logged rejection:', rejection.id);
  return rejection;
}

/**
 * Log a selection (like/save action)
 */
export async function logSelection(
  promptVersionId: string,
  likeReason?: SelectedOutputRecord['likeReason'],
  customFeedback?: string,
  outputHash?: string
): Promise<SelectedOutputRecord | null> {
  if (!activeSession) {
    console.warn('[Refyn Capture] No active session');
    return null;
  }

  activeSession.selectedOutput = {
    id: generateId(),
    promptVersionId,
    timestamp: new Date().toISOString(),
    likeReason,
    customFeedback,
    outputHash,
  };

  await persistSession();

  console.log('[Refyn Capture] Logged selection');
  return activeSession.selectedOutput;
}

/**
 * Update session consent status
 */
export async function setSessionConsent(
  consentGiven: boolean,
  contributorId?: string
): Promise<void> {
  if (!activeSession) return;

  activeSession.consentGiven = consentGiven;
  activeSession.contributorId = consentGiven ? contributorId : undefined;
  await persistSession();

  console.log('[Refyn Capture] Consent updated:', consentGiven);
}

/**
 * End the current session and queue for submission
 */
export async function endCaptureSession(): Promise<void> {
  if (!activeSession) return;

  activeSession.endedAt = new Date().toISOString();

  // Only submit if consent was given and there's meaningful data
  const hasData = activeSession.promptVersions.length > 0;
  const hasConsent = activeSession.consentGiven;

  if (hasConsent && hasData) {
    await queueForSubmission(activeSession);
    console.log('[Refyn Capture] Session queued for submission:', activeSession.id);
  } else {
    console.log('[Refyn Capture] Session ended without submission:', {
      hasConsent,
      hasData,
    });
  }

  activeSession = null;
  await chrome.storage.local.remove(STORAGE_KEYS.CAPTURE_SESSION);
}

/**
 * Get the current active session
 */
export function getActiveSession(): CaptureSession | null {
  return activeSession;
}

/**
 * Get the current prompt version ID (last in lineage)
 */
export function getCurrentVersionId(): string | null {
  if (!activeSession || activeSession.promptVersions.length === 0) {
    return null;
  }
  return activeSession.promptVersions[activeSession.promptVersions.length - 1].id;
}

/**
 * Restore active session from storage (on extension reload)
 */
export async function restoreActiveSession(): Promise<CaptureSession | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.CAPTURE_SESSION);
  activeSession = result[STORAGE_KEYS.CAPTURE_SESSION] || null;

  if (activeSession) {
    console.log('[Refyn Capture] Restored session:', activeSession.id);
  }

  return activeSession;
}

// ============================================================================
// Submission & Queue Management
// ============================================================================

/**
 * Queue a session for submission to CTAD
 */
async function queueForSubmission(session: CaptureSession): Promise<void> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.PENDING_SUBMISSIONS);
  const pending: CaptureSession[] = result[STORAGE_KEYS.PENDING_SUBMISSIONS] || [];

  pending.push(session);
  await chrome.storage.local.set({
    [STORAGE_KEYS.PENDING_SUBMISSIONS]: pending,
  });

  // Try to submit immediately
  await processPendingSubmissions();
}

/**
 * Process pending submissions with retry logic
 */
export async function processPendingSubmissions(): Promise<void> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.PENDING_SUBMISSIONS);
  const pending: CaptureSession[] = result[STORAGE_KEYS.PENDING_SUBMISSIONS] || [];

  if (pending.length === 0) return;

  console.log('[Refyn Capture] Processing', pending.length, 'pending submissions');

  const failed: CaptureSession[] = [];
  const succeeded: string[] = [];

  for (const session of pending) {
    try {
      const reward = await submitToCTAD(session);
      succeeded.push(session.id);

      // Update local stats if reward was returned
      if (reward) {
        await updateLocalStats(reward);
      }

      console.log('[Refyn Capture] Submitted session:', session.id);
    } catch (error) {
      console.error('[Refyn Capture] Submission failed:', error);
      failed.push(session);
    }
  }

  // Update pending list with only failed submissions
  await chrome.storage.local.set({
    [STORAGE_KEYS.PENDING_SUBMISSIONS]: failed,
  });

  if (succeeded.length > 0) {
    console.log('[Refyn Capture] Successfully submitted', succeeded.length, 'sessions');
  }
}

/**
 * Submit a session to CTAD API
 */
async function submitToCTAD(session: CaptureSession): Promise<ContributorReward | null> {
  const settings = await getCTADSettings();

  if (!settings.enabled) {
    throw new Error('CTAD integration is disabled');
  }

  // Calculate session duration
  const startTime = new Date(session.startedAt).getTime();
  const endTime = session.endedAt ? new Date(session.endedAt).getTime() : Date.now();
  const sessionDuration = Math.round((endTime - startTime) / 1000);

  // Build payload
  const payload = {
    platform: session.platform,
    sessionStartedAt: session.startedAt,
    sessionEndedAt: session.endedAt || new Date().toISOString(),
    sessionDuration,
    iterationCount: session.promptVersions.length,
    promptLineage: session.promptVersions,
    rejectedOutputs: session.rejectedOutputs,
    selectedOutput: session.selectedOutput,
    consentForTrainingData: session.consentGiven,
    consentTimestamp: new Date().toISOString(),
    consentVersion: '1.0',
    contributorId: session.contributorId,
  };

  const response = await fetch(settings.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(settings.apiKey && { Authorization: `Bearer ${settings.apiKey}` }),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const result = await response.json();
  return result.reward || null;
}

// ============================================================================
// Contributor Management
// ============================================================================

/**
 * Get or create anonymous contributor ID
 */
export async function getContributorId(): Promise<string> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.CONTRIBUTOR_ID);

  if (result[STORAGE_KEYS.CONTRIBUTOR_ID]) {
    return result[STORAGE_KEYS.CONTRIBUTOR_ID];
  }

  // Generate new anonymous ID (64 char hex string)
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const contributorId = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  await chrome.storage.local.set({
    [STORAGE_KEYS.CONTRIBUTOR_ID]: contributorId,
  });

  console.log('[Refyn Capture] Generated new contributor ID');
  return contributorId;
}

/**
 * Check if data contribution consent is enabled
 */
export async function isConsentEnabled(): Promise<boolean> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.CONTRIBUTION_CONSENT);
  return result[STORAGE_KEYS.CONTRIBUTION_CONSENT] === true;
}

/**
 * Set data contribution consent
 */
export async function setContributionConsent(enabled: boolean): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.CONTRIBUTION_CONSENT]: enabled,
  });

  // Update active session if exists
  if (activeSession) {
    const contributorId = enabled ? await getContributorId() : undefined;
    await setSessionConsent(enabled, contributorId);
  }

  console.log('[Refyn Capture] Contribution consent:', enabled);
}

/**
 * Get contributor statistics
 */
export async function getContributorStats(): Promise<ContributorStats> {
  const [statsResult, consentResult] = await Promise.all([
    chrome.storage.local.get(STORAGE_KEYS.CONTRIBUTOR_STATS),
    chrome.storage.local.get(STORAGE_KEYS.CONTRIBUTION_CONSENT),
  ]);

  const defaultStats: ContributorStats = {
    totalContributions: 0,
    totalPoints: 0,
    currentTier: 'explorer',
    tasteScore: 0.5,
    expertiseTags: [],
    consentEnabled: consentResult[STORAGE_KEYS.CONTRIBUTION_CONSENT] === true,
  };

  const savedStats = statsResult[STORAGE_KEYS.CONTRIBUTOR_STATS];
  if (!savedStats) {
    return defaultStats;
  }

  return {
    ...defaultStats,
    ...savedStats,
    consentEnabled: consentResult[STORAGE_KEYS.CONTRIBUTION_CONSENT] === true,
  };
}

/**
 * Update local contributor stats after successful submission
 */
async function updateLocalStats(reward: ContributorReward): Promise<void> {
  const stats = await getContributorStats();

  const updatedStats: Partial<ContributorStats> = {
    totalContributions: stats.totalContributions + 1,
    totalPoints: reward.newTotal,
    currentTier: reward.tierChange?.to || stats.currentTier,
  };

  await chrome.storage.local.set({
    [STORAGE_KEYS.CONTRIBUTOR_STATS]: {
      ...stats,
      ...updatedStats,
    },
  });

  // Notify about tier change if applicable
  if (reward.tierChange) {
    await notifyTierChange(reward.tierChange.from, reward.tierChange.to);
  }
}

/**
 * Notify user about tier change
 */
async function notifyTierChange(from: ContributorTier, to: ContributorTier): Promise<void> {
  // Send message to active tab to show notification
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'CTAD_TIER_CHANGE',
        payload: { from, to },
      });
    }
  } catch (error) {
    console.error('[Refyn Capture] Failed to notify tier change:', error);
  }
}

// ============================================================================
// Settings
// ============================================================================

/**
 * Get CTAD settings
 */
export async function getCTADSettings(): Promise<CTADSettings> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.CTAD_SETTINGS);
  const consentEnabled = await isConsentEnabled();

  return {
    apiUrl: CTAD_API_URL,
    enabled: consentEnabled,
    ...result[STORAGE_KEYS.CTAD_SETTINGS],
  };
}

/**
 * Update CTAD settings
 */
export async function setCTADSettings(settings: Partial<CTADSettings>): Promise<void> {
  const current = await getCTADSettings();
  await chrome.storage.local.set({
    [STORAGE_KEYS.CTAD_SETTINGS]: {
      ...current,
      ...settings,
    },
  });
}

// ============================================================================
// Utility
// ============================================================================

/**
 * Persist current session to storage
 */
async function persistSession(): Promise<void> {
  if (activeSession) {
    await chrome.storage.local.set({
      [STORAGE_KEYS.CAPTURE_SESSION]: activeSession,
    });
  }
}

/**
 * Calculate tier from points
 */
export function calculateTierFromPoints(points: number): ContributorTier {
  if (points >= TIER_THRESHOLDS.ORACLE.min) return 'oracle';
  if (points >= TIER_THRESHOLDS.TASTEMAKER.min) return 'tastemaker';
  if (points >= TIER_THRESHOLDS.CURATOR.min) return 'curator';
  return 'explorer';
}

/**
 * Get progress to next tier
 */
export function getTierProgress(points: number): {
  current: ContributorTier;
  next: ContributorTier | null;
  progress: number;
  pointsToNext: number;
} {
  const current = calculateTierFromPoints(points);

  const tierOrder: ContributorTier[] = ['explorer', 'curator', 'tastemaker', 'oracle'];
  const currentIndex = tierOrder.indexOf(current);
  const next = currentIndex < tierOrder.length - 1 ? tierOrder[currentIndex + 1] : null;

  if (!next) {
    return { current, next: null, progress: 100, pointsToNext: 0 };
  }

  const currentThreshold = TIER_THRESHOLDS[current.toUpperCase() as keyof typeof TIER_THRESHOLDS];
  const nextThreshold = TIER_THRESHOLDS[next.toUpperCase() as keyof typeof TIER_THRESHOLDS];

  const pointsInTier = points - currentThreshold.min;
  const tierRange = nextThreshold.min - currentThreshold.min;
  const progress = Math.round((pointsInTier / tierRange) * 100);
  const pointsToNext = nextThreshold.min - points;

  return { current, next, progress, pointsToNext };
}
