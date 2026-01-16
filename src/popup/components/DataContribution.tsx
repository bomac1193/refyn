import React, { useState, useEffect } from 'react';
import { Gift, Shield, ChevronRight, Check, Star, Award, TrendingUp } from 'lucide-react';
import { cn } from '@/shared/utils';
import type { ContributorTier } from '@/shared/constants';
import { TIER_THRESHOLDS } from '@/shared/constants';

interface ContributorStats {
  totalContributions: number;
  totalPoints: number;
  currentTier: ContributorTier;
  tasteScore: number;
  expertiseTags: string[];
  consentEnabled: boolean;
}

interface DataContributionProps {
  className?: string;
}

const TIER_INFO: Record<
  ContributorTier,
  {
    name: string;
    icon: string;
    color: string;
    bgColor: string;
    benefits: string[];
  }
> = {
  explorer: {
    name: 'Explorer',
    icon: '🔍',
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-700/30',
    benefits: ['Basic contribution tracking', 'Session capture'],
  },
  curator: {
    name: 'Curator',
    icon: '🎨',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    benefits: ['Priority prompt suggestions', 'Early access to features', 'Taste score visible'],
  },
  tastemaker: {
    name: 'Tastemaker',
    icon: '✨',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    benefits: ['Influence on AI training', 'Exclusive presets', 'Advanced analytics'],
  },
  oracle: {
    name: 'Oracle',
    icon: '👁️',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    benefits: ['VIP status', 'Direct impact on models', 'All unlocks', 'Revenue share eligible'],
  },
};

