import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  verifyFirestoreConnection,
} from '../lib/firebase';
import {
  ActivityEvent,
  ActivityEventRecord,
  Agent,
  AgentRecord,
  AuthUserSummary,
  ClipBriefRecord,
  DelegationPlanRecord,
  Department,
  DepartmentId,
  DepartmentRecord,
  ExecutionJobRecord,
  Goal,
  MissionDataRepository,
  Task,
  TaskRecord,
  UserPreferencesRecord,
  WorkspaceGoalRecord,
} from '../types/mission';
import {
  HydratedWorkspaceState,
  mergePersistedWorkspaceWithDemo,
  PREFERENCES_DOC_ID,
  sanitizeDocId,
  shouldSeedInitialWorkspace,
  toActivityEventPayload,
  toAgentPayload,
  toClipBriefPayload,
  toDelegationPlanPayload,
  toDepartmentPayload,
  toExecutionJobPayload,
  toTaskPayload,
  toUserPreferencesPayload,
  toWorkspaceGoalPayload,
  WORKSPACE_DOC_ID,
} from '../utils/persistenceLogic';

export interface WorkspaceStorageAdapter {
  getWorkspaceGoal(uid: string): Promise<WorkspaceGoalRecord | null>;
  getAllCollections(uid: string): Promise<{
    departments: DepartmentRecord[];
    agents: AgentRecord[];
    tasks: TaskRecord[];
    activities: ActivityEventRecord[];
    preferences: UserPreferencesRecord | null;
    taskPlans: DelegationPlanRecord[];
    executionJobs: ExecutionJobRecord[];
    clipBriefs: ClipBriefRecord[];
  }>;
  seedInitialWorkspace(
    uid: string,
    payloads: {
      goal: Omit<WorkspaceGoalRecord, 'createdAt' | 'updatedAt'>;
      departments: Array<Omit<DepartmentRecord, 'createdAt' | 'updatedAt'>>;
      agents: Array<Omit<AgentRecord, 'createdAt' | 'updatedAt'>>;
      tasks: Array<Omit<TaskRecord, 'createdAt' | 'updatedAt'>>;
      activities: Array<Omit<ActivityEventRecord, 'createdAt' | 'updatedAt'>>;
      preferences: Omit<UserPreferencesRecord, 'createdAt' | 'updatedAt'>;
    }
  ): Promise<void>;
  updateWorkspaceGoal(
    uid: string,
    goalPayload: Omit<WorkspaceGoalRecord, 'createdAt' | 'updatedAt'>
  ): Promise<void>;
  updateTaskAndAgentWithActivity(
    uid: string,
    taskPayload: Omit<TaskRecord, 'createdAt' | 'updatedAt'>,
    agentPayload: Omit<AgentRecord, 'createdAt' | 'updatedAt'>,
    activityPayload: Omit<ActivityEventRecord, 'createdAt' | 'updatedAt'>
  ): Promise<void>;
  updateAgentConfig(
    uid: string,
    agentPayload: Omit<AgentRecord, 'createdAt' | 'updatedAt'>
  ): Promise<void>;
  updateDepartmentConfig(
    uid: string,
    deptPayload: Omit<DepartmentRecord, 'createdAt' | 'updatedAt'>
  ): Promise<void>;
  updatePreferences(
    uid: string,
    prefsPayload: Omit<UserPreferencesRecord, 'createdAt' | 'updatedAt'>
  ): Promise<void>;
  deleteActivity(uid: string, activityId: string): Promise<void>;
  saveTaskPlan(
    uid: string,
    planPayload: Omit<DelegationPlanRecord, 'createdAt' | 'updatedAt'>,
    activityPayload?: Omit<ActivityEventRecord, 'createdAt' | 'updatedAt'>
  ): Promise<void>;
  saveExecutionJobAndBriefs(
    uid: string,
    jobPayload: Omit<ExecutionJobRecord, 'createdAt' | 'updatedAt'>,
    briefPayloads: Array<Omit<ClipBriefRecord, 'createdAt' | 'updatedAt'>>,
    planPayload?: Omit<DelegationPlanRecord, 'createdAt' | 'updatedAt'>,
    activityPayload?: Omit<ActivityEventRecord, 'createdAt' | 'updatedAt'>
  ): Promise<void>;
}

