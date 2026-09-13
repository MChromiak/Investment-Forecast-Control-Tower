import { Router, type IRouter } from "express";
import { db, controlTowerStateTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  PerformControlTowerActionBody,
  ResetControlTowerBody,
} from "@workspace/api-zod";

const router: IRouter = Router();
const STATE_KEY = "investment-forecast-control-tower";
const BASE_TIME = Date.parse("2026-09-12T08:00:00.000Z");

type MoneyStatus = "Passed" | "Warning" | "Blocked" | "Requires Review";
type ForecastRecord = {
  id: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  wbs: string;
  description: string;
  component: string;
  period: string;
  actual: number;
  commitment: number;
  existing: number;
  proposed: number;
  movement: number;
  source: string;
  method: string;
  validation: MoneyStatus;
  exception: string;
  review: string;
  submission: string;
  confidence: string;
};

type DemoState = ReturnType<typeof createSeedState>;

const projectSeeds = [
  ["p-riverside", "PRJ-2048", "Riverside Cable Reinforcement", "Tier 2", "Amelia Hart"],
  ["p-northgate", "PRJ-1092", "Northgate Transmission Upgrade", "Tier 1", "Oliver Grant"],
  ["p-windermere", "PRJ-3104", "Windermere Substation Modernisation", "Tier 3", "Priya Shah"],
  ["p-eastborough", "PRJ-4188", "Eastborough Grid Resilience", "Tier 1", "Daniel Hughes"],
  ["p-severn", "PRJ-5120", "Severn Interconnector Programme", "Tier 2", "Sophie Bennett"],
  ["p-greenfield", "PRJ-6284", "Greenfield Battery Connection", "Tier 3", "Marcus Webb"],
] as const;

const components = [
  "Staff",
  "Purchase orders",
  "CVR",
  "Overheads",
  "Prepayments",
  "Risk and contingency",
];

function makeRecord(
  id: string,
  project: (typeof projectSeeds)[number],
  index: number,
  overrides: Partial<ForecastRecord> = {},
): ForecastRecord {
  const component = components[index % components.length]!;
  const existing = 120_000 + index * 13_500;
  const movement = (index % 4 - 1) * 8_000;
  return {
    id,
    projectId: project[0],
    projectCode: project[1],
    projectName: project[2],
    wbs: `${project[1].replace("PRJ-", "")}-${String((index % 6) + 1).padStart(2, "0")}`,
    description: `${component} forecast — work package ${(index % 6) + 1}`,
    component,
    period: ["Sep 2026", "Oct 2026", "Nov 2026", "Dec 2026"][index % 4]!,
    actual: Math.round(existing * 0.42),
    commitment: Math.round(existing * 0.31),
    existing,
    proposed: existing + movement,
    movement,
    source: `${project[2]} Monthly Forecast Pack.xlsx`,
    method: index % 3 === 0 ? "Rule-calculated" : "Auto-extracted",
    validation: "Passed",
    exception: "None",
    review: "Ready",
    submission: "Eligible",
    confidence: "High confidence",
    ...overrides,
  };
}

