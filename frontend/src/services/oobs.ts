import {
  formatJobSalary,
  jobLabels,
  jobsApi,
  type CandidateApplication as JobCandidateApplication,
  type CandidateSavedJob as JobCandidateSavedJob,
  type PublicJob as JobPublicJob,
} from './jobs'

export { formatJobSalary }
export const oobLabels = jobLabels
export type PublicOob = JobPublicJob
export type PublicJob = JobPublicJob
export type CandidateOobApplication = Omit<JobCandidateApplication, 'job'> & { oob: JobCandidateApplication['job'] }
export type CandidateApplication = CandidateOobApplication
export type CandidateSavedOob = Omit<JobCandidateSavedJob, 'job'> & { oob: JobCandidateSavedJob['job'] }
export type CandidateSavedJob = CandidateSavedOob

/** Compatibility adapter for views that call vacancies "oobs" internally. */
export const oobsApi = {
  ...jobsApi,
  get: async (id: string) => {
    const { job } = await jobsApi.get(id)
    return { oob: job }
  },
  candidateApplications: async () => {
    const result = await jobsApi.candidateApplications()
    return { ...result, applications: result.applications.map(({ job, ...application }) => ({ ...application, oob: job })) as CandidateOobApplication[] }
  },
  candidateSavedJobs: async () => {
    const result = await jobsApi.candidateSavedJobs()
    return { savedJobs: result.savedJobs.map(({ job, ...saved }) => ({ ...saved, oob: job })) as CandidateSavedOob[] }
  },
}
