"use client";

import { Dialog } from "@base-ui/react/dialog";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { canvasWorkload, getGradeOutlook, WorkloadRequestError, type WorkloadCourse } from "@/lib/course-workload";
import { demoWorkload } from "@/lib/demo-workload";
import { simulate, type Outlook } from "@/lib/grade-outlook";

const field = "mt-2 block w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base";
const card = "rounded-3xl border border-border/70 bg-card p-5 sm:p-8";
const format = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 1 });
const valid = (value: string) => value.trim() !== "" && Number.isFinite(+value) && +value >= 0 && +value <= 100;

async function demoModel(id: string): Promise<Outlook> {
  const { assignments } = await demoWorkload.getRankableAssignments(id);
  const total = assignments.reduce((sum, a) => sum + (a.pointsPossible || 1), 0);
  return { fixed: 54, history: { demo: [72, 80, 87, 92, 98] }, remaining: assignments.map(a => ({
    id: a.assignmentId, name: a.assignmentName, groupId: "demo",
    share: 0.4 * (a.pointsPossible || 1) / total, actionable: true,
  })).sort((a,b) => b.share - a.share) };
}

function OutlookInfo() {
  return <Dialog.Root>
    <Dialog.Trigger aria-label="How Grade Outlook works" title="How Grade Outlook works"
      className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
      <span aria-hidden="true" className="grid size-5 place-items-center rounded-full border border-current font-serif text-sm font-bold">i</span>
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Backdrop className="dialog-backdrop fixed inset-0 z-50" />
      <Dialog.Popup className="dialog-panel fixed left-1/2 top-1/2 z-50 max-h-[85dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-2xl">
        <Dialog.Title className="text-xl font-semibold tracking-tight">How Grade Outlook works</Dialog.Title>
        <Dialog.Description className="mt-3 text-sm leading-relaxed">Pick a target course grade. Axiom keeps your posted scores and tries 4,000 combinations of scores on your remaining work. It uses your past grades or a score range you enter, then counts how often you reach your target.</Dialog.Description>
        <p className="my-4 rounded-xl bg-muted p-4 text-sm leading-relaxed"><strong>Example.</strong> If your target is 90% and you reach it in 3,000 of those 4,000 tries, your estimated chance is 75%. Use “Try a score” to see how earning 95% on your final would change that estimate.</p>
        <Dialog.Close className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background">Got it</Dialog.Close>
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>;
}

function Workspace() {
  const params = useSearchParams();
  const demo = params.get("demo") === "1";
  const preferred = params.get("course");
  const workload = demo ? demoWorkload : canvasWorkload;
  const [courses, setCourses] = useState<WorkloadCourse[]>([]);
  const [course, setCourse] = useState("");
  const [message, setMessage] = useState("Loading courses…");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const ctrl = new AbortController();
    workload.getWorkloadCourses(ctrl.signal).then(({ courses }) => {
      if (ctrl.signal.aborted) return;
      const visible = courses.filter(c => !c.hidden);
      setCourses(visible);
      setCourse(visible.find(c => c.courseId === preferred)?.courseId ?? visible[0]?.courseId ?? "");
      setMessage(visible.length ? "" : "No visible courses are available.");
    }).catch(e => {
      if (!ctrl.signal.aborted) setMessage(e instanceof WorkloadRequestError && e.status === 401 ? "Sign in to see your courses." : "Couldn’t load your courses.");
    });
    return () => ctrl.abort();
  }, [workload, preferred, attempt]);
  return <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-8 sm:py-12">
    <header><div className="flex items-center gap-2"><h1 className="text-4xl font-semibold tracking-tight">Grade Outlook</h1><OutlookInfo /></div>
      <p className="mt-2 text-muted-foreground">{demo ? "Sample course forecast" : "Explore where your grade could land."}</p></header>
    {courses.length > 0 && <label className="block text-sm font-medium">Course<select className={field} value={course} onChange={e => setCourse(e.target.value)}>
      {courses.map(c => <option key={c.courseId} value={c.courseId}>{c.courseName}</option>)}</select></label>}
    {message && <p role="status">{message} {message.startsWith("Sign in") ? <Link className="underline" href="/">Sign in</Link> : message.startsWith("Couldn") && <button className="underline" onClick={() => setAttempt(attempt+1)}>Retry</button>}</p>}
    {course && <Course key={course + demo} id={course} demo={demo}/>}
  </div>;
}

function Course({ id, demo }: { id: string; demo: boolean }) {
  const [model, setModel] = useState<Outlook | { reason: string }>();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const ctrl = new AbortController();
    (demo ? demoModel(id) : getGradeOutlook(id, ctrl.signal)).then(data => {
      if (!ctrl.signal.aborted) setModel(data);
    }).catch(() => { if (!ctrl.signal.aborted) setFailed(true); });
    return () => ctrl.abort();
  }, [id, demo, attempt]);
  if (failed) return <p role="alert">Couldn’t load this gradebook. <button className="underline" onClick={() => {setFailed(false); setAttempt(attempt+1);}}>Retry</button></p>;
  if (!model) return <p role="status">Loading gradebook…</p>;
  if ("reason" in model) return <p className={card}>{model.reason}</p>;
  if (!model.remaining.length) return <p className={card}>All visible coursework is graded. Your grade is <strong>{format(model.fixed)}%</strong>.</p>;
  return <Forecast model={model} course={id} demo={demo}/>;
}

