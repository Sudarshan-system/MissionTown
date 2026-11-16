import React from 'react';
import { ActiveMessagePacket } from '../types/mission';

interface IslandSceneryProps {
  activePackets?: ActiveMessagePacket[];
}

/**
 * Pure layered isometric SVG environment (1000x700 coordinate space)
 * cleanly separated from agent simulation state:
 * Layer 1: Sky clouds, underwater shadow, multi-ring shoreline & 3D cliff rim
 * Layer 2: Varied turf patches, curved cream pathways & central fountain plaza
 * Layer 3: Detailed 3D isometric buildings & district courtyards
 * Layer 4: White picket fences, workbenches, media props, lamps & signboards
 * Layer 5: Multi-species trees, bushes, flower beds & active message packets
 */
export const IslandScenery: React.FC<IslandSceneryProps> = ({
  activePackets = [],
}) => {
  return (
    <svg
      viewBox="0 0 1000 700"
      className="w-full h-full overflow-visible pointer-events-none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="islandTurf" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#82E554" />
          <stop offset="55%" stopColor="#6FD640" />
          <stop offset="100%" stopColor="#58BE2B" />
        </linearGradient>
        <linearGradient id="islandCliff" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#56AF2F" />
          <stop offset="50%" stopColor="#3F8E21" />
          <stop offset="100%" stopColor="#2C6A15" />
        </linearGradient>
        <linearGradient id="roadPath" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F8F0DF" />
          <stop offset="100%" stopColor="#E4D2AE" />
        </linearGradient>
        <linearGradient id="plazaStone" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F5ECD8" />
          <stop offset="100%" stopColor="#DFCCA4" />
        </linearGradient>
        <radialGradient id="waterFountain" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="55%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </radialGradient>
      </defs>

      {/* =====================================================================
          LAYER 1: SKY CLOUDS, OCEAN SHADOW, SHORELINE RINGS & 3D CLIFF BASE
         ===================================================================== */}
      <g id="layer-1-sky-and-shoreline">
        {/* Volumetric Isometric Clouds in the Cyan Sky */}
        <g transform="translate(454, 152)">
          <ellipse cx="24" cy="20" rx="22" ry="13" fill="#D5CEBC" />
          <ellipse cx="20" cy="15" rx="19" ry="12" fill="#FFFDF8" />
          <circle cx="9" cy="15" r="9" fill="#FFFDF8" />
          <circle cx="29" cy="12" r="10" fill="#FFFDF8" />
        </g>
        <g transform="translate(172, 308)">
          <ellipse cx="24" cy="22" rx="24" ry="14" fill="#D5CEBC" />
          <ellipse cx="20" cy="16" rx="21" ry="13" fill="#FFFDF8" />
          <ellipse cx="56" cy="24" rx="24" ry="14" fill="#D5CEBC" />
          <ellipse cx="52" cy="18" rx="21" ry="13" fill="#FFFDF8" />
          <circle cx="36" cy="14" r="11" fill="#FFFDF8" />
        </g>
        <g transform="translate(752, 248)">
          <ellipse cx="28" cy="21" rx="24" ry="14" fill="#D5CEBC" />
          <ellipse cx="23" cy="15" rx="21" ry="13" fill="#FFFDF8" />
          <circle cx="12" cy="15" r="10" fill="#FFFDF8" />
          <circle cx="34" cy="13" r="11" fill="#FFFDF8" />
        </g>
        <g transform="translate(312, 260)">
          <ellipse cx="22" cy="18" rx="20" ry="12" fill="#D5CEBC" />
          <ellipse cx="18" cy="14" rx="18" ry="11" fill="#FFFDF8" />
        </g>

        {/* Subtle Deep-Water Drop Shadow Beneath the Island */}
        <ellipse
          cx="504"
          cy="446"
          rx="288"
          ry="206"
          fill="#0B5575"
          opacity="0.28"
        />

        {/* Multi-Layered Shoreline Foam & Shallow Turquoise Rings */}
        <ellipse
          cx="500"
          cy="436"
          rx="282"
          ry="202"
          fill="#FFFFFF"
          opacity="0.82"
        />
        <ellipse cx="500" cy="431" rx="275" ry="196" fill="#4AD0F2" />
        <ellipse
          cx="500"
          cy="426"
          rx="268"
          ry="191"
          fill="#FFFFFF"
          opacity="0.9"
        />
        <ellipse cx="500" cy="422" rx="262" ry="186" fill="#7CE8FC" />
        <ellipse
          cx="500"
          cy="418"
          rx="256"
          ry="182"
          fill="#FFFFFF"
          opacity="0.96"
        />

        {/* 3D Terraced Island Cliff Rim & Facet Shading */}
        <ellipse
          cx="500"
          cy="412"
          rx="248"
          ry="176"
          fill="url(#islandCliff)"
        />
        {/* Cliff Vertical Facet Highlights */}
        <path
          d="M 272 445 Q 360 565 500 584 Q 640 565 728 445 L 722 430 Q 635 548 500 566 Q 365 548 278 430 Z"
          fill="#357A1B"
          opacity="0.55"
        />

        {/* Main Isometric Green Island Surface */}
        <ellipse
          cx="500"
          cy="396"
          rx="246"
          ry="170"
          fill="url(#islandTurf)"
        />

        {/* Coastal Rocks & Shoreline Boulders */}
        <g fill="#94A3B8" stroke="#475569" strokeWidth="1">
          <ellipse cx="272" cy="442" rx="9" ry="5.5" fill="#CBD5E1" />
          <ellipse cx="282" cy="448" rx="6" ry="4" fill="#94A3B8" />
          <ellipse cx="722" cy="448" rx="10" ry="6" fill="#CBD5E1" />
          <ellipse cx="712" cy="455" rx="6.5" ry="4" fill="#94A3B8" />
          <ellipse cx="628" cy="548" rx="8" ry="4.5" fill="#CBD5E1" />
          <ellipse cx="368" cy="542" rx="7.5" ry="4.5" fill="#CBD5E1" />
        </g>
      </g>

      {/* =====================================================================
          LAYER 2: VARIED GRASS LANDSCAPING, COURTYARDS, PATHWAYS & CENTRAL PLAZA
         ===================================================================== */}
      <g id="layer-2-ground-and-pathways">
        {/* Varied Grass Tones & Landscaped District Meadows */}
        <ellipse
          cx="500"
          cy="390"
          rx="214"
          ry="146"
          fill="#88EB5B"
          opacity="0.42"
        />
        {/* North Executive Lawn Contour */}
        <ellipse
          cx="500"
          cy="252"
          rx="78"
          ry="38"
          fill="#5BBA2E"
          opacity="0.38"
        />
        {/* West Sales & Community Meadow Contour */}
        <ellipse
          cx="355"
          cy="444"
          rx="68"
          ry="44"
          fill="#5BBA2E"
          opacity="0.35"
        />
        {/* East Content Studio Meadow Contour */}
        <ellipse
          cx="645"
          cy="444"
          rx="70"
          ry="45"
          fill="#5BBA2E"
          opacity="0.35"
        />
        {/* South Growth Meadow Contour */}
        <ellipse
          cx="500"
          cy="538"
          rx="68"
          ry="38"
          fill="#5BBA2E"
          opacity="0.35"
        />

        {/* Paved District Courtyards Under Major Building Clusters */}
        {/* The Boss North Forecourt */}
        <ellipse
          cx="500"
          cy="264"
          rx="48"
          ry="20"
          fill="#E8D8B9"
          stroke="#CDB891"
          strokeWidth="2"
        />
        {/* West Sales & Community Courtyard Pad */}
        <ellipse
          cx="358"
          cy="448"
          rx="46"
          ry="26"
          fill="#E8D8B9"
          stroke="#CDB891"
          strokeWidth="1.5"
          opacity="0.85"
        />
        {/* East Content Studio Courtyard Pad */}
        <ellipse
          cx="644"
          cy="448"
          rx="48"
          ry="27"
          fill="#E8D8B9"
          stroke="#CDB891"
          strokeWidth="1.5"
          opacity="0.85"
        />
        {/* South Growth Courtyard Pad */}
        <ellipse
          cx="500"
          cy="542"
          rx="44"
          ry="22"
          fill="#E8D8B9"
          stroke="#CDB891"
          strokeWidth="1.5"
          opacity="0.85"
        />

        {/* Curved Cream-Colored Pathways Connecting Districts (Outer Curb + Inner Fill) */}
        <g stroke="#CDB78E" strokeLinecap="round" fill="none">
          {/* North Avenue: Plaza to The Boss HQ */}
          <path d="M 500 392 L 500 262" strokeWidth="30" />
          {/* Northwest Harbor Road: Plaza to The Port */}
          <path d="M 468 370 Q 435 332 398 286" strokeWidth="22" />
          {/* West Village Road: Plaza to Sales & Community */}
          <path d="M 452 398 Q 405 416 352 440" strokeWidth="26" />
          {/* East Studio Road: Plaza to Content Studio */}
          <path d="M 548 398 Q 595 416 648 440" strokeWidth="26" />
          {/* South Boulevard: Plaza to Growth */}
          <path d="M 500 428 L 500 542" strokeWidth="28" />
          {/* Secondary Garden Walkways */}
          <path d="M 442 302 Q 470 282 500 282 Q 530 282 558 302" strokeWidth="12" />
          <path d="M 366 462 Q 422 512 478 536" strokeWidth="11" strokeDasharray="3 5" />
          <path d="M 634 462 Q 578 512 522 536" strokeWidth="11" strokeDasharray="3 5" />
        </g>

        <g stroke="url(#roadPath)" strokeLinecap="round" fill="none">
          <path d="M 500 392 L 500 262" strokeWidth="24" />
          <path d="M 468 370 Q 435 332 398 286" strokeWidth="17" />
          <path d="M 452 398 Q 405 416 352 440" strokeWidth="21" />
          <path d="M 548 398 Q 595 416 648 440" strokeWidth="21" />
          <path d="M 500 428 L 500 542" strokeWidth="22" />
          <path d="M 442 302 Q 470 282 500 282 Q 530 282 558 302" strokeWidth="9" />
        </g>

        {/* Subtle Cobblestone Stepping Stones Along Main Roads */}
        <g fill="#D5C19A" opacity="0.65">
          {[
            [495, 310],
            [505, 322],
            [496, 338],
            [442, 344],
            [424, 322],
            [412, 416],
            [390, 425],
            [585, 416],
            [610, 426],
            [495, 466],
            [505, 484],
            [496, 504],
          ].map(([sx, sy], i) => (
            <ellipse key={i} cx={sx} cy={sy} rx="4" ry="2.2" />
          ))}
        </g>

        {/* Central Town Hall Plaza & Tiered Water Fountain */}
        <g id="central-plaza">
          {/* Outer Decorative Stone Rim */}
          <ellipse
            cx="500"
            cy="396"
            rx="66"
            ry="46"
            fill="url(#plazaStone)"
            stroke="#CBB58B"
            strokeWidth="3.5"
          />
          {/* Inner Cobblestone Ring */}
          <ellipse
            cx="500"
            cy="396"
            rx="52"
            ry="36"
            fill="none"
            stroke="#D8C59E"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          {/* Fountain Stone Coping Basin */}
          <ellipse
            cx="500"
            cy="397"
            rx="26"
            ry="18"
            fill="#CBD5E1"
            stroke="#64748B"
            strokeWidth="1.5"
          />
          <ellipse
            cx="500"
            cy="395"
            rx="23"
            ry="15.5"
            fill="url(#waterFountain)"
          />
          {/* Fountain Water Ripples & Center Pedestal */}
          <ellipse
            cx="500"
            cy="394"
            rx="15"
            ry="9.5"
            fill="none"
            stroke="#BFDBFE"
            strokeWidth="1.2"
            opacity="0.85"
          />
          <ellipse cx="500" cy="393" rx="6" ry="4" fill="#E2E8F0" />
          <path
            d="M 496 392 Q 500 383 504 392"
            stroke="#EFF6FF"
            strokeWidth="2"
            fill="none"
          />

          {/* 4 Wooden Park Benches Around the Central Plaza */}
          {[
            [452, 378],
            [548, 378],
            [452, 414],
            [548, 414],
          ].map(([bx, by], idx) => (
            <g key={idx} transform={`translate(${bx}, ${by})`}>
              <ellipse cx="0" cy="5" rx="7" ry="2.5" fill="#B8A27A" />
              <rect
                x="-6"
                y="0"
                width="12"
                height="4"
                rx="1"
                fill="#B45309"
                stroke="#78350F"
                strokeWidth="0.8"
              />
              <rect x="-5" y="-2" width="10" height="2" rx="0.6" fill="#D97706" />
            </g>
          ))}
        </g>
      </g>

      {/* =====================================================================
          LAYER 3: DETAILED 3D ISOMETRIC BUILDINGS & HARBOR DOCK
         ===================================================================== */}
      <g id="layer-3-detailed-buildings">
        {/* -----------------------------------------------------------------
            1. THE PORT (Northwest Harbor, Wooden Pier, Boat, Crane & Boathouse)
           ----------------------------------------------------------------- */}
        <g id="building-the-port" transform="translate(324, 214)">
          {/* Sandy Beach Cove */}
          <ellipse cx="76" cy="72" rx="38" ry="20" fill="#F2DFB1" />
          <ellipse cx="76" cy="70" rx="32" ry="16" fill="#E6CE96" />

          {/* Moored Small Isometric Sailboat by the Pier */}
          <g transform="translate(10, 48)">
            <ellipse cx="14" cy="12" rx="14" ry="6" fill="#0EA5E9" opacity="0.45" />
            <polygon
              points="2,9 14,14 26,9 22,5 6,5"
              fill="#9A3412"
              stroke="#431407"
              strokeWidth="1"
            />
            <polygon points="14,6 14,-10 24,4" fill="#FFFBEB" stroke="#CBD5E1" strokeWidth="0.8" />
            <polygon points="13,5 13,-8 5,4" fill="#F1F5F9" />
          </g>

          {/* Main Wooden Pier & Cross-Dock */}
          <polygon
            points="74,70 18,26 26,18 82,62"
            fill="#A15C27"
            stroke="#5C3414"
            strokeWidth="1.2"
          />
          <polygon
            points="24,44 52,10 60,16 32,50"
            fill="#B86B2D"
            stroke="#5C3414"
            strokeWidth="1.2"
          />
          {/* Pier Plank Seam Lines */}
          <g stroke="#703E16" strokeWidth="1">
            <line x1="65" y1="62" x2="72" y2="55" />
            <line x1="56" y1="55" x2="63" y2="48" />
            <line x1="47" y1="48" x2="54" y2="41" />
            <line x1="38" y1="41" x2="45" y2="34" />
            <line x1="29" y1="34" x2="36" y2="27" />
          </g>

          {/* Wooden Pilings & Water Ripples */}
          {[
            [18, 25],
            [52, 11],
            [36, 40],
            [62, 58],
          ].map(([px, py], i) => (
            <g key={i}>
              <ellipse
                cx={px + 2}
                cy={py + 15}
                rx="5"
                ry="2.2"
                fill="none"
                stroke="#E0F2FE"
                strokeWidth="1"
              />
              <rect
                x={px}
                y={py}
                width="4.5"
                height="15"
                rx="1"
                fill="#5C3414"
              />
              <ellipse cx={px + 2.2} cy={py} rx="2.2" ry="1" fill="#D97706" />
            </g>
          ))}

          {/* Harbor Boathouse with 3D Shaded Walls & Forest-Green Roof */}
          <g transform="translate(52, 34)">
            <ellipse cx="22" cy="30" rx="24" ry="9" fill="#3B7A1E" opacity="0.45" />
            {/* Front Wall */}
            <polygon
              points="4,12 28,12 28,30 4,30"
              fill="#F8F4EC"
              stroke="#C5B9A5"
              strokeWidth="1.2"
            />
            {/* Right Shaded Side Wall */}
            <polygon
              points="28,12 40,6 40,24 28,30"
              fill="#DFD6C7"
              stroke="#B5A892"
              strokeWidth="1.2"
            />
            {/* Pitched Roof */}
            <polygon
              points="0,14 20,-2 32,14"
              fill="#1F6E43"
              stroke="#0F3D23"
              strokeWidth="1.2"
            />
            <polygon
              points="20,-2 34,-7 44,7 32,14"
              fill="#155231"
              stroke="#0F3D23"
              strokeWidth="1.2"
            />
            {/* Door & Window */}
            <rect x="13" y="19" width="7" height="11" rx="1" fill="#6E4726" />
            <rect x="6" y="16" width="5" height="5" rx="0.8" fill="#38BDF8" stroke="#475569" strokeWidth="0.8" />
          </g>

          {/* Wooden Cargo Crates & Barrels on the Dock */}
          <g transform="translate(46, 54)">
            <rect x="0" y="0" width="7" height="7" fill="#D97706" stroke="#78350F" strokeWidth="0.9" />
            <rect x="6" y="2" width="6" height="6" fill="#B45309" stroke="#78350F" strokeWidth="0.9" />
            <ellipse cx="16" cy="5" rx="3.2" ry="4.2" fill="#92400E" stroke="#451A03" strokeWidth="0.8" />
          </g>
        </g>

        {/* -----------------------------------------------------------------
            2. THE BOSS HEADQUARTERS (North Executive Mansion & Courtyard)
           ----------------------------------------------------------------- */}
        <g id="building-the-boss" transform="translate(446, 192)">
          {/* Ground Shadow */}
          <ellipse cx="54" cy="68" rx="56" ry="18" fill="#2E7016" opacity="0.55" />

          {/* Clipped Courtyard Hedges & Golden Forecourt Bollards */}
          <ellipse cx="14" cy="68" rx="11" ry="5" fill="#15803D" stroke="#052E16" strokeWidth="1" />
          <ellipse cx="94" cy="68" rx="11" ry="5" fill="#15803D" stroke="#052E16" strokeWidth="1" />

          {/* Left Wing (3D Front + Side + Slate Roof) */}
          <rect
            x="8"
            y="32"
            width="28"
            height="30"
            fill="#F3EFE6"
            stroke="#BFB6A4"
            strokeWidth="1.4"
          />
          <polygon
            points="4,34 22,20 38,34"
            fill="#475569"
            stroke="#1E293B"
            strokeWidth="1.3"
          />
          <rect x="14" y="39" width="6" height="8" rx="1" fill="#38BDF8" stroke="#334155" strokeWidth="1" />
          <rect x="24" y="39" width="6" height="8" rx="1" fill="#38BDF8" stroke="#334155" strokeWidth="1" />
          <rect x="14" y="50" width="16" height="6" rx="1" fill="#CBD5E1" />

          {/* Right Wing (3D Front + Shaded Right Wall + Slate Roof) */}
          <rect
            x="72"
            y="32"
            width="28"
            height="30"
            fill="#EAE4D7"
            stroke="#BFB6A4"
            strokeWidth="1.4"
          />
          <polygon
            points="100,32 108,27 108,56 100,62"
            fill="#D5CCB9"
            stroke="#AFA592"
            strokeWidth="1.2"
          />
          <polygon
            points="70,34 86,20 106,34"
            fill="#334155"
            stroke="#1E293B"
            strokeWidth="1.3"
          />
          <rect x="78" y="39" width="6" height="8" rx="1" fill="#38BDF8" stroke="#334155" strokeWidth="1" />
          <rect x="88" y="39" width="6" height="8" rx="1" fill="#38BDF8" stroke="#334155" strokeWidth="1" />
          <rect x="78" y="50" width="16" height="6" rx="1" fill="#CBD5E1" />

          {/* Central 2-Story Executive Pavilion */}
          <rect
            x="32"
            y="18"
            width="44"
            height="46"
            fill="#FCFBF7"
            stroke="#C5B9A5"
            strokeWidth="1.5"
          />
          {/* Shaded Right Depth Wall of Central Pavilion */}
          <polygon
            points="76,18 83,13 83,58 76,64"
            fill="#E2DACB"
            stroke="#B8AC97"
            strokeWidth="1.2"
          />
          {/* Classical Pediment & Hipped Slate Roof */}
          <polygon
            points="27,20 54,1 81,20"
            fill="#334155"
            stroke="#0F172A"
            strokeWidth="1.5"
          />
          <polygon
            points="34,19 54,6 74,19"
            fill="#F5F0E6"
            stroke="#BFB6A4"
            strokeWidth="1.2"
          />
          {/* Golden Executive Crest in Pediment */}
          <circle cx="54" cy="14" r="3.5" fill="#F59E0B" stroke="#78350F" strokeWidth="0.9" />

          {/* Upper Story Tall Windows */}
          <rect x="38" y="25" width="7" height="11" rx="1.5" fill="#38BDF8" stroke="#334155" strokeWidth="1" />
          <rect x="50.5" y="25" width="7" height="11" rx="1.5" fill="#FEF08A" stroke="#334155" strokeWidth="1" />
          <rect x="63" y="25" width="7" height="11" rx="1.5" fill="#38BDF8" stroke="#334155" strokeWidth="1" />

          {/* Columned Entrance Portico & Arched Doorway */}
          <rect x="41" y="40" width="3" height="22" fill="#E2DACB" />
          <rect x="64" y="40" width="3" height="22" fill="#E2DACB" />
          <rect
            x="47"
            y="43"
            width="14"
            height="21"
            rx="3"
            fill="#1E293B"
            stroke="#0F172A"
            strokeWidth="1.2"
          />
          <line x1="54" y1="43" x2="54" y2="64" stroke="#94A3B8" strokeWidth="1" />

          {/* Tiered Stone Entrance Steps Connecting to North Avenue */}
          <rect x="43" y="63" width="22" height="3.5" rx="1" fill="#E5DEC9" stroke="#B8AC97" strokeWidth="0.9" />
          <rect x="40" y="66.5" width="28" height="3.5" rx="1" fill="#DCD3BC" stroke="#B8AC97" strokeWidth="0.9" />
          <rect x="37" y="70" width="34" height="3.5" rx="1" fill="#D2C7AC" stroke="#B8AC97" strokeWidth="0.9" />
        </g>

        {/* -----------------------------------------------------------------
            3. TOWN HALL (Central Civic Hall Overlooking the Fountain Plaza)
           ----------------------------------------------------------------- */}
        <g id="building-town-hall" transform="translate(462, 320)">
          {/* Ground Shadow */}
          <ellipse cx="38" cy="50" rx="38" ry="12" fill="#3B7A1E" opacity="0.45" />

          {/* Front Limestone Facade */}
          <rect
            x="10"
            y="20"
            width="52"
            height="30"
            fill="#FAF5EB"
            stroke="#C8B9A6"
            strokeWidth="1.5"
          />
          {/* Right 3D Side Wall */}
          <polygon
            points="62,20 71,14 71,43 62,50"
            fill="#DFD4C2"
            stroke="#B8A793"
            strokeWidth="1.3"
          />
          {/* Terracotta Red Pitched Roof with Shaded Side Slope */}
          <polygon
            points="4,22 36,1 68,22"
            fill="#DC4C32"
            stroke="#8F2815"
            strokeWidth="1.5"
          />
          <polygon
            points="36,1 46,-4 76,16 68,22"
            fill="#B83821"
            stroke="#8F2815"
            strokeWidth="1.3"
          />
          {/* Civic Clock & Bell Gable */}
          <circle
            cx="36"
            cy="13"
            r="5"
            fill="#FEF3C7"
            stroke="#78350F"
            strokeWidth="1.2"
          />
          <polyline
            points="36,10 36,13 38.5,14"
            fill="none"
            stroke="#78350F"
            strokeWidth="1"
          />

          {/* Framed Windows & Arched Timber Entrance */}
          <rect x="15" y="27" width="8" height="10" rx="1.5" fill="#38BDF8" stroke="#64748B" strokeWidth="1" />
          <rect x="49" y="27" width="8" height="10" rx="1.5" fill="#38BDF8" stroke="#64748B" strokeWidth="1" />
          <rect
            x="29"
            y="29"
            width="14"
            height="21"
            rx="3"
            fill="#7C4D2B"
            stroke="#451A03"
            strokeWidth="1.2"
          />
          <line x1="36" y1="29" x2="36" y2="50" stroke="#451A03" strokeWidth="1" />
          {/* Stone Steps to Plaza */}
          <rect x="26" y="49" width="20" height="3.5" rx="1" fill="#E5DEC9" stroke="#B8AC97" strokeWidth="0.9" />
          <rect x="23" y="52.5" width="26" height="3.5" rx="1" fill="#D6CBB3" stroke="#B8AC97" strokeWidth="0.9" />
        </g>

        {/* -----------------------------------------------------------------
            4. SALES & COMMUNITY DISTRICT (West Village Cottages & Meeting Hub)
           ----------------------------------------------------------------- */}
        <g id="district-sales-community" transform="translate(296, 398)">
          {/* Cottage A (North-West Terracotta Outreach Office) */}
          <g transform="translate(18, 6)">
            <ellipse cx="24" cy="40" rx="24" ry="8" fill="#32751A" opacity="0.48" />
            <rect
              x="6"
              y="18"
              width="32"
              height="23"
              fill="#FAF5EC"
              stroke="#C5B9A5"
              strokeWidth="1.3"
            />
            <polygon
              points="38,18 46,13 46,35 38,41"
              fill="#DFD5C4"
              stroke="#B5A892"
              strokeWidth="1.2"
            />
            <polygon
              points="2,20 22,3 42,20"
              fill="#E05246"
              stroke="#881D15"
              strokeWidth="1.3"
            />
            <polygon
              points="22,3 31,-2 50,14 42,20"
              fill="#B9382E"
              stroke="#881D15"
              strokeWidth="1.2"
            />
            <rect x="18" y="27" width="8" height="14" rx="1" fill="#6E4726" />
            <rect x="9" y="24" width="6" height="6" rx="1" fill="#FEF08A" stroke="#64748B" strokeWidth="0.9" />
            <rect x="29" y="24" width="6" height="6" rx="1" fill="#38BDF8" stroke="#64748B" strokeWidth="0.9" />
          </g>

          {/* Cottage B (East Golden-Ochre Creator CRM Cottage) */}
          <g transform="translate(60, 26)">
            <ellipse cx="24" cy="40" rx="25" ry="8" fill="#32751A" opacity="0.48" />
            <rect
              x="6"
              y="18"
              width="34"
              height="23"
              fill="#FAF5EC"
              stroke="#C5B9A5"
              strokeWidth="1.3"
            />
            <polygon
              points="40,18 48,13 48,35 40,41"
              fill="#DFD5C4"
              stroke="#B5A892"
              strokeWidth="1.2"
            />
            <polygon
              points="2,20 23,3 44,20"
              fill="#F59E0B"
              stroke="#92400E"
              strokeWidth="1.3"
            />
            <polygon
              points="23,3 32,-2 52,14 44,20"
              fill="#D97706"
              stroke="#92400E"
              strokeWidth="1.2"
            />
            <rect x="19" y="27" width="8" height="14" rx="1" fill="#6E4726" />
            <rect x="10" y="24" width="6" height="6" rx="1" fill="#38BDF8" stroke="#64748B" strokeWidth="0.9" />
            <rect x="30" y="24" width="6" height="6" rx="1" fill="#FEF08A" stroke="#64748B" strokeWidth="0.9" />
          </g>

          {/* Cottage C (South-West Emerald Community Hub) */}
          <g transform="translate(20, 44)">
            <ellipse cx="22" cy="38" rx="22" ry="7.5" fill="#32751A" opacity="0.48" />
            <rect
              x="6"
              y="16"
              width="30"
              height="21"
              fill="#FAF5EC"
              stroke="#C5B9A5"
              strokeWidth="1.3"
            />
            <polygon
              points="36,16 43,11 43,31 36,37"
              fill="#DFD5C4"
              stroke="#B5A892"
              strokeWidth="1.2"
            />
            <polygon
              points="2,18 21,3 40,18"
              fill="#22A861"
              stroke="#065F46"
              strokeWidth="1.3"
            />
            <polygon
              points="21,3 29,-1 47,13 40,18"
              fill="#15803D"
              stroke="#065F46"
              strokeWidth="1.2"
            />
            <rect x="17" y="25" width="7" height="12" rx="1" fill="#6E4726" />
            <rect x="9" y="21" width="5.5" height="5.5" rx="0.8" fill="#FEF08A" stroke="#64748B" strokeWidth="0.8" />
          </g>

          {/* Outdoor Community Meeting Table, Seats & Noticeboard */}
          <g transform="translate(64, 70)">
            <ellipse cx="10" cy="8" rx="11" ry="5" fill="#C8B288" />
            <ellipse cx="10" cy="5" rx="7" ry="4" fill="#B45309" stroke="#78350F" strokeWidth="0.9" />
            <circle cx="2" cy="5" r="2" fill="#FDE68A" />
            <circle cx="18" cy="5" r="2" fill="#FDE68A" />
            {/* Community Noticeboard */}
            <rect x="24" y="-6" width="10" height="8" rx="1" fill="#92400E" stroke="#451A03" strokeWidth="0.9" />
            <rect x="25.5" y="-4.5" width="3" height="2.5" fill="#FEF08A" />
            <rect x="29.5" y="-4.5" width="3" height="2.5" fill="#93C5FD" />
            <line x1="26" y1="2" x2="26" y2="7" stroke="#451A03" strokeWidth="1.2" />
            <line x1="32" y1="2" x2="32" y2="7" stroke="#451A03" strokeWidth="1.2" />
          </g>

          {/* Curved White Picket Fence Framing Sales & Community */}
          <g>
            <path
              d="M 8 68 Q 48 96 108 86"
              stroke="#CBD5E1"
              strokeWidth="4.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 8 66 Q 48 94 108 84"
              stroke="#FFFFFF"
              strokeWidth="3.5"
              strokeDasharray="4 4"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        </g>

        {/* -----------------------------------------------------------------
            5. CONTENT STUDIO DISTRICT (East Media Campus & Clipping Props)
           ----------------------------------------------------------------- */}
        <g id="district-content-studio" transform="translate(588, 398)">
          {/* Building A: Main Slate-Roofed Video Clipping Studio */}
          <g transform="translate(4, 18)">
            <ellipse cx="26" cy="42" rx="26" ry="8.5" fill="#32751A" opacity="0.48" />
            <rect
              x="6"
              y="18"
              width="36"
              height="24"
              fill="#F1EDE4"
              stroke="#BFB6A4"
              strokeWidth="1.3"
            />
            <polygon
              points="42,18 50,13 50,36 42,42"
              fill="#D6CFC0"
              stroke="#ABA290"
              strokeWidth="1.2"
            />
            <polygon
              points="2,20 24,2 46,20"
              fill="#334155"
              stroke="#0F172A"
              strokeWidth="1.3"
            />
            <polygon
              points="24,2 33,-3 54,14 46,20"
              fill="#1E293B"
              stroke="#0F172A"
              strokeWidth="1.2"
            />
            {/* Studio Skylight Panels */}
            <polygon points="15,15 22,9 28,15" fill="#38BDF8" opacity="0.85" />
            <rect x="19" y="28" width="10" height="14" rx="1" fill="#475569" />
            <rect x="9" y="24" width="6" height="6" rx="1" fill="#FEF08A" stroke="#334155" strokeWidth="0.9" />
            <rect x="32" y="24" width="6" height="6" rx="1" fill="#38BDF8" stroke="#334155" strokeWidth="0.9" />
          </g>

          {/* Building B: Violet-Roofed 9:16 Reframe & Color Suite */}
          <g transform="translate(68, 8)">
            <ellipse cx="24" cy="40" rx="24" ry="8" fill="#32751A" opacity="0.48" />
            <rect
              x="6"
              y="18"
              width="32"
              height="22"
              fill="#F5F0FF"
              stroke="#C4B5FD"
              strokeWidth="1.3"
            />
            <polygon
              points="38,18 46,13 46,34 38,40"
              fill="#DDD6FE"
              stroke="#A78BFA"
              strokeWidth="1.2"
            />
            <polygon
              points="2,20 22,3 42,20"
              fill="#7E3AF2"
              stroke="#3B0764"
              strokeWidth="1.3"
            />
            <polygon
              points="22,3 31,-2 50,14 42,20"
              fill="#5B21B6"
              stroke="#3B0764"
              strokeWidth="1.2"
            />
            <rect x="18" y="26" width="8" height="14" rx="1" fill="#4C1D95" />
            <rect x="9" y="23" width="6" height="6" rx="1" fill="#FEF08A" stroke="#4C1D95" strokeWidth="0.9" />
          </g>

          {/* Building C: Amber-Roofed Kinetic Caption & Audio Booth */}
          <g transform="translate(44, 38)">
            <ellipse cx="24" cy="40" rx="24" ry="8" fill="#32751A" opacity="0.48" />
            <rect
              x="6"
              y="18"
              width="34"
              height="22"
              fill="#FAF5EC"
              stroke="#C5B9A5"
              strokeWidth="1.3"
            />
            <polygon
              points="40,18 48,13 48,34 40,40"
              fill="#DFD5C4"
              stroke="#B5A892"
              strokeWidth="1.2"
            />
            <polygon
              points="2,20 23,3 44,20"
              fill="#F59E0B"
              stroke="#78350F"
              strokeWidth="1.3"
            />
            <polygon
              points="23,3 32,-2 52,14 44,20"
              fill="#D97706"
              stroke="#78350F"
              strokeWidth="1.2"
            />
            <rect x="19" y="26" width="8" height="14" rx="1" fill="#78350F" />
            <rect x="10" y="23" width="6" height="6" rx="1" fill="#38BDF8" stroke="#78350F" strokeWidth="0.9" />
            <rect x="30" y="23" width="6" height="6" rx="1" fill="#FEF08A" stroke="#78350F" strokeWidth="0.9" />
          </g>

          {/* Video Production Props: Studio Camera Tripod, Softbox Light & Media Dish */}
          <g transform="translate(52, 16)">
            {/* Broadcast Satellite Dish */}
            <ellipse cx="8" cy="8" rx="6" ry="4" fill="#E2E8F0" stroke="#475569" strokeWidth="1" />
            <line x1="8" y1="8" x2="11" y2="4" stroke="#475569" strokeWidth="1.2" />
            <circle cx="11" cy="4" r="1.3" fill="#EF4444" />
          </g>
          <g transform="translate(18, 66)">
            {/* Camera Rig & Softbox */}
            <line x1="6" y1="4" x2="3" y2="11" stroke="#1E293B" strokeWidth="1.2" />
            <line x1="6" y1="4" x2="9" y2="11" stroke="#1E293B" strokeWidth="1.2" />
            <rect x="3" y="0" width="6" height="4.5" rx="1" fill="#0F172A" />
            <circle cx="10" cy="2.2" r="1.5" fill="#38BDF8" />
            {/* Render Queue Crates */}
            <rect x="14" y="4" width="6.5" height="6.5" rx="1" fill="#D97706" stroke="#78350F" strokeWidth="0.8" />
            <rect x="21" y="5.5" width="5.5" height="5.5" rx="1" fill="#B45309" stroke="#78350F" strokeWidth="0.8" />
          </g>

          {/* Curved White Picket Fence Framing Content Studio */}
          <g>
            <path
              d="M 8 84 Q 58 96 106 66"
              stroke="#CBD5E1"
              strokeWidth="4.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 8 82 Q 58 94 106 64"
              stroke="#FFFFFF"
              strokeWidth="3.5"
              strokeDasharray="4 4"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        </g>

        {/* -----------------------------------------------------------------
            6. GROWTH DISTRICT (South Striped Analytics Pavilion & Lab)
           ----------------------------------------------------------------- */}
        <g id="district-growth" transform="translate(448, 496)">
          {/* Building A: Iconic Red & White Striped Growth Experiment Tent */}
          <g transform="translate(12, 26)">
            <ellipse cx="26" cy="42" rx="26" ry="8.5" fill="#32751A" opacity="0.5" />
            {/* Tent Base Walls */}
            <rect
              x="8"
              y="28"
              width="36"
              height="16"
              fill="#FEE2E2"
              stroke="#991B1B"
              strokeWidth="1.2"
            />
            <rect x="14" y="28" width="6" height="16" fill="#FFFFFF" />
            <rect x="32" y="28" width="6" height="16" fill="#FFFFFF" />
            {/* Striped Conical Pavilion Roof */}
            <polygon
              points="2,29 26,2 50,29"
              fill="#EF4444"
              stroke="#991B1B"
              strokeWidth="1.3"
            />
            <polygon points="11,29 26,2 41,29" fill="#FFFFFF" />
            <polygon points="19,29 26,2 33,29" fill="#EF4444" />
            {/* Golden Pennant Flag on Tent Peak */}
            <line x1="26" y1="2" x2="26" y2="-5" stroke="#78350F" strokeWidth="1.3" />
            <polygon points="26,-5 34,-2.5 26,0" fill="#F59E0B" />
            {/* Tent Entrance Arch */}
            <rect x="21" y="31" width="10" height="13" rx="2" fill="#7F1D1D" />
          </g>

          {/* Building B: Purple Retention Analytics Lab Cottage */}
          <g transform="translate(56, 18)">
            <ellipse cx="22" cy="38" rx="22" ry="7.5" fill="#32751A" opacity="0.48" />
            <rect
              x="6"
              y="18"
              width="30"
              height="21"
              fill="#F5F0FF"
              stroke="#C4B5FD"
              strokeWidth="1.3"
            />
            <polygon
              points="36,18 43,13 43,33 36,39"
              fill="#DDD6FE"
              stroke="#A78BFA"
              strokeWidth="1.2"
            />
            <polygon
              points="2,20 21,3 40,20"
              fill="#7E3AF2"
              stroke="#3B0764"
              strokeWidth="1.3"
            />
            <polygon
              points="21,3 29,-2 47,14 40,20"
              fill="#5B21B6"
              stroke="#3B0764"
              strokeWidth="1.2"
            />
            <rect x="17" y="26" width="8" height="13" rx="1" fill="#4C1D95" />
            <rect x="9" y="23" width="5.5" height="5.5" rx="0.8" fill="#34D399" stroke="#3B0764" strokeWidth="0.8" />
          </g>

          {/* Growth Experiment Easel & Distribution Crates */}
          <g transform="translate(2, 46)">
            <rect x="2" y="2" width="9" height="7" rx="1" fill="#FFFBEB" stroke="#78350F" strokeWidth="1" />
            <polyline points="3.5,7 6,4.5 8,6 9.5,3.5" fill="none" stroke="#16A34A" strokeWidth="1.2" />
            <line x1="4" y1="9" x2="3" y2="13" stroke="#78350F" strokeWidth="1" />
            <line x1="9" y1="9" x2="10" y2="13" stroke="#78350F" strokeWidth="1" />
          </g>

          {/* Curved White Picket Fence Framing Growth District */}
          <g>
            <path
              d="M 4 72 Q 52 98 100 72"
              stroke="#CBD5E1"
              strokeWidth="4.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 4 70 Q 52 96 100 70"
              stroke="#FFFFFF"
              strokeWidth="3.5"
              strokeDasharray="4 4"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        </g>
      </g>

      {/* =====================================================================
          LAYER 4: DECORATIVE DETAILS (FLOWER BEDS, STREET LAMPS, SIGNBOARDS)
         ===================================================================== */}
      <g id="layer-4-decorative-details">
        {/* Colorful Flower Beds & Garden Borders */}
        {[
          [442, 266, '#F43F5E', '#FACC15'],
          [558, 266, '#A855F7', '#FACC15'],
          [456, 360, '#F43F5E', '#FFFFFF'],
          [544, 360, '#F43F5E', '#FACC15'],
          [388, 392, '#EC4899', '#FEF08A'],
          [612, 392, '#A855F7', '#FEF08A'],
          [448, 492, '#F97316', '#FEF08A'],
          [552, 492, '#EC4899', '#FFFFFF'],
        ].map(([fx, fy, c1, c2], idx) => (
          <g key={idx} transform={`translate(${fx}, ${fy})`}>
            <ellipse cx="0" cy="2" rx="9" ry="4.5" fill="#15803D" />
            <circle cx="-4" cy="1" r="2.2" fill={String(c1)} />
            <circle cx="0" cy="2.5" r="2.2" fill={String(c2)} />
            <circle cx="4" cy="1" r="2.2" fill={String(c1)} />
            <circle cx="1.5" cy="-0.5" r="1.8" fill={String(c2)} />
          </g>
        ))}

        {/* Warm Isometric Street Lamps Along Main Pathways */}
        {[
          [476, 286],
          [524, 286],
          [432, 384],
          [568, 384],
          [476, 444],
          [524, 444],
        ].map(([lx, ly], idx) => (
          <g key={idx} transform={`translate(${lx}, ${ly})`}>
            <ellipse cx="0" cy="9" rx="4" ry="1.8" fill="#3A7D1E" />
            <line x1="0" y1="9" x2="0" y2="-3" stroke="#1E293B" strokeWidth="1.8" />
            <circle cx="0" cy="-4" r="4.5" fill="#FEF08A" opacity="0.4" />
            <circle
              cx="0"
              cy="-4"
              r="2.6"
              fill="#FEF9C3"
              stroke="#475569"
              strokeWidth="0.9"
            />
          </g>
        ))}

        {/* Directional Wooden Signpost at Central Plaza Fork */}
        <g transform="translate(442, 428)">
          <ellipse cx="0" cy="9" rx="4" ry="1.8" fill="#3A7D1E" />
          <rect x="-1.2" y="-3" width="2.4" height="12" fill="#5C3414" />
          <polygon points="-7,-2 5,-2 8,0.5 5,3 -7,3" fill="#D97706" stroke="#5C3414" strokeWidth="0.8" />
          <polygon points="7,2 -4,2 -7,4.5 -4,7 7,7" fill="#F59E0B" stroke="#5C3414" strokeWidth="0.8" />
        </g>

        {/* Ambient Miniature Island Workers on the Plaza & Workstations */}
        {[
          [484, 380, '#EF4444'],
          [516, 384, '#F59E0B'],
          [494, 414, '#10B981'],
          [466, 398, '#3B82F6'],
          [534, 400, '#8B5CF6'],
          [412, 294, '#EC4899'],
        ].map(([cx, cy, shirtColor], idx) => (
          <g key={idx} transform={`translate(${cx}, ${cy})`}>
            <ellipse cx="0" cy="8.5" rx="4.5" ry="2" fill="#2D6A18" opacity="0.6" />
            <rect
              x="-3"
              y="1"
              width="6"
              height="6.5"
              rx="1.8"
              fill={String(shirtColor)}
              stroke="#0F172A"
              strokeWidth="0.8"
            />
            <circle
              cx="0"
              cy="-2"
              r="3"
              fill="#FDE68A"
              stroke="#0F172A"
              strokeWidth="0.8"
            />
          </g>
        ))}
      </g>

      {/* =====================================================================
          LAYER 5: VARIED TREES, CONIFERS, BUSHES & ACTIVE MESSAGE PACKETS
         ===================================================================== */}
      <g id="layer-5-trees-and-packets">
        {/* Tall Conifer Pines Adding Vertical Silhouette Variety */}
        {[
          [416, 244, 1],
          [582, 242, 1.05],
          [344, 326, 0.95],
          [654, 332, 1],
          [294, 434, 0.95],
          [708, 424, 0.95],
        ].map(([px, py, scale], idx) => (
          <g
            key={`pine-${idx}`}
            transform={`translate(${px}, ${py}) scale(${scale})`}
          >
            <ellipse cx="0" cy="20" rx="11" ry="4.5" fill="#2E6F18" opacity="0.6" />
            <rect x="-2.2" y="10" width="4.4" height="10" fill="#5C3414" />
            <polygon
              points="-12,13 0,-4 12,13"
              fill="#14532D"
              stroke="#052E16"
              strokeWidth="1.2"
            />
            <polygon
              points="-10,6 0,-10 10,6"
              fill="#166534"
              stroke="#052E16"
              strokeWidth="1.2"
            />
            <polygon
              points="-7,-1 0,-15 7,-1"
              fill="#22C55E"
              stroke="#052E16"
              strokeWidth="1"
            />
          </g>
        ))}

        {/* Lush Multi-Canopy Broadleaf Trees & Round Orchard Trees */}
        {[
          [432, 260, 13, '#1E5622', '#4ADE80'],
          [446, 272, 10.5, '#15803D', '#86EFAC'],
          [556, 252, 13.5, '#1E5622', '#4ADE80'],
          [572, 266, 10.5, '#166534', '#86EFAC'],
          [612, 304, 13, '#1E5622', '#4ADE80'],
          [638, 354, 14.5, '#166534', '#4ADE80'],
          [382, 342, 13.5, '#166534', '#4ADE80'],
          [308, 388, 12.5, '#15803D', '#86EFAC'],
          [398, 518, 13.5, '#166534', '#4ADE80'],
          [598, 520, 14, '#15803D', '#4ADE80'],
          [566, 550, 11.5, '#16A34A', '#86EFAC'],
          [432, 548, 11, '#16A34A', '#86EFAC'],
          [696, 392, 12.5, '#166534', '#4ADE80'],
          [342, 514, 11, '#15803D', '#86EFAC'],
          [654, 512, 11.5, '#15803D', '#86EFAC'],
        ].map(([cx, cy, r, baseColor, highlightColor], index) => (
          <g key={`tree-${index}`}>
            <ellipse
              cx={Number(cx)}
              cy={Number(cy) + Number(r) + 3}
              rx={Number(r) * 0.88}
              ry={Number(r) * 0.4}
              fill="#2E6F18"
              opacity="0.65"
            />
            <rect
              x={Number(cx) - 2.2}
              y={Number(cy) + 2}
              width="4.4"
              height={Number(r)}
              rx="1"
              fill="#6E4726"
            />
            <circle
              cx={Number(cx)}
              cy={Number(cy)}
              r={Number(r)}
              fill={String(baseColor)}
              stroke="#0F2912"
              strokeWidth="1.5"
            />
            <circle
              cx={Number(cx) - Number(r) * 0.26}
              cy={Number(cy) - Number(r) * 0.26}
              r={Number(r) * 0.58}
              fill={String(highlightColor)}
              opacity="0.45"
            />
          </g>
        ))}

        {/* Active Message Packet Indicators Travelling Between Communicating Agents */}
        {activePackets.map((pkt) => {
          const currX =
            pkt.fromCoords.x + (pkt.toCoords.x - pkt.fromCoords.x) * pkt.progress;
          const currY =
            pkt.fromCoords.y + (pkt.toCoords.y - pkt.fromCoords.y) * pkt.progress;

          return (
            <g key={pkt.id} data-testid="active-message-packet">
              <line
                x1={pkt.fromCoords.x}
                y1={pkt.fromCoords.y}
                x2={pkt.toCoords.x}
                y2={pkt.toCoords.y}
                stroke="#FDE68A"
                strokeWidth="2.5"
                strokeDasharray="5 5"
                opacity="0.78"
              />
              <circle
                cx={currX}
                cy={currY}
                r="8.5"
                fill="#F59E0B"
                opacity="0.35"
              />
              <circle
                cx={currX}
                cy={currY}
                r="4.8"
                fill="#FEF08A"
                stroke="#78350F"
                strokeWidth="1.5"
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
};
