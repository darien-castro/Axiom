CREATE TABLE IF NOT EXISTS focused_assignments (
    student_key BYTEA NOT NULL,
    course_id TEXT NOT NULL,
    assignment_id TEXT NOT NULL,
    PRIMARY KEY (student_key, course_id, assignment_id)
);
