import { and, eq } from "drizzle-orm";
import { db, schema } from "../src/db/client";

/**
 * One-off importer for a month of shift work transcribed from a screenshot of
 * another calendar app. Deliberately a script and not an API route: it writes
 * straight to one user's rows, needs no session, and is meant to be run once
 * from a laptop with production credentials in the environment.
 *
 * Re-running is safe — an event already present for the same user, date and
 * title is skipped rather than duplicated.
 */

/** Shift start/end times. Edit these if the ward's hours differ. */
const SHIFT_HOURS = {
  morning: { time: "08:00", endTime: "16:00" },   // ช — เช้า
  afternoon: { time: "16:00", endTime: "24:00" }, // บ — บ่าย
  night: { time: "00:00", endTime: "08:00" },     // ด — ดึก
} as const;

/** Non-shift rows get a neutral mid-morning slot and no end time. */
const PLAIN_TIME = "09:00";

type Kind = keyof typeof SHIFT_HOURS | "off" | "personal" | "other";

interface Entry {
  date: string;
  title: string;
  kind: Kind;
}

// Transcribed from the September 2026 screenshot. Titles marked with a
// trailing "…" were cut off in the source image — fix them in the app, or
// here before running.
const ENTRIES: Entry[] = [
  { date: "2026-09-01", title: "ด", kind: "night" },
  { date: "2026-09-01", title: "บ พี่หนิมแทน", kind: "afternoon" },

  { date: "2026-09-02", title: "รีเฟอร์ บ เบ…", kind: "afternoon" },
  { date: "2026-09-02", title: "เสริม ช", kind: "morning" },
  { date: "2026-09-02", title: "Off", kind: "off" },

  { date: "2026-09-03", title: "ช", kind: "morning" },

  { date: "2026-09-04", title: "บ", kind: "afternoon" },
  { date: "2026-09-04", title: "ช แทนพี่หนิม", kind: "morning" },
  { date: "2026-09-04", title: "ด พี่หนิมแทน", kind: "night" },

  { date: "2026-09-05", title: "ไปหาบีเวอร์", kind: "personal" },
  { date: "2026-09-05", title: "ด แทนวริน", kind: "night" },
  { date: "2026-09-05", title: "ช วรินแทน", kind: "morning" },

  { date: "2026-09-06", title: "เสริม ช", kind: "morning" },
  { date: "2026-09-06", title: "ซ้อมเต้น", kind: "personal" },
  { date: "2026-09-06", title: "Off", kind: "off" },

  { date: "2026-09-07", title: "บ", kind: "afternoon" },
  { date: "2026-09-07", title: "ช แทนพี่เก้า", kind: "morning" },
  { date: "2026-09-07", title: "ด พี่เก้าแทน", kind: "night" },

  { date: "2026-09-08", title: "ขายรีเฟอร์", kind: "other" },
  { date: "2026-09-08", title: "ด", kind: "night" },

  { date: "2026-09-09", title: "Vac", kind: "off" },
  { date: "2026-09-10", title: "Vac", kind: "off" },
  { date: "2026-09-11", title: "Vac", kind: "off" },

  { date: "2026-09-12", title: "Off", kind: "off" },

  { date: "2026-09-13", title: "ช ขายพี่เก้า", kind: "morning" },
  { date: "2026-09-13", title: "บ พี่กิ่งขึ้นแทน", kind: "afternoon" },

  { date: "2026-09-14", title: "เสริม บ", kind: "afternoon" },
  { date: "2026-09-14", title: "ช", kind: "morning" },

  { date: "2026-09-15", title: "บ", kind: "afternoon" },
  { date: "2026-09-15", title: "ช แทนพี่กิ่ง", kind: "morning" },
  { date: "2026-09-15", title: "ด พี่กิ่งแทน", kind: "night" },

  { date: "2026-09-16", title: "เสริม บ", kind: "afternoon" },
  { date: "2026-09-16", title: "ด", kind: "night" },

  { date: "2026-09-17", title: "รฟ บ เบอร์", kind: "afternoon" },
  { date: "2026-09-17", title: "Off", kind: "off" },

  { date: "2026-09-18", title: "บ แทนพี่หนิม", kind: "afternoon" },
  { date: "2026-09-18", title: "ขายรีเฟอร์", kind: "other" },
  { date: "2026-09-18", title: "ช", kind: "morning" },

  { date: "2026-09-19", title: "เสริม ช", kind: "morning" },
  { date: "2026-09-19", title: "ด", kind: "night" },

  { date: "2026-09-20", title: "บ", kind: "afternoon" },
  { date: "2026-09-20", title: "ด", kind: "night" },

  { date: "2026-09-21", title: "ช OPD", kind: "morning" },
  { date: "2026-09-21", title: "Off", kind: "off" },

  { date: "2026-09-22", title: "บ", kind: "afternoon" },
  { date: "2026-09-22", title: "ช", kind: "morning" },

  { date: "2026-09-23", title: "ช", kind: "morning" },

  { date: "2026-09-24", title: "บ", kind: "afternoon" },
  { date: "2026-09-24", title: "ช แทนป๊อก", kind: "morning" },
  { date: "2026-09-24", title: "ด ป๊อกแทน", kind: "night" },

  { date: "2026-09-25", title: "เสริม ด", kind: "night" },
  { date: "2026-09-25", title: "การแสดงวั…", kind: "personal" },
  { date: "2026-09-25", title: "Off", kind: "off" },

  { date: "2026-09-26", title: "บ", kind: "afternoon" },
  { date: "2026-09-26", title: "ช", kind: "morning" },

  { date: "2026-09-27", title: "ด แทนแม่แสง", kind: "night" },
  { date: "2026-09-27", title: "ช แม่แสง", kind: "morning" },

  { date: "2026-09-28", title: "ขายรีเฟอร์", kind: "other" },
  { date: "2026-09-28", title: "ด", kind: "night" },

  { date: "2026-09-29", title: "เสริม ช", kind: "morning" },
  { date: "2026-09-29", title: "เสริม ด", kind: "night" },
  { date: "2026-09-29", title: "Off", kind: "off" },

  { date: "2026-09-30", title: "บ", kind: "afternoon" },
  { date: "2026-09-30", title: "ช แทนพี่กิ่ง", kind: "morning" },
  { date: "2026-09-30", title: "ด พี่กิ่งแทน", kind: "night" },
];

