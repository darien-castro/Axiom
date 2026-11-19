CREATE TABLE IF NOT EXISTS course_credit_hours (
    student_key BYTEA NOT NULL,
    course_id TEXT NOT NULL,
    credit_hours DOUBLE PRECISION NOT NULL CHECK (credit_hours >= 0),
    PRIMARY KEY (student_key, course_id)
);

CREATE TABLE IF NOT EXISTS assignment_time_reports (
    course_id TEXT NOT NULL,
    assignment_id TEXT NOT NULL,
    student_key BYTEA NOT NULL,
    minutes INTEGER NOT NULL CHECK (minutes > 0),
    PRIMARY KEY (course_id, assignment_id, student_key)
);
