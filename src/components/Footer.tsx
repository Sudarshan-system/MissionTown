import React from 'react';

interface FooterProps {
  onNavigate: (sectionId: string) => void;
  onOpenCompany: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenCompany,
}) => {
  return (
    <footer className="border-t border-white/10 bg-[#08090B] py-14 px-4 sm:px-6">
      <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div>
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('top');
            }}
            className="inline-flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-[#F5F2EB]"
          >
            <span
              aria-hidden="true"
              className="inline-block w-2.5 h-2.5 rotate-45 bg-[#E5C158]"
            />
            <span>MissionTown</span>
          </a>
          <p className="mt-2 text-xs sm:text-sm text-[#F5F2EB]/65 max-w-md leading-relaxed">
            Personal AI-company workspace for goal-driven agent teams and
            automated short-form video clipping workflows.
          </p>
        </div>

        <nav
          aria-label="Footer Navigation"
          className="flex flex-wrap items-center gap-6 text-sm font-medium text-[#F5F2EB]/75"
        >
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('top');
            }}
            className="hover:text-[#F5F2EB] transition-colors"
          >
            Mission Goal
          </a>
          <a
            href="#demo"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('demo');
            }}
            className="hover:text-[#F5F2EB] transition-colors"
          >
            Live Island Demo
          </a>
          <a
            href="#roster"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('roster');
            }}
            className="hover:text-[#F5F2EB] transition-colors"
          >
            Agent Roster
          </a>
          <a
            href="#how-it-works"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('how-it-works');
            }}
            className="hover:text-[#F5F2EB] transition-colors"
          >
            How it works
          </a>
          <button
            type="button"
            onClick={onOpenCompany}
            className="px-4 py-2 rounded-full bg-[#E5C158] hover:bg-[#edd071] text-[#0B0B0C] text-xs font-bold transition-colors cursor-pointer"
          >
            Open My Company
          </button>
        </nav>
      </div>

      <div className="max-w-[1280px] mx-auto mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#F5F2EB]/50">
        <span>
          MissionTown Personal Sandbox · Explicit Sample Data Layer (Phase 1
          Frontend Milestone)
        </span>
        <span>
          No real background API calls or fabricated live revenue · Ready for
          video clipping engine integration
        </span>
      </div>
    </footer>
  );
};
