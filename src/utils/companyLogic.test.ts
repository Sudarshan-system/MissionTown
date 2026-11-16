import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assignSampleTaskToAgent,
  buildIslandRoute,
  calculateGoalProgressPercentage,
  clampToIslandBounds,
  clampZoom,
  dispatchSimulationScenario,
  filterAgentsByDepartmentAndQuery,
  getNextChapterIndex,
  ISLAND_CENTER,
  MAX_ZOOM,
  MIN_ZOOM,
  panCanvasTransform,
  resetCanvasTransform,
  resolveAgentLabelOffsets,
  stepAgentPosition,
  stepZoom,
  updateGoalMissionText,
} from './companyLogic';
import { DEMO_COMPANY_REPOSITORY } from '../data/demoCompanyData';

test('calculateGoalProgressPercentage computes clamped percentage accurately', () => {
  const goal = DEMO_COMPANY_REPOSITORY.initialGoal;
  assert.equal(calculateGoalProgressPercentage(goal), 40);
  assert.equal(
    calculateGoalProgressPercentage({ ...goal, currentValue: 15, targetValue: 10 }),
    100
  );
  assert.equal(
    calculateGoalProgressPercentage({ ...goal, currentValue: 0, targetValue: 0 }),
    0
  );
});

test('stepZoom and clampZoom enforce bounds and step cleanly', () => {
  assert.equal(stepZoom(1, 'in'), 1.2);
  assert.equal(stepZoom(1, 'out'), 0.8);
  assert.equal(clampZoom(5), MAX_ZOOM);
  assert.equal(clampZoom(0.1), MIN_ZOOM);
});

test('panCanvasTransform and resetCanvasTransform manage island viewport coordinates', () => {
  const initial = resetCanvasTransform();
  assert.deepEqual(initial, { scale: 1, x: 0, y: 0 });

  const panned = panCanvasTransform(initial, 120, -85);
  assert.equal(panned.x, 120);
  assert.equal(panned.y, -85);

  const clampedPan = panCanvasTransform(initial, 999, -999, 380);
  assert.equal(clampedPan.x, 380);
  assert.equal(clampedPan.y, -380);
});

test('filterAgentsByDepartmentAndQuery filters by department and search term', () => {
  const allAgents = DEMO_COMPANY_REPOSITORY.agents;
  const contentStudioAgents = filterAgentsByDepartmentAndQuery(
    allAgents,
    'content-studio',
    ''
  );
  assert.equal(contentStudioAgents.length, 4);

  const pixelSearch = filterAgentsByDepartmentAndQuery(
    allAgents,
    'all',
    '9:16'
  );
  assert.ok(pixelSearch.some((a) => a.name === 'Pixel'));
});

test('updateGoalMissionText updates non-empty goal title and preserves existing on blank', () => {
  const initial = DEMO_COMPANY_REPOSITORY.initialGoal;
  const updated = updateGoalMissionText(
    initial,
    '  Scale clipping studio to 25 creators  '
  );
  assert.equal(updated.title, 'Scale clipping studio to 25 creators');

  const unchanged = updateGoalMissionText(updated, '   ');
  assert.equal(unchanged.title, 'Scale clipping studio to 25 creators');
});

test('getNextChapterIndex wraps around 9 chapters in both directions', () => {
  assert.equal(getNextChapterIndex(0, 'next', 9), 1);
  assert.equal(getNextChapterIndex(8, 'next', 9), 0);
  assert.equal(getNextChapterIndex(0, 'prev', 9), 8);
});

test('assignSampleTaskToAgent updates agent task title and status', () => {
  const result = assignSampleTaskToAgent(
    DEMO_COMPANY_REPOSITORY.agents,
    DEMO_COMPANY_REPOSITORY.tasks,
    'agent-pixel',
    'Cut 5 vertical shorts from Episode #50'
  );
  const updatedTask = result.tasks.find((t) => t.id === 'task-pixel-1');
  assert.equal(updatedTask?.title, 'Cut 5 vertical shorts from Episode #50');
});

test('clampToIslandBounds keeps off-island coordinates inside the island ellipse', () => {
  const inside = clampToIslandBounds({ x: 500, y: 172 });
  assert.deepEqual(inside, { x: 500, y: 172 });

  const outside = clampToIslandBounds({ x: 950, y: 50 });
  const dx = outside.x - 500;
  const dy = outside.y - 390;
  const norm = (dx * dx) / (238 * 238) + (dy * dy) / (222 * 222);
  assert.ok(norm <= 1.01, `Expected normalized radius <= 1.01, got ${norm}`);
});

