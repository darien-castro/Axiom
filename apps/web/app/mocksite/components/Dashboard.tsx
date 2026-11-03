'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { getDashboardData } from '@/lib/axiom/api';
import type { Assignment, Course } from '@/lib/axiom/demo';

export type View = 'overview' | 'assignments' | 'courses' | 'history' | 'simulation';
type IconName = 'overview' | 'history' | 'simulation' | 'courses' | 'assignments';
function Icon({ name }: { name: IconName }) {
  const paths = { overview: 'M3 3h6v6H3z M15 3h6v6h-6z M3 15h6v6H3z M15 15h6v6h-6z', history: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10 M12 11v2', simulation: 'M3 3v18h18 M7 15l4-5 4 3 6-8', courses: 'M5 3h15v18H5a2 2 0 0 1 0-4h15 M5 3a2 2 0 0 0-2 2v14', assignments: 'M4 5h16v16H4z M4 10h16 M8 2v6 M16 2v6' };
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
const navigation: { view: View; label: string }[] = [{ view: 'overview', label: 'Overview' }, { view: 'history', label: 'Historical impact' }, { view: 'simulation', label: 'Monte Carlo' }, { view: 'courses', label: 'Courses' }, { view: 'assignments', label: 'Assignments' }];
const headings: Record<View, [string, string, string]> = {
  overview: ['OVERVIEW / THIS WEEK', 'What to work on next', 'Your highest-priority work and the week ahead.'],
  assignments: ['ASSIGNMENTS / ALL WORK', 'All assignments', 'Filter and organize your work in one place.'],
  courses: ['COURSES / WORKLOAD MAP', 'Course load', 'Bubble size reflects course weight. Red signals a deadline pile-up.'],
  history: ['INSIGHTS / HISTORICAL IMPACT', 'Learn from your progress', 'A place to understand how past assignments shaped your grades.'],
  simulation: ['PLANNING / MONTE CARLO', 'Explore what comes next', 'A place to explore possible outcomes for your semester.'],
};
const sortOptions = ['Recommended', 'Due date', 'Grade weight', 'Probable grade change', 'Low effort first'];

export default function Dashboard({ view }: { view: View }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof getDashboardData>> | null>(null);
  const [error, setError] = useState(false);
  const [sort, setSort] = useState('Recommended');
  const [courseFilter, setCourseFilter] = useState('all');
  const [status, setStatus] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState(1);
  const [details, setDetails] = useState<Assignment | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { let active = true; getDashboardData().then(value => { if (active) setData(value); }).catch(() => { if (active) setError(true); }); return () => { active = false; }; }, []);
  useEffect(() => { if (details) dialog.current?.showModal(); else dialog.current?.close(); }, [details]);
  const courses = data?.courses ?? [];
  const assignments = data?.assignments ?? [];
  const course = courses.find(c => c.id === selectedCourse);
  const hero = assignments.find(a => !a.completed);
  const [eyebrow, title, subtitle] = headings[view];
  const sorted = assignments.filter(a => (courseFilter === 'all' || a.courseId === Number(courseFilter)) && (status === 'all' || a.completed === (status === 'completed'))).sort((a, b) => sort === 'Due date' ? a.dueOrder - b.dueOrder : sort === 'Grade weight' ? b.weight - a.weight : sort === 'Probable grade change' ? a.change - b.change : sort === 'Low effort first' ? a.hours - b.hours : 0);
  const shown = view === 'overview' ? assignments.filter(a => !a.completed).slice(0, 4) : sorted;
  function move(id: number, direction: number) {
    if (!data) return;
    const index = shown.findIndex(a => a.id === id);
    const neighbor = shown[index + direction];
    if (!neighbor) return;
    const next = [...assignments];
    const from = next.findIndex(a => a.id === id), to = next.findIndex(a => a.id === neighbor.id);
    [next[from], next[to]] = [next[to], next[from]];
    setData({ ...data, assignments: next }); setSort('Recommended');
  }
  return <div className="axiom dashboard">
    <a className="skip-link" href="#main">Skip to content</a>
    <aside className="sidebar">
      <Link href="/mocksite" className="wordmark">axiom<span> /</span></Link>
      <p className="semester mono">FALL SEMESTER 2026</p>
      <nav aria-label="Main navigation">{navigation.map(item => <Link key={item.view} aria-label={item.label} href={item.view === 'overview' ? '/mocksite' : `/mocksite/${item.view}`} className={view === item.view ? 'nav-item active' : 'nav-item'} aria-current={view === item.view ? 'page' : undefined}><Icon name={item.view} /><span>{item.label}</span>{item.view === 'assignments' && <b className="count">{assignments.length}</b>}</Link>)}</nav>
      <div className="sidebar-bottom"><div className="sync-card"><strong><i /> Demo workspace</strong><p>Canvas connection coming soon</p></div><Link href="/" className="profile"><span className="avatar mono">AK</span><span><strong>Alex Kim</strong><small>Demo profile · Exit</small></span><span className="profile-arrow">›</span></Link></div>
    </aside>
    <main id="main" className="workspace">
      <header className="page-header"><div><p className="eyebrow mono">{eyebrow}</p><h1>{title}</h1><p className="subtitle">{subtitle}</p></div>{view === 'courses' ? <div className="legend panel"><span><i className="stable-dot" />Stable</span><span><i className="busy-dot" />Busy</span><span><i className="overloaded-dot" />Overloaded</span></div> : <div className="weekly-progress"><div><span className="mono">WEEKLY PROGRESS</span><strong>{assignments.filter(a => a.completed).length} of {assignments.length} tasks</strong></div><progress aria-label="Demo weekly progress" value={assignments.filter(a => a.completed).length} max={assignments.length || 1} /></div>}</header>
      <div className="demo-note"><span className="demo-pill">DEMO</span> Sample data · Rankings, estimates, and projections are illustrative.</div>
      {error ? <div className="panel empty-state" role="alert">Unable to load the demo. <button onClick={() => window.location.reload()}>Try again</button></div> : !data ? <div className="panel empty-state" role="status">Loading your workspace…</div> : <>
      {(view === 'overview' || view === 'assignments') && <>
        <section className="workload-alert"><div className="alert-icon"><Icon name="assignments" /></div><div><strong>Heavy workload on Thursday</strong><p>Two high-effort assignments overlap. Starting CS 301 today avoids an estimated 7-hour pile-up.</p></div><span className="effort mono"><b>2</b> HIGH EFFORT</span></section>
        {hero && <section className="recommendation panel"><span className="hero-number mono">01</span><div className="hero-copy"><p className="green mono">RECOMMENDED NEXT</p><h2>{hero.title}</h2><p>CS 301 · Due tomorrow at 11:59 PM</p><div className="tags"><span>Due soon</span><span>{hero.weight}% grade weight</span><span>6–8 hrs estimated</span></div></div><div className="importance"><span className="mono">GRADE IMPORTANCE</span><strong>{hero.weight}%</strong><progress value={hero.weight} max="25" aria-label="Demo grade importance" /></div><button className="primary" onClick={() => setDetails(hero)}>Start here <span>→</span></button></section>}
        {view === 'overview' && <GpaChart />}
        {view === 'assignments' && <section className="filter-bar panel"><div><strong><span className="green">{sorted.length}</span> assignments</strong><small>Choose how Axiom organizes your work</small></div><div className="sort-options" aria-label="Sort assignments">{sortOptions.map(option => <button key={option} className={sort === option ? 'selected' : ''} aria-pressed={sort === option} onClick={() => setSort(option)}>{option}</button>)}</div><label>Course<select value={courseFilter} onChange={e => setCourseFilter(e.target.value)}><option value="all">All courses</option>{courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}</select></label><label>Status<select value={status} onChange={e => setStatus(e.target.value)}><option value="all">All assignments</option><option value="pending">Upcoming</option><option value="completed">Completed</option></select></label></section>}
        <section className="assignment-list panel"><div className="section-heading"><div><h2>{view === 'overview' ? 'Next assignments' : 'All assignments'}</h2><p>{view === 'overview' ? 'Your four highest-priority assignments' : `Sorted by ${sort.toLowerCase()} · Arrows adjust the demo order`}</p></div>{view === 'overview' && <Link className="outline-button" href="/mocksite/assignments">View all assignments <span>→</span></Link>}</div>{shown.length === 0 && <p className="empty-state">No assignments match these filters.</p>}{shown.map((a, i) => <AssignmentRow key={a.id} assignment={a} course={courses.find(c => c.id === a.courseId)!} index={i} total={shown.length} move={move} canMove={sort === 'Recommended'} open={() => setDetails(a)} />)}</section>
      </>}
      {view === 'courses' && course && <div className="course-layout"><section className="bubble-panel panel"><p className="mono">COURSE WEIGHT</p><p>Larger bubble = more of your term workload</p><div className="bubble-map">{courses.map((c, i) => <button key={c.id} onClick={() => setSelectedCourse(c.id)} aria-pressed={selectedCourse === c.id} className={`course-bubble bubble-${i} ${c.status} ${selectedCourse === c.id ? 'chosen' : ''}`}><span className="bubble-badge mono">{assignments.filter(a => a.courseId === c.id && !a.completed).length} due soon</span><span className="mono course-code">{c.code}</span><strong>{c.title}</strong><span className="mono">{c.load}% term load</span><span className="bubble-grade">{c.grade} <small>{c.score}%</small></span></button>)}</div><p className="bubble-help">✧ &nbsp; Select a course to expand its workload</p></section><section className="course-detail panel"><header><div className="course-mark" style={{ color: course.color }}>{course.code.split(' ')[0]}</div><div><span className="mono green">{course.code}</span><h2>{course.title}</h2></div><div className="course-score"><strong>{course.grade}</strong><small>{course.score}%</small></div></header><div className="course-detail-body"><button className="outline-button wide" disabled title="Available after Canvas is connected">Canvas link coming soon <span>↗</span></button><div className={`course-warning ${course.status}`}><Icon name="assignments" /><div><strong>{course.status === 'overloaded' ? 'Deadline pile-up detected' : course.status === 'busy' ? 'A busy week ahead' : 'A little breathing room'}</strong><p>{course.status === 'stable' ? 'Your demo workload is balanced. Keep making steady progress.' : 'Several assignments are coming up. Set aside time for this course.'}</p></div></div><div className="metrics"><Metric label="TERM WEIGHT" value={`${course.load}%`} /><Metric label="CREDIT HOURS" value={String(course.credits)} /><Metric label="EST. THIS WEEK" value={`${course.hours} hrs`} /></div><div className="upcoming"><p className="mono">UPCOMING WORK</p>{assignments.filter(a => a.courseId === course.id && !a.completed).map(a => <button key={a.id} onClick={() => setDetails(a)}><span className="course-line" style={{ background: course.color }} /><span><strong>{a.title}</strong><small>{a.due}, 11:59 PM</small></span><b>{a.weight}%</b><span>›</span></button>)}</div></div></section></div>}
      {(view === 'history' || view === 'simulation') && <section className="panel future-panel"><div className="future-icon"><Icon name={view} /></div><span className="demo-pill">COMING LATER</span><h2>{view === 'history' ? 'Your past work, in perspective.' : 'More clarity. Fewer what-ifs.'}</h2><p>{view === 'history' ? 'Historical grade impact will appear here once Canvas data and the analysis service are connected.' : 'Monte Carlo simulations will live here once we configure the model, inputs, and projection service.'}</p><Link className="outline-button" href="/mocksite">Back to overview →</Link></section>}
      </>}
      <footer className="workspace-footer"><span>AXIOM / A LITTLE CLARITY GOES A LONG WAY</span><span>Demo workspace · Fall 2026</span></footer>
    </main>
    <dialog ref={dialog} className="assignment-dialog axiom" aria-label="Assignment details" onCancel={() => setDetails(null)} onClick={e => { if (e.target === e.currentTarget) setDetails(null); }}><button className="close-dialog" aria-label="Close assignment details" onClick={() => setDetails(null)}>×</button>{details && <><p className="eyebrow mono">{courses.find(c => c.id === details.courseId)?.code} / {details.group}</p><h2>{details.title}</h2><p className="subtitle">{details.reason}</p><div className="metrics"><Metric label="DUE" value={details.due} /><Metric label="DEMO WEIGHT" value={`${details.weight}%`} /><Metric label="EST. EFFORT" value={`${details.hours} hours`} /></div><p className="detail-note">This is a sample assignment. Canvas links, real grades, and calculated estimates will be available after integration.</p><span className="demo-pill">{details.completed ? 'COMPLETED' : 'UPCOMING'}</span><button className="primary wide" onClick={() => setDetails(null)}>Back to workspace →</button></>}</dialog>
  </div>;
}
function Metric({ label, value, negative = false }: { label: string; value: string; negative?: boolean }) { return <div className="metric"><span className="mono">{label}</span><strong className={negative ? 'negative mono' : 'mono'}>{value}</strong></div>; }
function AssignmentRow({ assignment: a, course, index, total, move, canMove, open }: { assignment: Assignment; course: Course; index: number; total: number; move: (id: number, direction: number) => void; canMove: boolean; open: () => void }) {
  return <article className={`assignment-row ${index === 0 ? 'first-row' : ''}`}><div className="rank mono"><button aria-label={`Move ${a.title} up`} disabled={index === 0 || !canMove} onClick={() => move(a.id, -1)}>⌃</button><strong>{String(index + 1).padStart(2, '0')}</strong><button aria-label={`Move ${a.title} down`} disabled={index === total - 1 || !canMove} onClick={() => move(a.id, 1)}>⌄</button></div><div className="assignment-content"><div className="assignment-title"><span className="course-line" style={{ '--course-color': course.color, background: course.color } as CSSProperties} /><div><p className="mono course-label">{course.code} · {a.group}</p>{index < 3 && !a.completed && <span className={`priority priority-${index} mono`}><b>{index + 1}</b> TOP PRIORITY</span>}<h3>{a.title}</h3></div><button className="text-button" onClick={open}>Full details <span>→</span></button></div><p className="assignment-reason">✧ &nbsp; {a.reason}</p><div className="metrics"><Metric label={a.completed ? 'STATUS' : 'DUE'} value={a.completed ? 'Completed' : a.due} /><Metric label="WEIGHT" value={`${a.weight}%`} /><Metric label="PROBABLE CHANGE" value={`${a.change.toFixed(1)}%`} negative /></div></div></article>;
}
function GpaChart() {
  const [range, setRange] = useState('Term');
  const labels = range === '30D' ? ['OCT 20', 'OCT 25', 'OCT 30', 'NOV 04', 'NOV 09', 'NOV 14', 'NOV 19'] : range === 'All' ? ['JAN', 'MAR', 'MAY', 'JUL', 'SEP', 'NOV', 'DEC'] : ['AUG 25', 'SEP 08', 'SEP 22', 'OCT 06', 'OCT 20', 'NOV 03', 'DEC 12'];
  const path = range === '30D' ? 'M0 175 C80 175 90 140 160 145 S260 110 330 120 S460 65 530 85 S590 62 630 65' : range === 'All' ? 'M0 210 C80 210 90 175 160 180 S260 145 330 150 S460 105 530 100 S590 62 630 65' : 'M0 190 C60 190 85 160 140 163 S190 160 245 138 S330 160 380 126 S450 108 490 105 S565 55 630 65';
  return <section className="gpa-section"><div className="section-heading"><div><h2>Likely GPA outcome</h2><p>Projected across your courses and remaining assignments</p></div><div className="range-control" aria-label="Chart time range">{['30D', 'Term', 'All'].map(r => <button key={r} className={range === r ? 'selected' : ''} aria-pressed={range === r} onClick={() => setRange(r)}>{r}</button>)}</div></div><div className="gpa-chart panel"><div className="chart-heading"><div><strong className="mono">3.71</strong><span>Projected term GPA</span></div><div className="chart-legend"><span>— &nbsp;Current</span><span>┄ &nbsp;Projected</span></div></div><div className="chart-plot"><svg viewBox="0 0 1000 260" preserveAspectRatio="none" role="img" aria-label={`${range} demo GPA chart, rising toward a target of 3.80. This is sample data.`}><defs><linearGradient id="gpa-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#78fa9a" stopOpacity=".24" /><stop offset="100%" stopColor="#78fa9a" stopOpacity="0" /></linearGradient></defs>{[40, 110, 180, 250].map(y => <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="#202a22" strokeWidth="1" />)}<line x1="0" y1="18" x2="1000" y2="18" stroke="#36563c" strokeDasharray="4 4" /><path d={`${path} L630 250 L0 250Z`} fill="url(#gpa-fill)" /><path d={path} fill="none" stroke="#78fa9a" strokeWidth="3" /><path d="M630 65 C690 65 710 20 780 28 S875 -2 1000 18" fill="none" stroke="#4e9d63" strokeWidth="3" strokeDasharray="6 6" /><circle cx="630" cy="65" r="6" fill="#101511" stroke="#78fa9a" strokeWidth="3" /></svg><span className="chart-target mono">TARGET 3.80</span></div><div className="chart-labels mono">{labels.map(l => <span key={l}>{l}</span>)}</div></div></section>;
}
