/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { LiveCompanyDemo } from './components/LiveCompanyDemo';
import { Navbar } from './components/Navbar';
import { DEMO_COMPANY_REPOSITORY } from './data/demoCompanyData';
import {
  signInWithGooglePopup,
  signOutCurrentUser,
  subscribeToAuthChanges,
  workspaceRepository,
} from './services/workspaceRepository';
import {
  ActiveMessagePacket,
  ActivityEvent,
  Agent,
  AuthUserSummary,
  ClipBriefRecord,
  DelegationPlanRecord,
  Department,
  DepartmentId,
  ExecutionJobRecord,
  Goal,
  PersistenceStatus,
  Task,
} from './types/mission';
import {
  assignSampleTaskToAgent,
  buildIslandRoute,
  dismissAgentBubble,
  dispatchSimulationScenario,
  pointDistance,
  stepAgentPosition,
  updateGoalMissionText,
} from './utils/companyLogic';

function formatPersistenceErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message) as { error?: string };
      if (parsed && typeof parsed.error === 'string') {
        return parsed.error;
      }
    } catch {
      // Not JSON-encoded FirestoreErrorInfo
    }
    return error.message;
  }
  return 'Unable to sync changes with Cloud Firestore.';
}

export default function App() {
  const [goal, setGoal] = useState<Goal>(DEMO_COMPANY_REPOSITORY.initialGoal);
  const [departments, setDepartments] = useState<Department[]>(
    DEMO_COMPANY_REPOSITORY.departments
  );
  const [agents, setAgents] = useState<Agent[]>(DEMO_COMPANY_REPOSITORY.agents);
  const [tasks, setTasks] = useState<Task[]>(DEMO_COMPANY_REPOSITORY.tasks);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>(
    DEMO_COMPANY_REPOSITORY.activityEvents
  );
  const [taskPlans, setTaskPlans] = useState<DelegationPlanRecord[]>([]);
  const [persistedJobs, setPersistedJobs] = useState<ExecutionJobRecord[]>([]);
  const [clipBriefs, setClipBriefs] = useState<ClipBriefRecord[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<
    DepartmentId | 'all'
  >('all');

  const [authUser, setAuthUser] = useState<AuthUserSummary | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [persistenceStatus, setPersistenceStatus] =
    useState<PersistenceStatus>('idle');
  const [persistenceError, setPersistenceError] = useState<string | null>(null);

  const selectedAgentIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedAgentIdRef.current = selectedAgentId;
  }, [selectedAgentId]);

  const [isSimulating, setIsSimulating] = useState<boolean>(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return false;
    }
    return true;
  });
  const [activePackets, setActivePackets] = useState<ActiveMessagePacket[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionPreferenceChange = (
      e: MediaQueryListEvent | MediaQueryList
    ) => {
      if (e.matches) {
        setIsSimulating(false);
        setActivePackets([]);
      }
    };
    handleMotionPreferenceChange(mediaQuery);
    mediaQuery.addEventListener('change', handleMotionPreferenceChange);
    return () => {
      mediaQuery.removeEventListener('change', handleMotionPreferenceChange);
    };
  }, []);

  // Subscribe to Firebase Authentication state and load/initialize user workspace
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      if (!isMounted) return;
      setAuthUser(user);
      setIsAuthReady(true);

      if (!user) {
        setPersistenceStatus('idle');
        setPersistenceError(null);
        setGoal(DEMO_COMPANY_REPOSITORY.initialGoal);
        setDepartments(DEMO_COMPANY_REPOSITORY.departments);
        setAgents(DEMO_COMPANY_REPOSITORY.agents);
        setTasks(DEMO_COMPANY_REPOSITORY.tasks);
        setActivityEvents(DEMO_COMPANY_REPOSITORY.activityEvents);
        setTaskPlans([]);
        setPersistedJobs([]);
        setClipBriefs([]);
        setDepartmentFilter('all');
        return;
      }

      setPersistenceStatus('loading');
      setPersistenceError(null);
      try {
        const { state } = await workspaceRepository.loadOrInitializeUserWorkspace(
          user.uid,
          DEMO_COMPANY_REPOSITORY
        );
        if (!isMounted) return;
        setGoal(state.goal);
        setDepartments(state.departments);
        setAgents(state.agents);
        setTasks(state.tasks);
        setActivityEvents(state.activityEvents);
        setTaskPlans(state.taskPlans);
        setPersistedJobs(state.executionJobs);
        setClipBriefs(state.clipBriefs);
        setDepartmentFilter(state.preferences.defaultDepartmentFilter);
        if (state.preferences.selectedAgentId) {
          setSelectedAgentId(state.preferences.selectedAgentId);
        }
        setPersistenceStatus('idle');
      } catch (err) {
        if (!isMounted) return;
        setPersistenceStatus('error');
        setPersistenceError(formatPersistenceErrorMessage(err));
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const scenarioCursorRef = useRef<number>(3);
  const scenarioElapsedMsRef = useRef<number>(3800);

  const triggerNextScenario = useCallback(() => {
    const scenarios = DEMO_COMPANY_REPOSITORY.simulationScenarios;
    if (scenarios.length === 0) return;

    const scenario = scenarios[scenarioCursorRef.current % scenarios.length];
    scenarioCursorRef.current =
      (scenarioCursorRef.current + 1) % scenarios.length;
    const nowMs = Date.now();

    setAgents((prevAgents) => {
      const withHomebound = prevAgents.map((ag) => {
        if (
          ag.id !== scenario.senderAgentId &&
          ag.id !== scenario.recipientAgentId &&
          (!ag.waypoints || ag.waypoints.length === 0) &&
          ag.homeCoords &&
          pointDistance(ag.islandCoords, ag.homeCoords) > 18
        ) {
          const returnRoute = buildIslandRoute(
            ag.islandCoords,
            ag.homeCoords,
            ag.departmentId,
            ag.departmentId
          );
          return {
            ...ag,
            waypoints: returnRoute,
            destinationCoords: ag.homeCoords,
            destinationLabel: 'Assigned Station',
            animationState: (returnRoute.length > 0
              ? 'walking'
              : 'working') as Agent['animationState'],
          };
        }
        return ag;
      });

      const dispatched = dispatchSimulationScenario(
        withHomebound,
        [],
        scenario,
        nowMs
      );

      if (dispatched.packet) {
        setActivePackets((prev) => [...prev.slice(-2), dispatched.packet!]);
      }

      if (dispatched.activityEvents.length > 0) {
        const createdEvt = dispatched.activityEvents[0];
        setActivityEvents((prevEvents) => {
          const deduped = prevEvents.filter(
            (e, idx) =>
              !(
                idx === 0 &&
                e.fromAgentId === createdEvt.fromAgentId &&
                e.message === createdEvt.message
              )
          );
          return [createdEvt, ...deduped].slice(0, 12);
        });
      }

      return dispatched.agents;
    });
  }, []);

  const lastReducedMotionRef = useRef<boolean>(
    typeof window !== 'undefined' &&
      Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  );

  // Single unified simulation loop (120ms tick) for scenario dispatch, walking agents, and packets
  // Note: Never writes to Firestore on movement or animation ticks.
  useEffect(() => {
    if (!isSimulating) return;

    const TICK_MS = 120;
    const SCENARIO_INTERVAL_MS = 4400;

    const unifiedInterval = window.setInterval(() => {
      const prefersReduced =
        typeof window !== 'undefined' &&
        Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
      if (prefersReduced && !lastReducedMotionRef.current) {
        lastReducedMotionRef.current = true;
        setIsSimulating(false);
        setActivePackets([]);
        return;
      }
      lastReducedMotionRef.current = prefersReduced;

      scenarioElapsedMsRef.current += TICK_MS;
      if (scenarioElapsedMsRef.current >= SCENARIO_INTERVAL_MS) {
        scenarioElapsedMsRef.current = 0;
        triggerNextScenario();
        return;
      }

      const nowMs = Date.now();
      const pausedId = selectedAgentIdRef.current;

      setAgents((prevAgents) => {
        const needsUpdate = prevAgents.some(
          (ag) =>
            (ag.waypoints && ag.waypoints.length > 0) ||
            ag.animationState === 'walking' ||
            (ag.bubbleExpiresAt !== undefined && nowMs >= ag.bubbleExpiresAt)
        );
        if (!needsUpdate) return prevAgents;
        return prevAgents.map((ag) =>
          stepAgentPosition(ag, TICK_MS / 1000, pausedId, nowMs)
        );
      });

      setActivePackets((prevPackets) => {
        if (prevPackets.length === 0) return prevPackets;
        const nextPackets = prevPackets
          .map((pkt) => ({
            ...pkt,
            progress: Math.min(1, Math.round((pkt.progress + 0.09) * 100) / 100),
          }))
          .filter((pkt) => pkt.progress < 1);

        if (nextPackets.length < prevPackets.length) {
          setActivityEvents((prevEvents) =>
            prevEvents.map((evt, idx) =>
              idx === 0 && evt.status === 'travelling'
                ? { ...evt, status: 'completed' }
                : evt
            )
          );
        }

        return nextPackets;
      });
    }, TICK_MS);

    return () => {
      window.clearInterval(unifiedInterval);
    };
  }, [isSimulating, triggerNextScenario]);

  const handleToggleSimulation = () => {
    setIsSimulating((prev) => !prev);
  };

  const handleResetSimulation = () => {
    scenarioCursorRef.current = 0;
    scenarioElapsedMsRef.current = 0;
    setActivePackets([]);
    // Reset transient walking coordinates back to homeCoords while preserving saved tasks/roles
    setAgents((prevAgents) =>
      prevAgents.map((ag) => {
        const template = DEMO_COMPANY_REPOSITORY.agents.find(
          (t) => t.id === ag.id
        );
        const home = ag.homeCoords ?? template?.homeCoords ?? ag.islandCoords;
        return {
          ...ag,
          islandCoords: home,
          destinationCoords: home,
          waypoints: [],
          animationState: ag.status === 'idle' ? 'idle' : 'working',
          sampleBubbleText: template?.sampleBubbleText,
          bubbleOffset: template?.bubbleOffset,
          bubbleExpiresAt: undefined,
        };
      })
    );
  };

  const handleDismissBubble = (agentId: string) => {
    setAgents((prevAgents) => dismissAgentBubble(prevAgents, agentId));
  };

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      const navbarOffset = 84;
      const elementTop = el.getBoundingClientRect().top + window.scrollY;
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({
        top: Math.max(0, elementTop - navbarOffset),
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    }
  };

  const handleOpenMyCompany = () => {
    scrollToSection('demo');
    if (!selectedAgentId) {
      setSelectedAgentId('agent-pixel');
    }
  };

  const handleSignIn = async () => {
    setPersistenceError(null);
    try {
      await signInWithGooglePopup();
    } catch (err) {
      const msg = formatPersistenceErrorMessage(err);
      if (!msg.includes('auth/popup-closed-by-user')) {
        setPersistenceStatus('error');
        setPersistenceError(msg);
      }
    }
  };

  const handleSignOut = async () => {
    setPersistenceError(null);
    try {
      await signOutCurrentUser();
    } catch (err) {
      setPersistenceStatus('error');
      setPersistenceError(formatPersistenceErrorMessage(err));
    }
  };

  const handleGoalChange = (newTitle: string) => {
    setGoal((prev) => ({
      ...prev,
      title: newTitle,
    }));
  };

  const handleSaveGoal = async (explicitTitle?: string) => {
    const candidateTitle = explicitTitle !== undefined ? explicitTitle : goal.title;
    const updatedGoal = updateGoalMissionText(goal, candidateTitle);
    setGoal(updatedGoal);

    if (!authUser) {
      return;
    }

    setPersistenceStatus('saving');
    setPersistenceError(null);
    try {
      await workspaceRepository.saveWorkspaceGoal(authUser.uid, updatedGoal);
      setPersistenceStatus('saved');
    } catch (err) {
      setPersistenceStatus('error');
      setPersistenceError(formatPersistenceErrorMessage(err));
    }
  };

  const handleDepartmentFilterChange = (deptId: DepartmentId | 'all') => {
    setDepartmentFilter(deptId);
    if (authUser) {
      void workspaceRepository
        .saveUserPreferences(authUser.uid, {
          defaultDepartmentFilter: deptId,
          selectedAgentId,
          simulationAutoplay: isSimulating,
        })
        .catch((err) => {
          setPersistenceStatus('error');
          setPersistenceError(formatPersistenceErrorMessage(err));
        });
    }
  };

  const handleAssignSampleTask = async (
    agentId: string,
    newTaskTitle: string
  ): Promise<boolean> => {
    const cleanTitle = newTaskTitle.trim();
    if (!cleanTitle) return false;

    const updated = assignSampleTaskToAgent(
      agents,
      tasks,
      agentId,
      cleanTitle
    );
    const updatedAgent = updated.agents.find((a) => a.id === agentId);
    const updatedTask = updatedAgent
      ? updated.tasks.find((t) => t.id === updatedAgent.currentTaskId)
      : undefined;

    if (!updatedAgent || !updatedTask) {
      return false;
    }

    const newEvent: ActivityEvent = {
      id: `evt-custom-${Date.now()}`,
      fromAgentName: 'The Boss',
      toAgentName: updatedAgent.name,
      fromAgentId: 'agent-boss',
      toAgentId: updatedAgent.id,
      departmentId: updatedAgent.departmentId,
      destinationLabel: updatedAgent.destinationLabel,
      message: `Assigned sample task: "${cleanTitle}"`,
      timestampLabel: 'Sample · Just now',
      createdAt: Date.now(),
      status: 'completed',
      eventType: 'clip_spec',
      isSampleData: true,
    };

    if (authUser) {
      setPersistenceStatus('saving');
      setPersistenceError(null);
      try {
        await workspaceRepository.saveAgentTaskAssignment(
          authUser.uid,
          updatedAgent,
          updatedTask,
          newEvent
        );
        setAgents(updated.agents);
        setTasks(updated.tasks);
        setActivityEvents((prev) => [newEvent, ...prev].slice(0, 12));
        setPersistenceStatus('saved');
        return true;
      } catch (err) {
        setPersistenceStatus('error');
        setPersistenceError(formatPersistenceErrorMessage(err));
        return false;
      }
    }

    setAgents(updated.agents);
    setTasks(updated.tasks);
    setActivityEvents((prev) => [newEvent, ...prev].slice(0, 12));
    return true;
  };

  const handleRecordRealActivity = useCallback((event: ActivityEvent) => {
    setActivityEvents((prev) => [event, ...prev].slice(0, 12));
  }, []);

  const handlePersistPlan = useCallback(
    async (
      plan: Omit<DelegationPlanRecord, 'createdAt' | 'updatedAt'>,
      event?: ActivityEvent
    ) => {
      if (!authUser) return;
      setPersistenceStatus('saving');
      setPersistenceError(null);
      try {
        await workspaceRepository.saveDelegationPlanRecord(
          authUser.uid,
          plan,
          event
        );
        setPersistenceStatus('saved');
      } catch (err) {
        setPersistenceStatus('error');
        setPersistenceError(formatPersistenceErrorMessage(err));
      }
    },
    [authUser]
  );

  const handlePersistJobBundle = useCallback(
    async (
      job: Omit<ExecutionJobRecord, 'createdAt' | 'updatedAt'>,
      briefs: Array<Omit<ClipBriefRecord, 'createdAt' | 'updatedAt'>>,
      plan?: Omit<DelegationPlanRecord, 'createdAt' | 'updatedAt'>,
      event?: ActivityEvent
    ) => {
      if (!authUser) return;
      setPersistenceStatus('saving');
      setPersistenceError(null);
      try {
        await workspaceRepository.saveExecutionJobBundle(
          authUser.uid,
          job,
          briefs,
          plan,
          event
        );
        setPersistenceStatus('saved');
      } catch (err) {
        setPersistenceStatus('error');
        setPersistenceError(formatPersistenceErrorMessage(err));
      }
    },
    [authUser]
  );

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F5F2EB] flex flex-col">
      <Navbar
        onNavigate={scrollToSection}
        onOpenCompany={handleOpenMyCompany}
        authUser={authUser}
        isAuthReady={isAuthReady}
        persistenceStatus={persistenceStatus}
        onSignIn={() => void handleSignIn()}
        onSignOut={() => void handleSignOut()}
      />

      <main className="flex-1">
        <HeroSection
          goal={goal}
          totalAgentsCount={agents.length}
          departments={departments}
          authUser={authUser}
          persistenceStatus={persistenceStatus}
          onGoalChange={handleGoalChange}
          onSaveGoal={handleSaveGoal}
          onSignIn={() => void handleSignIn()}
          onOpenDemo={handleOpenMyCompany}
          onScrollToDemo={() => scrollToSection('demo')}
        />

        <LiveCompanyDemo
          goal={goal}
          departments={departments}
          agents={agents}
          tasks={tasks}
          executionJobs={DEMO_COMPANY_REPOSITORY.executionJobs}
          activityEvents={activityEvents}
          activePackets={activePackets}
          isSimulating={isSimulating}
          selectedAgentId={selectedAgentId}
          departmentFilter={departmentFilter}
          authUser={authUser}
          persistenceStatus={persistenceStatus}
          persistenceError={persistenceError}
          taskPlans={taskPlans}
          persistedJobs={persistedJobs}
          clipBriefs={clipBriefs}
          onSelectAgentId={setSelectedAgentId}
          onDepartmentFilterChange={handleDepartmentFilterChange}
          onGoalChange={handleGoalChange}
          onSaveGoal={handleSaveGoal}
          onAssignSampleTask={handleAssignSampleTask}
          onRecordRealActivity={handleRecordRealActivity}
          onPersistPlan={handlePersistPlan}
          onPersistJobBundle={handlePersistJobBundle}
          onDismissPersistenceError={() => setPersistenceError(null)}
          onToggleSimulation={handleToggleSimulation}
          onStepSimulation={triggerNextScenario}
          onResetSimulation={handleResetSimulation}
          onDismissBubble={handleDismissBubble}
        />

        <HowItWorksSection
          chapters={DEMO_COMPANY_REPOSITORY.chapters}
          goal={goal}
          departments={departments}
          onJumpToDemo={handleOpenMyCompany}
        />
      </main>

      <Footer
        onNavigate={scrollToSection}
        onOpenCompany={handleOpenMyCompany}
      />
    </div>
  );
}
