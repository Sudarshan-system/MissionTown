import React from 'react';
import { ArrowDown, ArrowRight, Check, Cloud, Loader2 } from 'lucide-react';
import {
  AuthUserSummary,
  Department,
  Goal,
  PersistenceStatus,
} from '../types/mission';

interface HeroSectionProps {
  goal: Goal;
  totalAgentsCount: number;
  departments: Department[];
  authUser: AuthUserSummary | null;
  persistenceStatus: PersistenceStatus;
  onGoalChange: (newTitle: string) => void;
  onSaveGoal: (newTitle?: string) => Promise<void>;
  onSignIn: () => void;
  onOpenDemo: () => void;
  onScrollToDemo: () => void;
}

const SAMPLE_GOAL_PRESETS = [
  'Grow my clipping service to 10 paying creators.',
  'Turn 20 long-form podcasts into 100 high-retention Shorts.',
  'Deliver 5 watermarked sample reels per day to creator leads.',
];

export const HeroSection: React.FC<HeroSectionProps> = ({
  goal,
  totalAgentsCount,
  departments,
  authUser,
  persistenceStatus,
  onGoalChange,
  onSaveGoal,
  onSignIn,
  onOpenDemo,
  onScrollToDemo,
}) => {
  const nonBossAgentsCount = Math.max(1, totalAgentsCount - 1);

  return (
    <section
      id="top"
      aria-label="MissionTown Hero"
      className="relative min-h-[94vh] flex flex-col justify-center items-center px-4 sm:px-6 pt-28 pb-20 overflow-hidden select-none"
    >
      {/* Illustrated Miniature Green World Background (Blurred + Vignette matching Screenshot 3) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none overflow-hidden"
      >
        <svg
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full scale-105 blur-[10px] opacity-90"
        >
          <defs>
            <radialGradient id="heroGrassGrad" cx="50%" cy="50%" r="58%">
              <stop offset="0%" stopColor="#65B83B" />
              <stop offset="55%" stopColor="#4F9D2C" />
              <stop offset="85%" stopColor="#2F6619" />
              <stop offset="100%" stopColor="#12240C" />
            </radialGradient>
            <linearGradient id="heroPathGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D6C28F" />
              <stop offset="100%" stopColor="#B89F67" />
            </linearGradient>
          </defs>

          {/* Deep Ocean Rim & Lush Green Miniature Island World */}
          <rect width="1440" height="900" fill="#102216" />
          <ellipse cx="720" cy="480" rx="760" ry="460" fill="url(#heroGrassGrad)" />

          {/* Miniature Winding Cobblestone & Dirt Paths */}
          <path
            d="M 720 450 L 720 140 M 720 450 L 320 260 M 720 450 L 1120 280 M 720 450 L 290 660 M 720 450 L 1140 650 M 720 450 L 720 820"
            stroke="url(#heroPathGrad)"
            strokeWidth="36"
            strokeLinecap="round"
            opacity="0.7"
          />
          <circle
            cx="720"
            cy="450"
            r="145"
            fill="none"
            stroke="url(#heroPathGrad)"
            strokeWidth="28"
            opacity="0.75"
          />
          <circle
            cx="1090"
            cy="620"
            r="95"
            fill="none"
            stroke="url(#heroPathGrad)"
            strokeWidth="22"
            opacity="0.65"
          />

          {/* Central Blue-Roofed Town Hall Plaza (matches center of Screenshot 3) */}
          <g transform="translate(620, 360)">
            <rect x="10" y="55" width="180" height="95" rx="8" fill="#E9E2D0" />
            <polygon points="0,65 100,0 200,65" fill="#2B4C8C" />
            <rect x="75" y="90" width="50" height="60" fill="#6E4726" />
          </g>

          {/* Top-Left & Top-Right Miniature Cottages & Studios */}
          <g transform="translate(360, 95)">
            <rect x="15" y="45" width="95" height="65" rx="6" fill="#F2EDE2" />
            <polygon points="0,50 62,5 125,50" fill="#3B3F54" />
          </g>
          <g transform="translate(970, 120)">
            <rect x="15" y="45" width="95" height="65" rx="6" fill="#E8E4DA" />
            <polygon points="0,50 62,5 125,50" fill="#2F3545" />
          </g>

          {/* Left Village Cluster (Yellow & Red Roof Cottages) */}
          <g transform="translate(240, 560)">
            <rect x="12" y="40" width="80" height="55" rx="5" fill="#F4EFE6" />
            <polygon points="0,45 52,5 104,45" fill="#D99B26" />
          </g>
          <g transform="translate(410, 540)">
            <rect x="12" y="40" width="85" height="58" rx="5" fill="#F4EFE6" />
            <polygon points="0,45 54,5 108,45" fill="#C84B31" />
          </g>
          <g transform="translate(320, 670)">
            <rect x="12" y="40" width="85" height="58" rx="5" fill="#F4EFE6" />
            <polygon points="0,45 54,5 108,45" fill="#529471" />
          </g>

          {/* Right Studio Cluster (Purple, Orange & Green Roofs matching Screenshot 3) */}
          <g transform="translate(960, 570)">
            <rect x="10" y="38" width="76" height="52" rx="5" fill="#F4EFE6" />
            <polygon points="0,42 48,4 96,42" fill="#D9822B" />
          </g>
          <g transform="translate(1090, 500)">
            <rect x="10" y="38" width="76" height="52" rx="5" fill="#F4EFE6" />
            <polygon points="0,42 48,4 96,42" fill="#7E3AF2" />
          </g>
          <g transform="translate(1165, 595)">
            <rect x="10" y="38" width="76" height="52" rx="5" fill="#F4EFE6" />
            <polygon points="0,42 48,4 96,42" fill="#2E9E5B" />
          </g>

          {/* Lush Miniature Trees & Hedgerows */}
          {[
            [160, 320, 48],
            [210, 390, 38],
            [130, 460, 52],
            [260, 210, 44],
            [520, 170, 40],
            [860, 185, 42],
            [1230, 290, 50],
            [1290, 410, 45],
            [1190, 740, 48],
            [870, 720, 42],
            [550, 730, 46],
            [190, 750, 54],
          ].map(([cx, cy, r], idx) => (
            <g key={idx}>
              <circle cx={cx} cy={cy + 12} r={r} fill="#1E4612" opacity="0.45" />
              <circle cx={cx} cy={cy} r={r} fill="#2E6F1E" />
              <circle cx={cx - 8} cy={cy - 8} r={r * 0.72} fill="#4CA632" />
            </g>
          ))}

          {/* Soft Floating Clouds */}
          <g fill="#FFFFFF" opacity="0.35">
            <ellipse cx="260" cy="140" rx="85" ry="32" />
            <ellipse cx="1180" cy="170" rx="95" ry="35" />
            <ellipse cx="890" cy="810" rx="110" ry="34" />
          </g>
        </svg>

        {/* Measured Radial & Vertical Scrims for High-Contrast Typography */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(11,11,12,0.12)_0%,rgba(11,11,12,0.48)_78%,rgba(11,11,12,0.88)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#0B0B0C] via-[#0B0B0C]/65 to-transparent" />
      </div>

      {/* Main Foreground Hero Content */}
      <div className="relative z-10 max-w-4xl w-full mx-auto text-center flex flex-col items-center">
        {/* Small Early-Access Style Workspace Mode Label (Honest, no fake claims) */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#141815]/80 border border-white/12 backdrop-blur-md text-xs sm:text-sm font-medium text-[#F5F2EB]/90 mb-7 shadow-lg">
          <span className="text-[#34D399] font-semibold">Personal AI Sandbox</span>
          <span aria-hidden="true" className="text-white/30">
            ·
          </span>
          <span>
            {authUser
              ? 'Cloud Persistence Enabled · Sample Simulation Mode'
              : 'Sample Simulation Mode'}
          </span>
        </div>

        {/* Large Bold Editorial Headline */}
        <h1
          style={{ textWrap: 'balance' }}
          className="text-4xl sm:text-6xl md:text-[68px] font-extrabold tracking-tight leading-[1.04] text-[#F5F2EB] drop-shadow-[0_4px_24px_rgba(0,0,0,0.55)]"
        >
          Build your AI company.{' '}
          <span className="block mt-1">
            Give it a <span className="text-[#E5C158]">mission.</span>
          </span>
        </h1>

        {/* Supporting Description Explaining Personal AI Teams */}
        <p className="mt-6 max-w-2xl text-base sm:text-xl text-[#F5F2EB]/85 font-medium leading-relaxed drop-shadow">
          Define one clear goal and organize specialized AI departments—starting
          with your automated short-form video clipping studio, growth bench,
          and creator outreach team.
        </p>

        {/* Editable Goal Field (Matching Screenshot 3's dark translucent bar) */}
        <div className="mt-8 w-full max-w-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void onSaveGoal(goal.title);
            }}
            className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl bg-[#161922]/88 backdrop-blur-xl border border-white/15 shadow-2xl focus-within:border-[#E5C158] focus-within:ring-2 focus-within:ring-[#E5C158]/30 transition-all"
          >
            <label
              htmlFor="mission-goal-input"
              className="text-[11px] sm:text-xs font-extrabold tracking-wider uppercase text-[#E5C158] whitespace-nowrap shrink-0 text-left"
            >
              YOUR GOAL
            </label>
            <input
              id="mission-goal-input"
              type="text"
              value={goal.title}
              onChange={(e) => onGoalChange(e.target.value)}
              onBlur={() => {
                if (authUser) {
                  void onSaveGoal(goal.title);
                }
              }}
              placeholder="e.g., Grow my clipping service to 10 paying creators."
              className="w-full bg-transparent text-[13px] sm:text-lg font-semibold text-[#F5F2EB] placeholder:text-white/40 focus:outline-none text-left"
            />
            {authUser && (
              <button
                type="submit"
                data-testid="save-hero-goal-button"
                disabled={persistenceStatus === 'saving'}
                className="self-end sm:self-auto px-3 py-1 rounded-lg bg-[#E5C158]/20 hover:bg-[#E5C158]/30 border border-[#E5C158]/40 text-xs font-bold text-[#E5C158] shrink-0 transition-colors cursor-pointer disabled:opacity-50"
              >
                {persistenceStatus === 'saving' ? 'Saving...' : 'Save Goal'}
              </button>
            )}
          </form>

          {/* Persistence Feedback Line */}
          <div
            data-testid="goal-persistence-status"
            className="mt-2 flex items-center justify-center gap-1.5 text-xs text-[#F5F2EB]/75"
          >
            {authUser ? (
              persistenceStatus === 'saving' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-[#E5C158] animate-spin" />
                  <span className="text-[#E5C158]">
                    Saving goal to Cloud Firestore...
                  </span>
                </>
              ) : persistenceStatus === 'saved' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#34D399]" />
                  <span className="text-[#34D399] font-medium">
                    Saved to your Cloud Firestore workspace
                  </span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5 text-[#34D399]" />
                  <span>
                    Synced to your personal workspace (persists across refresh)
                  </span>
                </>
              )
            ) : (
              <span>
                Previewing sample workspace ·{' '}
                <button
                  type="button"
                  onClick={onSignIn}
                  className="text-[#E5C158] font-semibold underline underline-offset-2 hover:text-[#edd071] cursor-pointer"
                >
                  Sign in with Google
                </button>{' '}
                to persist goals &amp; tasks across browser refreshes
              </span>
            )}
          </div>

          {/* Visible Summary of Sample Company and Agents (Directly below goal input matching Screenshot 3) */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs sm:text-sm font-medium text-[#F5F2EB]/90">
            <span className="text-[#34D399] font-semibold">
              Company staffed:
            </span>
            <span>1 Boss</span>
            <span aria-hidden="true">·</span>
            <span>{nonBossAgentsCount} agents</span>
            <span aria-hidden="true">·</span>
            <span>
              {departments.length} departments ({departments.map((d) => d.name).join(', ')})
            </span>
          </div>

          {/* Quick Sample Goal Presets */}
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2 text-xs text-[#F5F2EB]/70">
            <span>Try sample goal:</span>
            {SAMPLE_GOAL_PRESETS.map((preset, index) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  onGoalChange(preset);
                  if (authUser) {
                    void onSaveGoal(preset);
                  }
                }}
                className={`px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                  goal.title === preset
                    ? 'bg-[#E5C158]/20 border-[#E5C158]/60 text-[#F5F2EB]'
                    : 'bg-black/35 border-white/10 text-[#F5F2EB]/75 hover:text-[#F5F2EB] hover:border-white/25'
                }`}
              >
                Preset {index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Primary & Secondary Action Buttons */}
        <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={onOpenDemo}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-7 py-4 text-base font-bold text-[#0B0B0C] bg-[#E5C158] hover:bg-[#edd071] active:scale-[0.99] rounded-2xl shadow-[0_6px_0_#9E7F2A,0_12px_24px_rgba(0,0,0,0.4)] transition-all cursor-pointer whitespace-nowrap"
          >
            <span>Open My Company</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onScrollToDemo}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 text-base font-bold text-[#0B0B0C] bg-[#F5F2EB] hover:bg-white active:scale-[0.99] rounded-2xl shadow-[0_6px_0_#B8B3A8,0_12px_24px_rgba(0,0,0,0.35)] transition-all cursor-pointer whitespace-nowrap"
          >
            <span>Explore Live Demo</span>
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>

        {/* Supporting Footnote & Secondary Scroll Link */}
        <p className="mt-5 text-xs sm:text-sm text-[#F5F2EB]/75 max-w-lg">
          Personal command workspace for orchestrating long-to-short video
          clipping agents, quality gates, and creator growth workflows.
        </p>

        <button
          type="button"
          onClick={onScrollToDemo}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#F5F2EB] underline underline-offset-4 decoration-white/50 hover:decoration-[#E5C158] hover:text-[#E5C158] transition-colors cursor-pointer"
        >
          <span>Watch the live island</span>
          <ArrowDown className="w-3.5 h-3.5" />
        </button>

        <div className="mt-5 text-xs text-[#F5F2EB]/70 flex items-center gap-2">
          <span className="text-[#34D399] font-bold">✓</span>
          <span>
            Explicit sample data layer · Ready for future clipping engine
            integration · No paid API keys required
          </span>
        </div>
      </div>
    </section>
  );
};