export interface WorkspaceRepositoryService {
  loadOrInitializeUserWorkspace(
    uid: string,
    demoRepo: MissionDataRepository
  ): Promise<{
    state: HydratedWorkspaceState;
    wasSeededFirstRun: boolean;
  }>;
  saveWorkspaceGoal(uid: string, goal: Goal): Promise<void>;
  saveAgentTaskAssignment(
    uid: string,
    agent: Agent,
    task: Task,
    activityEvent: ActivityEvent
  ): Promise<void>;
  saveAgentConfiguration(uid: string, agent: Agent): Promise<void>;
  saveDepartmentConfiguration(
    uid: string,
    department: Department
  ): Promise<void>;
  saveUserPreferences(
    uid: string,
    prefs: {
      defaultDepartmentFilter?: DepartmentId | 'all';
      selectedAgentId?: string | null;
      simulationAutoplay?: boolean;
    }
  ): Promise<void>;
  deleteActivityEventRecord(uid: string, activityId: string): Promise<void>;
  saveDelegationPlanRecord(
    uid: string,
    plan: Omit<DelegationPlanRecord, 'createdAt' | 'updatedAt'>,
    activityEvent?: ActivityEvent
  ): Promise<void>;
  saveExecutionJobBundle(
    uid: string,
    job: Omit<ExecutionJobRecord, 'createdAt' | 'updatedAt'>,
    briefs: Array<Omit<ClipBriefRecord, 'createdAt' | 'updatedAt'>>,
    plan?: Omit<DelegationPlanRecord, 'createdAt' | 'updatedAt'>,
    activityEvent?: ActivityEvent
  ): Promise<void>;
}

export function createWorkspaceRepository(
  adapter: WorkspaceStorageAdapter
): WorkspaceRepositoryService {
  return {
    async loadOrInitializeUserWorkspace(uid, demoRepo) {
      const existingGoal = await adapter.getWorkspaceGoal(uid);

      if (shouldSeedInitialWorkspace(existingGoal !== null)) {
        const goalPayload = toWorkspaceGoalPayload(demoRepo.initialGoal, uid);
        const deptPayloads = demoRepo.departments.map((d) =>
          toDepartmentPayload(d, uid)
        );
        const agentPayloads = demoRepo.agents.map((a) =>
          toAgentPayload(a, uid)
        );
        const taskPayloads = demoRepo.tasks.map((t) => toTaskPayload(t, uid));
        const activityPayloads = demoRepo.activityEvents.map((e) =>
          toActivityEventPayload(e, uid)
        );
        const prefsPayload = toUserPreferencesPayload(
          {
            defaultDepartmentFilter: 'all',
            selectedAgentId: null,
            simulationAutoplay: true,
          },
          uid
        );

        await adapter.seedInitialWorkspace(uid, {
          goal: goalPayload,
          departments: deptPayloads,
          agents: agentPayloads,
          tasks: taskPayloads,
          activities: activityPayloads,
          preferences: prefsPayload,
        });

        const state = mergePersistedWorkspaceWithDemo(
          {
            goal: goalPayload,
            departments: deptPayloads,
            agents: agentPayloads,
            tasks: taskPayloads,
            activities: activityPayloads,
            preferences: prefsPayload,
          },
          demoRepo
        );

        return {
          state,
          wasSeededFirstRun: true,
        };
      }

      const collections = await adapter.getAllCollections(uid);
      const state = mergePersistedWorkspaceWithDemo(
        {
          goal: existingGoal,
          departments: collections.departments,
          agents: collections.agents,
          tasks: collections.tasks,
          activities: collections.activities,
          preferences: collections.preferences,
          taskPlans: collections.taskPlans,
          executionJobs: collections.executionJobs,
          clipBriefs: collections.clipBriefs,
        },
        demoRepo
      );

      return {
        state,
        wasSeededFirstRun: false,
      };
    },

    async saveWorkspaceGoal(uid, goal) {
      const payload = toWorkspaceGoalPayload(goal, uid);
      await adapter.updateWorkspaceGoal(uid, payload);
    },

    async saveAgentTaskAssignment(uid, agent, task, activityEvent) {
      const taskPayload = toTaskPayload(task, uid);
      const agentPayload = toAgentPayload(agent, uid);
      const activityPayload = toActivityEventPayload(activityEvent, uid);
      await adapter.updateTaskAndAgentWithActivity(
        uid,
        taskPayload,
        agentPayload,
        activityPayload
      );
    },

    async saveAgentConfiguration(uid, agent) {
      const agentPayload = toAgentPayload(agent, uid);
      await adapter.updateAgentConfig(uid, agentPayload);
    },

    async saveDepartmentConfiguration(uid, department) {
      const deptPayload = toDepartmentPayload(department, uid);
      await adapter.updateDepartmentConfig(uid, deptPayload);
    },

    async saveUserPreferences(uid, prefs) {
      const prefsPayload = toUserPreferencesPayload(prefs, uid);
      await adapter.updatePreferences(uid, prefsPayload);
    },

    async deleteActivityEventRecord(uid, activityId) {
      await adapter.deleteActivity(uid, sanitizeDocId(activityId));
    },

    async saveDelegationPlanRecord(uid, plan, activityEvent) {
      const planPayload = toDelegationPlanPayload(plan, uid);
      const activityPayload = activityEvent
        ? toActivityEventPayload(activityEvent, uid)
        : undefined;
      await adapter.saveTaskPlan(uid, planPayload, activityPayload);
    },

    async saveExecutionJobBundle(uid, job, briefs, plan, activityEvent) {
      const jobPayload = toExecutionJobPayload(job, uid);
      const briefPayloads = briefs.map((b) => toClipBriefPayload(b, uid));
      const planPayload = plan ? toDelegationPlanPayload(plan, uid) : undefined;
      const activityPayload = activityEvent
        ? toActivityEventPayload(activityEvent, uid)
        : undefined;
      await adapter.saveExecutionJobAndBriefs(
        uid,
        jobPayload,
        briefPayloads,
        planPayload,
        activityPayload
      );
    },
  };
}

