import type { Category, Lang } from "./types";

export const STRINGS = {
  th: {
    appName: "Cozy Planner",
    dashboard: "ภาพรวม",
    calendar: "ปฏิทิน",
    todo: "สิ่งที่ต้องทำ",
    today: "วันนี้",
    upcoming: "กำลังจะถึง",
    tasksToday: "งานวันนี้",
    completion: "ความคืบหน้า",
    upcomingEvents: "นัดหมายที่จะถึง",
    yourTasksToday: "กำหนดการวันนี้",
    viewAll: "ดูทั้งหมด",
    noItemsToday: "ไม่มีรายการสำหรับวันนี้",
    addTask: "เพิ่ม",
    taskPlaceholder: "เพิ่มสิ่งที่ต้องทำ...",
    all: "ทั้งหมด",
    completed: "เสร็จแล้ว",
    noTasks: "ไม่มีรายการในหมวดนี้",
    month: "เดือน",
    week: "สัปดาห์",
    day: "วัน",
    addEvent: "เพิ่มนัดหมาย",
    addEventCta: "เพิ่มนัดหมาย +",
    saving: "กำลังบันทึก...",
    eventAdded: "เพิ่มนัดหมายแล้ว",
    close: "ปิด",
    eventTitlePlaceholder: "ชื่อนัดหมายใหม่...",
    aiTitle: "ผู้ช่วย AI",
    aiPlaceholder: "พิมพ์คำถามหรือขอความช่วยเหลือ...",
    quickSummary: "สรุปงานทั้งหมด",
    quickToday: "มีอะไรวันนี้บ้าง",
    quickAdd: "ช่วยวางแผนนัดหมายใหม่",
    aiWelcome:
      "**Cozy Agent พร้อมช่วยครับ**\n\nผมช่วยสรุปตาราง, จัดลำดับสิ่งที่ต้องทำ, วางแผนกิจกรรม และร่างนัดหมายให้กดยืนยันเพิ่มลงปฏิทินได้\n\n> ผมจะไม่แอบสร้างหรือแก้ข้อมูลเอง — ถ้าจะเพิ่มนัดหมาย ผมจะแสดงร่างให้ตรวจและให้คุณกดยืนยันก่อนครับ",
    aiError: "ตอนนี้ผู้ช่วย AI ยังตอบไม่ได้ครับ ลองใหม่อีกครั้งในอีกสักครู่",
    aiDraftTitle: "ร่างนัดหมาย",
    aiConfirm: "เพิ่มลงปฏิทิน",
    aiDismiss: "ไม่เพิ่ม",
    aiCreated: "เพิ่มลงปฏิทินแล้ว",
    aiCreateFailed: "เพิ่มนัดหมายไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
    catPersonal: "ส่วนตัว",
    catWork: "งาน",
    catHealth: "สุขภาพ",
    catStudy: "เรียนรู้",
    catOther: "อื่นๆ",
    catShift: "เวร",
    overdue: "เลยกำหนด",
    dueToday: "วันนี้",
    dueTomorrow: "พรุ่งนี้",
    typeLabel: "ประเภท",
    customTypePlaceholder: "ระบุประเภทเอง...",
    greetingMorning: "อรุณสวัสดิ์",
    greetingAfternoon: "สวัสดีตอนบ่าย",
    greetingEvening: "สวัสดีตอนเย็น",
  },
  en: {
    appName: "Cozy Planner",
    dashboard: "Dashboard",
    calendar: "Calendar",
    todo: "To-Do",
    today: "Today",
    upcoming: "Upcoming",
    tasksToday: "Today's tasks",
    completion: "Completion",
    upcomingEvents: "Upcoming events",
    yourTasksToday: "Today's agenda",
    viewAll: "View all",
    noItemsToday: "Nothing scheduled for this day",
    addTask: "Add",
    taskPlaceholder: "Add a task...",
    all: "All",
    completed: "Completed",
    noTasks: "No items here",
    month: "Month",
    week: "Week",
    day: "Day",
    addEvent: "Add event",
    addEventCta: "Add event +",
    saving: "Saving...",
    eventAdded: "Event added",
    close: "Close",
    eventTitlePlaceholder: "New event title...",
    aiTitle: "AI Assistant",
    aiPlaceholder: "Ask a question or request help...",
    quickSummary: "Summarize my tasks",
    quickToday: "What's on today",
    quickAdd: "Help me plan a new event",
    aiWelcome:
      "**Cozy Agent is ready.**\n\nI can summarize your schedule, prioritize tasks, plan activities, and draft events for you to confirm into the calendar.\n\n> I will not silently create or edit data — event changes are shown as a draft for your confirmation first.",
    aiError: "The AI assistant is unavailable right now. Please try again in a moment.",
    aiDraftTitle: "Event draft",
    aiConfirm: "Add to calendar",
    aiDismiss: "Dismiss",
    aiCreated: "Added to calendar",
    aiCreateFailed: "Could not add the event. Please try again.",
    catPersonal: "Personal",
    catWork: "Work",
    catHealth: "Health",
    catStudy: "Study",
    catOther: "Other",
    catShift: "Shift",
    overdue: "Overdue",
    dueToday: "Today",
    dueTomorrow: "Tomorrow",
    typeLabel: "Type",
    customTypePlaceholder: "Specify custom type...",
    greetingMorning: "Good morning",
    greetingAfternoon: "Good afternoon",
    greetingEvening: "Good evening",
  },
} as const;

export type StringKey = keyof (typeof STRINGS)["en"];

export function t(lang: Lang, key: StringKey): string {
  return STRINGS[lang][key] ?? key;
}

/** Localized label for a built-in category (e.g. "work" -> "งาน"/"Work"). */
export function catLabel(lang: Lang, cat: Category): string {
  const key = ("cat" + cat.charAt(0).toUpperCase() + cat.slice(1)) as StringKey;
  return t(lang, key);
}

/** Prefer a user-provided custom label, else the built-in category label. */
export function labelFor(
  lang: Lang,
  cat: Category,
  customLabel?: string | null
): string {
  return customLabel?.trim() || catLabel(lang, cat);
}

export function greeting(lang: Lang, date = new Date()): string {
  const h = date.getHours();
  const key: StringKey =
    h < 12 ? "greetingMorning" : h < 18 ? "greetingAfternoon" : "greetingEvening";
  return t(lang, key);
}
