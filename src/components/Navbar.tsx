import React, { useState } from 'react';
import { Cloud, CloudOff, Loader2, LogIn, LogOut, Menu, X } from 'lucide-react';
import { AuthUserSummary, PersistenceStatus } from '../types/mission';

interface NavbarProps {
  onNavigate: (sectionId: string) => void;
  onOpenCompany: () => void;
  authUser: AuthUserSummary | null;
  isAuthReady: boolean;
  persistenceStatus: PersistenceStatus;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigate,
  onOpenCompany,
  authUser,
  isAuthReady,
  persistenceStatus,
  onSignIn,
  onSignOut,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileNav = (sectionId: string) => {
    setMobileMenuOpen(false);
    onNavigate(sectionId);
  };

  const userLabel =
    authUser?.displayName ||
    (authUser?.email ? authUser.email.split('@')[0] : 'Workspace User');

  return (
    <header className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6 pointer-events-none">
      <div className="max-w-5xl mx-auto pointer-events-auto">
        <div className="flex items-center justify-between gap-2 sm:gap-5 px-4 sm:px-6 py-2.5 bg-[#141619]/88 backdrop-blur-md border border-white/12 rounded-full shadow-2xl">
          {/* Zone 1: Brand Identity */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              handleMobileNav('top');
            }}
            className="flex items-center gap-2.5 text-base sm:text-lg font-extrabold tracking-tight text-[#F5F2EB] whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E5C158] rounded-full px-1"
          >
            <span
              aria-hidden="true"
              className="inline-block w-2.5 h-2.5 rotate-45 bg-[#E5C158]"
            />
            <span>MissionTown</span>
          </a>

          {/* Zone 2: Navigation Links (Desktop) */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-[#F5F2EB]/75"
          >
            <a
              href="#demo"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('demo');
              }}
              className="hover:text-[#F5F2EB] transition-colors whitespace-nowrap shrink-0"
            >
              Demo
            </a>
            <a
              href="#roster"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('roster');
              }}
              className="hover:text-[#F5F2EB] transition-colors whitespace-nowrap shrink-0"
            >
              Agent Roster
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('how-it-works');
              }}
              className="hover:text-[#F5F2EB] transition-colors whitespace-nowrap shrink-0"
            >
              How it works
            </a>
          </nav>

          {/* Zone 3: Auth Control + Primary Action + Mobile Menu Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {isAuthReady && !authUser && (
              <button
                type="button"
                data-testid="auth-signin-button"
                onClick={onSignIn}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#F5F2EB] bg-white/10 hover:bg-white/15 border border-white/15 rounded-full transition-colors cursor-pointer whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5 text-[#E5C158]" />
                <span>Sign in</span>
              </button>
            )}

            {isAuthReady && authUser && (
              <div
                data-testid="auth-user-badge"
                className="hidden sm:flex items-center gap-2 pl-3 pr-1.5 py-1 rounded-full bg-white/8 border border-white/15 text-xs text-[#F5F2EB]"
              >
                {persistenceStatus === 'saving' ||
                persistenceStatus === 'loading' ? (
                  <Loader2 className="w-3.5 h-3.5 text-[#E5C158] animate-spin shrink-0" />
                ) : persistenceStatus === 'error' ? (
                  <CloudOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                ) : (
                  <Cloud className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
                )}
                <span className="max-w-[110px] truncate font-semibold">
                  {userLabel}
                </span>
                <button
                  type="button"
                  data-testid="auth-signout-button"
                  onClick={onSignOut}
                  aria-label="Sign out"
                  title="Sign out of MissionTown"
                  className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-bold text-[#F5F2EB]/90 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sign out</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCompany();
              }}
              className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold text-[#0B0B0C] bg-[#E5C158] hover:bg-[#edd071] active:scale-[0.99] transition-all rounded-full whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
            >
              Open My Company
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={
                mobileMenuOpen
                  ? 'Close navigation menu'
                  : 'Open navigation menu'
              }
              aria-expanded={mobileMenuOpen}
              className="md:hidden p-2 rounded-full bg-white/10 hover:bg-white/15 text-[#F5F2EB] transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <nav
            aria-label="Mobile Navigation"
            className="md:hidden mt-2 px-5 py-3.5 rounded-2xl bg-[#141619]/95 backdrop-blur-xl border border-white/15 shadow-2xl flex flex-col gap-3 text-xs font-bold text-[#F5F2EB]"
          >
            <div className="flex items-center justify-around">
              <a
                href="#demo"
                onClick={(e) => {
                  e.preventDefault();
                  handleMobileNav('demo');
                }}
                className="py-1 px-2 hover:text-[#E5C158] transition-colors"
              >
                Demo
              </a>
              <a
                href="#roster"
                onClick={(e) => {
                  e.preventDefault();
                  handleMobileNav('roster');
                }}
                className="py-1 px-2 hover:text-[#E5C158] transition-colors"
              >
                Agent Roster
              </a>
              <a
                href="#how-it-works"
                onClick={(e) => {
                  e.preventDefault();
                  handleMobileNav('how-it-works');
                }}
                className="py-1 px-2 hover:text-[#E5C158] transition-colors"
              >
                How it works
              </a>
            </div>
            {isAuthReady && (
              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                {authUser ? (
                  <>
                    <span className="text-[#34D399] truncate max-w-[180px]">
                      Signed in: {userLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onSignOut();
                      }}
                      className="px-3 py-1 rounded-full bg-white/10 text-[#F5F2EB]"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onSignIn();
                    }}
                    className="w-full py-1.5 rounded-full bg-white/10 text-[#E5C158] text-center"
                  >
                    Sign in with Google to save workspace
                  </button>
                )}
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};
