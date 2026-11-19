CREATE TABLE IF NOT EXISTS hidden_courses (
    student_key BYTEA NOT NULL,
    course_id TEXT NOT NULL,
    PRIMARY KEY (student_key, course_id)
);