function createRecords() {
  const records: ForecastRecord[] = [];
  const windermere = projectSeeds[2];
  const riverside = projectSeeds[0];
  const northgate = projectSeeds[1];

  for (let i = 0; i < 18; i += 1) {
    records.push(makeRecord(`wind-${i + 1}`, windermere, i));
  }

  const riversidePeriods = ["Sep 2026", "Oct 2026", "Nov 2026", "Dec 2026"];
  const shifts = [-210_000, -210_000, 210_000, 210_000];
  for (let i = 0; i < 4; i += 1) {
    const existing = 650_000;
    records.push(
      makeRecord(`river-${i + 1}`, riverside, i, {
        wbs: "RCR-220-04",
        description: "Contractor CVR period rephasing",
        component: "CVR",
        period: riversidePeriods[i]!,
        existing,
        proposed: existing + shifts[i]!,
        movement: shifts[i]!,
        source: "Riverside Contractor CVR.xlsx",
        method: "AI-assisted",
        validation: "Requires Review",
        exception: "Material Forecast Movement",
        review: "Pending",
        submission: "Held",
      }),
    );
  }

  for (let i = 0; i < 24; i += 1) {
    const overrides: Partial<ForecastRecord> = {};
    if (i === 19) {
      Object.assign(overrides, {
        wbs: "NGT-INVALID-99",
        validation: "Blocked",
        exception: "Unmapped WBS",
        review: "Blocked",
        submission: "Blocked",
        confidence: "Unmapped",
      });
    }
    if (i === 20) {
      Object.assign(overrides, {
        validation: "Blocked",
        exception: "Duplicate Record",
        review: "Blocked",
        submission: "Blocked",
      });
    }
    if (i === 21) {
      Object.assign(overrides, {
        component: "Overlay",
        method: "Human judgement",
        validation: "Requires Review",
        exception: "Unexplained Overlay",
        review: "Clarification required",
        submission: "Held",
      });
    }
    if (i === 22) {
      Object.assign(overrides, {
        proposed: 520_000,
        movement: 260_000,
        method: "Human judgement",
        validation: "Requires Review",
        exception: "Material Forecast Movement",
        review: "Pending",
        submission: "Held",
      });
    }
    if (i === 23) {
      Object.assign(overrides, {
        proposed: 315_000,
        validation: "Blocked",
        exception: "Source Total Mismatch",
        review: "Blocked",
        submission: "Blocked",
      });
    }
    records.push(makeRecord(`north-${i + 1}`, northgate, i, overrides));
  }

  for (let p = 3; p < projectSeeds.length; p += 1) {
    for (let i = 0; i < 6; i += 1) {
      records.push(makeRecord(`${projectSeeds[p]![1]}-${i + 1}`, projectSeeds[p]!, i));
    }
  }
  return records;
}

