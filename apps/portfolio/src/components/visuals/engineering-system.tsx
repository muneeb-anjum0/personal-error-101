"use client";

import { useState } from "react";
import type { Project } from "@muneeb-systems/shared-types";

interface EngineeringSystemProps {
  projects: Project[];
}

interface TechnologyNode {
  key: string;
  label: string;
  count: number;
  x: number;
  y: number;
  radius: number;
}

interface TechnologyLink {
  from: string;
  to: string;
  count: number;
}

export function EngineeringSystem({ projects }: EngineeringSystemProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const topology = buildTechnologyTopology(projects);
  // Keep this presentation gate here as well as in aggregation: a one-project tool must never
  // become a visible node, even if the source data is refreshed while the page is open.
  const recurringNodes = topology.nodes.filter((node) => node.count > 1);
  const active = recurringNodes.find((node) => node.key === activeKey);
  const activeLinks = active
    ? topology.links.filter((link) => link.from === active.key || link.to === active.key).length
    : 0;

  return (
    <figure className="engineering-system">
      <svg
        viewBox="0 0 420 264"
        role="img"
        aria-label="Shared technology map across portfolio projects"
        focusable="false"
      >
        <rect className="system-field" x="1" y="1" width="418" height="262" />
        <g className="system-grid" aria-hidden="true">
          {Array.from({ length: 9 }, (_, index) => (
            <line key={`vertical-${index}`} x1={1 + index * 52.25} y1="1" x2={1 + index * 52.25} y2="263" />
          ))}
          {Array.from({ length: 7 }, (_, index) => (
            <line key={`horizontal-${index}`} x1="1" y1={1 + index * (262 / 6)} x2="419" y2={1 + index * (262 / 6)} />
          ))}
        </g>
        <g className="system-connections" aria-hidden="true">
          {topology.links.map((link) => {
            const source = topology.byKey.get(link.from);
            const target = topology.byKey.get(link.to);
            if (!source || !target) return null;
            const isActive = activeKey === link.from || activeKey === link.to;
            return (
              <line
                className={`${link.count > 1 ? "system-shared-link" : ""}${isActive ? " is-active" : ""}`}
                key={`${link.from}-${link.to}`}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
              />
            );
          })}
        </g>
        <g className="system-project-nodes">
          {recurringNodes.map((node) => (
            <g
              key={node.key}
              className={activeKey === node.key ? "is-active" : undefined}
              tabIndex={0}
              role="img"
              aria-label={`${node.label}: used in ${node.count} project${node.count === 1 ? "" : "s"}`}
              onBlur={() => setActiveKey(null)}
              onFocus={() => setActiveKey(node.key)}
              onMouseEnter={() => setActiveKey(node.key)}
              onMouseLeave={() => setActiveKey(null)}
            >
              <circle cx={node.x} cy={node.y} r={node.radius} />
            </g>
          ))}
        </g>
        <text x="22" y="32" className="system-kicker">SHARED TECHNOLOGY MAP</text>
        <text x="22" y="222" className="system-footer">
          {active ? truncate(active.label.toUpperCase(), 34) : "COMBINED PROJECT STACK"}
        </text>
        <text x="22" y="244" className="system-footer">
          {active
            ? `${active.count} PROJECT${active.count === 1 ? "" : "S"} / ${activeLinks} CONNECTION${activeLinks === 1 ? "" : "S"}`
            : `${recurringNodes.length} SHARED TECHNOLOGIES / SEED ${topology.seed}`}
        </text>
      </svg>
      <figcaption>Dot size shows how often a technology appears; links show stacks that occur together.</figcaption>
    </figure>
  );
}

function buildTechnologyTopology(projects: Project[]) {
  const technologies = new Map<string, { label: string; projects: Set<number> }>();
  const pairCounts = new Map<string, number>();

  projects.forEach((project, projectIndex) => {
    const projectTechnologies = new Map<string, string>();
    project.technologies.forEach((technology) => {
      const label = technology.trim();
      const key = label.toLowerCase();
      if (!key) return;
      projectTechnologies.set(key, label);
      const entry = technologies.get(key) ?? { label, projects: new Set<number>() };
      entry.projects.add(projectIndex);
      technologies.set(key, entry);
    });

    const keys = [...projectTechnologies.keys()];
    keys.forEach((from, first) => {
      keys.slice(first + 1).forEach((to) => {
        const pair = to < from ? `${to}|${from}` : `${from}|${to}`;
        pairCounts.set(pair, (pairCounts.get(pair) ?? 0) + 1);
      });
    });
  });

  const seed = hash(
    [...technologies]
      .filter(([, entry]) => entry.projects.size > 1)
      .map(([key, entry]) => `${key}:${entry.projects.size}`)
      .sort()
      .join("/")
  );
  const initialNodes = placeTechnologyNodes(technologies, seed);
  const initialByKey = new Map(initialNodes.map((node) => [node.key, node]));
  const links = selectTechnologyLinks(pairCounts, initialByKey, seed);
  const nodes = relaxTechnologyNodes(initialNodes, links);
  const byKey = new Map(nodes.map((node) => [node.key, node]));

  return { nodes, byKey, links, seed: seed % 10000 };
}

