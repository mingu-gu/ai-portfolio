#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const COURSE = "semiclass-brand-website-vibecoding";
const STATE_DIR = ".semiclass";
const STATE_FILE = "brand-vibecoding-progress.json";
const MARKDOWN_FILE = "brand-vibecoding-progress.md";
const VERSION = 1;

const ROADMAP = [
  {
    id: "prepare",
    label: "준비",
    doneMeans: "계정, 브리프, 프로젝트 폴더가 준비됨",
    next: "5줄 브리프를 쓰고 프로젝트 폴더를 연다.",
  },
  {
    id: "local",
    label: "로컬 구현",
    doneMeans: "웹사이트 파일이 로컬 프로젝트에 존재함",
    next: "AI 코딩 에이전트로 첫 화면과 섹션을 만든다.",
  },
  {
    id: "preview",
    label: "미리보기",
    doneMeans: "로컬 URL이나 브라우저에서 화면을 확인함",
    next: "dev server를 열고 가장 크게 깨진 화면을 고친다.",
  },
  {
    id: "content",
    label: "내용/디자인",
    doneMeans: "카피, 섹션, 스타일, 모바일을 1차 수정함",
    next: "섹션 순서, 문구, 모바일 줄바꿈을 확인한다.",
  },
  {
    id: "git",
    label: "Git 저장",
    doneMeans: "Git 저장소와 최소 1개 commit이 있음",
    next: "git status를 보고 첫 commit을 만든다.",
  },
  {
    id: "github",
    label: "GitHub 연결",
    doneMeans: "GitHub remote가 연결되고 push 준비가 됨",
    next: "GitHub repo를 만들고 origin remote로 push한다.",
  },
  {
    id: "vercel",
    label: "Vercel 배포",
    doneMeans: "Vercel 프로젝트 또는 공개 URL이 있음",
    next: "Vercel에서 GitHub repo를 import하고 빌드 로그를 확인한다.",
  },
  {
    id: "qa",
    label: "URL 확인",
    doneMeans: "공개 URL을 데스크톱과 모바일에서 확인함",
    next: "휴대폰에서 URL을 열고 링크와 CTA를 확인한다.",
  },
  {
    id: "next",
    label: "Supabase 다음 확장",
    doneMeans: "DB, Auth, Storage는 다음 수업 범위로 분리함",
    next: "저장해야 할 데이터와 로그인 필요성을 메모만 한다.",
    locked: true,
  },
];

const STATUS_LABEL = {
  todo: "대기",
  doing: "진행",
  done: "완료",
  blocked: "막힘",
  locked: "잠금",
};

function usage() {
  console.log(`Usage:
  progress.mjs init [projectRoot]
  progress.mjs scan [projectRoot]
  progress.mjs show [projectRoot]
  progress.mjs set [projectRoot] <stage-id> <todo|doing|done|blocked|locked> [note]
  progress.mjs url [projectRoot] <public-url>
  progress.mjs reset [projectRoot]
`);
}

function isDirectoryLike(value) {
  return value === "." || value === ".." || value.startsWith("/") || value.startsWith("./") || value.startsWith("../");
}

function parseRoot(args, defaultRoot = ".") {
  if (args[0] && isDirectoryLike(args[0])) {
    return { root: resolve(args[0]), rest: args.slice(1) };
  }
  return { root: resolve(defaultRoot), rest: args };
}

function statePaths(root) {
  const dir = join(root, STATE_DIR);
  return {
    dir,
    json: join(dir, STATE_FILE),
    markdown: join(dir, MARKDOWN_FILE),
  };
}

function defaultState() {
  return {
    version: VERSION,
    course: COURSE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publicUrl: null,
    stages: ROADMAP.map((stage) => ({
      id: stage.id,
      status: stage.locked ? "locked" : "todo",
      note: "",
      updatedAt: null,
    })),
    signals: {},
  };
}

function loadState(root) {
  const paths = statePaths(root);
  if (!existsSync(paths.json)) return defaultState();
  const parsed = JSON.parse(readFileSync(paths.json, "utf8"));
  const byId = new Map((parsed.stages ?? []).map((stage) => [stage.id, stage]));
  parsed.stages = ROADMAP.map((stage) => ({
    id: stage.id,
    status: byId.get(stage.id)?.status ?? (stage.locked ? "locked" : "todo"),
    note: byId.get(stage.id)?.note ?? "",
    updatedAt: byId.get(stage.id)?.updatedAt ?? null,
  }));
  parsed.version = VERSION;
  parsed.course = COURSE;
  parsed.signals = parsed.signals ?? {};
  return parsed;
}

function saveState(root, state) {
  const paths = statePaths(root);
  mkdirSync(paths.dir, { recursive: true });
  state.updatedAt = new Date().toISOString();
  writeFileSync(paths.json, JSON.stringify(state, null, 2) + "\n");
  writeFileSync(paths.markdown, renderMarkdown(state) + "\n");
  return paths;
}