function createSeedState() {
  const records = createRecords();
  const exceptions = [
    {
      id: "exc-river-rephase",
      projectId: "p-riverside",
      projectCode: "PRJ-2048",
      projectName: "Riverside Cable Reinforcement",
      wbs: "RCR-220-04",
      type: "Material Forecast Movement",
      severity: "High",
      component: "CVR",
      owner: "Finance Business Partner",
      status: "Open",
      title: "£420,000 period profile moved to later months",
      impact: 420_000,
      observation: "September and October values reduce while November and December increase by the same annual amount.",
      evidence: "Certified progress and actual-cost profile indicate later delivery.",
      recommendation: "Accept the period rephasing; annual forecast remains unchanged.",
      decision: "",
      clarification: "",
    },
    {
      id: "exc-invalid-wbs",
      projectId: "p-northgate",
      projectCode: "PRJ-1092",
      projectName: "Northgate Transmission Upgrade",
      wbs: "NGT-INVALID-99",
      type: "Unmapped WBS",
      severity: "Critical",
      component: "Purchase orders",
      owner: "Forecast Operations Analyst",
      status: "Open",
      title: "Source WBS is not active for this project",
      impact: 148_000,
      observation: "The source alias does not resolve to an active Northgate WBS.",
      evidence: "Forecast pack row 20; active WBS register.",
      recommendation: "Change mapping to NGT-1092-04 after confirming source evidence.",
      decision: "",
      clarification: "",
    },
    {
      id: "exc-duplicate",
      projectId: "p-northgate",
      projectCode: "PRJ-1092",
      projectName: "Northgate Transmission Upgrade",
      wbs: "1092-03",
      type: "Duplicate Record",
      severity: "High",
      component: "CVR",
      owner: "Investment Accountant",
      status: "Open",
      title: "Duplicate contractor forecast line",
      impact: 188_000,
      observation: "The same project, WBS, component and period appears twice.",
      evidence: "Forecast pack rows 14 and 21.",
      recommendation: "Exclude the duplicate line from submission.",
      decision: "",
      clarification: "",
    },
    {
      id: "exc-overlay",
      projectId: "p-northgate",
      projectCode: "PRJ-1092",
      projectName: "Northgate Transmission Upgrade",
      wbs: "1092-04",
      type: "Unexplained Overlay",
      severity: "High",
      component: "Overlay",
      owner: "Project Manager",
      status: "Awaiting project input",
      title: "Overlay requires rationale and approval",
      impact: 214_000,
      observation: "An overlay was submitted without the required business reason.",
      evidence: "Forecast Overlay Request.pdf; forecast pack row 22.",
      recommendation: "Request clarification, then route to Financial Controller.",
      decision: "",
      clarification: "",
    },
    {
      id: "exc-north-movement",
      projectId: "p-northgate",
      projectCode: "PRJ-1092",
      projectName: "Northgate Transmission Upgrade",
      wbs: "1092-05",
      type: "Material Forecast Movement",
      severity: "High",
      component: "Risk and contingency",
      owner: "Finance Business Partner",
      status: "Open",
      title: "Material risk provision movement",
      impact: 260_000,
      observation: "The movement exceeds the Tier 1 illustrative threshold.",
      evidence: "Risk and Contingency Register.xlsx.",
      recommendation: "Review evidence and route to Financial Controller.",
      decision: "",
      clarification: "",
    },
    {
      id: "exc-source-total",
      projectId: "p-northgate",
      projectCode: "PRJ-1092",
      projectName: "Northgate Transmission Upgrade",
      wbs: "1092-06",
      type: "Source Total Mismatch",
      severity: "Critical",
      component: "Prepayments",
      owner: "Forecast Operations Analyst",
      status: "Open",
      title: "Extracted rows do not reconcile to the source control total",
      impact: 35_000,
      observation: "Included extracted rows exceed the declared pack total by £35,000.",
      evidence: "Northgate Monthly Forecast Pack.xlsx control sheet.",
      recommendation: "Correct the extracted value and rerun reconciliation.",
      decision: "",
      clarification: "",
    },
  ];

  const documents = [
    ["doc-wind", "Windermere Monthly Forecast Pack.xlsx", "Forecast pack", "Windermere Substation Modernisation", 3_622_500, 3_622_500, 18, "Ready", "Passed"],
    ["doc-river", "Riverside Contractor CVR.xlsx", "CVR", "Riverside Cable Reinforcement", 2_600_000, 2_600_000, 4, "Requires review", "Warning"],
    ["doc-north", "Northgate Monthly Forecast Pack.xlsx", "Forecast pack", "Northgate Transmission Upgrade", 6_242_000, 6_277_000, 24, "Exceptions", "Blocked"],
    ["doc-staff", "Staff Forecast September.xlsx", "Staff plan", "Portfolio", 1_184_000, 1_184_000, 12, "Ready", "Passed"],
    ["doc-po", "Open Purchase Orders.csv", "Purchase orders", "Portfolio", 2_420_000, 2_420_000, 16, "Ready", "Passed"],
    ["doc-prepay", "Prepayment Schedule.xlsx", "Prepayments", "Portfolio", 680_000, 680_000, 8, "Ready", "Passed"],
    ["doc-risk", "Risk and Contingency Register.xlsx", "Risk", "Northgate Transmission Upgrade", 920_000, 920_000, 7, "Requires review", "Warning"],
    ["doc-overlay", "Forecast Overlay Request.pdf", "Overlay", "Northgate Transmission Upgrade", 214_000, 214_000, 1, "Clarification", "Requires Review"],
  ].map((d, index) => ({
    id: String(d[0]),
    name: String(d[1]),
    type: String(d[2]),
    projectName: String(d[3]),
    period: "September 2026",
    submitter: ["Priya Shah", "Oliver Grant", "Amelia Hart"][index % 3]!,
    date: `2026-09-${String(2 + index).padStart(2, "0")}`,
    sourceTotal: Number(d[4]),
    extractedTotal: Number(d[5]),
    records: Number(d[6]),
    status: String(d[7]),
    validation: String(d[8]),
  }));

  const scenarios = [
    {
      id: "scenario-1",
      name: "Streamlined Forecast Pack",
      project: "Windermere Substation Modernisation",
      description: "18 clean records progress from source pack to reconciled SAC receipt.",
      status: "Ready",
      currentStep: 0,
      steps: ["Portfolio", "Forecast Cycle", "Process pack", "Inspect evidence", "Review WBS", "Approve", "Prepare batch", "Approve batch", "Submit", "Receipt", "Audit package"],
    },
    {
      id: "scenario-2",
      name: "CVR Forecast Rephasing",
      project: "Riverside Cable Reinforcement",
      description: "£420,000 moves out and back in across periods with annual net zero.",
      status: "In review",
      currentStep: 0,
      steps: ["Process CVR", "Inspect mapping", "Open exception", "Compare evidence", "Accept recommendation", "Approve for SAC", "Approve batch", "Submit", "Receipt", "Audit package"],
    },
    {
      id: "scenario-3",
      name: "Forecast Pack with Exceptions",
      project: "Northgate Transmission Upgrade",
      description: "24 rows: 19 initially clean and five controlled exception conditions.",
      status: "Exceptions open",
      currentStep: 0,
      steps: ["Process pack", "Correct WBS", "Exclude duplicate", "Request clarification", "Respond", "Approve overlay", "Review movement", "Correct mismatch", "Complete approvals", "Approve batch", "Submit", "Audit package"],
    },
  ];

  const state = {
    meta: {
      activePeriod: "September 2026",
      persona: "Investment Accountant",
      environment: "Simulated Environment",
      currentScenario: "scenario-3",
      guidedDemo: false,
      playbackStep: 0,
    },
    metrics: {
      proposedForecast: 0,
      actualCost: 0,
      movement: 0,
      wbsRecords: 0,
      readyForSac: 0,
      openExceptions: 0,
      projectsInScope: 6,
      heldRecords: 0,
      blockedRecords: 0,
      excludedRecords: 0,
    },
    projects: [] as Array<Record<string, unknown>>,
    records,
    exceptions,
    documents,
    activity: [
      {
        id: "activity-1",
        time: "12 Sep 2026, 09:12",
        actor: "Forecast Orchestration",
        role: "System",
        action: "Validation completed",
        detail: "Northgate pack: 19 rows passed; five exception conditions created.",
        project: "Northgate Transmission Upgrade",
      },
      {
        id: "activity-2",
        time: "12 Sep 2026, 09:06",
        actor: "Amelia Hart",
        role: "Project Manager",
        action: "Evidence added",
        detail: "Updated certified progress evidence for Riverside CVR rephasing.",
        project: "Riverside Cable Reinforcement",
      },
      {
        id: "activity-3",
        time: "12 Sep 2026, 08:54",
        actor: "Priya Shah",
        role: "Investment Accountant",
        action: "Forecast pack processed",
        detail: "Windermere totals reconciled with 18 records ready for review.",
        project: "Windermere Substation Modernisation",
      },
    ],
    batch: {
      id: "SAC-SEP26-DRAFT-001",
      status: "Draft",
      approved: false,
      submitted: false,
      value: 0,
      ready: 0,
      held: 0,
      blocked: 0,
      excluded: 0,
      unresolvedBlockers: 0,
      submittedAt: null as string | null,
      receipt: null as string | null,
    },
    config: {
      label: "Illustrative Demo Rules",
      thresholds: {
        "Tier 1": "Greater than £100,000 or 10%",
        "Tier 2": "Greater than £150,000 or 15%",
        "Tier 3": "Greater than £250,000 or 20%",
      },
      overheadRate: 7.5,
      allowedCurrency: "GBP",
      periods: ["Sep 2026", "Oct 2026", "Nov 2026", "Dec 2026"],
    },
    scenarios,
  };
  return recalculate(state);
}

