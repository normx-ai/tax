import prisma from '../utils/prisma';
import { createLogger } from '../utils/logger';

const logger = createLogger('AnalyticsService');

export async function getDashboard(orgId: string) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(now.getDate() - 60);

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    currentStats,
    previousStats,
    sub,
    memberCount,
    todayStats,
    weekStats,
    monthStats,
    activeMembers30d,
  ] = await Promise.all([
    prisma.usageStats.aggregate({
      where: { organizationId: orgId, date: { gte: thirtyDaysAgo } },
      _sum: { questionsAsked: true, articlesViewed: true, tokensUsed: true },
    }),
    prisma.usageStats.aggregate({
      where: { organizationId: orgId, date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      _sum: { questionsAsked: true, articlesViewed: true, tokensUsed: true },
    }),
    prisma.subscription.findUnique({ where: { organizationId: orgId } }),
    prisma.organizationMember.count({ where: { organizationId: orgId } }),
    prisma.usageStats.aggregate({
      where: { organizationId: orgId, date: { gte: todayStart } },
      _sum: { questionsAsked: true },
    }),
    prisma.usageStats.aggregate({
      where: { organizationId: orgId, date: { gte: weekAgo } },
      _sum: { questionsAsked: true },
    }),
    prisma.usageStats.aggregate({
      where: { organizationId: orgId, date: { gte: monthStart } },
      _sum: { questionsAsked: true },
    }),
    // Membres actifs : ceux qui ont au moins 1 message dans les 30 derniers jours
    prisma.message.groupBy({
      by: ['authorId'],
      where: {
        role: 'USER',
        conversation: { organizationId: orgId },
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
  ]);

  const currentQuestions = currentStats._sum.questionsAsked || 0;
  const previousQuestions = previousStats._sum.questionsAsked || 0;
  const questionsTrend = previousQuestions > 0
    ? Math.round(((currentQuestions - previousQuestions) / previousQuestions) * 100)
    : currentQuestions > 0 ? 100 : 0;

  return {
    // Format attendu par le frontend
    totalQuestions: currentQuestions,
    totalMembers: memberCount,
    activeMembers: activeMembers30d.length,
    trend: questionsTrend,
    questionsToday: todayStats._sum.questionsAsked || 0,
    questionsThisWeek: weekStats._sum.questionsAsked || 0,
    questionsThisMonth: monthStats._sum.questionsAsked || 0,
    // Données détaillées
    current: {
      questions: currentQuestions,
      articlesViewed: currentStats._sum.articlesViewed || 0,
      tokensUsed: currentStats._sum.tokensUsed || 0,
    },
    previous: {
      questions: previousQuestions,
      articlesViewed: previousStats._sum.articlesViewed || 0,
      tokensUsed: previousStats._sum.tokensUsed || 0,
    },
    subscription: sub ? {
      plan: sub.plan,
      creditsUsed: sub.creditsUsed,
      creditsPerMonth: sub.creditsPerMonth,
    } : null,
  };
}

export async function getTimeSeries(orgId: string, days: number = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const stats = await prisma.usageStats.findMany({
    where: { organizationId: orgId, date: { gte: since } },
    orderBy: { date: 'asc' },
    select: { date: true, questionsAsked: true, articlesViewed: true, tokensUsed: true },
  });

  // Retourner au format attendu par le frontend
  return stats.map(s => ({
    date: s.date instanceof Date ? s.date.toISOString() : s.date,
    count: s.questionsAsked,
    articlesViewed: s.articlesViewed,
    tokensUsed: s.tokensUsed,
  }));
}

export async function getMemberStats(orgId: string) {
  const members = await prisma.organizationMember.findMany({
    where: { organizationId: orgId },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, lastLoginAt: true } },
    },
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const memberStats = await Promise.all(
    members.map(async (m) => {
      const [messageCount, searchCount] = await Promise.all([
        prisma.message.count({
          where: {
            authorId: m.userId,
            role: 'USER',
            conversation: { organizationId: orgId },
            createdAt: { gte: thirtyDaysAgo },
          },
        }),
        prisma.searchHistory.count({
          where: { userId: m.userId, createdAt: { gte: thirtyDaysAgo } },
        }),
      ]);

      return {
        userId: m.userId,
        name: [m.user.firstName, m.user.lastName].filter(Boolean).join(' ') || m.user.email,
        email: m.user.email,
        role: m.role,
        questionsCount: messageCount + searchCount,
        creditsUsed: m.creditsUsed,
        messagesLast30d: messageCount,
        searchesLast30d: searchCount,
        lastActive: m.user.lastLoginAt?.toISOString() || null,
        joinedAt: m.joinedAt,
      };
    })
  );

  return memberStats;
}

/**
 * Recherches les plus populaires (30 derniers jours)
 */
export async function getPopularSearches(orgId: string, limit: number = 10) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const memberIds = await prisma.organizationMember.findMany({
    where: { organizationId: orgId },
    select: { userId: true },
  });
  const userIds = memberIds.map(m => m.userId);

  const searches = await prisma.searchHistory.groupBy({
    by: ['query'],
    where: {
      userId: { in: userIds },
      createdAt: { gte: thirtyDaysAgo },
    },
    _count: true,
    orderBy: { _count: { query: 'desc' } },
    take: limit,
  });

  return searches.map(s => ({
    query: s.query,
    count: s._count,
  }));
}

/**
 * Temps de réponse moyen de l'IA (30 derniers jours)
 */
export async function getResponseTimeStats(orgId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const stats = await prisma.message.aggregate({
    where: {
      role: 'ASSISTANT',
      conversation: { organizationId: orgId },
      createdAt: { gte: thirtyDaysAgo },
      responseTime: { not: null },
    },
    _avg: { responseTime: true, tokensUsed: true },
    _max: { responseTime: true },
    _min: { responseTime: true },
    _count: true,
  });

  return {
    avgResponseTimeMs: Math.round(stats._avg.responseTime || 0),
    maxResponseTimeMs: stats._max.responseTime || 0,
    minResponseTimeMs: stats._min.responseTime || 0,
    avgTokensPerResponse: Math.round(stats._avg.tokensUsed || 0),
    totalResponses: stats._count,
  };
}

/**
 * Usage par fonctionnalité (chat vs recherche vs simulateur)
 */
export async function getFeatureUsage(orgId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const memberIds = await prisma.organizationMember.findMany({
    where: { organizationId: orgId },
    select: { userId: true },
  });
  const userIds = memberIds.map(m => m.userId);

  const [chatCount, searchCount, auditCountResult] = await Promise.all([
    prisma.message.count({
      where: {
        role: 'USER',
        conversation: { organizationId: orgId },
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.searchHistory.count({
      where: { userId: { in: userIds }, createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::bigint as count FROM document_audits
      WHERE "orgId" = ${orgId} AND "createdAt" >= ${thirtyDaysAgo}
    `.catch(() => [{ count: BigInt(0) }]),
  ]);
  const auditCount = Number(auditCountResult[0]?.count ?? 0);

  return {
    chat: chatCount,
    search: searchCount,
    audit: auditCount,
  };
}

export async function exportCsv(orgId: string, days: number = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const stats = await prisma.usageStats.findMany({
    where: { organizationId: orgId, date: { gte: since } },
    orderBy: { date: 'asc' },
  });

  const header = 'date,questionsAsked,articlesViewed,tokensUsed';
  const rows = stats.map(s => {
    const d = s.date instanceof Date ? s.date.toISOString().split('T')[0] : s.date;
    return `${d},${s.questionsAsked},${s.articlesViewed},${s.tokensUsed}`;
  });

  return [header, ...rows].join('\n');
}
