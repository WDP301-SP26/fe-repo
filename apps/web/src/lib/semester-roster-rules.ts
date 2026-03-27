export function canAssignExaminer(
  lecturerId: string,
  teachingLecturerId: string | null | undefined,
) {
  if (!teachingLecturerId) return true;
  return lecturerId !== teachingLecturerId;
}

export function getExaminerConflictMessage(
  lecturerName: string,
  classCode: string,
) {
  return `${lecturerName} is already teaching ${classCode} and cannot examine the same class.`;
}

export function isExaminerAssignmentOpen(currentWeek: number) {
  return currentWeek >= 10;
}