function runGit(root, args) {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function listFilesSafe(dir) {
  try {
    return readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function hasAnySourceFile(root) {
  const candidates = [
    "index.html",
    "src",
    "app",
    "pages",
    "components",
    "public",
    "main.js",
    "style.css",
  ];
  return candidates.some((item) => existsSync(join(root, item)));
}

function detectSignals(root, state) {
  const packagePath = join(root, "package.json");
  let pkg = null;
  if (existsSync(packagePath)) {
    try {
      pkg = JSON.parse(readFileSync(packagePath, "utf8"));
    } catch {
      pkg = {};
    }
  }
  const hasGitDir = existsSync(join(root, ".git"));
  const head = hasGitDir ? runGit(root, ["rev-parse", "--verify", "HEAD"]) : "";
  const remote = hasGitDir ? runGit(root, ["config", "--get", "remote.origin.url"]) : "";
  const rootFiles = listFilesSafe(root).map((entry) => entry.name);
  const vercelProject = existsSync(join(root, ".vercel", "project.json"));
  const sourceFiles = hasAnySourceFile(root);
  return {
    packageJson: Boolean(pkg),
    packageName: pkg?.name ?? null,
    devScript: Boolean(pkg?.scripts?.dev),
    buildScript: Boolean(pkg?.scripts?.build),
    sourceFiles,
    rootFiles: rootFiles.slice(0, 30),
    gitDir: hasGitDir,
    gitCommit: Boolean(head),
    gitRemote: remote || null,
    githubRemote: /github\.com[:/]/i.test(remote),
    vercelProject,
    publicUrl: state.publicUrl ?? null,
  };
}

function rankStatus(status) {
  return { locked: -1, todo: 0, doing: 1, blocked: 1, done: 2 }[status] ?? 0;
}

function mergeAuto(stage, nextStatus, note = "") {
  if (stage.status === "done") return;
  if (stage.status === "blocked" && nextStatus !== "done") return;
  if (rankStatus(nextStatus) >= rankStatus(stage.status)) {
    stage.status = nextStatus;
    if (note && !stage.note) stage.note = note;
    stage.updatedAt = new Date().toISOString();
  }
}

function applyScan(state, signals) {
  const byId = new Map(state.stages.map((stage) => [stage.id, stage]));
  if (signals.packageJson || signals.sourceFiles) mergeAuto(byId.get("prepare"), "done", "프로젝트 파일 감지");
  else mergeAuto(byId.get("prepare"), "doing", "브리프와 프로젝트 폴더 준비 필요");

  if (signals.packageJson || signals.sourceFiles) mergeAuto(byId.get("local"), "done", "로컬 파일 감지");
  if (signals.packageJson && signals.devScript) mergeAuto(byId.get("preview"), "doing", "dev script 감지, 화면 확인 필요");
  if (signals.sourceFiles) mergeAuto(byId.get("content"), "doing", "카피와 반응형 확인 필요");

  if (signals.gitCommit) mergeAuto(byId.get("git"), "done", "Git commit 감지");
  else if (signals.gitDir) mergeAuto(byId.get("git"), "doing", "Git 저장소 감지, commit 필요");

  if (signals.githubRemote) mergeAuto(byId.get("github"), "done", "GitHub remote 감지");
  else if (signals.gitRemote) mergeAuto(byId.get("github"), "doing", "remote 감지, GitHub 여부 확인 필요");

  if (signals.vercelProject || signals.publicUrl) mergeAuto(byId.get("vercel"), "done", "Vercel 프로젝트 또는 URL 감지");
  else if (byId.get("github")?.status === "done") mergeAuto(byId.get("vercel"), "doing", "Vercel import 필요");

  if (signals.publicUrl && byId.get("qa")?.status !== "done") {
    mergeAuto(byId.get("qa"), "doing", "공개 URL 기록됨, 모바일/링크 확인 필요");
  }

  byId.get("next").status = "locked";
  byId.get("next").note = "이번 수업에서는 Supabase 구현을 시작하지 않음";
  state.signals = signals;
}

function currentStage(state) {
  return state.stages.find((stage) => !["done", "locked"].includes(stage.status)) ?? state.stages.find((stage) => stage.id === "qa");
}

function progressBar(status) {
  if (status === "done") return "██████████";
  if (status === "doing") return "█████░░░░░";
  if (status === "blocked") return "███!░░░░░░";
  if (status === "locked") return "잠금";
  return "░░░░░░░░░░";
}

function completionPercent(state) {
  const active = state.stages.filter((stage) => stage.id !== "next");
  const done = active.filter((stage) => stage.status === "done").length;
  return Math.round((done / active.length) * 100);
}

function renderMarkdown(state) {
  const byId = new Map(ROADMAP.map((stage) => [stage.id, stage]));
  const current = currentStage(state);
  const currentMeta = byId.get(current?.id);
  const lines = [];
  lines.push("# SemiClass Brand Website Progress");
  lines.push("");
  lines.push(`- Course: ${COURSE}`);
  lines.push(`- Updated: ${state.updatedAt ?? new Date().toISOString()}`);
  lines.push(`- Overall: ${completionPercent(state)}%`);
  if (state.publicUrl) lines.push(`- Public URL: ${state.publicUrl}`);
  lines.push("");
  lines.push(`## Current`);
  lines.push("");
  lines.push(`현재 위치: ${current ? `${ROADMAP.findIndex((s) => s.id === current.id) + 1} / 8 - ${currentMeta?.label}` : "완료"}`);
  if (current?.note) lines.push(`메모: ${current.note}`);
  lines.push("");
  lines.push("## Roadmap");
  lines.push("");
  lines.push("| # | Stage | Status | Progress | Done means | Next action |");
  lines.push("|---:|---|---|---|---|---|");
  state.stages.forEach((stage, index) => {
    const meta = byId.get(stage.id);
    const number = stage.id === "next" ? "9" : String(index + 1);
    lines.push(`| ${number} | ${meta.label} | ${STATUS_LABEL[stage.status] ?? stage.status} | ${progressBar(stage.status)} | ${meta.doneMeans} | ${stage.status === "done" ? "다음 단계로 이동" : meta.next} |`);
  });
  lines.push("");
  lines.push("## Signals");
  lines.push("");
  const signals = state.signals ?? {};
  for (const key of ["packageJson", "devScript", "buildScript", "sourceFiles", "gitDir", "gitCommit", "gitRemote", "githubRemote", "vercelProject"]) {
    lines.push(`- ${key}: ${signals[key] ?? false}`);
  }
  lines.push("");
  lines.push("## Agent Commands");
  lines.push("");
  lines.push("```bash");
  lines.push("node <skill-folder>/scripts/progress.mjs scan .");
  lines.push("node <skill-folder>/scripts/progress.mjs set . preview done \"로컬 화면 확인 완료\"");
  lines.push("node <skill-folder>/scripts/progress.mjs url . https://your-site.vercel.app");
  lines.push("```");
  return lines.join("\n");
}

function setStage(root, args) {
  const [stageId, status, ...noteParts] = args;
  if (!stageId || !status) {
    usage();
    process.exit(1);
  }
  const allowed = new Set(["todo", "doing", "done", "blocked", "locked"]);
  if (!allowed.has(status)) throw new Error(`Invalid status: ${status}`);
  const state = loadState(root);
  const stage = state.stages.find((item) => item.id === stageId);
  if (!stage) throw new Error(`Unknown stage id: ${stageId}`);
  stage.status = status;
  stage.note = noteParts.join(" ").trim();
  stage.updatedAt = new Date().toISOString();
  if (stageId === "next" && status !== "locked") {
    stage.note = stage.note || "Instructor explicitly opened next-step expansion.";
  }
  const paths = saveState(root, state);
  console.log(paths.markdown);
}

function commandUrl(root, args) {
  const [publicUrl] = args;
  if (!publicUrl) {
    usage();
    process.exit(1);
  }
  const state = loadState(root);
  state.publicUrl = publicUrl;
  const vercel = state.stages.find((stage) => stage.id === "vercel");
  if (vercel) {
    vercel.status = "done";
    vercel.note = "공개 URL 기록";
    vercel.updatedAt = new Date().toISOString();
  }
  const qa = state.stages.find((stage) => stage.id === "qa");
  if (qa && qa.status !== "done") {
    qa.status = "doing";
    qa.note = "공개 URL을 모바일과 링크까지 확인 필요";
    qa.updatedAt = new Date().toISOString();
  }
  const paths = saveState(root, state);
  console.log(paths.markdown);
}

function scan(root) {
  const state = loadState(root);
  const signals = detectSignals(root, state);
  applyScan(state, signals);
  const paths = saveState(root, state);
  console.log(paths.markdown);
}

function show(root) {
  const state = loadState(root);
  const paths = saveState(root, state);
  console.log(readFileSync(paths.markdown, "utf8"));
}

function reset(root) {
  const paths = saveState(root, defaultState());
  console.log(paths.markdown);
}

try {
  const [command = "scan", ...rawArgs] = process.argv.slice(2);
  if (command === "help" || command === "--help" || command === "-h") {
    usage();
    process.exit(0);
  }

  if (command === "set") {
    const { root, rest } = parseRoot(rawArgs);
    setStage(root, rest);
  } else if (command === "url") {
    const { root, rest } = parseRoot(rawArgs);
    commandUrl(root, rest);
  } else if (command === "init" || command === "scan") {
    const { root } = parseRoot(rawArgs);
    scan(root);
  } else if (command === "show") {
    const { root } = parseRoot(rawArgs);
    show(root);
  } else if (command === "reset") {
    const { root } = parseRoot(rawArgs);
    reset(root);
  } else {
    usage();
    process.exit(1);
  }
} catch (error) {
  console.error(`progress.mjs error: ${error.message}`);
  process.exit(1);
}
