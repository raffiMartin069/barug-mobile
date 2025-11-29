import { CommunityRepository } from '@/repository/CommunityRepository';

export default class CommunityService {
  private repo: CommunityRepository;

  constructor() {
    this.repo = new CommunityRepository();
  }

  /**
   * Fetches community statistics (residents, households, families).
   * Validates values and returns `null` for any invalid / unavailable counts.
   */
  async getCommunityStats(): Promise<{
    residentsCount: number | null;
    householdsCount: number | null;
    familiesCount: number | null;
  }> {
    const [residents, households, families] = await Promise.all([
      this.repo.GetResidentsCount(),
      this.repo.GetHouseholdsCount(),
      this.repo.GetFamiliesCount(),
    ]);

    const validate = (c: number | null): number | null => {
      if (c === null) return null;
      const n = Number(c);
      if (!Number.isFinite(n) || Number.isNaN(n) || n < 0) return null;
      return Math.floor(n);
    };

    return {
      residentsCount: validate(residents),
      householdsCount: validate(households),
      familiesCount: validate(families),
    };
  }
}
