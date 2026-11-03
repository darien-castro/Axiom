export type Course = { id: number; code: string; title: string; grade: string; score: number; load: number; credits: number; hours: string; status: 'stable' | 'busy' | 'overloaded'; color: string };
export type Assignment = { id: number; courseId: number; title: string; group: string; due: string; dueOrder: number; weight: number; change: number; hours: number; reason: string; completed: boolean };
export const courses: Course[] = [
  { id: 1, code: 'CS 301', title: 'Systems Architecture', grade: 'A−', score: 91.8, load: 38, credits: 4, hours: '11–14', status: 'overloaded', color: '#78fa9a' },
  { id: 2, code: 'PHYS 210', title: 'Classical Mechanics', grade: 'B', score: 86.7, load: 36, credits: 4, hours: '8–10', status: 'overloaded', color: '#ffd083' },
  { id: 3, code: 'MATH 241', title: 'Linear Algebra', grade: 'B+', score: 88.4, load: 34, credits: 3, hours: '5–7', status: 'busy', color: '#87def2' },
  { id: 4, code: 'WRIT 210', title: 'Academic Writing', grade: 'A', score: 94.2, load: 28, credits: 3, hours: '3–4', status: 'stable', color: '#c7a5ff' },
  { id: 5, code: 'BIO 220', title: 'Cell Biology', grade: 'B+', score: 89.5, load: 31, credits: 3, hours: '5–6', status: 'busy', color: '#ff9cc8' },
];
export const assignments: Assignment[] = [
  { id: 1, courseId: 1, title: 'Distributed Systems Project', group: 'Projects', due: 'Tomorrow', dueOrder: 1, weight: 18, change: -5.2, hours: 7, reason: 'Due soon · 18% weight', completed: false },
  { id: 2, courseId: 2, title: 'Dynamics Midterm', group: 'Exams', due: 'Nov 7', dueOrder: 4, weight: 25, change: -4.3, hours: 6, reason: 'Highest grade weight', completed: false },
  { id: 3, courseId: 5, title: 'Cell Biology Lab Practical', group: 'Labs', due: 'Nov 9', dueOrder: 6, weight: 20, change: -3.7, hours: 4, reason: '20% weight · high historical risk', completed: false },
  { id: 4, courseId: 1, title: 'Final Design Review', group: 'Projects', due: 'Nov 11', dueOrder: 8, weight: 15, change: -3.2, hours: 5, reason: '15% weight · project milestone', completed: false },
  { id: 5, courseId: 3, title: 'Eigenvalues Problem Set', group: 'Homework', due: 'Nov 6', dueOrder: 3, weight: 8, change: -1.4, hours: 3, reason: 'Build your understanding', completed: false },
  { id: 6, courseId: 4, title: 'Research Essay Draft', group: 'Essays', due: 'Nov 8', dueOrder: 5, weight: 12, change: -1.8, hours: 4, reason: 'Make room for revision', completed: false },
  { id: 7, courseId: 2, title: 'Momentum Lab Report', group: 'Labs', due: 'Nov 10', dueOrder: 7, weight: 10, change: -2.1, hours: 3, reason: 'Upcoming lab deadline', completed: false },
  { id: 8, courseId: 3, title: 'Vector Spaces Quiz', group: 'Quizzes', due: 'Nov 12', dueOrder: 9, weight: 5, change: -0.8, hours: 2, reason: 'A little practice goes a long way', completed: false },
  { id: 9, courseId: 5, title: 'Membrane Transport Worksheet', group: 'Homework', due: 'Nov 13', dueOrder: 10, weight: 4, change: -0.6, hours: 1, reason: 'A quick win for this week', completed: false },
  { id: 10, courseId: 1, title: 'Cache Coherence Exercise', group: 'Homework', due: 'Nov 3', dueOrder: 0, weight: 7, change: -1.2, hours: 2, reason: 'Completed in the demo', completed: true },
  { id: 11, courseId: 4, title: 'Peer Review Workshop', group: 'Participation', due: 'Nov 2', dueOrder: -1, weight: 3, change: -0.4, hours: 1, reason: 'Completed in the demo', completed: true },
  { id: 12, courseId: 2, title: 'Kinematics Practice', group: 'Homework', due: 'Nov 1', dueOrder: -2, weight: 5, change: -0.7, hours: 2, reason: 'Completed in the demo', completed: true },
];