function recalculate(state: any) {
  for (const record of state.records as ForecastRecord[]) {
    record.movement = record.proposed - record.existing;
  }
  state.projects = projectSeeds.map(([id, code, name, tier, owner]) => {
    const records = state.records.filter((record: ForecastRecord) => record.projectId === id);
    const actuals = records.reduce((sum: number, record: ForecastRecord) => sum + record.actual, 0);
    const existingForecast = records.reduce((sum: number, record: ForecastRecord) => sum + record.existing, 0);
    const proposedForecast = records.reduce((sum: number, record: ForecastRecord) => sum + record.proposed, 0);
    const exceptionCount = state.exceptions.filter(
      (exception: any) => exception.projectId === id && exception.status !== "Resolved",
    ).length;
    const blocked = records.some((record: ForecastRecord) => record.submission === "Blocked");
    const held = records.some((record: ForecastRecord) => record.submission === "Held");
    return {
      id,
      code,
      name,
      tier,
      owner,
      actuals,
      existingForecast,
      proposedForecast,
      movement: proposedForecast - existingForecast,
      exceptions: exceptionCount,
      readiness: blocked ? "Blocked" : held ? "Requires review" : "Ready for SAC",
      wbsCount: new Set(records.map((record: ForecastRecord) => record.wbs)).size,
      status: blocked ? "Requires Review" : "Processing",
    };
  });
  const eligible = state.records.filter(
    (record: ForecastRecord) => record.submission === "Eligible" || record.submission === "Approved",
  );
  state.metrics = {
    proposedForecast: state.records.reduce((sum: number, record: ForecastRecord) => sum + record.proposed, 0),
    actualCost: state.records.reduce((sum: number, record: ForecastRecord) => sum + record.actual, 0),
    movement: state.records.reduce((sum: number, record: ForecastRecord) => sum + record.movement, 0),
    wbsRecords: state.records.length,
    readyForSac: eligible.length,
    openExceptions: state.exceptions.filter((exception: any) => exception.status !== "Resolved").length,
    projectsInScope: projectSeeds.length,
    heldRecords: state.records.filter((record: ForecastRecord) => record.submission === "Held").length,
    blockedRecords: state.records.filter((record: ForecastRecord) => record.submission === "Blocked").length,
    excludedRecords: state.records.filter((record: ForecastRecord) => record.submission === "Excluded").length,
  };
  state.batch.ready = eligible.length;
  state.batch.held = state.metrics.heldRecords;
  state.batch.blocked = state.metrics.blockedRecords;
  state.batch.excluded = state.metrics.excludedRecords;
  state.batch.unresolvedBlockers = state.metrics.blockedRecords;
  state.batch.value = eligible.reduce((sum: number, record: ForecastRecord) => sum + record.proposed, 0);
  return state;
}

