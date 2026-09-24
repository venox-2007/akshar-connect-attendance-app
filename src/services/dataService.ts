import {
  Teacher,
  ClassEntity,
  Student,
  AttendanceRecord,
  AttendanceStatus,
  DashboardStats,
  ClassAttendanceSummary,
  AttendanceSummary,
  User
} from '../types';
import { getFreshMockDatabase, MockDatabaseState } from '../data/mockDatabase';
import { authService } from './authService';

const STORAGE_KEY = 'akshar_connect_records_v2';

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

class DataService {
  private loadData(): MockDatabaseState {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (!serialized) {
        return this.resetData();
      }
      const parsed = JSON.parse(serialized) as MockDatabaseState;
      if (!parsed.teachers || !parsed.classes || !parsed.students || !parsed.attendance) {
        return this.resetData();
      }
      return parsed;
    } catch (e) {
      console.error('Error loading data from localStorage, resetting to defaults', e);
      return this.resetData();
    }
  }

  private saveData(data: MockDatabaseState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
      throw new Error('Storage quota exceeded or storage unavailable.');
    }
  }

  public resetData(): MockDatabaseState {
    const fresh = getFreshMockDatabase();
    this.saveData(fresh);
    return fresh;
  }

  // ===================== AUTHORIZATION HELPERS =====================

  public getCurrentUserOrThrow(): User {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new AuthorizationError('Authentication required: No active session found.');
    }
    return user;
  }

  public requireAdmin(): User {
    const user = this.getCurrentUserOrThrow();
    if (user.role !== 'ADMIN') {
      throw new AuthorizationError('Access denied: Administrator privileges required for this operation.');
    }
    return user;
  }

  public requireClassAccess(classId: string): { user: User; isAdmin: boolean } {
    const user = this.getCurrentUserOrThrow();
    if (user.role === 'ADMIN') {
      return { user, isAdmin: true };
    }

    if (user.role === 'TEACHER') {
      if (!user.teacherId) {
        throw new AuthorizationError('Access denied: User account is not linked to an educator profile.');
      }

      const data = this.loadData();
      const cls = data.classes.find(c => c.id === classId);
      if (!cls) {
        throw new Error(`Class with ID "${classId}" not found.`);
      }

      const teacher = data.teachers.find(t => t.id === user.teacherId);
      const isAssigned =
        (teacher && teacher.assignedClassIds.includes(classId)) ||
        cls.assignedTeacherId === user.teacherId;

      if (!isAssigned) {
        throw new AuthorizationError(
          `Access denied: Educator "${user.name}" is not assigned to class "${cls.name}" (${classId}).`
        );
      }

      return { user, isAdmin: false };
    }

    throw new AuthorizationError('Access denied: Unauthorized role.');
  }

  // ===================== TEACHERS CRUD =====================

  /**
   * Only Administrators may list all teachers.
   */
  public async getTeachers(): Promise<Teacher[]> {
    this.requireAdmin();
    const data = this.loadData();
    return [...data.teachers];
  }

  /**
   * Admin can view any teacher; Teachers may only view their own profile.
   */
  public async getTeacherById(id: string): Promise<Teacher | null> {
    const user = this.getCurrentUserOrThrow();
    if (user.role === 'TEACHER' && user.teacherId !== id) {
      throw new AuthorizationError('Access denied: Educators may only view their own profile.');
    }

    const data = this.loadData();
    const teacher = data.teachers.find(t => t.id === id);
    return teacher ? { ...teacher } : null;
  }

  /**
   * Only Administrators may create teachers.
   */
  public async createTeacher(teacherInput: Omit<Teacher, 'id'>): Promise<Teacher> {
    this.requireAdmin();
    const data = this.loadData();
    const newId = `tch-${Date.now()}`;
    const newTeacher: Teacher = {
      ...teacherInput,
      id: newId,
      assignedClassIds: teacherInput.assignedClassIds || []
    };

    // Update classes assigned to this new teacher
    if (newTeacher.assignedClassIds.length > 0) {
      data.classes = data.classes.map(cls => {
        if (newTeacher.assignedClassIds.includes(cls.id)) {
          return {
            ...cls,
            assignedTeacherId: newTeacher.id,
            assignedTeacherName: newTeacher.name
          };
        }
        return cls;
      });
    }

    data.teachers.push(newTeacher);
    this.saveData(data);
    return newTeacher;
  }

  /**
   * Only Administrators may update teachers.
   */
  public async updateTeacher(id: string, updates: Partial<Omit<Teacher, 'id'>>): Promise<Teacher> {
    this.requireAdmin();
    const data = this.loadData();
    const index = data.teachers.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error(`Teacher with id ${id} not found.`);
    }

    const current = data.teachers[index];
    const updated: Teacher = {
      ...current,
      ...updates
    };

    // Handle class assignment sync if classes or name changed
    if (updates.assignedClassIds !== undefined || updates.name !== undefined) {
      const newAssignedClassIds = updated.assignedClassIds;
      data.classes = data.classes.map(cls => {
        if (newAssignedClassIds.includes(cls.id)) {
          return {
            ...cls,
            assignedTeacherId: updated.id,
            assignedTeacherName: updated.name
          };
        } else if (cls.assignedTeacherId === updated.id) {
          return {
            ...cls,
            assignedTeacherId: null,
            assignedTeacherName: null
          };
        }
        return cls;
      });
    }

    data.teachers[index] = updated;
    this.saveData(data);
    return updated;
  }

  /**
   * Only Administrators may delete teachers.
   */
  public async deleteTeacher(id: string): Promise<void> {
    this.requireAdmin();
    const data = this.loadData();
    const teacherToDelete = data.teachers.find(t => t.id === id);
    if (!teacherToDelete) {
      throw new Error(`Teacher with id ${id} not found.`);
    }

    data.classes = data.classes.map(cls => {
      if (cls.assignedTeacherId === id) {
        return {
          ...cls,
          assignedTeacherId: null,
          assignedTeacherName: null
        };
      }
      return cls;
    });

    data.teachers = data.teachers.filter(t => t.id !== id);
    this.saveData(data);
  }

  // ===================== CLASSES CRUD =====================

  /**
   * Admin can view all classes.
   * Teachers only retrieve their assigned classes.
   */
  public async getClasses(): Promise<ClassEntity[]> {
    const user = this.getCurrentUserOrThrow();
    const data = this.loadData();

    let accessibleClasses = data.classes;
    if (user.role === 'TEACHER') {
      const teacher = data.teachers.find(t => t.id === user.teacherId);
      accessibleClasses = data.classes.filter(
        c => c.assignedTeacherId === user.teacherId || (teacher && teacher.assignedClassIds.includes(c.id))
      );
    }

    return accessibleClasses.map(cls => ({
      ...cls,
      studentCount: data.students.filter(s => s.classId === cls.id).length
    }));
  }

  /**
   * Admin can view any class.
   * Teachers can only view class if assigned to it.
   */
  public async getClassById(id: string): Promise<ClassEntity | null> {
    this.requireClassAccess(id);
    const data = this.loadData();
    const cls = data.classes.find(c => c.id === id);
    if (!cls) return null;
    return {
      ...cls,
      studentCount: data.students.filter(s => s.classId === cls.id).length
    };
  }

  /**
   * Only Administrators may create classes.
   */
  public async createClass(classInput: Omit<ClassEntity, 'id' | 'studentCount'>): Promise<ClassEntity> {
    this.requireAdmin();
    const data = this.loadData();
    const newId = `cls-${Date.now()}`;

    let assignedTeacherName = null;
    if (classInput.assignedTeacherId) {
      const teacher = data.teachers.find(t => t.id === classInput.assignedTeacherId);
      if (teacher) {
        assignedTeacherName = teacher.name;
        if (!teacher.assignedClassIds.includes(newId)) {
          teacher.assignedClassIds.push(newId);
        }
      }
    }

    const newClass: ClassEntity = {
      ...classInput,
      id: newId,
      assignedTeacherName,
      studentCount: 0
    };

    data.classes.push(newClass);
    this.saveData(data);
    return newClass;
  }

  /**
   * Only Administrators may update classes.
   */
  public async updateClass(id: string, updates: Partial<Omit<ClassEntity, 'id' | 'studentCount'>>): Promise<ClassEntity> {
    this.requireAdmin();
    const data = this.loadData();
    const index = data.classes.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error(`Class with id ${id} not found.`);
    }

    const current = data.classes[index];
    let assignedTeacherName = current.assignedTeacherName;

    if (updates.assignedTeacherId !== undefined) {
      const oldTeacherId = current.assignedTeacherId;
      const newTeacherId = updates.assignedTeacherId;

      if (oldTeacherId && oldTeacherId !== newTeacherId) {
        const oldTeacher = data.teachers.find(t => t.id === oldTeacherId);
        if (oldTeacher) {
          oldTeacher.assignedClassIds = oldTeacher.assignedClassIds.filter(cId => cId !== id);
        }
      }

      if (newTeacherId) {
        const newTeacher = data.teachers.find(t => t.id === newTeacherId);
        if (newTeacher) {
          assignedTeacherName = newTeacher.name;
          if (!newTeacher.assignedClassIds.includes(id)) {
            newTeacher.assignedClassIds.push(id);
          }
        } else {
          assignedTeacherName = null;
        }
      } else {
        assignedTeacherName = null;
      }
    }

    const updated: ClassEntity = {
      ...current,
      ...updates,
      assignedTeacherName,
      studentCount: data.students.filter(s => s.classId === id).length
    };

    data.classes[index] = updated;
    this.saveData(data);
    return updated;
  }

  /**
   * Only Administrators may delete classes.
   */
  public async deleteClass(id: string): Promise<void> {
    this.requireAdmin();
    const data = this.loadData();
    const clsToDelete = data.classes.find(c => c.id === id);
    if (!clsToDelete) {
      throw new Error(`Class with id ${id} not found.`);
    }

    data.teachers = data.teachers.map(teacher => {
      if (teacher.assignedClassIds.includes(id)) {
        return {
          ...teacher,
          assignedClassIds: teacher.assignedClassIds.filter(cId => cId !== id)
        };
      }
      return teacher;
    });

    data.students = data.students.filter(s => s.classId !== id);
    data.attendance = data.attendance.filter(a => a.classId !== id);
    data.classes = data.classes.filter(c => c.id !== id);
    this.saveData(data);
  }

  // ===================== STUDENTS CRUD =====================

  /**
   * Admin can view all students.
   * Teachers can ONLY view students belonging to their assigned classes.
   * If a teacher specifies a classId outside their assignment, throws AuthorizationError.
   */
  public async getStudents(filter?: { classId?: string; search?: string }): Promise<Student[]> {
    const user = this.getCurrentUserOrThrow();
    const data = this.loadData();

    if (user.role === 'TEACHER') {
      const teacher = data.teachers.find(t => t.id === user.teacherId);
      const teacherClassIds = data.classes
        .filter(c => c.assignedTeacherId === user.teacherId || (teacher && teacher.assignedClassIds.includes(c.id)))
        .map(c => c.id);

      // If teacher specifically requests a class, verify authorization
      if (filter?.classId) {
        if (!teacherClassIds.includes(filter.classId)) {
          throw new AuthorizationError(
            `Access denied: Educator "${user.name}" cannot view students of unassigned class (${filter.classId}).`
          );
        }
      }

      // Restrict all returned students strictly to teacher's assigned classes
      let result = data.students.filter(s => teacherClassIds.includes(s.classId));
      if (filter?.classId) {
        result = result.filter(s => s.classId === filter.classId);
      }
      if (filter?.search) {
        const q = filter.search.toLowerCase();
        result = result.filter(s =>
          s.name.toLowerCase().includes(q) ||
          s.rollNumber.toLowerCase().includes(q) ||
          (s.guardianName && s.guardianName.toLowerCase().includes(q))
        );
      }
      return result;
    }

    // Administrator
    let result = [...data.students];
    if (filter?.classId) {
      result = result.filter(s => s.classId === filter.classId);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        (s.guardianName && s.guardianName.toLowerCase().includes(q))
      );
    }
    return result;
  }

  /**
   * Admin can view any student.
   * Teacher may only view student if student is enrolled in their assigned class.
   */
  public async getStudentById(id: string): Promise<Student | null> {
    const user = this.getCurrentUserOrThrow();
    const data = this.loadData();
    const student = data.students.find(s => s.id === id);
    if (!student) return null;

    if (user.role === 'TEACHER') {
      this.requireClassAccess(student.classId);
    }

    return { ...student };
  }

  /**
   * Only Administrators may create students.
   */
  public async createStudent(studentInput: Omit<Student, 'id'>): Promise<Student> {
    this.requireAdmin();
    const data = this.loadData();

    const classExists = data.classes.some(c => c.id === studentInput.classId);
    if (!classExists) {
      throw new Error('Assigned class does not exist.');
    }

    const newId = `std-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newStudent: Student = {
      ...studentInput,
      id: newId
    };

    data.students.push(newStudent);

    const targetClass = data.classes.find(c => c.id === studentInput.classId);
    if (targetClass) {
      targetClass.studentCount = data.students.filter(s => s.classId === studentInput.classId).length;
    }

    this.saveData(data);
    return newStudent;
  }

  /**
   * Only Administrators may update students.
   */
  public async updateStudent(id: string, updates: Partial<Omit<Student, 'id'>>): Promise<Student> {
    this.requireAdmin();
    const data = this.loadData();
    const index = data.students.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error(`Student with id ${id} not found.`);
    }

    const oldClassId = data.students[index].classId;
    const updated: Student = {
      ...data.students[index],
      ...updates
    };

    data.students[index] = updated;

    if (updates.classId && updates.classId !== oldClassId) {
      data.classes.forEach(c => {
        c.studentCount = data.students.filter(s => s.classId === c.id).length;
      });
    }

    this.saveData(data);
    return updated;
  }

  /**
   * Only Administrators may delete students.
   */
  public async deleteStudent(id: string): Promise<void> {
    this.requireAdmin();
    const data = this.loadData();
    const student = data.students.find(s => s.id === id);
    if (!student) {
      throw new Error(`Student with id ${id} not found.`);
    }

    const classId = student.classId;
    data.students = data.students.filter(s => s.id !== id);
    data.attendance = data.attendance.filter(a => a.studentId !== id);

    const cls = data.classes.find(c => c.id === classId);
    if (cls) {
      cls.studentCount = data.students.filter(s => s.classId === classId).length;
    }

    this.saveData(data);
  }

  // ===================== ATTENDANCE =====================

  /**
   * Admin can view all attendance logs.
   * Teachers can ONLY view attendance logs for their assigned classes.
   * If a teacher specifies an unassigned classId, throws AuthorizationError.
   */
  public async getAttendance(filter?: {
    classId?: string;
    date?: string;
    studentId?: string;
  }): Promise<AttendanceRecord[]> {
    const user = this.getCurrentUserOrThrow();
    const data = this.loadData();

    if (user.role === 'TEACHER') {
      const teacher = data.teachers.find(t => t.id === user.teacherId);
      const teacherClassIds = data.classes
        .filter(c => c.assignedTeacherId === user.teacherId || (teacher && teacher.assignedClassIds.includes(c.id)))
        .map(c => c.id);

      // Verify specific class request
      if (filter?.classId) {
        if (!teacherClassIds.includes(filter.classId)) {
          throw new AuthorizationError(
            `Access denied: Educator "${user.name}" cannot view attendance of unassigned class (${filter.classId}).`
          );
        }
      }

      // If specific studentId is requested, verify student is in teacher's class
      if (filter?.studentId) {
        const student = data.students.find(s => s.id === filter.studentId);
        if (!student || !teacherClassIds.includes(student.classId)) {
          throw new AuthorizationError(
            `Access denied: Educator "${user.name}" cannot view attendance for student not in their class.`
          );
        }
      }

      let records = data.attendance.filter(r => teacherClassIds.includes(r.classId));
      if (filter?.classId) {
        records = records.filter(r => r.classId === filter.classId);
      }
      if (filter?.date) {
        records = records.filter(r => r.date === filter.date);
      }
      if (filter?.studentId) {
        records = records.filter(r => r.studentId === filter.studentId);
      }

      return records.sort((a, b) => b.date.localeCompare(a.date));
    }

    // Administrator
    let records = [...data.attendance];
    if (filter?.classId) {
      records = records.filter(r => r.classId === filter.classId);
    }
    if (filter?.date) {
      records = records.filter(r => r.date === filter.date);
    }
    if (filter?.studentId) {
      records = records.filter(r => r.studentId === filter.studentId);
    }

    return records.sort((a, b) => b.date.localeCompare(a.date));
  }

  /**
   * Save or edit attendance.
   * Admin can record attendance for any class.
   * Teachers can ONLY record attendance for their assigned classes.
   * Throws AuthorizationError if teacher tries to record/edit attendance for an unassigned class.
   */
  public async saveAttendance(
    classId: string,
    date: string,
    entries: { studentId: string; status: AttendanceStatus; notes?: string }[],
    markedBy: string
  ): Promise<AttendanceRecord[]> {
    if (!classId) throw new Error('Class ID is required');
    if (!date) throw new Error('Date is required');
    if (!entries || entries.length === 0) throw new Error('No attendance records to save');

    // Strict class-level authorization check
    this.requireClassAccess(classId);

    const data = this.loadData();

    // Verify all students belong to this class
    const invalidStudent = entries.find(e => {
      const s = data.students.find(std => std.id === e.studentId);
      return !s || s.classId !== classId;
    });

    if (invalidStudent) {
      throw new Error(`Integrity error: Student "${invalidStudent.studentId}" does not belong to class "${classId}".`);
    }

    const nowIso = new Date().toISOString();
    const savedRecords: AttendanceRecord[] = [];

    entries.forEach(entry => {
      const existingIdx = data.attendance.findIndex(
        r => r.studentId === entry.studentId && r.classId === classId && r.date === date
      );

      if (existingIdx !== -1) {
        data.attendance[existingIdx] = {
          ...data.attendance[existingIdx],
          status: entry.status,
          notes: entry.notes ?? data.attendance[existingIdx].notes,
          markedBy,
          updatedAt: nowIso
        };
        savedRecords.push(data.attendance[existingIdx]);
      } else {
        const newRecord: AttendanceRecord = {
          id: `att-${entry.studentId}-${date}-${Date.now().toString(36)}`,
          studentId: entry.studentId,
          classId,
          date,
          status: entry.status,
          notes: entry.notes,
          markedBy,
          updatedAt: nowIso
        };
        data.attendance.push(newRecord);
        savedRecords.push(newRecord);
      }
    });

    this.saveData(data);
    return savedRecords;
  }

  /**
   * Only Administrators may delete attendance logs.
   */
  public async deleteAttendance(id: string): Promise<void> {
    this.requireAdmin();
    const data = this.loadData();
    data.attendance = data.attendance.filter(a => a.id !== id);
    this.saveData(data);
  }

  // ===================== STATS & REPORTING =====================

  /**
   * Only Administrators may access organization-wide reports & analytics.
   */
  public async getDashboardStats(): Promise<DashboardStats> {
    this.requireAdmin();
    const data = this.loadData();

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const totalStudents = data.students.length;
    const totalClasses = data.classes.length;
    const totalTeachers = data.teachers.length;

    const todayRecords = data.attendance.filter(r => r.date === todayStr);
    const presentToday = todayRecords.filter(r => r.status === 'present').length;
    const absentToday = todayRecords.filter(r => r.status === 'absent').length;
    const totalTodayMarked = presentToday + absentToday;
    const todayPercentage = totalTodayMarked > 0 ? Math.round((presentToday / totalTodayMarked) * 100) : 0;

    const todayAttendance: AttendanceSummary = {
      total: totalTodayMarked,
      present: presentToday,
      absent: absentToday,
      percentage: todayPercentage
    };

    const classBreakdown: ClassAttendanceSummary[] = data.classes.map(cls => {
      const clsStudents = data.students.filter(s => s.classId === cls.id);
      const clsTodayRecords = todayRecords.filter(r => r.classId === cls.id);
      const presentCount = clsTodayRecords.filter(r => r.status === 'present').length;
      const absentCount = clsTodayRecords.filter(r => r.status === 'absent').length;
      const markedStudents = presentCount + absentCount;
      const percentage = markedStudents > 0 ? Math.round((presentCount / markedStudents) * 100) : 0;

      return {
        classId: cls.id,
        className: cls.name,
        learningCenter: cls.learningCenter,
        totalStudents: clsStudents.length,
        markedStudents,
        presentCount,
        absentCount,
        percentage,
        isMarkedToday: markedStudents > 0
      };
    });

    return {
      totalTeachers,
      totalClasses,
      totalStudents,
      todayAttendance,
      classBreakdown
    };
  }

  /**
   * Only Administrators may export organization-wide reports.
   */
  public async getOrganizationReports(): Promise<{
    classes: ClassEntity[];
    students: Student[];
    attendance: AttendanceRecord[];
  }> {
    this.requireAdmin();
    const data = this.loadData();
    return {
      classes: [...data.classes],
      students: [...data.students],
      attendance: [...data.attendance]
    };
  }

  /**
   * Teacher dashboard data:
   * A teacher may ONLY retrieve their own scoped dashboard data.
   * Passing another teacher's ID throws AuthorizationError.
   * Admin may view any teacher's dashboard data.
   */
  public async getTeacherDashboardData(teacherId: string): Promise<{
    teacher: Teacher | null;
    classes: ClassEntity[];
    stats: {
      assignedClassesCount: number;
      totalStudentsCount: number;
      todayMarkedClassesCount: number;
      todayAttendanceRate: number;
    };
    classSummaries: ClassAttendanceSummary[];
  }> {
    const user = this.getCurrentUserOrThrow();
    if (user.role === 'TEACHER' && user.teacherId !== teacherId) {
      throw new AuthorizationError(
        `Access denied: Educator "${user.name}" cannot view the dashboard of another educator (${teacherId}).`
      );
    }

    const data = this.loadData();
    const teacher = data.teachers.find(t => t.id === teacherId) || null;
    const teacherClasses = data.classes
      .filter(c => c.assignedTeacherId === teacherId || (teacher && teacher.assignedClassIds.includes(c.id)))
      .map(c => ({
        ...c,
        studentCount: data.students.filter(s => s.classId === c.id).length
      }));

    const teacherClassIds = teacherClasses.map(c => c.id);
    const studentsInTeacherClasses = data.students.filter(s => teacherClassIds.includes(s.classId));

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const todayRecords = data.attendance.filter(r => teacherClassIds.includes(r.classId) && r.date === todayStr);
    const presentCount = todayRecords.filter(r => r.status === 'present').length;
    const totalMarked = todayRecords.length;
    const todayAttendanceRate = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0;

    let todayMarkedClassesCount = 0;
    const classSummaries: ClassAttendanceSummary[] = teacherClasses.map(cls => {
      const clsStudents = studentsInTeacherClasses.filter(s => s.classId === cls.id);
      const clsTodayRecords = todayRecords.filter(r => r.classId === cls.id);
      const clsPresent = clsTodayRecords.filter(r => r.status === 'present').length;
      const clsAbsent = clsTodayRecords.filter(r => r.status === 'absent').length;
      const marked = clsPresent + clsAbsent;
      const pct = marked > 0 ? Math.round((clsPresent / marked) * 100) : 0;

      if (marked > 0) todayMarkedClassesCount++;

      return {
        classId: cls.id,
        className: cls.name,
        learningCenter: cls.learningCenter,
        totalStudents: clsStudents.length,
        markedStudents: marked,
        presentCount: clsPresent,
        absentCount: clsAbsent,
        percentage: pct,
        isMarkedToday: marked > 0
      };
    });

    return {
      teacher,
      classes: teacherClasses,
      stats: {
        assignedClassesCount: teacherClasses.length,
        totalStudentsCount: studentsInTeacherClasses.length,
        todayMarkedClassesCount,
        todayAttendanceRate
      },
      classSummaries
    };
  }

  /**
   * Verifies if teacher has permission to access classId.
   */
  public async canTeacherAccessClass(teacherId: string, classId: string): Promise<boolean> {
    const data = this.loadData();
    const teacher = data.teachers.find(t => t.id === teacherId);
    if (!teacher) return false;
    const cls = data.classes.find(c => c.id === classId);
    if (!cls) return false;
    return cls.assignedTeacherId === teacherId || teacher.assignedClassIds.includes(classId);
  }
}

export const dataService = new DataService();
