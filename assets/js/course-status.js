(function exposeCourseStatus(global) {
  const statusDefinitions = {
    upcoming: { label: "即將開放", order: 1 },
    open: { label: "報名中", order: 2 },
    closed: { label: "報名截止", order: 3 },
    ongoing: { label: "上課中", order: 4 },
    ended: { label: "已結束", order: 5 },
    cancelled: { label: "已取消", order: 6 }
  };

  const toLocalDate = (value) => {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const startOfDay = (value = new Date()) => new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate()
  );

  const getStatus = (course, referenceDate = new Date()) => {
    if (course.isCancelled) return "cancelled";
    if (course.statusOverride && statusDefinitions[course.statusOverride]) return course.statusOverride;

    const today = startOfDay(referenceDate);
    const registrationStart = toLocalDate(course.registrationStart);
    const registrationEnd = toLocalDate(course.registrationEnd);
    const courseStart = toLocalDate(course.courseStart);
    const courseEnd = toLocalDate(course.courseEnd);

    if (today < registrationStart) return "upcoming";
    if (today <= registrationEnd) return "open";
    if (today < courseStart) return "closed";
    if (today <= courseEnd) return "ongoing";
    return "ended";
  };

  const formatDateRange = (start, end) => {
    const format = (value) => value.replaceAll("-", ".");
    return start === end ? format(start) : `${format(start)}–${format(end)}`;
  };

  global.FCUCourseStatus = {
    definitions: statusDefinitions,
    formatDateRange,
    getStatus
  };
}(window));
