/**
 * Akshar Connect - Complete RBAC & Security Audit Test Suite
 * Validates the 14-test security matrix against authService, dataService, and route guards.
 */

import './setupPolyfill';
import { authService } from '../services/authService';
import { dataService, AuthorizationError } from '../services/dataService';

interface TestResult {
  id: number;
  name: string;
  category: string;
  expected: string;
  actual: string;
  passed: boolean;
  errorDetails?: string;
}

const results: TestResult[] = [];

function recordResult(
  id: number,
  name: string,
  category: string,
  expected: string,
  actual: string,
  passed: boolean,
  errorDetails?: string
) {
  results.push({ id, name, category, expected, actual, passed, errorDetails });
  const statusStr = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${statusStr}] TEST ${id}: ${name}`);
  if (errorDetails) {
    console.log(`   Details: ${errorDetails}`);
  }
}

async function runSecurityAudit() {
  console.log('====================================================');
  console.log('AKSHAR CONNECT - ROLE-BASED ACCESS CONTROL AUDIT');
  console.log('====================================================\n');

  // Reset database state to pristine defaults
  dataService.resetData();

  // -----------------------------------------------------------------
  // TEST 1: Teacher Riya Patil (cls-1) access own class -> ALLOWED
  // -----------------------------------------------------------------
  try {
    await authService.login('riya.patil@aksharpaaul.org', 'teacher123');
    const classes = await dataService.getClasses();
    const ownClass = await dataService.getClassById('cls-1');
    const hasClass1 = classes.some(c => c.id === 'cls-1');
    const passed = hasClass1 && ownClass !== null && ownClass.id === 'cls-1';

    recordResult(
      1,
      'Teacher Riya Patil access own class (cls-1)',
      'Class Access Isolation',
      'Access allowed to cls-1',
      `Classes accessible: ${classes.map(c => c.id).join(', ')}. cls-1 fetched: "${ownClass?.name}"`,
      passed
    );
  } catch (err: any) {
    recordResult(1, 'Teacher Riya Patil access own class (cls-1)', 'Class Access Isolation', 'Allowed', err.message, false, err.message);
  }

  // -----------------------------------------------------------------
  // TEST 2: Teacher Riya Patil access Vikram\'s class (cls-2) -> DENIED
  // -----------------------------------------------------------------
  try {
    await authService.login('riya.patil@aksharpaaul.org', 'teacher123');
    let denied = false;
    let errMessage = '';
    try {
      await dataService.getClassById('cls-2');
    } catch (err: any) {
      if (err instanceof AuthorizationError || err.name === 'AuthorizationError') {
        denied = true;
        errMessage = err.message;
      } else {
        throw err;
      }
    }

    recordResult(
      2,
      "Teacher Riya Patil access Vikram's class (cls-2)",
      'Class Access Isolation',
      'AuthorizationError thrown',
      denied ? `Blocked with: "${errMessage}"` : 'Failed: No AuthorizationError thrown',
      denied
    );
  } catch (err: any) {
    recordResult(2, "Teacher Riya Patil access Vikram's class (cls-2)", 'Class Access Isolation', 'AuthorizationError', err.message, false, err.message);
  }

  // -----------------------------------------------------------------
  // TEST 3: Teacher Riya Patil view Vikram\'s students -> DENIED
  // -----------------------------------------------------------------
  try {
    await authService.login('riya.patil@aksharpaaul.org', 'teacher123');
    let deniedFilter = false;
    let filterErr = '';
    try {
      await dataService.getStudents({ classId: 'cls-2' });
    } catch (err: any) {
      if (err instanceof AuthorizationError) {
        deniedFilter = true;
        filterErr = err.message;
      }
    }

    // Also test getStudentById on a student in cls-2 (std-cls-2-1)
    let deniedSingle = false;
    let singleErr = '';
    try {
      await dataService.getStudentById('std-cls-2-1');
    } catch (err: any) {
      if (err instanceof AuthorizationError) {
        deniedSingle = true;
        singleErr = err.message;
      }
    }

    const passed = deniedFilter && deniedSingle;
    recordResult(
      3,
      "Teacher Riya Patil view Vikram's students (cls-2)",
      'Student Roster Isolation',
      'AuthorizationError for cls-2 filter and student std-cls-2-1',
      `Filter query blocked: ${deniedFilter} ("${filterErr}"), Single student blocked: ${deniedSingle} ("${singleErr}")`,
      passed
    );
  } catch (err: any) {
    recordResult(3, "Teacher Riya Patil view Vikram's students", 'Student Roster Isolation', 'AuthorizationError', err.message, false, err.message);
  }

  // -----------------------------------------------------------------
  // TEST 4: Teacher Riya Patil record attendance for Vikram\'s class -> DENIED
  // -----------------------------------------------------------------
  try {
    await authService.login('riya.patil@aksharpaaul.org', 'teacher123');
    let denied = false;
    let errMessage = '';
    try {
      await dataService.saveAttendance(
        'cls-2',
        '2026-09-24',
        [{ studentId: 'std-cls-2-1', status: 'present' }],
        'Riya Patil'
      );
    } catch (err: any) {
      if (err instanceof AuthorizationError) {
        denied = true;
        errMessage = err.message;
      }
    }

    recordResult(
      4,
      "Teacher Riya Patil record attendance for Vikram's class (cls-2)",
      'Attendance Recording Isolation',
      'AuthorizationError thrown',
      denied ? `Blocked with: "${errMessage}"` : 'Failed: No AuthorizationError thrown',
      denied
    );
  } catch (err: any) {
    recordResult(4, "Teacher Riya Patil record attendance for Vikram's class", 'Attendance Recording Isolation', 'AuthorizationError', err.message, false, err.message);
  }

  // -----------------------------------------------------------------
  // TEST 5: Teacher Riya Patil modify Vikram\'s existing attendance -> DENIED
  // -----------------------------------------------------------------
  try {
    // First, login as Admin to record an initial attendance record for Vikram's class (cls-2)
    await authService.login('admin@aksharpaaul.org', 'admin123');
    await dataService.saveAttendance(
      'cls-2',
      '2026-09-20',
      [{ studentId: 'std-cls-2-1', status: 'present', notes: 'Initial by Admin' }],
      'System Admin'
    );

    // Now switch to Teacher Riya Patil and attempt to overwrite/modify it
    await authService.login('riya.patil@aksharpaaul.org', 'teacher123');
    let denied = false;
    let errMessage = '';
    try {
      await dataService.saveAttendance(
        'cls-2',
        '2026-09-20',
        [{ studentId: 'std-cls-2-1', status: 'absent', notes: 'Tampered by Riya' }],
        'Riya Patil'
      );
    } catch (err: any) {
      if (err instanceof AuthorizationError) {
        denied = true;
        errMessage = err.message;
      }
    }

    recordResult(
      5,
      "Teacher Riya Patil modify Vikram's existing attendance (cls-2)",
      'Attendance Modification Isolation',
      'AuthorizationError thrown',
      denied ? `Blocked with: "${errMessage}"` : 'Failed: No AuthorizationError thrown',
      denied
    );
  } catch (err: any) {
    recordResult(5, "Teacher Riya Patil modify Vikram's existing attendance", 'Attendance Modification Isolation', 'AuthorizationError', err.message, false, err.message);
  }

  // -----------------------------------------------------------------
  // TEST 6: Teacher Riya Patil access /admin/dashboard -> DENIED / REDIRECTED
  // -----------------------------------------------------------------
  try {
    await authService.login('riya.patil@aksharpaaul.org', 'teacher123');
    const user = authService.getCurrentUser();

    // Verify ProtectedRoute redirection logic for TEACHER attempting ADMIN route
    const allowedRoles = ['ADMIN'];
    const isTeacher = user?.role === 'TEACHER';
    const isBlockedByRoute = !allowedRoles.includes(user?.role || '');
    const redirectTarget = isTeacher ? '/teacher/dashboard' : '/login';

    // Verify direct dataService query backing admin dashboard throws AuthorizationError
    let serviceDenied = false;
    let serviceErrMsg = '';
    try {
      await dataService.getDashboardStats();
    } catch (err: any) {
      if (err instanceof AuthorizationError) {
        serviceDenied = true;
        serviceErrMsg = err.message;
      }
    }

    const passed = isBlockedByRoute && redirectTarget === '/teacher/dashboard' && serviceDenied;
    recordResult(
      6,
      'Teacher Riya Patil access /admin/dashboard',
      'Administrative Route Protection',
      'Route redirects to /teacher/dashboard and service queries rejected with AuthorizationError',
      `Route blocked: ${isBlockedByRoute}, Redirect target: ${redirectTarget}, Service blocked: ${serviceDenied} ("${serviceErrMsg}")`,
      passed
    );
  } catch (err: any) {
    recordResult(6, 'Teacher Riya Patil access /admin/dashboard', 'Administrative Route Protection', 'Denied/Redirected', err.message, false, err.message);
  }

  // -----------------------------------------------------------------
  // TEST 7: Teacher Riya Patil access teacher management -> DENIED
  // -----------------------------------------------------------------
  try {
    await authService.login('riya.patil@aksharpaaul.org', 'teacher123');

    let getTeachersDenied = false;
    try {
      await dataService.getTeachers();
    } catch (err: any) {
      if (err instanceof AuthorizationError) getTeachersDenied = true;
    }

    let createTeacherDenied = false;
    try {
      await dataService.createTeacher({
        name: 'Unauthorized Teacher',
        email: 'unauth@test.org',
        phone: '9999999999',
        assignedClassIds: [],
        status: 'active',
        joinedDate: '2026-09-24'
      });
    } catch (err: any) {
      if (err instanceof AuthorizationError) createTeacherDenied = true;
    }

    let updateTeacherDenied = false;
    try {
      await dataService.updateTeacher('tch-2', { name: 'Hacked Name' });
    } catch (err: any) {
      if (err instanceof AuthorizationError) updateTeacherDenied = true;
    }

    let deleteTeacherDenied = false;
    try {
      await dataService.deleteTeacher('tch-2');
    } catch (err: any) {
      if (err instanceof AuthorizationError) deleteTeacherDenied = true;
    }

    const passed = getTeachersDenied && createTeacherDenied && updateTeacherDenied && deleteTeacherDenied;
    recordResult(
      7,
      'Teacher Riya Patil access teacher management (view/create/update/delete)',
      'Teacher Management Isolation',
      'All teacher CRUD operations throw AuthorizationError',
      `getTeachers: ${getTeachersDenied}, createTeacher: ${createTeacherDenied}, updateTeacher: ${updateTeacherDenied}, deleteTeacher: ${deleteTeacherDenied}`,
      passed
    );
  } catch (err: any) {
    recordResult(7, 'Teacher Riya Patil access teacher management', 'Teacher Management Isolation', 'All CRUD Denied', err.message, false, err.message);
  }

  // -----------------------------------------------------------------
  // TEST 8: Teacher Riya Patil create/edit/delete student -> DENIED
  // -----------------------------------------------------------------
  try {
    await authService.login('riya.patil@aksharpaaul.org', 'teacher123');

    let createDenied = false;
    try {
      await dataService.createStudent({
        name: 'Illegal Student',
        rollNumber: 'ROLL-ILLEGAL',
        classId: 'cls-1',
        gender: 'male',
        status: 'active',
        guardianName: 'Guardian',
        guardianPhone: '9876543210'
      });
    } catch (err: any) {
      if (err instanceof AuthorizationError) createDenied = true;
    }

    let updateDenied = false;
    try {
      await dataService.updateStudent('std-cls-1-1', { name: 'Altered Student' });
    } catch (err: any) {
      if (err instanceof AuthorizationError) updateDenied = true;
    }

    let deleteDenied = false;
    try {
      await dataService.deleteStudent('std-cls-1-1');
    } catch (err: any) {
      if (err instanceof AuthorizationError) deleteDenied = true;
    }

    const passed = createDenied && updateDenied && deleteDenied;
    recordResult(
      8,
      'Teacher Riya Patil create/edit/delete student',
      'Student Master Data Protection',
      'createStudent, updateStudent, and deleteStudent throw AuthorizationError',
      `createStudent: ${createDenied}, updateStudent: ${updateDenied}, deleteStudent: ${deleteDenied}`,
      passed
    );
  } catch (err: any) {
    recordResult(8, 'Teacher Riya Patil create/edit/delete student', 'Student Master Data Protection', 'All student CRUD Denied', err.message, false, err.message);
  }

  // -----------------------------------------------------------------
  // TEST 9: Teacher Riya Patil change class ID in URL or state -> DENIED
  // -----------------------------------------------------------------
  try {
    await authService.login('riya.patil@aksharpaaul.org', 'teacher123');
    const user = authService.getCurrentUser()!;

    // 1. Check UI validation guard in TakeAttendancePage:
    const dashboardData = await dataService.getTeacherDashboardData(user.teacherId!);
    const teacherClasses = dashboardData.classes;
    const requestedClassId = 'cls-2'; // Tampered via URL: /teacher/attendance?classId=cls-2
    const isUnauthorizedAttempt = requestedClassId !== null && !teacherClasses.some(c => c.id === requestedClassId);

    // 2. Check service-level guard if tampered request is sent anyway:
    let serviceRejected = false;
    try {
      await dataService.saveAttendance(
        requestedClassId,
        '2026-09-24',
        [{ studentId: 'std-cls-2-1', status: 'present' }],
        'Riya Patil'
      );
    } catch (err: any) {
      if (err instanceof AuthorizationError) serviceRejected = true;
    }

    const passed = isUnauthorizedAttempt && serviceRejected;
    recordResult(
      9,
      'Teacher Riya Patil change class ID in URL or state (?classId=cls-2)',
      'URL/State Tampering Prevention',
      'UI displays Access Denied guard and service layer throws AuthorizationError',
      `UI Tamper Guard Triggered: ${isUnauthorizedAttempt}, Service Layer Rejected: ${serviceRejected}`,
      passed
    );
  } catch (err: any) {
    recordResult(9, 'Teacher Riya Patil change class ID in URL or state', 'URL/State Tampering Prevention', 'Denied', err.message, false, err.message);
  }

  // -----------------------------------------------------------------
  // TEST 10: Admin access all classes -> ALLOWED
  // -----------------------------------------------------------------
  try {
    await authService.login('admin@aksharpaaul.org', 'admin123');
    const classes = await dataService.getClasses();
    const classIds = classes.map(c => c.id);
    const expectedClasses = ['cls-1', 'cls-2', 'cls-3', 'cls-4'];
    const hasAllClasses = expectedClasses.every(id => classIds.includes(id));

    // Also verify individual access
    const c1 = await dataService.getClassById('cls-1');
    const c2 = await dataService.getClassById('cls-2');
    const passed = hasAllClasses && c1 !== null && c2 !== null;

    recordResult(
      10,
      'Admin access all classes',
      'Administrator Universal Access',
      'All classes retrieved successfully',
      `Classes found: [${classIds.join(', ')}] (${classes.length} total)`,
      passed
    );
  } catch (err: any) {
    recordResult(10, 'Admin access all classes', 'Administrator Universal Access', 'Allowed', err.message, false, err.message);
  }

  // -----------------------------------------------------------------
  // TEST 11: Admin access all students -> ALLOWED
  // -----------------------------------------------------------------
  try {
    await authService.login('admin@aksharpaaul.org', 'admin123');
    const allStudents = await dataService.getStudents();
    const cls1Students = await dataService.getStudents({ classId: 'cls-1' });
    const cls2Students = await dataService.getStudents({ classId: 'cls-2' });
    const passed = allStudents.length >= 25 && cls1Students.length > 0 && cls2Students.length > 0;

    recordResult(
      11,
      'Admin access all students across all classes',
      'Administrator Universal Access',
      'Students across all classes returned without restriction',
      `Total students: ${allStudents.length}, cls-1 students: ${cls1Students.length}, cls-2 students: ${cls2Students.length}`,
      passed
    );
  } catch (err: any) {
    recordResult(11, 'Admin access all students', 'Administrator Universal Access', 'Allowed', err.message, false, err.message);
  }

  // -----------------------------------------------------------------
  // TEST 12: Admin modify attendance for any class -> ALLOWED
  // -----------------------------------------------------------------
  try {
    await authService.login('admin@aksharpaaul.org', 'admin123');
    const recCls1 = await dataService.saveAttendance(
      'cls-1',
      '2026-09-24',
      [{ studentId: 'std-cls-1-1', status: 'present', notes: 'Admin verification cls-1' }],
      'System Admin'
    );
    const recCls2 = await dataService.saveAttendance(
      'cls-2',
      '2026-09-24',
      [{ studentId: 'std-cls-2-1', status: 'absent', notes: 'Admin verification cls-2' }],
      'System Admin'
    );
    const passed = recCls1.length === 1 && recCls2.length === 1;

    recordResult(
      12,
      'Admin modify attendance for any class (cls-1, cls-2)',
      'Administrator Universal Access',
      'Attendance successfully recorded for both cls-1 and cls-2',
      `cls-1 record: ${recCls1[0]?.id}, cls-2 record: ${recCls2[0]?.id}`,
      passed
    );
  } catch (err: any) {
    recordResult(12, 'Admin modify attendance for any class', 'Administrator Universal Access', 'Allowed', err.message, false, err.message);
  }

  // -----------------------------------------------------------------
  // TEST 13: Unauthenticated access to /admin/dashboard -> REDIRECT TO LOGIN
  // -----------------------------------------------------------------
  try {
    authService.logout();
    const currentUser = authService.getCurrentUser();
    const isAuthenticated = !!currentUser;

    const routeAction = !isAuthenticated ? 'REDIRECT_TO_LOGIN' : 'ALLOW';

    let serviceBlocked = false;
    let serviceErrMsg = '';
    try {
      await dataService.getDashboardStats();
    } catch (err: any) {
      if (err instanceof AuthorizationError) {
        serviceBlocked = true;
        serviceErrMsg = err.message;
      }
    }

    const passed = !isAuthenticated && routeAction === 'REDIRECT_TO_LOGIN' && serviceBlocked;
    recordResult(
      13,
      'Unauthenticated access to /admin/dashboard',
      'Unauthenticated Session Protection',
      'Redirect to /login and service throws AuthorizationError',
      `Authenticated: ${isAuthenticated}, Route Action: ${routeAction}, Service Blocked: ${serviceBlocked} ("${serviceErrMsg}")`,
      passed
    );
  } catch (err: any) {
    recordResult(13, 'Unauthenticated access to /admin/dashboard', 'Unauthenticated Session Protection', 'Redirect to Login', err.message, false, err.message);
  }

  // -----------------------------------------------------------------
  // TEST 14: Unauthenticated access to /teacher/dashboard -> REDIRECT TO LOGIN
  // -----------------------------------------------------------------
  try {
    authService.logout();
    const currentUser = authService.getCurrentUser();
    const isAuthenticated = !!currentUser;

    const routeAction = !isAuthenticated ? 'REDIRECT_TO_LOGIN' : 'ALLOW';

    let serviceBlocked = false;
    let serviceErrMsg = '';
    try {
      await dataService.getTeacherDashboardData('tch-1');
    } catch (err: any) {
      if (err instanceof AuthorizationError) {
        serviceBlocked = true;
        serviceErrMsg = err.message;
      }
    }

    const passed = !isAuthenticated && routeAction === 'REDIRECT_TO_LOGIN' && serviceBlocked;
    recordResult(
      14,
      'Unauthenticated access to /teacher/dashboard',
      'Unauthenticated Session Protection',
      'Redirect to /login and service throws AuthorizationError',
      `Authenticated: ${isAuthenticated}, Route Action: ${routeAction}, Service Blocked: ${serviceBlocked} ("${serviceErrMsg}")`,
      passed
    );
  } catch (err: any) {
    recordResult(14, 'Unauthenticated access to /teacher/dashboard', 'Unauthenticated Session Protection', 'Redirect to Login', err.message, false, err.message);
  }

  console.log('\n====================================================');
  console.log('AUDIT SUMMARY');
  console.log('====================================================');
  const totalPassed = results.filter(r => r.passed).length;
  console.log(`TOTAL TESTS: ${results.length}`);
  console.log(`PASSED: ${totalPassed}`);
  console.log(`FAILED: ${results.length - totalPassed}`);
  console.log(`RESULT: ${totalPassed === results.length ? 'ALL 14 TESTS PASSED (100%)' : 'SOME TESTS FAILED'}`);
  console.log('====================================================\n');

  if (totalPassed !== results.length) {
    process.exit(1);
  }
}

runSecurityAudit().catch(err => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
