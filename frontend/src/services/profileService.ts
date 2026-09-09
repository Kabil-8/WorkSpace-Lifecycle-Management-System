import api from './api'

export interface ExternalProfilesData {
  leetcode?: {
    username?: string
    profileUrl?: string
    ranking?: number
    campusRank?: number
    totalSolved?: number
    easySolved?: number
    mediumSolved?: number
    hardSolved?: number
    contestRating?: number
    acceptanceRate?: number
    streak?: number
    topBadge?: string
    lastSyncedAt?: string
  }
  github?: {
    username?: string
    profileUrl?: string
    publicRepos?: number
    totalStars?: number
    totalCommits?: number
    topLanguages?: string[]
    followers?: number
    contributionsThisYear?: number
    campusRank?: number
    developerScore?: number
    lastSyncedAt?: string
  }
  linkedin?: {
    profileUrl?: string
    username?: string
    headline?: string
    connections?: number
    verifiedSkills?: string[]
    certifications?: string[]
    lastSyncedAt?: string
  }
  overallDeveloperRank?: {
    score: number
    campusRank: number
    totalStudents: number
    campusPercentile: number
    globalTier: string
    badge: string
  }
}

export interface SyncExternalParams {
  leetcodeUsername?: string
  githubUsername?: string
  linkedinUrl?: string
  linkedinHeadline?: string
  linkedinConnections?: number | string
  linkedinSkills?: string[] | string
  linkedinCertifications?: string[] | string
}

export const profileService = {
  getCodingStats: async () => {
    return (await api.get<{ success: boolean; data: { user: any; externalProfiles: ExternalProfilesData } }>('/profile/coding-stats')) as any
  },

  syncExternalProfiles: async (params: SyncExternalParams) => {
    return (await api.post<{ success: boolean; message: string; data: { user: any; externalProfiles: ExternalProfilesData } }>(
      '/profile/sync-external',
      params
    )) as any
  },

  getLeaderboard: async () => {
    return (await api.get<{ success: boolean; data: { leaderboard: any[]; totalParticipants: number } }>('/profile/leaderboard')) as any
  },
}
