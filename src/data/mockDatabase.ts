import type { User, Teacher, ClassEntity, Student, AttendanceRecord } from '../types';

export const INITIAL_ADMIN: User = {
  id: 'usr-admin-1',
  name: 'Dr. Anand Deshmukh',
  email: 'admin@aksharpaaul.org',
  role: 'ADMIN',
  phone: '+91 98200 99887'
};

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'tch-1',
    name: 'Riya Patil',
    email: 'riya.patil@aksharpaaul.org',
    phone: '+91 98201 12345',
    assignedClassIds: ['cls-1'],
    status: 'active',
    qualification: 'B.Ed, MA English',
    joinedDate: '2023-06-15'
  },
  {
    id: 'tch-2',
    name: 'Vikram Kulkarni',
    email: 'vikram.kulkarni@aksharpaaul.org',
    phone: '+91 98202 23456',
    assignedClassIds: ['cls-2'],
    status: 'active',
    qualification: 'D.Ed, B.Sc Mathematics',
    joinedDate: '2023-08-01'
  },
  {
    id: 'tch-3',
    name: 'Anita Sharma',
    email: 'anita.sharma@aksharpaaul.org',
    phone: '+91 98203 34567',
    assignedClassIds: ['cls-3'],
    status: 'active',
    qualification: 'B.El.Ed, Hindi Specialist',
    joinedDate: '2024-01-10'
  },
  {
    id: 'tch-4',
    name: 'Suresh Pawar',
    email: 'suresh.pawar@aksharpaaul.org',
    phone: '+91 98204 45678',
    assignedClassIds: ['cls-4'],
    status: 'active',
    qualification: 'MSW, Certified Educator',
    joinedDate: '2024-03-20'
  }
];

export const INITIAL_CLASSES: ClassEntity[] = [
  {
    id: 'cls-1',
    name: 'Navchetna Standard 3',
    grade: 'Standard 3',
    learningCenter: 'Dharavi Community Center',
    assignedTeacherId: 'tch-1',
    assignedTeacherName: 'Riya Patil',
    studentCount: 30,
    schedule: 'Mon - Fri (09:00 AM - 01:00 PM)'
  },
  {
    id: 'cls-2',
    name: 'Prerana Standard 4',
    grade: 'Standard 4',
    learningCenter: 'Govandi Uplift Center',
    assignedTeacherId: 'tch-2',
    assignedTeacherName: 'Vikram Kulkarni',
    studentCount: 30,
    schedule: 'Mon - Fri (09:30 AM - 01:30 PM)'
  },
  {
    id: 'cls-3',
    name: 'Udaan Standard 5',
    grade: 'Standard 5',
    learningCenter: 'Wadala Balwadi Center',
    assignedTeacherId: 'tch-3',
    assignedTeacherName: 'Anita Sharma',
    studentCount: 30,
    schedule: 'Mon - Fri (10:00 AM - 02:00 PM)'
  },
  {
    id: 'cls-4',
    name: 'Sankalp Standard 6',
    grade: 'Standard 6',
    learningCenter: 'Kurla Literacy Hub',
    assignedTeacherId: 'tch-4',
    assignedTeacherName: 'Suresh Pawar',
    studentCount: 30,
    schedule: 'Mon - Fri (09:00 AM - 01:00 PM)'
  }
];

// Student name pool with realistic Indian first and last names
const FIRST_NAMES_BOYS = [
  'Aarav', 'Rohan', 'Vihaan', 'Aditya', 'Sai', 'Ishaan', 'Arjun', 'Kunal',
  'Rahul', 'Sameer', 'Pranav', 'Yash', 'Omkar', 'Tejas', 'Nikhil', 'Dev',
  'Ayush', 'Manish', 'Harsh', 'Tanmay'
];

const FIRST_NAMES_GIRLS = [
  'Ananya', 'Priya', 'Sneha', 'Diya', 'Pooja', 'Meera', 'Tanvi', 'Neha',
  'Shreya', 'Kavya', 'Ritu', 'Divya', 'Sakshi', 'Swati', 'Gauri', 'Isha',
  'Anushka', 'Vaishnavi', 'Bhavna', 'Roshni'
];

const LAST_NAMES = [
  'Jadhav', 'Shinde', 'Patil', 'Chavan', 'Kadam', 'Kamble', 'More', 'Gaikwad',
  'Salunkhe', 'Bhosale', 'Sawant', 'Mane', 'Pawar', 'Deshmukh', 'Thakur', 'Waghmare',
  'Rathod', 'Ghatge', 'Kale', 'Gore', 'Shirke', 'Sutar', 'Tambe', 'Dharne', 'Ingle',
  'Khilare', 'Lohar', 'Mestri', 'Nalawade', 'Rane'
];

