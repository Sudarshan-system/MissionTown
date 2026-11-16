import React, { useState } from 'react';
import { X } from 'lucide-react';
import {
  ActiveMessagePacket,
  Agent,
  CanvasTransform,
  Department,
} from '../types/mission';
import {
  computeSafeBubblePosition,
  resolveAgentLabelOffsets,
} from '../utils/companyLogic';
import { IslandScenery } from './IslandScenery';

interface IsometricIslandProps {
  agents: Agent[];
  departments: Department[];
  selectedAgentId: string | null;
  activeDepartmentFilter: string;
  transform: CanvasTransform;
  isDragging: boolean;
  activePackets?: ActiveMessagePacket[];
  onSelectAgent: (agent: Agent) => void;
  onSelectDepartment: (departmentId: Department['id']) => void;
  onDismissBubble?: (agentId: string) => void;
}

const BADGE_STYLES: Record<
  Agent['badgeColor'],
  {
    bg: string;
    border: string;
    text: string;
    avatarShirt: string;
    avatarAccent: string;
    hairColor: string;
  }
> = {
  green: {
    bg: 'bg-[#2BB656] hover:bg-[#32ca61]',
    border: 'border-[#124E24]',
    text: 'text-white',
    avatarShirt: '#22C55E',
    avatarAccent: '#DCFCE7',
    hairColor: '#1E293B',
  },
  blue: {
    bg: 'bg-[#4C6EF5] hover:bg-[#5c7cfa]',
    border: 'border-[#1E2E78]',
    text: 'text-white',
    avatarShirt: '#3B82F6',
    avatarAccent: '#DBEAFE',
    hairColor: '#78350F',
  },
  purple: {
    bg: 'bg-[#7E3AF2] hover:bg-[#9052f5]',
    border: 'border-[#39147A]',
    text: 'text-white',
    avatarShirt: '#8B5CF6',
    avatarAccent: '#EDE9FE',
    hairColor: '#311042',
  },
  orange: {
    bg: 'bg-[#F59E0B] hover:bg-[#f7ab28]',
    border: 'border-[#78350F]',
    text: 'text-white',
    avatarShirt: '#F59E0B',
    avatarAccent: '#FEF3C7',
    hairColor: '#451A03',
  },
  teal: {
    bg: 'bg-[#4B5563] hover:bg-[#626d7d]',
    border: 'border-[#1F2937]',
    text: 'text-white',
    avatarShirt: '#14B8A6',
    avatarAccent: '#CCFBF1',
    hairColor: '#0F172A',
  },
  rose: {
    bg: 'bg-[#E11D48] hover:bg-[#f43f5e]',
    border: 'border-[#881337]',
    text: 'text-white',
    avatarShirt: '#F43F5E',
    avatarAccent: '#FFE4E6',
    hairColor: '#4C0519',
  },
};

const renderDepartmentIcon = (deptId: Department['id']) => {
  if (deptId === 'sales-community') {
    return (
      <svg
        width="13"
        height="13"
        viewBox="0 0 16 16"
        className="inline-block mr-1.5 -mt-0.5 shrink-0"
        aria-hidden="true"
      >
        <polygon points="2,10 6,4 12,12" fill="#FDE047" />
        <circle cx="11" cy="5" r="2" fill="#34D399" />
        <circle cx="6" cy="13" r="1.5" fill="#F43F5E" />
      </svg>
    );
  }
  if (deptId === 'content-studio') {
    return (
      <svg
        width="13"
        height="13"
        viewBox="0 0 16 16"
        className="inline-block mr-1.5 -mt-0.5 shrink-0"
        aria-hidden="true"
      >
        <rect x="2" y="6" width="12" height="8" rx="1.5" fill="#E2E8F0" />
        <polygon points="2,6 14,3 14,6" fill="#FDE047" />
        <rect x="4" y="8" width="8" height="4" rx="0.8" fill="#1E293B" />
      </svg>
    );
  }
  if (deptId === 'growth') {
    return (
      <svg
        width="13"
        height="13"
        viewBox="0 0 16 16"
        className="inline-block mr-1.5 -mt-0.5 shrink-0"
        aria-hidden="true"
      >
        <polygon points="2,13 8,3 14,13" fill="#FEF08A" />
        <polygon points="5,13 8,4 11,13" fill="#EF4444" />
      </svg>
    );
  }
  return null;
};

