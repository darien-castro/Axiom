export type Outlook = {
  fixed: number;
  remaining: { id: string; name: string; groupId: string; share: number; actionable: boolean }[];
  history: Record<string, number[]>;
};

export function simulate(model: Outlook, target: number, selected: string, score: number, range?: [number, number]) {
  let seed = 2143;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const grades: number[] = [];
  let hits = 0;
  let scenarioHits = 0;
  for (let trial = 0; trial < 4000; trial++) {
    let grade = model.fixed;
    let change = 0;
    for (const a of model.remaining) {
      const history = model.history[a.groupId];
      const draw = random();
      const sampled = range ? range[0] + draw * (range[1] - range[0]) : history[Math.floor(draw * history.length)];
      grade += a.share * sampled;
      if (a.id === selected) change = a.share * (score - sampled);
    }
    grades.push(grade);
    hits += Number(grade + 1e-9 >= target);
    scenarioHits += Number(grade + change + 1e-9 >= target);
  }
  grades.sort((a,b) => a-b);
  const start = Math.floor(grades[0]);
  const width = Math.max(1, Math.ceil((grades[grades.length - 1] - start) / 32));
  const bins = Array.from({ length: Math.min(33, Math.floor((grades[grades.length - 1] - start) / width) + 1) }, () => 0);
  for (const grade of grades) bins[Math.floor((grade - start) / width)]++;
  return { bins, start, width, chance: hits / 40, scenario: scenarioHits / 40, low: grades[400], high: grades[3599] };
}
