import type { Project } from "@muneeb-systems/shared-types";
import { makeProjectCoverSignature } from "@/lib/portfolio-selectors";

interface GeneratedProjectCoverProps {
  project: Project;
  index: number;
}

export function GeneratedProjectCover({ project, index }: GeneratedProjectCoverProps) {
  const signature = makeProjectCoverSignature(project);
  const nodes = Array.from({ length: signature.nodeCount }, (_, nodeIndex) => {
    const x = 40 + ((signature.seed + nodeIndex * 47) % 260);
    const y = 36 + ((signature.offset + nodeIndex * 31) % 150);
    return { x, y };
  });

  return (
    <svg
      className="project-cover"
      viewBox="0 0 360 230"
      role="img"
      aria-label={`${project.name} generated cover`}
    >
      <rect x="0" y="0" width="360" height="230" />
      <g className="cover-grid">
        {Array.from({ length: 8 }, (_, lineIndex) => (
          <line key={`v-${lineIndex}`} x1={lineIndex * 52} y1="0" x2={lineIndex * 52} y2="230" />
        ))}
        {Array.from({ length: 6 }, (_, lineIndex) => (
          <line key={`h-${lineIndex}`} x1="0" y1={lineIndex * 46} x2="360" y2={lineIndex * 46} />
        ))}
      </g>
      <g className="cover-routes">
        {nodes.slice(1).map((node, nodeIndex) => (
          <line
            key={`${node.x}-${node.y}`}
            x1={nodes[nodeIndex]?.x ?? 0}
            y1={nodes[nodeIndex]?.y ?? 0}
            x2={node.x}
            y2={node.y}
          />
        ))}
      </g>
      <g className="cover-nodes">
        {nodes.map((node, nodeIndex) => (
          <circle
            key={`${node.x}-${node.y}-${nodeIndex}`}
            cx={node.x}
            cy={node.y}
            r={nodeIndex === 0 ? 9 : 5}
          />
        ))}
      </g>
      <text x="24" y="42" className="cover-index">
        {String(index + 1).padStart(2, "0")}
      </text>
      <text x="24" y="190" className="cover-title">
        {signature.abbreviation}
      </text>
      <text x="24" y="211" className="cover-meta">
        NODES {signature.nodeCount} / SEED {signature.seed}
      </text>
    </svg>
  );
}