export const DataContribution: React.FC<DataContributionProps> = ({ className }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [stats, setStats] = useState<ContributorStats | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContributorData();
  }, []);

  const loadContributorData = async () => {
    setLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_CONTRIBUTOR_STATS' });
      if (response?.success && response.data) {
        setStats(response.data);
        setIsEnabled(response.data.consentEnabled);
      }
    } catch (error) {
      console.error('[Refyn] Failed to load contributor stats:', error);
    }
    setLoading(false);
  };

  const handleToggle = async () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);

    try {
      await chrome.runtime.sendMessage({
        type: 'SET_CONTRIBUTION_CONSENT',
        payload: { enabled: newValue },
      });

      // Reload stats to reflect new consent state
      await loadContributorData();
    } catch (error) {
      console.error('[Refyn] Failed to update consent:', error);
      setIsEnabled(!newValue); // Revert on error
    }
  };

  const tierInfo = stats ? TIER_INFO[stats.currentTier] : TIER_INFO.explorer;
  const tierProgress = stats ? calculateTierProgress(stats.totalPoints, stats.currentTier) : null;

  if (loading) {
    return (
      <div className={cn('p-4 animate-pulse', className)}>
        <div className="h-6 bg-refyn-surface rounded w-1/2 mb-4" />
        <div className="h-20 bg-refyn-surface rounded" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-refyn-cyan" />
          <span className="font-medium text-zinc-200">Data Contribution</span>
        </div>
        <button
          onClick={handleToggle}
          className={cn(
            'relative w-11 h-6 rounded-full transition-colors duration-200',
            isEnabled ? 'bg-refyn-cyan' : 'bg-zinc-600'
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
              isEnabled && 'translate-x-5'
            )}
          />
        </button>
      </div>

      {/* Privacy note */}
      <div className="flex items-start gap-2 p-3 bg-refyn-surface rounded-lg">
        <Shield className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-zinc-400">
          Your prompts help improve AI for everyone. Data is anonymized and you can opt out anytime.
          We never store your actual outputs (images, audio, video).
        </p>
      </div>

      {isEnabled && stats && (
        <>
          {/* Tier display */}
          <div className={cn('flex items-center gap-3 p-3 rounded-lg', tierInfo.bgColor)}>
            <div
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center text-2xl',
                'border-2',
                tierInfo.color.replace('text-', 'border-')
              )}
            >
              {tierInfo.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn('font-semibold', tierInfo.color)}>{tierInfo.name}</span>
                <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded-full">
                  {stats.totalPoints.toLocaleString()} pts
                </span>
              </div>
              {tierProgress && tierProgress.next && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          tierInfo.color.replace('text-', 'bg-')
                        )}
                        style={{ width: `${tierProgress.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-zinc-500 whitespace-nowrap">
                      {tierProgress.pointsToNext} to {TIER_INFO[tierProgress.next].name}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 bg-refyn-surface rounded-lg text-center">
              <div className="flex items-center justify-center mb-1">
                <TrendingUp className="w-4 h-4 text-refyn-cyan" />
              </div>
              <div className="text-lg font-bold text-zinc-200">{stats.totalContributions}</div>
              <div className="text-xs text-zinc-500">Contributions</div>
            </div>
            <div className="p-3 bg-refyn-surface rounded-lg text-center">
              <div className="flex items-center justify-center mb-1">
                <Star className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-lg font-bold text-zinc-200">
                {Math.round(stats.tasteScore * 100)}%
              </div>
              <div className="text-xs text-zinc-500">Taste Score</div>
            </div>
            <div className="p-3 bg-refyn-surface rounded-lg text-center">
              <div className="flex items-center justify-center mb-1">
                <Award className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-lg font-bold text-zinc-200">{stats.totalPoints}</div>
              <div className="text-xs text-zinc-500">Points</div>
            </div>
          </div>

          {/* Benefits expandable */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between p-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <span>View tier benefits</span>
            <ChevronRight
              className={cn('w-4 h-4 transition-transform duration-200', showDetails && 'rotate-90')}
            />
          </button>

          {showDetails && (
            <div className="p-3 bg-refyn-surface rounded-lg space-y-3">
              <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Your {tierInfo.name} Benefits
              </h4>
              <ul className="space-y-2">
                {tierInfo.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                    <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>

              {/* Show locked benefits from next tier */}
              {tierProgress?.next && (
                <>
                  <h4 className="text-xs font-medium text-zinc-600 uppercase tracking-wider pt-2 border-t border-zinc-700">
                    Unlock at {TIER_INFO[tierProgress.next].name}
                  </h4>
                  <ul className="space-y-2 opacity-60">
                    {TIER_INFO[tierProgress.next].benefits
                      .filter((b) => !tierInfo.benefits.includes(b))
                      .slice(0, 2)
                      .map((benefit, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-zinc-500">
                          <div className="w-3.5 h-3.5 rounded border border-zinc-600 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                  </ul>
                </>
              )}
            </div>
          )}

          {/* Expertise tags */}
          {stats.expertiseTags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-zinc-500">Your Expertise</h4>
              <div className="flex flex-wrap gap-1.5">
                {stats.expertiseTags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 text-xs bg-refyn-surface text-zinc-400 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Disabled state message */}
      {!isEnabled && (
        <div className="text-center py-4">
          <p className="text-sm text-zinc-500">
            Enable contributions to earn rewards and help train better AI models.
          </p>
        </div>
      )}
    </div>
  );
};

function calculateTierProgress(
  points: number,
  currentTier: ContributorTier
): {
  progress: number;
  pointsToNext: number;
  next: ContributorTier | null;
} {
  const tierOrder: ContributorTier[] = ['explorer', 'curator', 'tastemaker', 'oracle'];
  const currentIndex = tierOrder.indexOf(currentTier);
  const next = currentIndex < tierOrder.length - 1 ? tierOrder[currentIndex + 1] : null;

  if (!next) {
    return { progress: 100, pointsToNext: 0, next: null };
  }

  const currentThreshold =
    TIER_THRESHOLDS[currentTier.toUpperCase() as keyof typeof TIER_THRESHOLDS];
  const nextThreshold = TIER_THRESHOLDS[next.toUpperCase() as keyof typeof TIER_THRESHOLDS];

  const pointsInTier = points - currentThreshold.min;
  const tierRange = nextThreshold.min - currentThreshold.min;
  const progress = Math.min(100, Math.round((pointsInTier / tierRange) * 100));
  const pointsToNext = nextThreshold.min - points;

  return { progress, pointsToNext, next };
}

export default DataContribution;
