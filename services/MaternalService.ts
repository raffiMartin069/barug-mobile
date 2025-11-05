import { MaternalRepository } from '@/repository/MaternalRepository'
import { MaternalRecordBundle, MaternalScheduleGroup, PostpartumSchedule, PrenatalSchedule } from '@/types/maternal'

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
  }> {
    const [postpartum, prenatal, records] = await Promise.all([
      this.repo.getPostpartumScheduleByPersonId(personId),
      this.repo.getPrenatalScheduleByPersonId(personId),
      this.repo.getMaternalRecordBundlesByPersonId(personId),
    ])
    const latestTracker = await this.repo.getTrimesterTrackerForLatestRecord(personId)

    return { postpartum, prenatal, records, latestTracker }
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
}
