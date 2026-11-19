CREATE TABLE IF NOT EXISTS dismissed_assignments (
    student_key BYTEA NOT NULL,
    course_id TEXT NOT NULL,
    assignment_id TEXT NOT NULL,
    course_name TEXT NOT NULL,
    assignment_name TEXT NOT NULL,
    dismissed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (student_key, course_id, assignment_id)
);
