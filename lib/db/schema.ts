import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  date,
  time,
  smallint,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["child", "parent"]);
export const companionEnum = pgEnum("companion_type", ["cat", "panda", "owl"]);
export const timetableCategoryEnum = pgEnum("timetable_category", [
  "school",
  "private_lesson",
  "activity",
  "homework",
]);

export const families = pgTable("families", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  familyId: uuid("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  userId: text("user_id").unique(),
  role: roleEnum("role").notNull(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  coins: integer("coins").default(0).notNull(),
  stars: integer("stars").default(0).notNull(),
  streakCurrent: integer("streak_current").default(0).notNull(),
  streakBest: integer("streak_best").default(0).notNull(),
  companionType: companionEnum("companion_type").default("cat").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subjects = pgTable("subjects", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  colorHex: text("color_hex").notNull(),
  iconName: text("icon_name").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id").references(() => subjects.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    description: text("description"),
    dueDate: date("due_date").notNull(),
    estimatedMinutes: integer("estimated_minutes"),
    completedAt: timestamp("completed_at"),
    coinsReward: integer("coins_reward").default(5).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("tasks_profile_due_idx").on(t.profileId, t.dueDate)]
);

export const timetableSlots = pgTable("timetable_slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  category: timetableCategoryEnum("category").notNull(),
  title: text("title").notNull(),
  dayOfWeek: smallint("day_of_week").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  colorHex: text("color_hex").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