async function loadState(): Promise<DemoState> {
  const [row] = await db
    .select()
    .from(controlTowerStateTable)
    .where(eq(controlTowerStateTable.key, STATE_KEY))
    .limit(1);
  if (row) return recalculate(row.value as DemoState);
  const state = createSeedState();
  await saveState(state);
  return state;
}

async function saveState(state: DemoState) {
  await db
    .insert(controlTowerStateTable)
    .values({ key: STATE_KEY, value: recalculate(state) })
    .onConflictDoUpdate({
      target: controlTowerStateTable.key,
      set: { value: recalculate(state), updatedAt: new Date() },
    });
}

function addAudit(state: any, action: string, detail: string, project = "Portfolio") {
  const sequence = state.activity.length + 1;
  const timestamp = new Date(BASE_TIME + sequence * 60_000);
  state.activity.unshift({
    id: `activity-${sequence}`,
    time: timestamp.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/London",
    }),
    actor: state.meta.persona,
    role: state.meta.persona,
    action,
    detail,
    project,
  });
}

router.get("/control-tower", async (_req, res, next) => {
  try {
    res.json(await loadState());
  } catch (error) {
    next(error);
  }
});

router.post("/control-tower/actions", async (req, res, next) => {
  try {
    const input = PerformControlTowerActionBody.parse(req.body);
    const state: any = await loadState();
    const record = input.recordId
      ? state.records.find((item: ForecastRecord) => item.id === input.recordId)
      : undefined;
    const exception = input.exceptionId
      ? state.exceptions.find((item: any) => item.id === input.exceptionId)
      : undefined;
    const reason = input.reason?.trim() || "Demo workflow action";

    switch (input.action) {
      case "set-persona":
        state.meta.persona = reason;
        addAudit(state, "Persona changed", `Active persona changed to ${reason}.`);
        break;
      case "toggle-guided-demo":
        state.meta.guidedDemo = !state.meta.guidedDemo;
        break;
      case "next-step": {
        const scenario = state.scenarios.find((item: any) => item.id === state.meta.currentScenario);
        if (scenario) {
          scenario.currentStep = Math.min(scenario.currentStep + 1, scenario.steps.length - 1);
          state.meta.playbackStep = scenario.currentStep;
        }
        break;
      }
      case "previous-step": {
        const scenario = state.scenarios.find((item: any) => item.id === state.meta.currentScenario);
        if (scenario) {
          scenario.currentStep = Math.max(scenario.currentStep - 1, 0);
          state.meta.playbackStep = scenario.currentStep;
        }
        break;
      }
      case "select-scenario":
        if (input.scenarioId) {
          state.meta.currentScenario = input.scenarioId;
          const scenario = state.scenarios.find((item: any) => item.id === input.scenarioId);
          state.meta.playbackStep = scenario?.currentStep ?? 0;
        }
        break;
      case "accept-recommendation":
        if (exception) {
          exception.status = "Recommendation accepted";
          exception.decision = reason;
          addAudit(state, "Recommendation accepted", reason, exception.projectName);
        }
        break;
      case "reject-recommendation":
        if (exception) {
          exception.status = "Open";
          exception.decision = `Recommendation rejected: ${reason}`;
          addAudit(state, "Recommendation rejected", reason, exception.projectName);
        }
        break;
      case "request-clarification":
        if (exception) {
          exception.status = "Awaiting project input";
          exception.clarification = reason;
          if (record) {
            record.review = "Clarification required";
            record.submission = "Held";
          }
          addAudit(state, "Clarification requested", reason, exception.projectName);
        }
        break;
      case "respond-clarification":
        if (exception) {
          exception.status = "Finance review";
          exception.clarification = `Response received: ${reason}`;
          addAudit(state, "Clarification response received", reason, exception.projectName);
        }
        break;
      case "escalate":
        if (exception) {
          exception.status = "Escalated";
          exception.owner = "Financial Controller";
          addAudit(state, "Exception escalated", reason, exception.projectName);
        }
        break;
      case "resolve-exception":
      case "correct-wbs":
      case "correct-mismatch":
        if (exception) {
          exception.status = "Resolved";
          exception.decision = reason;
          const linked = state.records.find(
            (item: ForecastRecord) =>
              item.projectId === exception.projectId &&
              (item.wbs === exception.wbs || item.exception === exception.type),
          );
          if (linked) {
            if (input.action === "correct-wbs") linked.wbs = "1092-04";
            if (input.action === "correct-mismatch" && input.value != null) linked.proposed = input.value;
            linked.validation = "Passed";
            linked.exception = "None";
            linked.review = "Ready";
            linked.submission = "Eligible";
          }
          addAudit(state, "Exception resolved", reason, exception.projectName);
        }
        break;
      case "exclude-record":
        if (record) {
          record.submission = "Excluded";
          record.review = "Excluded with reason";
          addAudit(state, "Record excluded", reason, record.projectName);
        }
        if (exception) {
          exception.status = "Resolved";
          exception.decision = `Excluded: ${reason}`;
        }
        break;
      case "edit-value":
        if (record && input.value != null) {
          const prior = record.proposed;
          record.proposed = input.value;
          record.method = "Manual correction";
          record.review = "Pending approval";
          record.submission = "Held";
          addAudit(state, "Proposed value edited", `${reason}. Prior £${prior}; new £${input.value}.`, record.projectName);
        }
        break;
      case "approve-record":
        if (record) {
          record.review = "Approved";
          record.submission = "Approved";
          if (exception) {
            exception.status = "Resolved";
            exception.decision = reason;
          }
          addAudit(state, "Approved for SAC", reason, record.projectName);
        }
        break;
      case "approve-batch":
        if (state.batch.unresolvedBlockers === 0) {
          state.batch.approved = true;
          state.batch.status = "Approved";
          addAudit(state, "Batch approved", reason);
        }
        break;
      case "submit-batch":
        if (state.batch.approved && state.batch.unresolvedBlockers === 0) {
          state.batch.submitted = true;
          state.batch.status = "Submitted to SAC — simulated";
          state.batch.submittedAt = "2026-09-12T11:30:00.000Z";
          state.batch.receipt = "SAC-DEMO-SEP26-0001";
          addAudit(state, "Simulated SAC submission completed", `Receipt ${state.batch.receipt}.`);
        }
        break;
      case "process-document": {
        const document = state.documents.find((item: any) => item.id === input.recordId);
        if (document) {
          document.status = document.validation === "Passed" ? "Ready" : "Exceptions";
          addAudit(state, "Source document processed", `${document.records} records extracted and validated.`, document.projectName);
        }
        break;
      }
      case "restore-rules":
        state.config = createSeedState().config;
        addAudit(state, "Default demo rules restored", reason);
        break;
      case "update-overhead-rate":
        if (input.value != null) {
          state.config.overheadRate = input.value;
          addAudit(state, "Configuration changed", `${reason}. Overhead rate set to ${input.value}%.`);
        }
        break;
      default:
        res.status(400).json({ error: `Unsupported action: ${input.action}` });
        return;
    }
    await saveState(state);
    res.json(recalculate(state));
  } catch (error) {
    next(error);
  }
});

