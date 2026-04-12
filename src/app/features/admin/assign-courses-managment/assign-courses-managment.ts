import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CourseOption, CourseTransferBoardComponent } from './components/course-transfer-board/course-transfer-board';
import {
  AssignMode,
  AssignModeTabsComponent,
} from './components/assign-mode-tabs/assign-mode-tabs';
import { AssignmentTargetSelectorComponent } from './components/assignment-target-selector/assignment-target-selector';
import { CourseFacade } from '../services/course-facade';
import { DepartmentFacade } from '../services/department-facade';
import { ProfessorFacade } from '../services/professor-facade';

@Component({
  selector: 'app-assign-courses-managment',
  imports: [
    AssignModeTabsComponent,
    AssignmentTargetSelectorComponent,
    CourseTransferBoardComponent,
  ],
  templateUrl: './assign-courses-managment.html',
  styleUrl: './assign-courses-managment.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignCoursesManagment {
  private readonly courseFacade = inject(CourseFacade);
  private readonly departmentFacade = inject(DepartmentFacade);
  private readonly professorFacade = inject(ProfessorFacade);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly mode = signal<AssignMode>('professor');
  protected readonly selectedProfessorId = signal<string | null>(null);
  protected readonly selectedDepartmentId = signal<number | null>(null);
  protected readonly availableSearch = signal('');
  protected readonly assignedSearch = signal('');
  protected readonly assignedCourseIds = signal<number[]>([]);
  protected readonly lastLoadedCourseIds = signal<number[]>([]);
  protected readonly assignedFallbackCourses = signal<CourseOption[]>([]);
  protected readonly submitting = signal(false);
  protected readonly loadingAssignments = signal(false);
  protected readonly feedbackMessage = signal<string | null>(null);
  protected readonly feedbackType = signal<'success' | 'error'>('success');

  protected readonly professors = computed(() => this.professorFacade.allProfessors.value() || []);
  protected readonly departments = computed(() => this.departmentFacade.allDepartments.value() || []);
  protected readonly allCourses = computed(() => this.courseFacade.allCourses.value() || []);

  protected readonly isBusy = computed(
    () =>
      this.submitting() ||
      this.loadingAssignments() ||
      this.professorFacade.allProfessors.isLoading() ||
      this.departmentFacade.allDepartments.isLoading() ||
      this.courseFacade.allCourses.isLoading(),
  );

  protected readonly hasTargetSelected = computed(() =>
    this.mode() === 'professor' ? !!this.selectedProfessorId() : !!this.selectedDepartmentId(),
  );

  protected readonly availableCourses = computed(() => {
    const assignedSet = new Set(this.assignedCourseIds());
    const query = this.availableSearch().trim().toLowerCase();

    return this.allCourses()
      .filter((course) => !assignedSet.has(course.id))
      .filter((course) => {
        if (!query) return true;
        return (
          course.name.toLowerCase().includes(query) || course.code.toLowerCase().includes(query)
        );
      })
      .map((course) => ({ id: course.id, name: course.name, code: course.code }));
  });

  protected readonly assignedCourses = computed(() => {
    const query = this.assignedSearch().trim().toLowerCase();
    const courseMap = new Map(this.allCourses().map((course) => [course.id, course]));
    const fallbackMap = new Map(this.assignedFallbackCourses().map((course) => [course.id, course]));

    return this.assignedCourseIds()
      .map((courseId) => {
        const fromAll = courseMap.get(courseId);
        if (fromAll) return { id: fromAll.id, name: fromAll.name, code: fromAll.code };
        return fallbackMap.get(courseId) || null;
      })
      .filter((course): course is CourseOption => !!course)
      .filter((course) => {
        if (!query) return true;
        return (
          course.name.toLowerCase().includes(query) || course.code.toLowerCase().includes(query)
        );
      });
  });

  constructor() {
    this.courseFacade.allCourses.reload();
    this.professorFacade.allProfessors.reload();
    this.departmentFacade.allDepartments.reload();
  }

  protected onModeChanged(mode: AssignMode): void {
    this.mode.set(mode);
    this.selectedProfessorId.set(null);
    this.selectedDepartmentId.set(null);
    this.resetSelectionState();
  }

  protected onProfessorChanged(id: string): void {
    this.selectedProfessorId.set(id);
    this.selectedDepartmentId.set(null);
    this.loadProfessorAssignments(id);
  }

  protected onDepartmentChanged(id: number): void {
    this.selectedDepartmentId.set(id);
    this.selectedProfessorId.set(null);
    this.loadDepartmentAssignments(id);
  }

  protected onAssignCourse(courseId: number): void {
    if (this.assignedCourseIds().includes(courseId)) return;
    this.assignedCourseIds.update((ids) => [...ids, courseId]);
  }

  protected onUnassignCourse(courseId: number): void {
    this.assignedCourseIds.update((ids) => ids.filter((id) => id !== courseId));
  }

  protected onAssignAll(): void {
    const availableIds = this.availableCourses().map((course) => course.id);
    if (!availableIds.length) return;

    this.assignedCourseIds.update((ids) => {
      const merged = new Set([...ids, ...availableIds]);
      return Array.from(merged);
    });
  }

  protected onUnassignAll(): void {
    this.assignedCourseIds.set([]);
  }

  protected onCancel(): void {
    this.assignedCourseIds.set(this.lastLoadedCourseIds());
    this.availableSearch.set('');
    this.assignedSearch.set('');
    this.feedbackMessage.set(null);
  }

  protected saveAssignments(): void {
    this.feedbackMessage.set(null);
    if (!this.hasTargetSelected()) {
      this.feedbackType.set('error');
      this.feedbackMessage.set('Please select a target before saving.');
      return;
    }

    this.submitting.set(true);

    if (this.mode() === 'professor') {
      this.saveProfessorAssignments();
      return;
    }

    this.saveDepartmentAssignments();
  }

  private saveProfessorAssignments(): void {
    const professorId = this.selectedProfessorId();
    if (!professorId) {
      this.submitting.set(false);
      return;
    }

    this.professorFacade
      .assignCourses({
        professorId,
        courseIds: this.assignedCourseIds(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.lastLoadedCourseIds.set([...this.assignedCourseIds()]);
          this.feedbackType.set('success');
          this.feedbackMessage.set('Professor assignments saved successfully.');
        },
        error: () => {
          this.submitting.set(false);
          this.feedbackType.set('error');
          this.feedbackMessage.set(this.professorFacade.error() || 'Failed to save assignments.');
        },
      });
  }

  private saveDepartmentAssignments(): void {
    const departmentId = this.selectedDepartmentId();
    if (!departmentId) {
      this.submitting.set(false);
      return;
    }

    this.departmentFacade
      .assignCourses({
        departmentId,
        courseIds: this.assignedCourseIds(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.lastLoadedCourseIds.set([...this.assignedCourseIds()]);
          this.feedbackType.set('success');
          this.feedbackMessage.set('Department assignments saved successfully.');
        },
        error: () => {
          this.submitting.set(false);
          this.feedbackType.set('error');
          this.feedbackMessage.set(this.departmentFacade.error() || 'Failed to save assignments.');
        },
      });
  }

  private loadProfessorAssignments(professorId: string): void {
    this.feedbackMessage.set(null);
    this.loadingAssignments.set(true);
    this.professorFacade
      .getAssignedCourses(professorId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.loadingAssignments.set(false);
          this.hydrateAssignments(response.assignedCourses || []);
        },
        error: () => {
          this.loadingAssignments.set(false);
          this.resetSelectionState();
          this.feedbackType.set('error');
          this.feedbackMessage.set(
            this.professorFacade.error() || 'Unable to load current professor assignments.',
          );
        },
      });
  }

  private loadDepartmentAssignments(departmentId: number): void {
    this.feedbackMessage.set(null);
    this.loadingAssignments.set(true);
    this.departmentFacade
      .getAssignCourses(departmentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.loadingAssignments.set(false);
          this.hydrateAssignments(response.assignedCourses || []);
        },
        error: () => {
          this.loadingAssignments.set(false);
          this.resetSelectionState();
          this.feedbackType.set('error');
          this.feedbackMessage.set(
            this.departmentFacade.error() || 'Unable to load current department assignments.',
          );
        },
      });
  }

  private hydrateAssignments(
    assigned: { courseId: number; courseName: string; courseCode: string }[],
  ): void {
    const ids = Array.from(new Set(assigned.map((course) => course.courseId)));

    this.assignedFallbackCourses.set(
      assigned.map((course) => ({
        id: course.courseId,
        name: course.courseName,
        code: course.courseCode,
      })),
    );
    this.assignedCourseIds.set(ids);
    this.lastLoadedCourseIds.set(ids);
  }

  private resetSelectionState(): void {
    this.availableSearch.set('');
    this.assignedSearch.set('');
    this.assignedCourseIds.set([]);
    this.lastLoadedCourseIds.set([]);
    this.assignedFallbackCourses.set([]);
    this.feedbackMessage.set(null);
  }
}