function Forecast({ model, course, demo }: { model: Outlook; course: string; demo: boolean }) {
  const sparse = model.remaining.some(a => model.history[a.groupId].length < 3);
  const [custom, setCustom] = useState(sparse);
  const [low, setLow] = useState("");
  const [high, setHigh] = useState("");
  const [target, setTarget] = useState("90");
  const choices = model.remaining.filter(a => a.actionable);
  const [selected, setSelected] = useState(choices[0]?.id ?? "");
  const [score, setScore] = useState(90);
  const [focus, setFocus] = useState<Record<string,string>>({});
  const maximum = model.fixed + model.remaining.reduce((sum,a) => sum + a.share * 100, 0);
  const ready = valid(target) && (!custom || (valid(low) && valid(high) && +low <= +high));
  const result = useMemo(() => ready ? simulate(model,+target,selected,score,custom ? [+low,+high] : undefined) : null,
    [model, target, selected, score, custom, low, high, ready]);
  async function save() {
    const id = selected;
    setFocus(prev => ({ ...prev, [id]: "Saving…" }));
    try {
      await (demo ? demoWorkload : canvasWorkload).saveAssignmentFocus(course,id,true);
      setFocus(prev => ({ ...prev, [id]: "Added to Focus List" }));
    } catch { setFocus(prev => ({ ...prev, [id]: "Retry adding to Focus List" })); }
  }
  return <>
    <section className={card}>
      <label className="flex items-center justify-between gap-3 text-sm font-medium">Target course grade (%)
        <input className={field + " mt-0 max-w-24"} type="number" min="0" max="100" step="any" value={target} onChange={e => setTarget(e.target.value)}/></label>
      <div className="my-6 border-t border-border/60"/>
      {!valid(target) ? <p>Enter a target from 0 to 100%.</p> : +target > maximum + 1e-9 ? <p>The highest possible grade on visible coursework is <strong>{format(maximum)}%</strong>.</p> : +target <= model.fixed + 1e-9 ? <p>Your posted scores already secure this target on visible coursework.</p> : result ? <>
        <p className="text-sm text-muted-foreground">Chance of reaching {target}%</p>
        <p className="my-2 text-6xl font-semibold tracking-tight tabular-nums">{Math.round(result.chance)}%</p>
        <figure className="my-5" aria-label="Distribution of simulated course grades">
          <div aria-hidden="true" className="flex h-16 items-end gap-0.5 border-b border-border">
            {result.bins.map((count, index) => <div key={index} className={`flex-1 rounded-t-sm ${result.start + index * result.width >= +target ? "bg-emerald-600" : "bg-muted-foreground/35"}`}
              style={{ height: `${100 * count / Math.max(...result.bins)}%` }}/>)}
          </div>
          <figcaption className="mt-1 flex justify-between text-xs text-muted-foreground"><span>{result.start}%</span><span>Simulated course grades</span><span>{result.start + result.width * result.bins.length}%</span></figcaption>
        </figure>
        <p>The middle 80% of simulated grades span <strong>{format(result.low)}–{format(result.high)}%</strong>.</p>
      </> : <p>Enter an expected score range below to see your outlook.</p>}
      <p className="mt-5 text-xs text-muted-foreground">Based on {model.remaining.length} ungraded {model.remaining.length === 1 ? "assignment" : "assignments"} visible in this course.</p>
    </section>
    <details className={card} open={sparse || undefined}><summary className="cursor-pointer font-medium">Score assumptions</summary>
      <p className="mt-3 text-sm text-muted-foreground">{sparse ? "There are too few comparable grades. Enter a range for your remaining scores." : "Each trial draws a score from past grades in the same grading group. Points-based courses use course-wide history."} Each assignment is sampled independently across 4,000 trials.</p>
      {!sparse && <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={custom} onChange={e => setCustom(e.target.checked)}/>Use my own score range</label>}
      {custom && <><div className="mt-4 grid grid-cols-2 gap-3">{(["Low","High"] as const).map(label => <label key={label} className="text-sm">{label} score (%)<input className={field} type="number" min="0" max="100" value={label === "Low" ? low : high} onChange={e => (label === "Low" ? setLow : setHigh)(e.target.value)}/></label>)}</div>
      <p className="mt-2 text-xs text-muted-foreground">Scores across this range are equally likely. Enter values from 0 to 100 with the low score first.</p></>}
    </details>
    {choices.length > 0 && <section className={card}><h2 className="text-xl font-semibold tracking-tight">Try a score</h2>
      <label className="mt-4 block text-sm">Assignment · highest grade impact first<select className={field} value={selected} onChange={e => setSelected(e.target.value)}>{choices.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
      <label className="mt-5 block text-sm">What if I earn <strong>{score}%</strong>?<input className="mt-3 block w-full accent-emerald-600" type="range" min="0" max="100" value={score} onChange={e => setScore(+e.target.value)}/></label>
      {result && <p className="my-4 text-sm">Chance of reaching {target}% <strong>{Math.round(result.chance)}% → {Math.round(result.scenario)}%</strong></p>}
      <button className="mt-3 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background" disabled={["Saving…","Added to Focus List"].includes(focus[selected])} onClick={save}>{focus[selected] ?? "Add to Focus List"}</button>
    </section>}
  </>;
}

export default function GradeOutlook() {
  return <Suspense fallback={<p className="p-8">Loading outlook…</p>}><Workspace/></Suspense>;
}
