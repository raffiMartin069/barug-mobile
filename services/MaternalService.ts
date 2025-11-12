import { MaternalRepository, PostpartumScheduleDisplay } from '@/repository/MaternalRepository'
import { ChildHealthRecord, MaternalRecordBundle, MaternalScheduleGroup, PostpartumSchedule, PrenatalSchedule } from '@/types/maternal'

export class MaternalService {
  private repo: MaternalRepository

  constructor(repo?: MaternalRepository) {
    this.repo = repo ?? new MaternalRepository()
  }

  /** Fetch postpartum and prenatal schedules and record bundles in parallel. */
  async fetchAllForPerson(personId: number): Promise<{
    postpartum: MaternalScheduleGroup<PostpartumSchedule>
    prenatal: MaternalScheduleGroup<PrenatalSchedule>
    records: MaternalRecordBundle[]
    latestTracker: import('@/types/maternal').TrimesterTrackerItem[]
    childRecords: ChildHealthRecord[]
  }> {
    const [postpartum, prenatal, records, childRecords] = await Promise.all([
      this.repo.getPostpartumScheduleByPersonId(personId),
      this.repo.getPrenatalScheduleByPersonId(personId),
      this.repo.getMaternalRecordBundlesByPersonId(personId),
      this.repo.getChildHealthRecordsByMotherId(personId),
    ])
    const latestTracker = await this.repo.getTrimesterTrackerForLatestRecord(personId)

    return { postpartum, prenatal, records, latestTracker, childRecords }
  }

  async getPostpartum(personId: number) {
    return this.repo.getPostpartumScheduleByPersonId(personId)
  }

  async getPrenatal(personId: number) {
    return this.repo.getPrenatalScheduleByPersonId(personId)
  }

  async getRecords(personId: number) {
    return this.repo.getMaternalRecordBundlesByPersonId(personId)
  }

  /**
   * Fetch latest pending postpartum schedules across all records.
   */
  async fetchLatestPendingPostpartumSchedules(): Promise<PostpartumScheduleDisplay[]> {
    // repository method handles normalization and name lookup
    return this.repo.getLatestPendingPostpartumSchedules()
  }
}