const firestoreStorageAdapter: WorkspaceStorageAdapter = {
  async getWorkspaceGoal(uid) {
    const path = `users/${uid}/workspaces/${WORKSPACE_DOC_ID}`;
    try {
      const snap = await getDoc(doc(db, 'users', uid, 'workspaces', WORKSPACE_DOC_ID));
      if (!snap.exists()) return null;
      return snap.data() as WorkspaceGoalRecord;
    } catch (error) {
      return handleFirestoreError(error, OperationType.GET, path);
    }
  },

  async getAllCollections(uid) {
    const basePath = `users/${uid}`;
    try {
      const [
        deptSnap,
        agentSnap,
        taskSnap,
        activitySnap,
        prefSnap,
        planSnap,
        jobSnap,
        briefSnap,
      ] = await Promise.all([
        getDocs(collection(db, 'users', uid, 'departments')),
        getDocs(collection(db, 'users', uid, 'agents')),
        getDocs(collection(db, 'users', uid, 'tasks')),
        getDocs(collection(db, 'users', uid, 'activities')),
        getDoc(doc(db, 'users', uid, 'preferences', PREFERENCES_DOC_ID)),
        getDocs(collection(db, 'users', uid, 'taskPlans')),
        getDocs(collection(db, 'users', uid, 'executionJobs')),
        getDocs(collection(db, 'users', uid, 'clipBriefs')),
      ]);

      return {
        departments: deptSnap.docs.map((d) => d.data() as DepartmentRecord),
        agents: agentSnap.docs.map((d) => d.data() as AgentRecord),
        tasks: taskSnap.docs.map((d) => d.data() as TaskRecord),
        activities: activitySnap.docs.map((d) => d.data() as ActivityEventRecord),
        preferences: prefSnap.exists()
          ? (prefSnap.data() as UserPreferencesRecord)
          : null,
        taskPlans: planSnap.docs.map((d) => d.data() as DelegationPlanRecord),
        executionJobs: jobSnap.docs.map((d) => d.data() as ExecutionJobRecord),
        clipBriefs: briefSnap.docs.map((d) => d.data() as ClipBriefRecord),
      };
    } catch (error) {
      return handleFirestoreError(error, OperationType.LIST, basePath);
    }
  },

  async seedInitialWorkspace(uid, payloads) {
    const basePath = `users/${uid}/workspaces/${WORKSPACE_DOC_ID}`;
    try {
      const batch = writeBatch(db);
      const ts = serverTimestamp();

      batch.set(doc(db, 'users', uid, 'workspaces', WORKSPACE_DOC_ID), {
        ...payloads.goal,
        createdAt: ts,
        updatedAt: ts,
      });

      for (const dept of payloads.departments) {
        batch.set(doc(db, 'users', uid, 'departments', dept.id), {
          ...dept,
          createdAt: ts,
          updatedAt: ts,
        });
      }

      for (const ag of payloads.agents) {
        batch.set(doc(db, 'users', uid, 'agents', ag.id), {
          ...ag,
          createdAt: ts,
          updatedAt: ts,
        });
      }

      for (const task of payloads.tasks) {
        batch.set(doc(db, 'users', uid, 'tasks', task.id), {
          ...task,
          createdAt: ts,
          updatedAt: ts,
        });
      }

      for (const evt of payloads.activities) {
        batch.set(doc(db, 'users', uid, 'activities', evt.id), {
          ...evt,
          createdAt: ts,
          updatedAt: ts,
        });
      }

      batch.set(doc(db, 'users', uid, 'preferences', PREFERENCES_DOC_ID), {
        ...payloads.preferences,
        createdAt: ts,
        updatedAt: ts,
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, basePath);
    }
  },

  async updateWorkspaceGoal(uid, goalPayload) {
    const path = `users/${uid}/workspaces/${WORKSPACE_DOC_ID}`;
    try {
      const ref = doc(db, 'users', uid, 'workspaces', WORKSPACE_DOC_ID);
      await updateDoc(ref, {
        title: goalPayload.title,
        metricLabel: goalPayload.metricLabel,
        currentValue: goalPayload.currentValue,
        targetValue: goalPayload.targetValue,
        unit: goalPayload.unit,
        currentDay: goalPayload.currentDay,
        totalDays: goalPayload.totalDays,
        deadlineLabel: goalPayload.deadlineLabel,
        countdownDisplay: goalPayload.countdownDisplay,
        isSampleData: goalPayload.isSampleData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async updateTaskAndAgentWithActivity(
    uid,
    taskPayload,
    agentPayload,
    activityPayload
  ) {
    const path = `users/${uid}/tasks/${taskPayload.id}`;
    try {
      const batch = writeBatch(db);
      const ts = serverTimestamp();

      batch.update(doc(db, 'users', uid, 'tasks', taskPayload.id), {
        title: taskPayload.title,
        description: taskPayload.description,
        departmentId: taskPayload.departmentId,
        assignedAgentId: taskPayload.assignedAgentId,
        status: taskPayload.status,
        priority: taskPayload.priority,
        progressPercent: taskPayload.progressPercent,
        sampleOutputSummary: taskPayload.sampleOutputSummary,
        isSampleData: taskPayload.isSampleData,
        updatedAt: ts,
      });

      batch.update(doc(db, 'users', uid, 'agents', agentPayload.id), {
        name: agentPayload.name,
        role: agentPayload.role,
        departmentId: agentPayload.departmentId,
        status: agentPayload.status,
        badgeColor: agentPayload.badgeColor,
        progressPercent: agentPayload.progressPercent,
        homeX: agentPayload.homeX,
        homeY: agentPayload.homeY,
        destinationLabel: agentPayload.destinationLabel,
        speedPxPerSec: agentPayload.speedPxPerSec,
        currentTaskId: agentPayload.currentTaskId,
        executionJobId: agentPayload.executionJobId,
        specialty: agentPayload.specialty,
        isSampleData: agentPayload.isSampleData,
        updatedAt: ts,
      });

      batch.set(doc(db, 'users', uid, 'activities', activityPayload.id), {
        ...activityPayload,
        createdAt: ts,
        updatedAt: ts,
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async updateAgentConfig(uid, agentPayload) {
    const path = `users/${uid}/agents/${agentPayload.id}`;
    try {
      await updateDoc(doc(db, 'users', uid, 'agents', agentPayload.id), {
        name: agentPayload.name,
        role: agentPayload.role,
        departmentId: agentPayload.departmentId,
        status: agentPayload.status,
        badgeColor: agentPayload.badgeColor,
        progressPercent: agentPayload.progressPercent,
        homeX: agentPayload.homeX,
        homeY: agentPayload.homeY,
        destinationLabel: agentPayload.destinationLabel,
        speedPxPerSec: agentPayload.speedPxPerSec,
        currentTaskId: agentPayload.currentTaskId,
        executionJobId: agentPayload.executionJobId,
        specialty: agentPayload.specialty,
        isSampleData: agentPayload.isSampleData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async updateDepartmentConfig(uid, deptPayload) {
    const path = `users/${uid}/departments/${deptPayload.id}`;
    try {
      await updateDoc(doc(db, 'users', uid, 'departments', deptPayload.id), {
        name: deptPayload.name,
        shortLabel: deptPayload.shortLabel,
        description: deptPayload.description,
        accentColor: deptPayload.accentColor,
        badgeBg: deptPayload.badgeBg,
        badgeBorder: deptPayload.badgeBorder,
        badgeText: deptPayload.badgeText,
        islandX: deptPayload.islandX,
        islandY: deptPayload.islandY,
        futureEngineHook: deptPayload.futureEngineHook,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async updatePreferences(uid, prefsPayload) {
    const path = `users/${uid}/preferences/${PREFERENCES_DOC_ID}`;
    try {
      const ref = doc(db, 'users', uid, 'preferences', PREFERENCES_DOC_ID);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          ...prefsPayload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(ref, {
          defaultDepartmentFilter: prefsPayload.defaultDepartmentFilter,
          selectedAgentId: prefsPayload.selectedAgentId,
          simulationAutoplay: prefsPayload.simulationAutoplay,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteActivity(uid, activityId) {
    const path = `users/${uid}/activities/${activityId}`;
    try {
      await deleteDoc(doc(db, 'users', uid, 'activities', activityId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async saveTaskPlan(uid, planPayload, activityPayload) {
    const path = `users/${uid}/taskPlans/${planPayload.id}`;
    try {
      const planRef = doc(db, 'users', uid, 'taskPlans', planPayload.id);
      const existingSnap = await getDoc(planRef);
      const batch = writeBatch(db);
      const ts = serverTimestamp();

      if (!existingSnap.exists()) {
        batch.set(planRef, {
          ...planPayload,
          createdAt: ts,
          updatedAt: ts,
        });
      } else {
        batch.update(planRef, {
          goalTitle: planPayload.goalTitle,
          providerId: planPayload.providerId,
          status: planPayload.status,
          autoRunApprovedTypesOnly: planPayload.autoRunApprovedTypesOnly,
          tasksJson: planPayload.tasksJson,
          taskCount: planPayload.taskCount,
          supportedTaskCount: planPayload.supportedTaskCount,
          updatedAt: ts,
        });
      }

      if (activityPayload) {
        batch.set(doc(db, 'users', uid, 'activities', activityPayload.id), {
          ...activityPayload,
          createdAt: ts,
          updatedAt: ts,
        });
      }

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async saveExecutionJobAndBriefs(
    uid,
    jobPayload,
    briefPayloads,
    planPayload,
    activityPayload
  ) {
    const path = `users/${uid}/executionJobs/${jobPayload.id}`;
    try {
      const jobRef = doc(db, 'users', uid, 'executionJobs', jobPayload.id);
      const existingJobSnap = await getDoc(jobRef);
      const batch = writeBatch(db);
      const ts = serverTimestamp();

      if (!existingJobSnap.exists()) {
        batch.set(jobRef, {
          ...jobPayload,
          createdAt: ts,
          updatedAt: ts,
        });
      } else {
        batch.update(jobRef, {
          status: jobPayload.status,
          retryCount: jobPayload.retryCount,
          outputSummary: jobPayload.outputSummary,
          errorMessage: jobPayload.errorMessage,
          updatedAt: ts,
        });
      }

      for (const brief of briefPayloads) {
        const briefRef = doc(db, 'users', uid, 'clipBriefs', brief.id);
        batch.set(briefRef, {
          ...brief,
          createdAt: ts,
          updatedAt: ts,
        });
      }

      if (planPayload) {
        const planRef = doc(db, 'users', uid, 'taskPlans', planPayload.id);
        const existingPlanSnap = await getDoc(planRef);
        if (existingPlanSnap.exists()) {
          batch.update(planRef, {
            goalTitle: planPayload.goalTitle,
            providerId: planPayload.providerId,
            status: planPayload.status,
            autoRunApprovedTypesOnly: planPayload.autoRunApprovedTypesOnly,
            tasksJson: planPayload.tasksJson,
            taskCount: planPayload.taskCount,
            supportedTaskCount: planPayload.supportedTaskCount,
            updatedAt: ts,
          });
        }
      }

      if (activityPayload) {
        batch.set(doc(db, 'users', uid, 'activities', activityPayload.id), {
          ...activityPayload,
          createdAt: ts,
          updatedAt: ts,
        });
      }

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },
};

export const workspaceRepository = createWorkspaceRepository(
  firestoreStorageAdapter
);

function mapFirebaseUser(user: User): AuthUserSummary {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
  };
}

export async function signInWithGooglePopup(): Promise<AuthUserSummary> {
  const credential = await signInWithPopup(auth, googleProvider);
  return mapFirebaseUser(credential.user);
}

export async function signOutCurrentUser(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuthChanges(
  onUserChanged: (user: AuthUserSummary | null) => void
): () => void {
  void verifyFirestoreConnection();
  return onAuthStateChanged(auth, (firebaseUser) => {
    if (!firebaseUser) {
      onUserChanged(null);
      return;
    }
    onUserChanged(mapFirebaseUser(firebaseUser));
  });
}
