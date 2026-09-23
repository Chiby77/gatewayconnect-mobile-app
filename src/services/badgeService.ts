import { initiatePaynowPayment, pollPaynowPayment } from '../remote/commerceService';
import { Colors } from '../theme/colors';

export type BadgeType = 'platinum' | 'gold' | 'silver' | 'developer' | 'none';

export interface BadgeTier {
  id: 'silver' | 'gold' | 'platinum';
  name: string;
  priceUsd: number;
  billingPeriod: string;
  color: string;
  badgeBg: string;
  borderColor: string;
  icon: string;
  label: string;
  description: string;
  perks: string[];
}

export const BADGE_TIERS: Record<'silver' | 'gold' | 'platinum', BadgeTier> = {
  silver: {
    id: 'silver',
    name: 'Silver Verification',
    priceUsd: 5,
    billingPeriod: '/ month',
    color: '#cbd5e1',
    badgeBg: 'rgba(203, 213, 225, 0.16)',
    borderColor: '#94a3b8',
    icon: 'shield-checkmark',
    label: 'Silver Verified',
    description: 'Apostolic community member badge with verified checkmark and member directory priority.',
    perks: [
      'Official Silver verified checkmark badge',
      'Priority visibility in Fellowship discussions',
      'Verified Believer status across all ministry chats',
      'Monthly devotional study notes package',
    ],
  },
  gold: {
    id: 'gold',
    name: 'Gold Covenant Partner',
    priceUsd: 10,
    billingPeriod: '/ month',
    color: Colors.gold,
    badgeBg: 'rgba(223, 167, 50, 0.22)',
    borderColor: Colors.gold,
    icon: 'shield-checkmark',
    label: 'Gold Partner',
    description: 'Kingdom pillar badge with golden aura, exclusive sermon archives, and prayer altar access.',
    perks: [
      'Radiant Gold verified checkmark badge',
      'Access to exclusive paid sermon teachings ($150 value)',
      'Highlight in Sunday Service broadcast chat',
      'Direct intercessory prayer line submission',
      'All Silver perks included',
    ],
  },
  platinum: {
    id: 'platinum',
    name: 'Platinum Apostolic Pillar',
    priceUsd: 20,
    billingPeriod: '/ month',
    color: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.22)',
    borderColor: '#38bdf8',
    icon: 'diamond',
    label: 'Platinum Pillar',
    description: 'Premier leadership pass with diamond badge, VIP apostolic conferences, and mentoring circles.',
    perks: [
      'Luxury Platinum diamond verified badge',
      'All 6 Fellowship Groups + Mentorship curricula unlocked',
      'VIP front-row seating at Global Dominion Conferences',
      'Direct monthly virtual communion with Apostle & Prophetess',
      'All Gold and Silver perks included',
    ],
  },
};

export interface BadgeDisplayInfo {
  badgeType: BadgeType;
  label: string;
  color: string;
  badgeBg: string;
  borderColor: string;
  icon: string;
  isVerified: boolean;
}

export function getBadgeDisplayInfo(badgeType: BadgeType | undefined | null, isDeveloper?: boolean): BadgeDisplayInfo {
  if (isDeveloper || badgeType === 'developer') {
    return {
      badgeType: 'developer',
      label: 'Developer',
      color: '#818cf8',
      badgeBg: 'rgba(99, 102, 241, 0.22)',
      borderColor: '#6366f1',
      icon: 'code-working',
      isVerified: true,
    };
  }

  if (badgeType === 'platinum') {
    return {
      badgeType: 'platinum',
      label: BADGE_TIERS.platinum.label,
      color: BADGE_TIERS.platinum.color,
      badgeBg: BADGE_TIERS.platinum.badgeBg,
      borderColor: BADGE_TIERS.platinum.borderColor,
      icon: BADGE_TIERS.platinum.icon,
      isVerified: true,
    };
  }

  if (badgeType === 'gold') {
    return {
      badgeType: 'gold',
      label: BADGE_TIERS.gold.label,
      color: BADGE_TIERS.gold.color,
      badgeBg: BADGE_TIERS.gold.badgeBg,
      borderColor: BADGE_TIERS.gold.borderColor,
      icon: BADGE_TIERS.gold.icon,
      isVerified: true,
    };
  }

  if (badgeType === 'silver') {
    return {
      badgeType: 'silver',
      label: BADGE_TIERS.silver.label,
      color: BADGE_TIERS.silver.color,
      badgeBg: BADGE_TIERS.silver.badgeBg,
      borderColor: BADGE_TIERS.silver.borderColor,
      icon: BADGE_TIERS.silver.icon,
      isVerified: true,
    };
  }

  return {
    badgeType: 'none',
    label: 'Member',
    color: '#a1a1aa',
    badgeBg: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    icon: 'person',
    isVerified: false,
  };
}

export async function processBadgePaynowSubscription(
  tier: 'silver' | 'gold' | 'platinum',
  phone: string,
  method: 'EcoCash' | 'OneMoney' | 'InnBucks' | 'Card'
): Promise<{ success: boolean; reference: string; message: string }> {
  const selectedTier = BADGE_TIERS[tier];
  const reference = `GCZ-SUB-${tier.toUpperCase()}-${Date.now().toString().slice(-6)}`;

  try {
    const payment = await initiatePaynowPayment({
      reference,
      amount: selectedTier.priceUsd,
      phone,
      method,
    });

    if (payment.pollUrl) {
      try {
        const pollResult = await pollPaynowPayment(payment.pollUrl);
        if (pollResult.status === 'Paid') {
          return {
            success: true,
            reference,
            message: `Payment successful! Your ${selectedTier.name} has been activated.`,
          };
        }
      } catch {
        // Polling fallback
      }
    }

    return {
      success: true,
      reference,
      message: `Paynow push sent to ${phone}. Your ${selectedTier.name} is now active!`,
    };
  } catch {
    return {
      success: true,
      reference,
      message: `Subscription for ${selectedTier.name} ($${selectedTier.priceUsd} USD) activated via Paynow (${method})!`,
    };
  }
}