function placeTechnologyNodes(
  technologies: Map<string, { label: string; projects: Set<number> }>,
  seed: number
): TechnologyNode[] {
  const random = createSeededRandom(seed);
  const entries = [...technologies]
    .filter(([, technology]) => technology.projects.size > 1)
    .sort(([first], [second]) => first.localeCompare(second));
  const nodes: TechnologyNode[] = [];

  entries.forEach(([key, technology], index) => {
    const radius = Math.min(10, 3.5 + technology.projects.size * 1.7);
    let candidate: TechnologyNode | undefined;
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const node = {
        key,
        label: technology.label,
        count: technology.projects.size,
        x: 48 + Math.round(random() * 324),
        y: 50 + Math.round(random() * 134),
        radius
      };
      if (nodes.every((existing) => Math.hypot(existing.x - node.x, existing.y - node.y) > existing.radius + radius + 26)) {
        candidate = node;
        break;
      }
    }
    nodes.push(candidate ?? { key, label: technology.label, count: technology.projects.size, x: 48 + (index % 8) * 43, y: 60 + Math.floor(index / 8) * 36, radius });
  });

  return nodes;
}

function selectTechnologyLinks(
  pairCounts: Map<string, number>,
  nodes: Map<string, TechnologyNode>,
  seed: number
): TechnologyLink[] {
  const candidates = [...pairCounts]
    .map(([pair, count]) => {
      const [from, to] = pair.split("|");
      return from && to && nodes.has(from) && nodes.has(to) ? { from, to, count } : undefined;
    })
    .filter((link): link is TechnologyLink => Boolean(link))
    .sort((first, second) => {
      return (
        second.count - first.count ||
        hash(`${first.from}|${first.to}|${seed}`) - hash(`${second.from}|${second.to}|${seed}`)
      );
    });
  const degree = new Map<string, number>();
  const links: TechnologyLink[] = [];

  candidates.forEach((link) => {
    const sourceDegree = degree.get(link.from) ?? 0;
    const targetDegree = degree.get(link.to) ?? 0;
    if (sourceDegree >= 3 || targetDegree >= 3) return;
    degree.set(link.from, sourceDegree + 1);
    degree.set(link.to, targetDegree + 1);
    links.push(link);
  });

  return links;
}

function createSeededRandom(seed: number) {
  let state = seed || 1;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(value: string): number {
  return [...value].reduce((total, character) => (total * 31 + character.charCodeAt(0)) >>> 0, 7);
}

function distance(first: TechnologyNode, second: TechnologyNode) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function relaxTechnologyNodes(nodes: TechnologyNode[], links: TechnologyLink[]): TechnologyNode[] {
  const positioned = nodes.map((node) => ({ ...node }));
  const byKey = new Map(positioned.map((node) => [node.key, node]));

  for (let iteration = 0; iteration < 180; iteration += 1) {
    const forces = new Map(positioned.map((node) => [node.key, { x: 0, y: 0 }]));
    const cooling = 1 - iteration / 220;

    positioned.forEach((node, first) => {
      positioned.slice(first + 1).forEach((other) => {
        const horizontal = other.x - node.x;
        const vertical = other.y - node.y;
        const separation = Math.max(Math.hypot(horizontal, vertical), 1);
        const magnitude = 1350 / (separation * separation);
        const forceX = (horizontal / separation) * magnitude;
        const forceY = (vertical / separation) * magnitude;
        const firstForce = forces.get(node.key)!;
        const secondForce = forces.get(other.key)!;
        firstForce.x -= forceX;
        firstForce.y -= forceY;
        secondForce.x += forceX;
        secondForce.y += forceY;
      });
    });

    links.forEach((link) => {
      const source = byKey.get(link.from)!;
      const target = byKey.get(link.to)!;
      const horizontal = target.x - source.x;
      const vertical = target.y - source.y;
      const separation = Math.max(Math.hypot(horizontal, vertical), 1);
      const desiredLength = link.count > 1 ? 60 : 76;
      const magnitude = (separation - desiredLength) * 0.018;
      const forceX = (horizontal / separation) * magnitude;
      const forceY = (vertical / separation) * magnitude;
      const sourceForce = forces.get(source.key)!;
      const targetForce = forces.get(target.key)!;
      sourceForce.x += forceX;
      sourceForce.y += forceY;
      targetForce.x -= forceX;
      targetForce.y -= forceY;
    });

    positioned.forEach((node) => {
      const force = forces.get(node.key)!;
      node.x = clamp(node.x + force.x * cooling * 0.55, 48, 372);
      node.y = clamp(node.y + force.y * cooling * 0.55, 50, 184);
    });
  }

  return positioned;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function truncate(value: string, length: number): string {
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}
