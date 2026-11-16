import {
  ActiveMessagePacket,
  ActivityEvent,
  Agent,
  CanvasTransform,
  DepartmentId,
  Goal,
  IslandPoint,
  SimulationScenarioTemplate,
  Task,
} from '../types/mission';

export const MIN_ZOOM = 0.65;
export const MAX_ZOOM = 1.75;
export const ZOOM_STEP = 0.2;

export const ISLAND_CENTER: IslandPoint = { x: 500, y: 396 };

export const DEPARTMENT_HUB_WAYPOINTS: Record<DepartmentId, IslandPoint> = {
  'the-boss': { x: 500, y: 268 },
  'content-studio': { x: 612, y: 422 },
  growth: { x: 500, y: 508 },
  'sales-community': { x: 382, y: 424 },
};

export function pointDistance(a: IslandPoint, b: IslandPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/**
 * Ensures any coordinate stays safely inside the green isometric island surface
 * (including The Boss HQ at y=186 through South Growth Tent at y=586).
 */
export function clampToIslandBounds(point: IslandPoint): IslandPoint {
  const cx = 500;
  const cy = 390;
  const maxRx = 238;
  const maxRy = 222;
  const dx = point.x - cx;
  const dy = point.y - cy;
  const normalized = (dx * dx) / (maxRx * maxRx) + (dy * dy) / (maxRy * maxRy);

  if (normalized <= 1) {
    return {
      x: Math.round(point.x * 10) / 10,
      y: Math.round(point.y * 10) / 10,
    };
  }

  const scale = 1 / Math.sqrt(normalized);
  return {
    x: Math.round((cx + dx * scale) * 10) / 10,
    y: Math.round((cy + dy * scale) * 10) / 10,
  };
}

/**
 * Builds a path of waypoints along the island's radial cobblestone paths
 * so agents walk smoothly between departments without passing through buildings.
 */
export function buildIslandRoute(
  from: IslandPoint,
  to: IslandPoint,
  fromDept: DepartmentId,
  toDept: DepartmentId
): IslandPoint[] {
  const safeTarget = clampToIslandBounds(to);
  const directDist = pointDistance(from, safeTarget);

  if (directDist <= 6) {
    return [];
  }

  const rawWaypoints: IslandPoint[] = [];

  if (fromDept === toDept && directDist <= 115) {
    const deptHub = DEPARTMENT_HUB_WAYPOINTS[fromDept];
    if (
      pointDistance(from, deptHub) < directDist &&
      pointDistance(deptHub, safeTarget) < directDist
    ) {
      rawWaypoints.push(deptHub);
    }
    rawWaypoints.push(safeTarget);
  } else {
    const startHub = DEPARTMENT_HUB_WAYPOINTS[fromDept];
    const endHub = DEPARTMENT_HUB_WAYPOINTS[toDept];

    if (pointDistance(from, startHub) > 16) {
      rawWaypoints.push(startHub);
    }
    if (
      fromDept !== toDept &&
      pointDistance(startHub, ISLAND_CENTER) > 18 &&
      pointDistance(ISLAND_CENTER, endHub) > 18
    ) {
      rawWaypoints.push(ISLAND_CENTER);
    }
    if (pointDistance(endHub, safeTarget) > 16) {
      rawWaypoints.push(endHub);
    }
    rawWaypoints.push(safeTarget);
  }

  // Deduplicate consecutive close points
  const filtered: IslandPoint[] = [];
  let cursor = from;
  for (const wp of rawWaypoints) {
    const clamped = clampToIslandBounds(wp);
    if (pointDistance(cursor, clamped) > 6) {
      filtered.push(clamped);
      cursor = clamped;
    }
  }

  return filtered;
}

/**
 * Advances a single agent along its active waypoint queue by dtSeconds.
 * Pauses movement if the agent is currently selected/inspected by the user.
 */
export function stepAgentPosition(
  agent: Agent,
  dtSeconds: number,
  pausedAgentId: string | null = null,
  nowMs?: number
): Agent {
  let nextBubbleText = agent.sampleBubbleText;
  let nextBubbleExpiresAt = agent.bubbleExpiresAt;

  if (
    nowMs !== undefined &&
    agent.bubbleExpiresAt !== undefined &&
    nowMs >= agent.bubbleExpiresAt
  ) {
    nextBubbleText = undefined;
    nextBubbleExpiresAt = undefined;
  }

  // Pause movement if this agent is currently inspected in the detail drawer
  if (pausedAgentId === agent.id) {
    return {
      ...agent,
      sampleBubbleText: nextBubbleText,
      bubbleExpiresAt: nextBubbleExpiresAt,
    };
  }

  const waypoints = agent.waypoints ?? [];
  if (waypoints.length === 0) {
    const settledState =
      agent.animationState === 'walking'
        ? nextBubbleText
          ? 'communicating'
          : agent.status === 'idle'
          ? 'idle'
          : 'working'
        : agent.animationState ?? 'working';

    if (
      settledState === agent.animationState &&
      nextBubbleText === agent.sampleBubbleText
    ) {
      return agent;
    }

    return {
      ...agent,
      animationState: settledState,
      sampleBubbleText: nextBubbleText,
      bubbleExpiresAt: nextBubbleExpiresAt,
    };
  }

  const speed = agent.speedPxPerSec ?? 72;
  let remainingStep = Math.max(0, speed * dtSeconds);
  let currentPos = agent.islandCoords;
  const remainingWaypoints = [...waypoints];

  while (remainingStep > 0 && remainingWaypoints.length > 0) {
    const target = remainingWaypoints[0];
    const dist = pointDistance(currentPos, target);

    if (dist <= remainingStep) {
      currentPos = target;
      remainingStep -= dist;
      remainingWaypoints.shift();
    } else {
      const ratio = remainingStep / dist;
      currentPos = {
        x: Math.round((currentPos.x + (target.x - currentPos.x) * ratio) * 10) / 10,
        y: Math.round((currentPos.y + (target.y - currentPos.y) * ratio) * 10) / 10,
      };
      remainingStep = 0;
    }
  }

  const arrived = remainingWaypoints.length === 0;
  const nextProgress = arrived
    ? Math.min(100, Math.max(25, ((agent.progressPercent + 4) % 96) + 4))
    : agent.progressPercent;

  return {
    ...agent,
    islandCoords: clampToIslandBounds(currentPos),
    waypoints: remainingWaypoints,
    progressPercent: nextProgress,
    animationState: arrived
      ? nextBubbleText
        ? 'communicating'
        : 'working'
      : 'walking',
    sampleBubbleText: nextBubbleText,
    bubbleExpiresAt: nextBubbleExpiresAt,
  };
}

/**
 * Triggers a coordinated agent movement + message bubble + activity feed entry.
 */
export function dispatchSimulationScenario(
  agents: Agent[],
  activityEvents: ActivityEvent[],
  scenario: SimulationScenarioTemplate,
  nowMs: number
): {
  agents: Agent[];
  activityEvents: ActivityEvent[];
  packet: ActiveMessagePacket | null;
} {
  const sender = agents.find((a) => a.id === scenario.senderAgentId);
  if (!sender) {
    return { agents, activityEvents, packet: null };
  }

  const recipient = scenario.recipientAgentId
    ? agents.find((a) => a.id === scenario.recipientAgentId)
    : undefined;

  const targetCoords = clampToIslandBounds(scenario.destinationCoords);
  const route = buildIslandRoute(
    sender.islandCoords,
    targetCoords,
    sender.departmentId,
    scenario.departmentId
  );

  const updatedAgents = agents.map((agent) => {
    if (agent.id === sender.id) {
      // Place speech bubble below or to the side for south-zone agents so it never covers the GROWTH banner
      const smartBubbleOffset =
        targetCoords.y > 510
          ? { dx: -88, dy: 8 }
          : targetCoords.x < 400
          ? { dx: -72, dy: -46 }
          : targetCoords.x > 580
          ? { dx: 72, dy: -46 }
          : { dx: 0, dy: -46 };

      return {
        ...agent,
        status: 'working' as const,
        animationState: (route.length > 0 ? 'walking' : 'communicating') as Agent['animationState'],
        destinationCoords: targetCoords,
        destinationLabel: scenario.destinationLabel,
        waypoints: route,
        sampleBubbleText: scenario.bubbleText,
        bubbleOffset: smartBubbleOffset,
        bubbleExpiresAt: nowMs + 3900,
      };
    }

    if (recipient && agent.id === recipient.id) {
      return {
        ...agent,
        animationState: 'communicating' as const,
        sampleBubbleText: undefined,
        bubbleExpiresAt: undefined,
      };
    }

    return {
      ...agent,
      sampleBubbleText: undefined,
      bubbleExpiresAt: undefined,
    };
  });

  const newEvent: ActivityEvent = {
    id: `evt-sim-${nowMs}-${scenario.id}`,
    fromAgentName: scenario.senderAgentName,
    toAgentName: scenario.recipientAgentName,
    fromAgentId: scenario.senderAgentId,
    toAgentId: scenario.recipientAgentId,
    departmentId: scenario.departmentId,
    destinationLabel: scenario.destinationLabel,
    message: scenario.message,
    timestampLabel: 'Sample · Just now',
    createdAt: nowMs,
    status: 'travelling',
    eventType: scenario.eventType,
    isSampleData: true,
  };

  const packet: ActiveMessagePacket = {
    id: `pkt-${nowMs}-${scenario.id}`,
    eventId: newEvent.id,
    fromAgentId: sender.id,
    toAgentId: recipient?.id ?? sender.id,
    fromCoords: sender.islandCoords,
    toCoords: recipient?.islandCoords ?? targetCoords,
    progress: 0,
    label: `${scenario.senderAgentName} → ${scenario.recipientAgentName}`,
  };

  const filteredExisting = activityEvents.filter(
    (evt, index) =>
      !(
        index === 0 &&
        evt.fromAgentId === newEvent.fromAgentId &&
        evt.message === newEvent.message
      )
  );

  return {
    agents: updatedAgents,
    activityEvents: [newEvent, ...filteredExisting].slice(0, 12),
    packet,
  };
}

export function calculateGoalProgressPercentage(goal: Goal): number {
  if (goal.targetValue <= 0) return 0;
  const raw = Math.round((goal.currentValue / goal.targetValue) * 100);
  return Math.max(0, Math.min(100, raw));
}

export function clampZoom(
  scale: number,
  min: number = MIN_ZOOM,
  max: number = MAX_ZOOM
): number {
  const clamped = Math.max(min, Math.min(max, scale));
  return Math.round(clamped * 100) / 100;
}

export function stepZoom(
  currentScale: number,
  direction: 'in' | 'out'
): number {
  const delta = direction === 'in' ? ZOOM_STEP : -ZOOM_STEP;
  return clampZoom(currentScale + delta);
}

export function resetCanvasTransform(): CanvasTransform {
  return {
    scale: 1,
    x: 0,
    y: 0,
  };
}

export function panCanvasTransform(
  current: CanvasTransform,
  dx: number,
  dy: number,
  maxOffset: number = 380
): CanvasTransform {
  const nextX = Math.max(-maxOffset, Math.min(maxOffset, current.x + dx));
  const nextY = Math.max(-maxOffset, Math.min(maxOffset, current.y + dy));
  return {
    ...current,
    x: Math.round(nextX),
    y: Math.round(nextY),
  };
}

export function filterAgentsByDepartmentAndQuery(
  agents: Agent[],
  departmentFilter: DepartmentId | 'all',
  query: string
): Agent[] {
  const normalizedQuery = query.trim().toLowerCase();
  return agents.filter((agent) => {
    const matchesDepartment =
      departmentFilter === 'all' || agent.departmentId === departmentFilter;
    if (!matchesDepartment) return false;
    if (!normalizedQuery) return true;
    return (
      agent.name.toLowerCase().includes(normalizedQuery) ||
      agent.role.toLowerCase().includes(normalizedQuery) ||
      agent.specialty.toLowerCase().includes(normalizedQuery)
    );
  });
}

export function updateGoalMissionText(goal: Goal, newTitle: string): Goal {
  const trimmed = newTitle.trim();
  if (!trimmed) {
    return goal;
  }
  return {
    ...goal,
    title: trimmed,
  };
}

export function getNextChapterIndex(
  currentIndex: number,
  direction: 'next' | 'prev',
  totalChapters: number
): number {
  if (totalChapters <= 0) return 0;
  if (direction === 'next') {
    return (currentIndex + 1) % totalChapters;
  }
  return (currentIndex - 1 + totalChapters) % totalChapters;
}

export function assignSampleTaskToAgent(
  agents: Agent[],
  tasks: Task[],
  agentId: string,
  newTaskTitle: string
): { agents: Agent[]; tasks: Task[] } {
  const cleanTitle = newTaskTitle.trim();
  if (!cleanTitle) {
    return { agents, tasks };
  }

  const targetAgent = agents.find((a) => a.id === agentId);
  if (!targetAgent) {
    return { agents, tasks };
  }

  const updatedTasks = tasks.map((task) => {
    if (task.id === targetAgent.currentTaskId) {
      return {
        ...task,
        title: cleanTitle,
        status: 'in_progress' as const,
        progressPercent: 35,
      };
    }
    return task;
  });

  const updatedAgents = agents.map((agent) => {
    if (agent.id === agentId) {
      return {
        ...agent,
        status: 'working' as const,
        animationState: 'communicating' as const,
        progressPercent: 35,
        sampleBubbleText: `Sample task updated: ${cleanTitle}`,
        bubbleOffset: agent.bubbleOffset ?? { dx: 0, dy: -44 },
        bubbleExpiresAt: Date.now() + 6500,
      };
    }
    return agent;
  });

  return {
    agents: updatedAgents,
    tasks: updatedTasks,
  };
}

/**
 * Dismisses an active speech bubble on an agent without affecting the activity feed.
 */
export function dismissAgentBubble(agents: Agent[], agentId: string): Agent[] {
  return agents.map((agent) => {
    if (agent.id !== agentId) return agent;
    return {
      ...agent,
      sampleBubbleText: undefined,
      bubbleExpiresAt: undefined,
    };
  });
}

const FIXED_LANDMARK_BANNERS: Array<{
  x: number;
  y: number;
  halfW: number;
  halfH: number;
}> = [
  { x: 382, y: 216, halfW: 52, halfH: 20 }, // The Port
  { x: 498, y: 312, halfW: 58, halfH: 22 }, // Town Hall
  { x: 375, y: 405, halfW: 92, halfH: 24 }, // SALES & COMMUNITY
  { x: 605, y: 405, halfW: 84, halfH: 24 }, // CONTENT STUDIO
  { x: 495, y: 495, halfW: 62, halfH: 24 }, // GROWTH
];

/**
 * Computes a safe world coordinate for an agent's speech bubble so it stays
 * near the sender while avoiding UI cards and department banners.
 */
export function computeSafeBubblePosition(agent: Agent): IslandPoint {
  const offsetX = agent.bubbleOffset?.dx ?? 0;
  const offsetY = agent.bubbleOffset?.dy ?? -48;

  let x = Math.max(248, Math.min(856, agent.islandCoords.x + offsetX));
  let y = Math.max(124, Math.min(560, agent.islandCoords.y + offsetY));

  for (const banner of FIXED_LANDMARK_BANNERS) {
    const dx = x - banner.x;
    const dy = y - banner.y;
    const minX = banner.halfW + 76;
    const minY = banner.halfH + 26;
    if (Math.abs(dx) < minX && Math.abs(dy) < minY) {
      if (dy < 0) {
        y = banner.y - minY;
      } else {
        y = banner.y + minY;
      }
    }
  }

  return {
    x: Math.round(Math.max(248, Math.min(856, x))),
    y: Math.round(Math.max(124, Math.min(560, y))),
  };
}

export interface AgentLabelOffset {
  dx: number;
  dy: number;
  showLeaderLine: boolean;
}

/**
 * Computes collision-aware label offsets when agents are close to each other
 * or close to major department/landmark banners so every label remains legible.
 */
export function resolveAgentLabelOffsets(
  agents: Agent[]
): Record<string, AgentLabelOffset> {
  const offsets: Record<string, AgentLabelOffset> = {};
  for (const agent of agents) {
    offsets[agent.id] = { dx: 0, dy: 0, showLeaderLine: false };
  }

  const LABEL_ANCHOR_Y_OFFSET = -16;

  for (let pass = 0; pass < 3; pass++) {
    // 1. Repel agent labels from fixed department & landmark banners
    for (const agent of agents) {
      const off = offsets[agent.id];
      const labelX = agent.islandCoords.x + off.dx;
      const labelY = agent.islandCoords.y + LABEL_ANCHOR_Y_OFFSET + off.dy;

      for (const banner of FIXED_LANDMARK_BANNERS) {
        const dx = labelX - banner.x;
        const dy = labelY - banner.y;
        const minX = banner.halfW + 34;
        const minY = banner.halfH + 18;

        if (Math.abs(dx) < minX && Math.abs(dy) < minY) {
          const pushY = dy < 0 ? -(minY - Math.abs(dy)) : minY - Math.abs(dy);
          const pushX = dx < 0 ? -8 : 8;
          off.dy = Math.max(-28, Math.min(28, off.dy + pushY * 0.65));
          off.dx = Math.max(-38, Math.min(38, off.dx + pushX));
        }
      }
    }

    // 2. Repel nearby agent labels from each other
    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const a = agents[i];
        const b = agents[j];
        const offA = offsets[a.id];
        const offB = offsets[b.id];

        const ax = a.islandCoords.x + offA.dx;
        const ay = a.islandCoords.y + LABEL_ANCHOR_Y_OFFSET + offA.dy;
        const bx = b.islandCoords.x + offB.dx;
        const by = b.islandCoords.y + LABEL_ANCHOR_Y_OFFSET + offB.dy;

        const dx = bx - ax;
        const dy = by - ay;
        const minX = 64;
        const minY = 32;

        if (Math.abs(dx) < minX && Math.abs(dy) < minY) {
          const overlapX = (minX - Math.abs(dx)) * 0.35;
          const overlapY = (minY - Math.abs(dy)) * 0.45;
          const signX = dx >= 0 ? 1 : -1;
          const signY = dy >= 0 ? 1 : -1;

          offA.dx = Math.round(
            Math.max(-38, Math.min(38, offA.dx - signX * Math.max(6, overlapX)))
          );
          offA.dy = Math.round(
            Math.max(-28, Math.min(28, offA.dy - signY * Math.max(5, overlapY)))
          );
          offB.dx = Math.round(
            Math.max(-38, Math.min(38, offB.dx + signX * Math.max(6, overlapX)))
          );
          offB.dy = Math.round(
            Math.max(-28, Math.min(28, offB.dy + signY * Math.max(5, overlapY)))
          );
        }
      }
    }
  }

  for (const agent of agents) {
    const off = offsets[agent.id];
    off.dx = Math.round(off.dx);
    off.dy = Math.round(off.dy);
    off.showLeaderLine = Math.hypot(off.dx, off.dy) >= 10;
  }

  return offsets;
}

