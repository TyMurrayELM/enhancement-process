type BranchKey = 'fab_lv' | 'phx_sw' | 'phx_se' | 'phx_n' | 'corp';

function normalizeBranchKey(branchName?: string): BranchKey | null {
  if (!branchName) return null;
  const n = branchName.toLowerCase();
  if (n.includes('las vegas') || n.includes('vegas')) return 'fab_lv';
  if (n.includes('southwest') || n.includes('south west')) return 'phx_sw';
  if (n.includes('southeast') || n.includes('south east')) return 'phx_se';
  if (n.includes('north')) return 'phx_n';
  if (n.includes('corporate') || n.includes('corp')) return 'corp';
  return null;
}

const SLACK_EMOJI: Record<BranchKey, string> = {
  fab_lv: ':fab_lv:',
  phx_sw: ':sw:',
  phx_se: ':se:',
  phx_n: ':n:',
  corp: ':corp:',
};

export function getBranchEmoji(branchName?: string): string | null {
  const key = normalizeBranchKey(branchName);
  return key ? SLACK_EMOJI[key] : null;
}

export function getBranchIcon(branchName?: string): string | null {
  const key = normalizeBranchKey(branchName);
  return key ? `/icons/branches/${key}.png` : null;
}
