import React, { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Department, Goal, HowItWorksChapter } from '../types/mission';
import {
  calculateGoalProgressPercentage,
  getNextChapterIndex,
} from '../utils/companyLogic';

interface HowItWorksSectionProps {
  chapters: HowItWorksChapter[];
  goal: Goal;
  departments: Department[];
  onJumpToDemo: () => void;
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({
  chapters,
  goal,
  departments,
  onJumpToDemo,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeChapter = chapters[activeIndex] ?? chapters[0];
  const progressPercentage = calculateGoalProgressPercentage(goal);

  const handlePrev = () => {
    setActiveIndex((prev) =>
      getNextChapterIndex(prev, 'prev', chapters.length)
    );
  };

  const handleNext = () => {
    setActiveIndex((prev) =>
      getNextChapterIndex(prev, 'next', chapters.length)
    );
  };

  return (
    <section
      id="how-it-works"
      aria-label="How MissionTown works"
      className="max-w-[1280px] mx-auto px-4 sm:px-6 py-20 border-t border-white/10 scroll-mt-20"
    >
      {/* Top Heading Row (Matching Screenshot 2) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <h2 className="text-4xl sm:text-5xl md:text-[56px] font-extrabold tracking-tight text-[#F5F2EB] leading-none">
          How the system works.
        </h2>
        <p className="text-sm sm:text-base font-medium text-[#F5F2EB]/65">
          Your goal, your team, and the harness that keeps it all running.
        </p>
      </div>

      {/* Main Two-Column Composition (Matching Screenshot 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Column: Vertical List of 9 Numbered Chapters */}
        <div
          role="tablist"
          aria-label="How it works chapters"
          className="lg:col-span-3 flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0"
        >
          {chapters.map((chapter, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={chapter.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveIndex(idx)}
                className={`flex items-center gap-4 px-4 sm:px-5 py-3.5 rounded-2xl text-left transition-colors duration-75 cursor-pointer shrink-0 lg:w-full ${
                  isActive
                    ? 'bg-[#1D1E22] border border-white/15 text-[#F5F2EB] shadow-md'
                    : 'bg-transparent border border-transparent text-[#F5F2EB]/55 hover:text-[#F5F2EB]/90 hover:bg-white/[0.03]'
                }`}
              >
                <span
                  className={`text-xs font-extrabold font-mono-tabular ${
                    isActive ? 'text-[#E5C158]' : 'text-[#E5C158]/70'
                  }`}
                >
                  {chapter.number}
                </span>
                <span className="text-sm sm:text-base font-bold whitespace-nowrap">
                  {chapter.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Column: Subtle Grid Content Panel with Illustrative Card & Chapter Copy */}
        <div
          role="tabpanel"
          aria-label={`Chapter ${activeChapter.number}: ${activeChapter.title}`}
          className="lg:col-span-9 rounded-[28px] bg-[#0F1014] border border-white/12 bg-subtle-grid p-6 sm:p-10 md:p-12 flex flex-col justify-between min-h-[540px] relative overflow-hidden"
        >
          {/* Top / Center Illustrative Card Area */}
          <div className="my-auto py-6 flex items-center justify-center">
            <div className="w-full max-w-[460px] rounded-3xl bg-[#1C2338]/95 border border-white/15 p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.65)]">
              {/* Top Row: Tilted Yellow Tag + Mission Title */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#E5C158] text-[#0B0B0C] text-xs font-extrabold tracking-wider uppercase -rotate-2 shrink-0">
                    MISSION
                  </span>
                  <span className="text-sm sm:text-base font-bold text-white truncate">
                    {goal.title}
                  </span>
                </div>
                <span className="text-[11px] font-mono-tabular text-[#E5C158] shrink-0">
                  CH.{activeChapter.number}
                </span>
              </div>

              {/* Dynamic Illustrative Content Based on Selected Chapter */}
              {activeChapter.cardVariant === 'goal' && (
                <div className="mt-5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-extrabold text-white font-mono-tabular tracking-tight">
                      {goal.metricLabel}
                    </span>
                    <span className="text-sm font-semibold text-[#F5F2EB]/70">
                      {goal.unit}
                    </span>
                  </div>
                  <div className="mt-5 w-full h-3.5 rounded-full bg-white/12 overflow-hidden">
                    <div
                      style={{ width: `${progressPercentage}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-[#34D399] to-[#86EFAC]"
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs sm:text-sm text-[#F5F2EB]/75 font-mono-tabular">
                    <span>{progressPercentage}% there (Sample)</span>
                    <span className="text-lg sm:text-xl font-extrabold text-white">
                      {goal.countdownDisplay}
                    </span>
                  </div>
                </div>
              )}

              {activeChapter.cardVariant === 'boss' && (
                <div className="mt-5 space-y-3">
                  <div className="text-xs font-semibold text-[#34D399]">
                    The Boss · Sprint Decomposition (Sample)
                  </div>
                  <div className="space-y-2 text-xs font-mono-tabular">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/35 border border-white/10">
                      <span className="text-white">1. Content Studio Quota</span>
                      <span className="text-[#4ADE80]">12 vertical cuts/day</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/35 border border-white/10">
                      <span className="text-white">2. Growth Hook Tests</span>
                      <span className="text-[#E5C158]">3 A/B openers/clip</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/35 border border-white/10">
                      <span className="text-white">3. Creator Audition Packs</span>
                      <span className="text-[#60A5FA]">14 warm leads</span>
                    </div>
                  </div>
                </div>
              )}

              {activeChapter.cardVariant === 'team' && (
                <div className="mt-5 space-y-2.5">
                  <div className="text-xs font-semibold text-[#F5F2EB]/75">
                    4 Specialized Departments Ready:
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {departments.map((d) => (
                      <div
                        key={d.id}
                        className="p-3 rounded-xl bg-black/35 border border-white/10"
                      >
                        <div className="text-xs font-extrabold text-white">
                          {d.name}
                        </div>
                        <div className="mt-1 text-[11px] text-[#F5F2EB]/65 line-clamp-2">
                          {d.futureEngineHook}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeChapter.cardVariant === 'quality' && (
                <div className="mt-5 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-[#34D399] font-bold">
                    <span>Critic · Pre-Delivery Quality Gate</span>
                    <span className="font-mono-tabular">4 / 4 Checks</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/35 border border-white/10 space-y-1.5 font-mono-tabular text-[#F5F2EB]/85">
                    <div>✓ 9:16 Active Speaker Face Centered</div>
                    <div>✓ Kinetic Captions Inside UI Safe-Zone</div>
                    <div>✓ Opening 3.0s Hook Retention Score &gt; 75%</div>
                    <div>✓ Audio Normalized to -14 LUFS (Sample)</div>
                  </div>
                </div>
              )}

              {activeChapter.cardVariant === 'harness' && (
                <div className="mt-5 space-y-2.5 text-xs font-mono-tabular">
                  <div className="text-[#E5C158] font-sans font-bold">
                    Deterministic ExecutionJob Pipeline:
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5 text-[#F5F2EB]/85">
                    <div>Stage 1: ingest_vod → transcript.json</div>
                    <div>Stage 2: hook_extraction → [00:18:42–00:19:29]</div>
                    <div>Stage 3: scene_detection → 1080x1920 crop</div>
                    <div>Stage 4: caption_render → kinetic .ASS burn-in</div>
                  </div>
                </div>
              )}

              {activeChapter.cardVariant === 'base' && (
                <div className="mt-5 space-y-3 text-xs">
                  <div className="text-[#34D399] font-bold">
                    Spatial Island Telemetry (Sample)
                  </div>
                  <p className="text-[#F5F2EB]/80 leading-relaxed">
                    Every building zone on the island corresponds to a real
                    module in your company state: Town Hall, The Port, Content
                    Studio, Growth, and Sales &amp; Community.
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-white/10 font-mono-tabular text-[#E5C158]">
                    <span>Interactive Zoom: 65% – 175%</span>
                    <span>15 Inspectable Agents</span>
                  </div>
                </div>
              )}

              {activeChapter.cardVariant === 'healing' && (
                <div className="mt-5 space-y-2.5 text-xs">
                  <div className="text-[#E5C158] font-bold">
                    Self-Healing Fallback Protocol (Sample)
                  </div>
                  <div className="p-3 rounded-xl bg-black/35 border border-white/10 space-y-1.5 text-[#F5F2EB]/85">
                    <div>
                      • Crosstalk detected @ 00:42:10 → Switched to Split-Screen
                      2-Speaker Grid
                    </div>
                    <div>
                      • Caption overlap flagged → Auto-raised subtitle baseline
                      by 48px
                    </div>
                  </div>
                </div>
              )}

              {activeChapter.cardVariant === 'always_on' && (
                <div className="mt-5 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">
                      Event-Driven Clipping Queue
                    </span>
                    <span className="font-mono-tabular text-[#34D399]">
                      Phase 1 Sample
                    </span>
                  </div>
                  <p className="text-[#F5F2EB]/80 leading-relaxed">
                    Designed so new long-form creator uploads can trigger
                    automated scene detection and sample reel preparation
                    without manual prompting.
                  </p>
                  <div className="text-[11px] font-mono-tabular text-[#F5F2EB]/60">
                    Current mode: Simulated frontend preview (zero background API
                    calls).
                  </div>
                </div>
              )}

              {activeChapter.cardVariant === 'your_turn' && (
                <div className="mt-5 space-y-3 text-xs">
                  <p className="text-[#F5F2EB]/85 leading-relaxed">
                    Your personal MissionTown architecture is ready. Jump back
                    to the live island to edit your goal, inspect any agent, or
                    assign sample clipping tasks.
                  </p>
                  <button
                    type="button"
                    onClick={onJumpToDemo}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#E5C158] hover:bg-[#edd071] text-[#0B0B0C] font-extrabold text-xs transition-colors cursor-pointer"
                  >
                    Open Live Island Workspace →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row: Chapter Headline, Explanatory Copy, and Previous/Next Controls */}
          <div className="mt-8 flex flex-col md:flex-row md:items-end justify-between gap-6 pt-6 border-t border-white/10">
            <div className="max-w-xl">
              <div className="text-xs font-mono-tabular uppercase tracking-wider text-[#E5C158] mb-1.5">
                Chapter {activeChapter.number} · {activeChapter.title}
              </div>
              <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                {activeChapter.headline}
              </h3>
              <p className="mt-1.5 text-sm sm:text-base font-semibold text-[#F5F2EB]/85">
                {activeChapter.subtitle}
              </p>
              <p className="mt-2.5 text-xs sm:text-sm text-[#F5F2EB]/70 leading-relaxed">
                {activeChapter.description}
              </p>
              <p className="mt-2 text-xs text-[#34D399]/90 font-medium">
                {activeChapter.sampleNote}
              </p>
            </div>

            {/* Previous & Next Chapter Buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous chapter"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1B1C20] hover:bg-[#25272C] border border-white/15 text-xs sm:text-sm font-bold text-[#F5F2EB] transition-colors cursor-pointer whitespace-nowrap"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="See next chapter"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1B1C20] hover:bg-[#25272C] border border-white/25 text-xs sm:text-sm font-bold text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>See next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
