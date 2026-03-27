import {
  canAssignExaminer,
  getExaminerConflictMessage,
  isExaminerAssignmentOpen,
} from './semester-roster-rules';

describe('semester roster rules', () => {
  it('blocks lecturer from examining their own class', () => {
    expect(canAssignExaminer('lecturer-1', 'lecturer-1')).toBe(false);
    expect(canAssignExaminer('lecturer-1', 'lecturer-2')).toBe(true);
  });

  it('opens examiner assignment from week 10 onward', () => {
    expect(isExaminerAssignmentOpen(9)).toBe(false);
    expect(isExaminerAssignmentOpen(10)).toBe(true);
  });

  it('renders conflict message with lecturer and class context', () => {
    expect(getExaminerConflictMessage('Lecturer One', 'SWP391')).toContain(
      'cannot examine',
    );
  });
});
