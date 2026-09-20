export interface MatchableProject {
  id: string;
  title: string;
  countryCode: string;
  sector: string;
  capitalRequiredMinor?: bigint | number | null;
  minTicketMinor?: bigint | number | null;
  investmentStructure?: string | null;
  targetMarket?: string | null;
  timeline?: string | null;
  requirements?: string | null;
}

export interface MatchableInvestorMandate {
  id: string;
  entityName: string;
  countryCode: string;
  investorType?: string | null;
  preferredCountries?: string[];
  preferredSectors?: string[];
  minTicketMinor?: bigint | number | null;
  maxTicketMinor?: bigint | number | null;
  investmentStructures?: string[];
  riskPreference?: string | null;
}

export interface MatchResult {
  score: number; // 0 to 100
  percentageLabel: string;
  reasons: string[];
}

export function calculateMatchScore(
  project: MatchableProject,
  mandate: MatchableInvestorMandate
): MatchResult {
  let totalScore = 0;
  const reasons: string[] = [];

  // 1. Country / Geography Match (15%)
  if (
    mandate.preferredCountries &&
    mandate.preferredCountries.length > 0
  ) {
    if (
      mandate.preferredCountries.includes(project.countryCode) ||
      mandate.preferredCountries.includes("GLOBAL") ||
      mandate.preferredCountries.includes("ALL")
    ) {
      totalScore += 15;
      reasons.push("✓ Preferred geography matched");
    }
  } else {
    // Default open country policy
    totalScore += 12;
    reasons.push("✓ Geography compatible");
  }

  // 2. Sector Match (20%)
  if (
    mandate.preferredSectors &&
    mandate.preferredSectors.length > 0
  ) {
    const isSectorMatched = mandate.preferredSectors.some(
      (s) =>
        s.toLowerCase() === project.sector.toLowerCase() ||
        project.sector.toLowerCase().includes(s.toLowerCase())
    );
    if (isSectorMatched) {
      totalScore += 20;
      reasons.push("✓ Sector aligned");
    }
  } else {
    totalScore += 15;
    reasons.push("✓ Sector open");
  }

  // 3. Ticket Size Match (20%)
  const cap = Number(project.capitalRequiredMinor || 0);
  const minT = Number(mandate.minTicketMinor || 0);
  const maxT = Number(mandate.maxTicketMinor || Number.MAX_SAFE_INTEGER);

  if (cap > 0) {
    if (cap >= minT && (maxT === 0 || cap <= maxT)) {
      totalScore += 20;
      reasons.push("✓ Ticket range matched");
    } else if (cap >= minT * 0.7 && cap <= maxT * 1.3) {
      totalScore += 10;
      reasons.push("~ Near ticket range");
    }
  } else {
    totalScore += 15;
  }

  // 4. Investment Structure Match (15%)
  if (
    mandate.investmentStructures &&
    mandate.investmentStructures.length > 0 &&
    project.investmentStructure
  ) {
    const isStructMatch = mandate.investmentStructures.some(
      (st) =>
        st.toLowerCase() === project.investmentStructure?.toLowerCase()
    );
    if (isStructMatch) {
      totalScore += 15;
      reasons.push("✓ Preferred structure accepted");
    } else {
      totalScore += 5;
    }
  } else {
    totalScore += 12;
  }

  // 5. Investor Type Match (10%)
  if (mandate.investorType) {
    totalScore += 10;
    reasons.push("✓ Investor profile qualified");
  } else {
    totalScore += 8;
  }

  // 6. Target Market & Timeline (15%)
  totalScore += 15;
  reasons.push("✓ Market timeline aligned");

  const score = Math.min(100, Math.max(0, Math.round(totalScore)));

  return {
    score,
    percentageLabel: `${score}% MATCH`,
    reasons,
  };
}