function shape(entry: Entry) {
  if (entry.kind === "off") {
    return { category: "personal", time: PLAIN_TIME, endTime: null };
  }
  if (entry.kind === "personal") {
    return { category: "personal", time: PLAIN_TIME, endTime: null };
  }
  if (entry.kind === "other") {
    return { category: "work", time: PLAIN_TIME, endTime: null };
  }
  return { category: "shift", ...SHIFT_HOURS[entry.kind] };
}

function usage(): never {
  console.error(
    "Usage: npm run shifts:import -- <username> [--commit]\n" +
      "Without --commit it only prints what it would write.\n" +
      "Example: npm run shifts:import -- thipyarat --commit"
  );
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  const commitIndex = args.indexOf("--commit");
  const commit = commitIndex !== -1;
  if (commit) args.splice(commitIndex, 1);

  const username = args[0]?.trim().toLowerCase();
  if (!username) usage();

  const [user] = await db
    .select({ id: schema.users.id, displayName: schema.users.displayName })
    .from(schema.users)
    .where(eq(schema.users.username, username))
    .limit(1);

  if (!user) {
    throw new Error(
      `No user "${username}". Check the spelling, or create them with ` +
        `npm run user:create -- ${username} '<password>'`
    );
  }

  let written = 0;
  let skipped = 0;

  for (const entry of ENTRIES) {
    const { category, time, endTime } = shape(entry);

    const [existing] = await db
      .select({ id: schema.events.id })
      .from(schema.events)
      .where(
        and(
          eq(schema.events.userId, user.id),
          eq(schema.events.date, entry.date),
          eq(schema.events.title, entry.title)
        )
      )
      .limit(1);

    if (existing) {
      skipped += 1;
      continue;
    }

    if (commit) {
      await db.insert(schema.events).values({
        userId: user.id,
        title: entry.title,
        category,
        date: entry.date,
        time,
        endTime,
      });
    }
    written += 1;
    console.log(
      `${commit ? "+" : "would add"} ${entry.date} ${time}${endTime ? `-${endTime}` : ""}  ${entry.title}  [${category}]`
    );
  }

  console.log(
    `\n${commit ? "✓ imported" : "dry run:"} ${written} event(s) for ${user.displayName} (${username})` +
      (skipped ? `, ${skipped} already present` : "") +
      (commit ? "" : "\nRe-run with --commit to write them.")
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