export const IsometricIsland: React.FC<IsometricIslandProps> = ({
  agents,
  departments,
  selectedAgentId,
  activeDepartmentFilter,
  transform,
  isDragging,
  activePackets = [],
  onSelectAgent,
  onSelectDepartment,
  onDismissBubble,
}) => {
  const [hoveredAgentId, setHoveredAgentId] = useState<string | null>(null);
  const labelOffsets = resolveAgentLabelOffsets(agents);
  const isZoomedOut = transform.scale <= 0.85;
  const isZoomedIn = transform.scale >= 1.2;

  return (
    <div
      style={{
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
        transition: isDragging
          ? 'none'
          : 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className="relative w-[1000px] h-[700px] select-none origin-center"
    >
      {/* LAYERS 1–5: Pure Layered Isometric Scenery (Shoreline, Roads, Plaza, 3D Buildings, Trees & Packets) */}
      <IslandScenery activePackets={activePackets} />

      {/* SVG Overlay for Collision-Avoided Label Leader Lines & Speech Bubble Tethers */}
      <svg
        viewBox="0 0 1000 700"
        className="absolute inset-0 w-full h-full pointer-events-none z-22 overflow-visible"
        aria-hidden="true"
      >
        {agents.map((agent) => {
          const nudge = labelOffsets[agent.id] ?? {
            dx: 0,
            dy: 0,
            showLeaderLine: false,
          };
          const isHighlighted =
            selectedAgentId === agent.id || hoveredAgentId === agent.id;
          if (!nudge.showLeaderLine && !isHighlighted) return null;

          const startX = agent.islandCoords.x;
          const startY = agent.islandCoords.y + 4;
          const endX = agent.islandCoords.x + nudge.dx;
          const endY = agent.islandCoords.y - 14 + nudge.dy;

          if (Math.hypot(endX - startX, endY - startY) < 6) return null;

          return (
            <g key={`leader-${agent.id}`}>
              <line
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke={isHighlighted ? '#FDE047' : '#0F172A'}
                strokeWidth={isHighlighted ? '2' : '1.4'}
                strokeDasharray={isHighlighted ? undefined : '2.5 2.5'}
                opacity={isHighlighted ? '0.95' : '0.65'}
              />
              <circle
                cx={startX}
                cy={startY}
                r="2.2"
                fill={isHighlighted ? '#FDE047' : '#0F172A'}
              />
            </g>
          );
        })}

        {agents
          .filter((agent) => Boolean(agent.sampleBubbleText))
          .map((agent) => {
            const bubblePos = computeSafeBubblePosition(agent);
            return (
              <line
                key={`bubble-tether-${agent.id}`}
                x1={agent.islandCoords.x}
                y1={agent.islandCoords.y - 8}
                x2={bubblePos.x}
                y2={bubblePos.y}
                stroke="#1E293B"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                opacity="0.55"
              />
            );
          })}
      </svg>

      {/* Static Landmark Labels ("The Port" & "Town Hall") */}
      <div
        style={{ left: '382px', top: '216px' }}
        className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
      >
        <div className="px-3 py-1 rounded-full bg-[#4C6EF5] border-2 border-[#1E2E78] text-white text-xs font-extrabold shadow-[0_3px_0_rgba(0,0,0,0.38)] whitespace-nowrap">
          The Port
        </div>
      </div>

      <div
        style={{ left: '498px', top: '312px' }}
        className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
      >
        <div className="px-3.5 py-1 rounded-full bg-[#C93B2B] border-2 border-[#5C1912] text-white text-xs font-extrabold shadow-[0_3px_0_rgba(0,0,0,0.38)] whitespace-nowrap">
          Town Hall
        </div>
      </div>

      {/* Prominent Interactive Department Zone Banners (SALES & COMMUNITY, CONTENT STUDIO, GROWTH) */}
      {departments
        .filter((dept) => dept.id !== 'the-boss')
        .map((dept) => {
          const isFiltered = activeDepartmentFilter === dept.id;
          return (
            <button
              key={dept.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectDepartment(dept.id);
              }}
              style={{
                left: `${dept.islandPosition.x}px`,
                top: `${dept.islandPosition.y}px`,
                backgroundColor: dept.badgeBg,
                borderColor: dept.badgeBorder,
              }}
              aria-label={`Filter by ${dept.name} department`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-25 px-4 py-1.5 rounded-full border-[2.5px] text-white text-xs sm:text-[13px] font-black tracking-wider shadow-[0_5px_0_rgba(0,0,0,0.42)] transition-transform hover:scale-105 cursor-pointer whitespace-nowrap flex items-center ${
                isFiltered ? 'ring-4 ring-[#E5C158]' : ''
              }`}
            >
              {renderDepartmentIcon(dept.id)}
              <span>{dept.shortLabel}</span>
            </button>
          );
        })}

      {/* LAYER 8: Interactive Speech Bubble Callouts Attached to Moving Agents */}
      {agents
        .filter((agent) => Boolean(agent.sampleBubbleText))
        .map((agent) => {
          const bubblePos = computeSafeBubblePosition(agent);
          const isSelected = selectedAgentId === agent.id;

          return (
            <div
              key={`bubble-${agent.id}`}
              data-testid={`agent-bubble-${agent.id}`}
              style={{
                left: `${bubblePos.x}px`,
                top: `${bubblePos.y}px`,
                transition: 'left 140ms linear, top 140ms linear',
              }}
              className={`hidden sm:flex animate-bubble-pop group absolute -translate-x-1/2 -translate-y-1/2 z-40 w-[178px] items-start justify-between gap-1.5 text-left px-2.5 py-2 rounded-xl bg-[#FAF8F5]/96 hover:bg-white text-[#141619] border-2 ${
                isSelected
                  ? 'border-[#E5C158] ring-2 ring-[#E5C158]'
                  : 'border-[#1E293B]'
              } shadow-[0_4px_0_rgba(15,23,42,0.45)]`}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectAgent(agent);
                }}
                aria-label={`Sample activity from ${agent.name}: ${agent.sampleBubbleText}`}
                className="flex-1 text-left cursor-pointer"
              >
                <p className="text-[10.5px] leading-snug font-semibold text-[#1E293B] break-words">
                  {agent.sampleBubbleText}
                </p>
              </button>
              {onDismissBubble && (
                <button
                  type="button"
                  data-testid={`dismiss-bubble-${agent.id}`}
                  aria-label={`Dismiss message bubble from ${agent.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismissBubble(agent.id);
                  }}
                  className="p-0.5 -mr-1 -mt-0.5 rounded hover:bg-black/10 text-[#1E293B]/60 hover:text-[#1E293B] transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

      {/* LAYERS 6 & 7: Interactive Moving Agent Characters, Collision-Avoided Labels & Progress Bars */}
      {agents.map((agent) => {
        const style = BADGE_STYLES[agent.badgeColor];
        const isSelected = selectedAgentId === agent.id;
        const isHovered = hoveredAgentId === agent.id;
        const isHighlighted = isSelected || isHovered;
        const isWalking = agent.animationState === 'walking';
        const isCommunicating = agent.animationState === 'communicating';
        const isBoss = agent.id === 'agent-boss';
        const isDimmed =
          activeDepartmentFilter !== 'all' &&
          activeDepartmentFilter !== agent.departmentId &&
          !isHighlighted;
        const nudge = labelOffsets[agent.id] ?? {
          dx: 0,
          dy: 0,
          showLeaderLine: false,
        };
        const showProgressBar =
          !isZoomedOut ||
          isHighlighted ||
          isWalking ||
          isBoss ||
          agent.status === 'working';

        return (
          <div
            key={agent.id}
            data-testid={`island-agent-${agent.id}`}
            data-agent-name={agent.name}
            data-x={agent.islandCoords.x}
            data-y={agent.islandCoords.y}
            data-animation-state={agent.animationState ?? 'working'}
            onMouseEnter={() => setHoveredAgentId(agent.id)}
            onMouseLeave={() =>
              setHoveredAgentId((prev) => (prev === agent.id ? null : prev))
            }
            style={{
              left: `${agent.islandCoords.x}px`,
              top: `${agent.islandCoords.y}px`,
              transition: 'left 140ms linear, top 140ms linear',
            }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 ${
              isHighlighted ? 'z-45' : 'z-30'
            } flex flex-col items-center transition-opacity ${
              isDimmed ? 'opacity-40' : 'opacity-100'
            }`}
          >
            <div
              className={`flex flex-col items-center ${
                isWalking ? 'animate-agent-walk' : ''
              }`}
            >
              {/* Staggered Label + Progress Bar Group (Collision-Avoided) */}
              <div
                style={{
                  transform: `translate3d(${nudge.dx}px, ${nudge.dy}px, 0)`,
                  transition: 'transform 160ms ease-out',
                }}
                className="flex flex-col items-center"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAgent(agent);
                  }}
                  aria-label={`Inspect agent ${agent.name}, ${agent.role}`}
                  aria-pressed={isSelected}
                  className={`${
                    isBoss ? 'px-3 py-0.5 text-xs' : 'px-2.5 py-0.5 text-[11px]'
                  } rounded-full border-2 ${style.bg} ${style.border} ${
                    style.text
                  } font-extrabold tracking-tight shadow-[0_3px_0_rgba(0,0,0,0.38)] transition-transform hover:scale-110 cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    isSelected
                      ? 'ring-4 ring-[#E5C158] scale-110'
                      : isHovered
                      ? 'ring-2 ring-white scale-105'
                      : isCommunicating
                      ? 'ring-2 ring-[#FEF08A]'
                      : ''
                  }`}
                >
                  {isWalking && (
                    <span
                      aria-hidden="true"
                      className="w-1.5 h-1.5 rounded-full bg-[#FEF08A] animate-pulse shrink-0"
                    />
                  )}
                  <span>{agent.name}</span>
                </button>

                {/* Zoomed-in or Hovered Role Tag */}
                {(isZoomedIn || isHighlighted) && (
                  <span className="mt-0.5 px-1.5 py-[1px] rounded bg-[#0F172A]/90 text-[#F5F2EB] text-[9px] font-semibold tracking-tight whitespace-nowrap pointer-events-none border border-white/15">
                    {agent.role}
                  </span>
                )}

                {/* Progress Indicator Attached to Agent */}
                {showProgressBar && (
                  <div
                    aria-hidden="true"
                    className="mt-0.5 w-12 h-1.5 rounded-full bg-[#1E293B]/92 border border-black/65 p-[1px] overflow-hidden shadow-sm"
                  >
                    <div
                      style={{ width: `${agent.progressPercent}%` }}
                      className="h-full rounded-full bg-[#4ADE80] transition-all duration-300"
                    />
                  </div>
                )}
              </div>

              {/* Layer 6: Detailed Miniature Isometric Agent Character Anchored to World Coordinates */}
              <div
                aria-hidden="true"
                className="mt-0.5 flex flex-col items-center pointer-events-none"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  className="overflow-visible"
                >
                  {/* Ground Shadow */}
                  <ellipse
                    cx="10"
                    cy="17.2"
                    rx="5.8"
                    ry="2.3"
                    fill="#1B4310"
                    opacity="0.7"
                    className={isWalking ? 'animate-agent-shadow' : ''}
                  />
                  {/* Active Communication / Selection Ground Ring */}
                  {(isHighlighted || isCommunicating) && (
                    <ellipse
                      cx="10"
                      cy="17.2"
                      rx="7.5"
                      ry="3"
                      fill="none"
                      stroke="#FDE047"
                      strokeWidth="1.3"
                    />
                  )}
                  {/* Legs / Boots */}
                  <rect
                    x="7.2"
                    y="13.2"
                    width="2.2"
                    height="3.8"
                    rx="0.9"
                    fill="#1E293B"
                  />
                  <rect
                    x="10.6"
                    y="13.2"
                    width="2.2"
                    height="3.8"
                    rx="0.9"
                    fill="#0F172A"
                  />
                  {/* Torso / Jacket */}
                  <rect
                    x="5.8"
                    y="7.2"
                    width="8.4"
                    height="6.8"
                    rx="2.4"
                    fill={style.avatarShirt}
                    stroke="#0F172A"
                    strokeWidth="1.1"
                  />
                  {/* Collar / Tie Accent */}
                  <polygon
                    points="8.6,7.5 11.4,7.5 10,10.2"
                    fill={isBoss ? '#FACC15' : style.avatarAccent}
                  />
                  {/* Arms */}
                  <rect
                    x="4.5"
                    y="8"
                    width="1.8"
                    height="4.5"
                    rx="0.9"
                    fill={style.avatarShirt}
                    stroke="#0F172A"
                    strokeWidth="0.8"
                  />
                  <rect
                    x="13.7"
                    y="8"
                    width="1.8"
                    height="4.5"
                    rx="0.9"
                    fill={style.avatarShirt}
                    stroke="#0F172A"
                    strokeWidth="0.8"
                  />
                  {/* Head */}
                  <circle
                    cx="10"
                    cy="4.6"
                    r="3.4"
                    fill="#FDE68A"
                    stroke="#0F172A"
                    strokeWidth="1.1"
                  />
                  {/* Hair / Executive Crown Cap */}
                  {isBoss ? (
                    <polygon
                      points="6.5,3.2 8.2,1 10,2.5 11.8,1 13.5,3.2"
                      fill="#FACC15"
                      stroke="#78350F"
                      strokeWidth="0.8"
                    />
                  ) : (
                    <path
                      d="M 6.8 4.2 Q 10 1.2 13.2 4.2 Q 11.5 2.8 8.5 2.8 Z"
                      fill={style.hairColor}
                    />
                  )}
                </svg>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

