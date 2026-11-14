import { describe, expect, it } from "vitest";
import {
  computeNsmCoverage,
  computeNsmPortfolioKpis,
  NSM_COVERAGE_KEY,
  resolveStoryCoveredNodeKeys,
} from "@/lib/metrics/nsmCoverage";

const metrics = [
  { id: "eff-root", parent_id: null },
  { id: "eff-leaf", parent_id: "eff-root" },
  { id: "breadth-root", parent_id: null },
];

describe("resolveStoryCoveredNodeKeys", () => {
  it("bubbles leaf metric up to root", () => {
    const keys = resolveStoryCoveredNodeKeys(
      { impacts_north_star: false, impact_metric_id: "eff-leaf" },
      Object.fromEntries(metrics.map((m) => [m.id, m]))
    );
    expect(keys.has("eff-leaf")).toBe(true);
    expect(keys.has("eff-root")).toBe(true);
    expect(keys.has("breadth-root")).toBe(false);
  });

  it("adds NSM key when impacts north star", () => {
    const keys = resolveStoryCoveredNodeKeys(
      { impacts_north_star: true, impact_metric_id: null },
      {}
    );
    expect(keys.has(NSM_COVERAGE_KEY)).toBe(true);
  });
});

describe("computeNsmCoverage", () => {
  const epics = [
    { id: "e1", title: "E1" },
    { id: "e2", title: "E2" },
  ];

  it("counts validated stories and distinct epics per node", () => {
    const bundle = computeNsmCoverage(
      metrics,
      [
        {
          id: "s1",
          title: "S1",
          context_label: null,
          epic_id: "e1",
          impacts_north_star: false,
          impact_metric_id: "eff-leaf",
          status: "validated",
        },
        {
          id: "s2",
          title: "S2",
          context_label: null,
          epic_id: "e1",
          impacts_north_star: false,
          impact_metric_id: "eff-leaf",
          status: "validated",
        },
        {
          id: "s3",
          title: "S3",
          context_label: null,
          epic_id: null,
          impacts_north_star: true,
          impact_metric_id: null,
          status: "validated",
        },
        {
          id: "s4",
          title: "Proposed",
          context_label: null,
          epic_id: "e2",
          impacts_north_star: false,
          impact_metric_id: "breadth-root",
          status: "proposed",
        },
      ],
      epics
    );

    expect(bundle.nodes["eff-leaf"].storyCount).toBe(2);
    expect(bundle.nodes["eff-leaf"].epicCount).toBe(1);
    expect(bundle.nodes["eff-root"].storyCount).toBe(2);
    expect(bundle.nodes[NSM_COVERAGE_KEY].storyCount).toBe(1);
    expect(bundle.nodes[NSM_COVERAGE_KEY].epicCount).toBe(0);
    expect(bundle.nodes["breadth-root"].storyCount).toBe(0);
  });
});

describe("computeNsmPortfolioKpis", () => {
  it("aggregates tree coverage stats", () => {
    const bundle = computeNsmCoverage(
      metrics,
      [
        {
          id: "s1",
          title: "S1",
          context_label: null,
          epic_id: "e1",
          impacts_north_star: false,
          impact_metric_id: "eff-leaf",
          status: "validated",
        },
      ],
      [{ id: "e1", title: "E1" }]
    );

    const kpis = computeNsmPortfolioKpis(bundle, metrics);
    expect(kpis.totalMetricNodes).toBe(4);
    expect(kpis.coveredMetricNodes).toBe(2);
    expect(kpis.orphanMetricNodes).toBe(2);
    expect(kpis.storiesWithCoverage).toBe(1);
  });
});