test('buildIslandRoute routes cross-department travel through central Town Hall plaza', () => {
  const route = buildIslandRoute(
    { x: 500, y: 186 }, // The Boss HQ
    { x: 648, y: 458 }, // Content Studio (Ivy)
    'the-boss',
    'content-studio'
  );
  assert.ok(route.length >= 2);
  assert.ok(
    route.some(
      (pt) => pt.x === ISLAND_CENTER.x && pt.y === ISLAND_CENTER.y
    ),
    'Cross-department route should pass through Town Hall central hub'
  );
});

test('stepAgentPosition advances walking agents, pauses inspected agent, and stops at destination', () => {
  const boss = DEMO_COMPANY_REPOSITORY.agents.find(
    (a) => a.id === 'agent-boss'
  )!;
  const walkingBoss = {
    ...boss,
    islandCoords: { x: 500, y: 200 },
    waypoints: [{ x: 500, y: 268 }],
    speedPxPerSec: 68,
    animationState: 'walking' as const,
  };

  // When paused (selected in drawer), position does not change
  const pausedStep = stepAgentPosition(walkingBoss, 0.5, 'agent-boss');
  assert.deepEqual(pausedStep.islandCoords, { x: 500, y: 200 });

  // When unpaused, moves halfway in 0.5s
  const halfStep = stepAgentPosition(walkingBoss, 0.5, null);
  assert.equal(halfStep.islandCoords.y, 234);
  assert.equal(halfStep.animationState, 'walking');

  // Reaches destination in another 0.5s and stops walking
  const arrivedStep = stepAgentPosition(halfStep, 0.5, null);
  assert.deepEqual(arrivedStep.islandCoords, { x: 500, y: 268 });
  assert.equal(arrivedStep.waypoints?.length, 0);
  assert.notEqual(arrivedStep.animationState, 'walking');
});

test('dispatchSimulationScenario creates connected agent route, bubble, packet, and activity event', () => {
  const scenario = DEMO_COMPANY_REPOSITORY.simulationScenarios[0]; // Courier -> Echo
  const nowMs = 1710000000000;
  const dispatched = dispatchSimulationScenario(
    DEMO_COMPANY_REPOSITORY.agents,
    DEMO_COMPANY_REPOSITORY.activityEvents,
    scenario,
    nowMs
  );

  const courier = dispatched.agents.find((a) => a.id === 'agent-courier')!;
  assert.equal(courier.animationState, 'walking');
  assert.ok((courier.waypoints?.length ?? 0) > 0);
  assert.equal(courier.sampleBubbleText, scenario.bubbleText);

  assert.equal(dispatched.activityEvents[0].fromAgentName, 'Courier');
  assert.equal(dispatched.activityEvents[0].toAgentName, 'Echo');
  assert.equal(dispatched.activityEvents[0].message, scenario.message);
  assert.ok(dispatched.packet);
});

test('DEMO_COMPANY_REPOSITORY has 9 chapters and explicit sample flags', () => {
  assert.equal(DEMO_COMPANY_REPOSITORY.chapters.length, 9);
  assert.equal(DEMO_COMPANY_REPOSITORY.initialGoal.isSampleData, true);
  assert.ok(DEMO_COMPANY_REPOSITORY.simulationScenarios.length >= 4);
  assert.ok(
    DEMO_COMPANY_REPOSITORY.executionJobs.every(
      (job) => job.isSampleData && job.executionMode === 'simulated_preview'
    )
  );
});

test('resolveAgentLabelOffsets separates overlapping nearby agent labels and sets showLeaderLine', () => {
  const [a1, a2] = DEMO_COMPANY_REPOSITORY.agents;
  const closeAgents = [
    { ...a1, islandCoords: { x: 500, y: 400 } },
    { ...a2, islandCoords: { x: 506, y: 402 } },
  ];
  const offsets = resolveAgentLabelOffsets(closeAgents);
  assert.notEqual(offsets[a1.id].dy, offsets[a2.id].dy);
  assert.notEqual(offsets[a1.id].dx, offsets[a2.id].dx);
  assert.ok(
    offsets[a1.id].showLeaderLine || offsets[a2.id].showLeaderLine,
    'Displaced labels should enable showLeaderLine'
  );
});

