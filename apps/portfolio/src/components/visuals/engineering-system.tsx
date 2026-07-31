const nodes = [
  { id: "ai", label: "AI", x: 75, y: 50 },
  { id: "security", label: "SECURITY", x: 330, y: 58 },
  { id: "backend", label: "BACKEND", x: 80, y: 205 },
  { id: "products", label: "PRODUCTS", x: 330, y: 205 },
  { id: "systems", label: "SYSTEMS", x: 205, y: 22 },
  { id: "research", label: "RESEARCH", x: 205, y: 242 }
];

export function EngineeringSystem() {
  return (
    <figure className="engineering-system" aria-labelledby="engineering-system-title">
      <svg viewBox="0 0 420 290" role="img" focusable="false">
        <title id="engineering-system-title">
          Engineering system diagram connecting engineer to AI, security, backend, products,
          systems, and research.
        </title>
        <g className="system-lines">
          {nodes.map((node) => (
            <line key={node.id} x1="210" y1="145" x2={node.x} y2={node.y} />
          ))}
        </g>
        <g className="system-core">
          <rect x="154" y="111" width="112" height="68" rx="2" />
          <text x="210" y="141" textAnchor="middle">
            ENGINEER
          </text>
          <text x="210" y="161" textAnchor="middle" className="svg-meta">
            CORE / 00
          </text>
        </g>
        {nodes.map((node, index) => (
          <g key={node.id} className="system-node" tabIndex={0} aria-label={`${node.label} node`}>
            <rect x={node.x - 48} y={node.y - 18} width="96" height="36" rx="18" />
            <text x={node.x} y={node.y + 4} textAnchor="middle">
              {node.label}
            </text>
            <text x={node.x} y={node.y + 35} textAnchor="middle" className="svg-meta">
              X{node.x} / Y{node.y} / 0{index + 1}
            </text>
          </g>
        ))}
      </svg>
      <figcaption>Static engineering map prepared for Phase 2 motion.</figcaption>
    </figure>
  );
}