router.post("/control-tower/reset", async (req, res, next) => {
  try {
    const input = ResetControlTowerBody.parse(req.body ?? {});
    let state: any = await loadState();
    if (input.scope === "playback") {
      for (const scenario of state.scenarios) scenario.currentStep = 0;
      state.meta.playbackStep = 0;
      state.meta.guidedDemo = true;
    } else {
      const persona = state.meta.persona;
      state = createSeedState();
      state.meta.persona = persona;
      if (input.scope === "scenario" && input.scenarioId) {
        state.meta.currentScenario = input.scenarioId;
      }
    }
    addAudit(state, input.scope === "playback" ? "Playback restarted" : "Demo data reset", `Reset scope: ${input.scope ?? "demo"}.`);
    await saveState(state);
    res.json(state);
  } catch (error) {
    next(error);
  }
});

router.get("/control-tower/audit-package", async (_req, res, next) => {
  try {
    const state = await loadState();
    res.json({
      generatedAt: "2026-09-12T12:00:00.000Z",
      reference: state.batch.receipt ?? "AUDIT-SEP26-DRAFT-001",
      summary: {
        period: state.meta.activePeriod,
        proposedForecast: state.metrics.proposedForecast,
        readyRecords: state.metrics.readyForSac,
        openExceptions: state.metrics.openExceptions,
        batchStatus: state.batch.status,
      },
      events: state.activity,
    });
  } catch (error) {
    next(error);
  }
});

export default router;