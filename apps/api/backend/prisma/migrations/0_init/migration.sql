-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "userid" BYTEA NOT NULL,
    "first_name" VARCHAR(255),
    "last_name" VARCHAR(255),

    CONSTRAINT "users_pkey" PRIMARY KEY ("userid")
);

-- CreateTable
CREATE TABLE "user_api_keys" (
    "userid" BYTEA NOT NULL,
    "encrypted_user_id" TEXT,
    "encrypted_api_key" TEXT NOT NULL,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_api_keys_pkey" PRIMARY KEY ("userid")
);

-- CreateTable
CREATE TABLE "user_info" (
    "userid" BYTEA NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_info_pkey" PRIMARY KEY ("userid")
);

-- CreateTable
CREATE TABLE "course" (
    "courseid" VARCHAR(255) NOT NULL,
    "course_name" VARCHAR(255) NOT NULL,
    "course_term" VARCHAR(255),
    "course_term_id" VARCHAR(50),
    "course_code" VARCHAR(50),
    "course_section" VARCHAR(50),
    "coursedepartment" VARCHAR(255),

    CONSTRAINT "course_pkey" PRIMARY KEY ("courseid")
);

-- CreateTable
CREATE TABLE "user_courses" (
    "userid" BYTEA NOT NULL,
    "courseid" VARCHAR(255) NOT NULL,
    "grade" TEXT,

    CONSTRAINT "user_courses_pkey" PRIMARY KEY ("userid","courseid")
);

-- CreateTable
CREATE TABLE "assignment" (
    "assignmentid" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(255),
    "grade" TEXT,
    "points" DOUBLE PRECISION,
    "courseid" VARCHAR(255),

    CONSTRAINT "assignment_pkey" PRIMARY KEY ("assignmentid")
);

-- CreateTable
CREATE TABLE "submission" (
    "submissionid" VARCHAR(255) NOT NULL,
    "assignmentid" VARCHAR(255),
    "courseid" VARCHAR(255),
    "userid" BYTEA,
    "score" TEXT,
    "grade" TEXT,
    "submitted_at" TEXT,

    CONSTRAINT "submission_pkey" PRIMARY KEY ("submissionid")
);

-- CreateTable
CREATE TABLE "updates" (
    "updateid" SERIAL NOT NULL,
    "userid" BYTEA,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "updates_pkey" PRIMARY KEY ("updateid")
);

-- CreateTable
CREATE TABLE "sessions" (
    "session_key" VARCHAR(255) NOT NULL,
    "api_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("session_key")
);

-- AddForeignKey
ALTER TABLE "user_api_keys" ADD CONSTRAINT "user_api_keys_userid_fkey" FOREIGN KEY ("userid") REFERENCES "users"("userid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_info" ADD CONSTRAINT "user_info_userid_fkey" FOREIGN KEY ("userid") REFERENCES "users"("userid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_courses" ADD CONSTRAINT "user_courses_userid_fkey" FOREIGN KEY ("userid") REFERENCES "users"("userid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_courses" ADD CONSTRAINT "user_courses_courseid_fkey" FOREIGN KEY ("courseid") REFERENCES "course"("courseid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_courseid_fkey" FOREIGN KEY ("courseid") REFERENCES "course"("courseid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission" ADD CONSTRAINT "submission_userid_fkey" FOREIGN KEY ("userid") REFERENCES "users"("userid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission" ADD CONSTRAINT "submission_courseid_fkey" FOREIGN KEY ("courseid") REFERENCES "course"("courseid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission" ADD CONSTRAINT "submission_assignmentid_fkey" FOREIGN KEY ("assignmentid") REFERENCES "assignment"("assignmentid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "updates" ADD CONSTRAINT "updates_userid_fkey" FOREIGN KEY ("userid") REFERENCES "users"("userid") ON DELETE CASCADE ON UPDATE CASCADE;

