import type { Project } from "@muneeb-systems/shared-types";
import {
  makeProjectCoverSignature,
  type ProjectCoverFamily
} from "@/lib/portfolio-selectors";

interface GeneratedProjectCoverProps {
  project: Project;
  index: number;
  wide?: boolean;
  className?: string;
}

export function GeneratedProjectCover({
  project,
  index,
  wide = false,
  className = ""
}: GeneratedProjectCoverProps) {
  const signature = makeProjectCoverSignature(project);
  const topology = coverTopologies[signature.family];
  const frame = wide
    ? { width: 520, height: 205, horizontalLines: 5, verticalLines: 11 }
    : { width: 360, height: 230, horizontalLines: 6, verticalLines: 8 };
  const frameInset = 2;
  const drawableWidth = frame.width - frameInset * 2;
  const drawableHeight = frame.height - frameInset * 2;
  const xScale = frame.width / 360;
  const yScale = frame.height / 230;
  const nodes = topology.nodes.map(([x, y], nodeIndex) => ({
    x: (x + seededJitter(signature.seed, nodeIndex, 0)) * xScale,
    y: (y + seededJitter(signature.seed, nodeIndex, 1)) * yScale
  }));

  return (
    <svg
      className={`project-cover${wide ? " project-cover--wide" : ""} ${className}`}
      viewBox={`0 0 ${frame.width} ${frame.height}`}
      role="img"
      aria-label={`${project.name} ${topology.label.toLowerCase()} architecture cover`}
    >
      <rect x={frameInset} y={frameInset} width={drawableWidth} height={drawableHeight} />
      <g className="cover-grid">
        {Array.from({ length: frame.verticalLines }, (_, lineIndex) => (
          <line
            key={`v-${lineIndex}`}
            x1={frameInset + lineIndex * (drawableWidth / (frame.verticalLines - 1))}
            y1={frameInset}
            x2={frameInset + lineIndex * (drawableWidth / (frame.verticalLines - 1))}
            y2={frame.height - frameInset}
          />
        ))}
        {Array.from({ length: frame.horizontalLines }, (_, lineIndex) => (
          <line
            key={`h-${lineIndex}`}
            x1={frameInset}
            y1={frameInset + lineIndex * (drawableHeight / (frame.horizontalLines - 1))}
            x2={frame.width - frameInset}
            y2={frameInset + lineIndex * (drawableHeight / (frame.horizontalLines - 1))}
          />
        ))}
      </g>
      <g className="cover-routes">
        {topology.routes.map(([from, to]) => {
          const start = nodes[from];
          const end = nodes[to];
          return start && end ? (
            <line
              className="cover-route-line"
              key={`${from}-${to}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
            />
          ) : null;
        })}
      </g>
      <g className="cover-nodes">
        {nodes.map((node, nodeIndex) => (
          <circle
            key={`${node.x}-${node.y}-${nodeIndex}`}
            cx={node.x}
            cy={node.y}
            r={(topology.primary.includes(nodeIndex) ? 9 : 5) * Math.min(xScale, yScale)}
          />
        ))}
      </g>
      <text x={24 * xScale} y={42 * yScale} className="cover-index">
        {String(index + 1).padStart(2, "0")}
      </text>
      <text x={24 * xScale} y={190 * yScale} className="cover-title">
        {signature.abbreviation}
      </text>
      <text x={24 * xScale} y={211 * yScale} className="cover-meta">
        {topology.label} / N{signature.nodeCount} / S{signature.seed}
      </text>
    </svg>
  );
}

interface CoverTopology {
  label: string;
  nodes: Array<readonly [number, number]>;
  routes: Array<readonly [number, number]>;
  primary: number[];
}

const coverTopologies: Record<ProjectCoverFamily, CoverTopology> = {
  OFFLINE: {
    label: "OFFLINE LOOP",
    nodes: [[82, 78], [150, 52], [230, 62], [278, 116], [218, 154], [124, 146]],
    routes: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 3]],
    primary: [0, 3]
  },
  INTEGRATION: {
    label: "INTEGRATION",
    nodes: [[58, 78], [112, 78], [174, 112], [236, 112], [302, 78], [174, 54]],
    routes: [[0, 1], [1, 2], [5, 2], [2, 3], [3, 4]],
    primary: [0, 4]
  },
  CLOUD: {
    label: "CLOUD HUB",
    nodes: [[180, 104], [82, 58], [82, 146], [278, 58], [278, 146], [180, 48], [180, 160]],
    routes: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]],
    primary: [0]
  },
  DATA: {
    label: "DATA FLOW",
    nodes: [[62, 54], [62, 104], [62, 154], [158, 104], [238, 104], [304, 72], [304, 138]],
    routes: [[0, 3], [1, 3], [2, 3], [3, 4], [4, 5], [4, 6]],
    primary: [3, 4]
  },
  SIGNAL: {
    label: "SIGNAL PATH",
    nodes: [[48, 108], [92, 72], [132, 142], [176, 62], [220, 142], [264, 76], [312, 108]],
    routes: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]],
    primary: [0, 6]
  },
  AI: {
    label: "MODEL LAYERS",
    nodes: [[70, 66], [70, 142], [156, 52], [156, 104], [156, 156], [242, 104], [306, 104]],
    routes: [[0, 2], [0, 3], [1, 3], [1, 4], [2, 5], [3, 5], [4, 5], [5, 6]],
    primary: [6]
  },
  SECURITY: {
    label: "SECURITY",
    nodes: [[180, 104], [180, 44], [262, 66], [278, 132], [220, 162], [118, 162], [80, 88]],
    routes: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 1]],
    primary: [0]
  },
  FULL_STACK: {
    label: "FULL STACK",
    nodes: [[82, 54], [180, 54], [278, 54], [82, 142], [180, 142], [278, 142]],
    routes: [[0, 1], [1, 2], [0, 3], [1, 4], [2, 5], [3, 4], [4, 5]],
    primary: [1, 4]
  },
  WORKFLOW: {
    label: "WORKFLOW",
    nodes: [[56, 104], [118, 68], [180, 104], [242, 140], [304, 104]],
    routes: [[0, 1], [1, 2], [2, 3], [3, 4]],
    primary: [0, 4]
  }
};

function seededJitter(seed: number, nodeIndex: number, axis: number): number {
  return ((seed + nodeIndex * 17 + axis * 29) % 7) - 3;
}