const GUARDIAN_RELATIONS = ['Mother', 'Father', 'Uncle', 'Grandmother'];

export function generateInitialStudents(): Student[] {
  const students: Student[] = [];
  const classConfigs = [
    { classId: 'cls-1', prefix: 'NC3' },
    { classId: 'cls-2', prefix: 'PR4' },
    { classId: 'cls-3', prefix: 'UD5' },
    { classId: 'cls-4', prefix: 'SK6' }
  ];

  classConfigs.forEach((cfg) => {
    for (let i = 1; i <= 30; i++) {
      const isGirl = i % 2 === 0;
      const firstName = isGirl
        ? FIRST_NAMES_GIRLS[(i * 3 + 5) % FIRST_NAMES_GIRLS.length]
        : FIRST_NAMES_BOYS[(i * 2 + 3) % FIRST_NAMES_BOYS.length];
      const lastName = LAST_NAMES[(i * 7 + 1) % LAST_NAMES.length];
      const rollNumber = `${cfg.prefix}-${String(i).padStart(2, '0')}`;
      const guardianLastName = lastName;
      const relation = GUARDIAN_RELATIONS[i % GUARDIAN_RELATIONS.length];
      const guardianFirstName = relation === 'Mother' || relation === 'Grandmother' ? 'Sunita' : 'Ramesh';

      students.push({
        id: `std-${cfg.classId}-${i}`,
        name: `${firstName} ${lastName}`,
        rollNumber,
        classId: cfg.classId,
        gender: isGirl ? 'female' : 'male',
        status: 'active',
        guardianName: `${guardianFirstName} ${guardianLastName} (${relation})`,
        guardianPhone: `+91 97654 ${String(10000 + i * 37).padStart(5, '0')}`,
        dob: `201${4 + (parseInt(cfg.classId.replace('cls-', ''), 10) % 3)}-0${(i % 9) + 1}-15`
      });
    }
  });

  return students;
}

/**
 * Generate a modest, legitimate sample of previous working day attendance for classes 1 & 2.
 * Leaves today completely open and unrecorded so educators can immediately take today's attendance.
 */
export function generateInitialAttendance(students: Student[]): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  
  // Format YYYY-MM-DD
  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Find previous 2 working days (strictly excluding today, i >= 1)
  const previousDates: string[] = [];
  let daysBack = 1;
  while (previousDates.length < 2 && daysBack < 10) {
    const d = new Date(today);
    d.setDate(today.getDate() - daysBack);
    if (d.getDay() !== 0) { // skip Sunday
      previousDates.push(formatDate(d));
    }
    daysBack++;
  }

  // Teacher lookup map for classes
  const classTeacherMap: Record<string, string> = {
    'cls-1': 'Riya Patil',
    'cls-2': 'Vikram Kulkarni'
  };

  // Only seed historical attendance for cls-1 and cls-2, leaving cls-3 and cls-4 fresh
  const historicalStudents = students.filter(s => s.classId === 'cls-1' || s.classId === 'cls-2');

  previousDates.forEach((dateStr, dateIdx) => {
    historicalStudents.forEach((student, sIdx) => {
      // Natural 90% attendance pattern with legitimate reasons
      const isAbsent = ((sIdx * 7 + dateIdx * 3) % 9) === 0;
      const teacherName = classTeacherMap[student.classId] || 'Riya Patil';

      records.push({
        id: `att-${student.id}-${dateStr}`,
        studentId: student.id,
        classId: student.classId,
        date: dateStr,
        status: isAbsent ? 'absent' : 'present',
        markedBy: teacherName,
        updatedAt: `${dateStr}T11:45:00.000Z`,
        notes: isAbsent ? 'Family function or medical appointment' : undefined
      });
    });
  });

  return records;
}

export interface MockDatabaseState {
  users: User[];
  teachers: Teacher[];
  classes: ClassEntity[];
  students: Student[];
  attendance: AttendanceRecord[];
}

export function getFreshMockDatabase(): MockDatabaseState {
  const students = generateInitialStudents();
  const attendance = generateInitialAttendance(students);

  const teacherUsers: User[] = INITIAL_TEACHERS.map(t => ({
    id: `usr-${t.id}`,
    name: t.name,
    email: t.email,
    role: 'TEACHER',
    teacherId: t.id,
    phone: t.phone
  }));

  return {
    users: [INITIAL_ADMIN, ...teacherUsers],
    teachers: JSON.parse(JSON.stringify(INITIAL_TEACHERS)),
    classes: JSON.parse(JSON.stringify(INITIAL_CLASSES)),
    students,
    attendance
  };
}
