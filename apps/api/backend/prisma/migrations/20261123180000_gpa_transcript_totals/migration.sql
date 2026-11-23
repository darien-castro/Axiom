CREATE TABLE IF NOT EXISTS gpa_transcript_totals (
  student_key BYTEA PRIMARY KEY,
  semester_key TEXT NOT NULL,
  gpa_hours DOUBLE PRECISION NOT NULL CHECK (gpa_hours >= 0),
  quality_points DOUBLE PRECISION NOT NULL CHECK (quality_points >= 0 AND quality_points <= gpa_hours * 4)
);
