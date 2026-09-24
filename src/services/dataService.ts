import {
  Teacher,
  ClassEntity,
  Student,
  AttendanceRecord,
  AttendanceStatus,
  DashboardStats,
  ClassAttendanceSummary,
  AttendanceSummary
} from '../types';
import { getFreshMockDatabase, MockDatabaseState } from '../data/mockDatabase';

const STORAGE_KEY = 'akshar_connect_records_v2';

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

  // ===================== TEACHERS CRUD =====================

  public async getTeachers(): Promise<Teacher[]> {
    const data = this.loadData();
    return [...data.teachers];
  }

  public async getTeacherById(id: string): Promise<Teacher | null> {
    const data = this.loadData();
    const teacher = data.teachers.find(t => t.id === id);
    return teacher ? { ...teacher } : null;
  }

  public async createTeacher(teacherInput: Omit<Teacher, 'id'>): Promise<Teacher> {
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

  public async updateTeacher(id: string, updates: Partial<Omit<Teacher, 'id'>>): Promise<Teacher> {
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
          // Unassigned from this class
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

  public async deleteTeacher(id: string): Promise<void> {
    const data = this.loadData();
    const teacherToDelete = data.teachers.find(t => t.id === id);
    if (!teacherToDelete) {
      throw new Error(`Teacher with id ${id} not found.`);
    }

    // Clean up class associations: classes assigned to this teacher become unassigned
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

  public async getClasses(): Promise<ClassEntity[]> {
    const data = this.loadData();
    // Ensure student count reflects actual students in that class
    return data.classes.map(cls => ({
      ...cls,
      studentCount: data.students.filter(s => s.classId === cls.id).length
    }));
  }

  public async getClassById(id: string): Promise<ClassEntity | null> {
    const data = this.loadData();
    const cls = data.classes.find(c => c.id === id);
    if (!cls) return null;
    return {
      ...cls,
      studentCount: data.students.filter(s => s.classId === cls.id).length
    };
  }

  public async createClass(classInput: Omit<ClassEntity, 'id' | 'studentCount'>): Promise<ClassEntity> {
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

  public async updateClass(id: string, updates: Partial<Omit<ClassEntity, 'id' | 'studentCount'>>): Promise<ClassEntity> {
    const data = this.loadData();
    const index = data.classes.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error(`Class with id ${id} not found.`);
    }

    const current = data.classes[index];
    let assignedTeacherName = current.assignedTeacherName;

    // If teacher assignment changed
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

  public async deleteClass(id: string): Promise<void> {
    const data = this.loadData();
    const clsToDelete = data.classes.find(c => c.id === id);
    if (!clsToDelete) {
      throw new Error(`Class with id ${id} not found.`);
    }

    // 1. Unassign from teacher
    data.teachers = data.teachers.map(teacher => {
      if (teacher.assignedClassIds.includes(id)) {
        return {
          ...teacher,
          assignedClassIds: teacher.assignedClassIds.filter(cId => cId !== id)
        };
      }
      return teacher;
    });

    // 2. Cascade delete or unassign students & attendance for this class
    data.students = data.students.filter(s => s.classId !== id);
    data.attendance = data.attendance.filter(a => a.classId !== id);

    // 3. Remove class
    data.classes = data.classes.filter(c => c.id !== id);
    this.saveData(data);
  }

  // ===================== STUDENTS CRUD =====================

  public async getStudents(filter?: { classId?: string; search?: string }): Promise<Student[]> {
    const data = this.loadData();
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

  public async getStudentById(id: string): Promise<Student | null> {
    const data = this.loadData();
    const student = data.students.find(s => s.id === id);
    return student ? { ...student } : null;
  }

  public async createStudent(studentInput: Omit<Student, 'id'>): Promise<Student> {
    const data = this.loadData();
    
    // Verify class exists
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

    // Update class student count
    const targetClass = data.classes.find(c => c.id === studentInput.classId);
    if (targetClass) {
      targetClass.studentCount = data.students.filter(s => s.classId === studentInput.classId).length;
    }

    this.saveData(data);
    return newStudent;
  }

  public async updateStudent(id: string, updates: Partial<Omit<Student, 'id'>>): Promise<Student> {
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

    // Update student counts if class changed
    if (updates.classId && updates.classId !== oldClassId) {
      data.classes.forEach(c => {
        c.studentCount = data.students.filter(s => s.classId === c.id).length;
      });
    }

    this.saveData(data);
    return updated;
  }

  public async deleteStudent(id: string): Promise<void> {
    const data = this.loadData();
    const student = data.students.find(s => s.id === id);
    if (!student) {
      throw new Error(`Student with id ${id} not found.`);
    }

    const classId = student.classId;

    // Remove student
    data.students = data.students.filter(s => s.id !== id);

    // Remove attendance records for this student
    data.attendance = data.attendance.filter(a => a.studentId !== id);

    // Recalculate class student count
    const cls = data.classes.find(c => c.id === classId);
    if (cls) {
      cls.studentCount = data.students.filter(s => s.classId === classId).length;
    }

    this.saveData(data);
  }

  // ===================== ATTENDANCE =====================

  public async getAttendance(filter?: {
    classId?: string;
    date?: string;
    studentId?: string;
  }): Promise<AttendanceRecord[]> {
    const data = this.loadData();
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

    // Sort newest date first
    return records.sort((a, b) => b.date.localeCompare(a.date));
  }

  public async saveAttendance(
    classId: string,
    date: string,
    entries: { studentId: string; status: AttendanceStatus; notes?: string }[],
    markedBy: string
  ): Promise<AttendanceRecord[]> {
    if (!classId) throw new Error('Class ID is required');
    if (!date) throw new Error('Date is required');
    if (!entries || entries.length === 0) throw new Error('No attendance records to save');

    const data = this.loadData();
    const nowIso = new Date().toISOString();

    const savedRecords: AttendanceRecord[] = [];

    entries.forEach(entry => {
      // Find if record already exists for (studentId + classId + date)
      const existingIdx = data.attendance.findIndex(
        r => r.studentId === entry.studentId && r.classId === classId && r.date === date
      );

      if (existingIdx !== -1) {
        // Update existing record (prevent duplicates)
        data.attendance[existingIdx] = {
          ...data.attendance[existingIdx],
          status: entry.status,
          notes: entry.notes ?? data.attendance[existingIdx].notes,
          markedBy,
          updatedAt: nowIso
        };
        savedRecords.push(data.attendance[existingIdx]);
      } else {
        // Create new record
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

  // ===================== STATS & REPORTING =====================

  public async getDashboardStats(): Promise<DashboardStats> {
    const data = this.loadData();
    
    // Format today as YYYY-MM-DD
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const totalStudents = data.students.length;
    const totalClasses = data.classes.length;
    const totalTeachers = data.teachers.length;

    // Today's attendance
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

    // Class breakdown for today
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

  // Teacher-specific permissions & stats
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

  // Teacher permission enforcement
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
