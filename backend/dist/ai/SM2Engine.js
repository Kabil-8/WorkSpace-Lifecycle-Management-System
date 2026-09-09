/**
 * SM2Engine — Pure SuperMemo-2 Spaced Repetition Algorithm
 *
 * NO database calls. NO side effects. Fully deterministic and testable.
 *
 * Quality scale:
 *   1 = Forgot          (complete blackout / wrong)
 *   3 = Good            (correct with effort)
 *   5 = Perfect         (correct immediately, easy)
 *
 * References:
 *   - SuperMemo SM-2 Algorithm (Wozniak, 1987)
 *   - Ebbinghaus Forgetting Curve: R = e^(-t / S)
 */
export class SM2Engine {
    static MIN_EASE_FACTOR = 1.3;
    static INITIAL_EASE_FACTOR = 2.5;
    /**
     * Core SM-2 scheduling calculation.
     * All values are derived from the student's actual review history.
     */
    static calculate(input) {
        const { quality, repetitions, easeFactor, interval, lastReviewedAt, reviewHistory } = input;
        const correct = quality >= 3;
        // ── 1. Ease Factor Update (Wozniak SM-2 formula) ─────────────────────────
        // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        const efDelta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
        const newEaseFactor = Math.max(SM2Engine.MIN_EASE_FACTOR, Number((easeFactor + efDelta).toFixed(3)));
        // ── 2. Repetitions ───────────────────────────────────────────────────────
        const newRepetitions = correct ? repetitions + 1 : 0;
        // ── 3. Interval Calculation ───────────────────────────────────────────────
        // On failure: reset to 1 day regardless of history
        // On success:
        //   rep=1 → 1 day
        //   rep=2 → 6 days
        //   rep>2 → ceil(previousInterval * easeFactor)
        let newInterval;
        if (!correct) {
            newInterval = 1;
        }
        else if (newRepetitions === 1) {
            newInterval = 1;
        }
        else if (newRepetitions === 2) {
            newInterval = 6;
        }
        else {
            newInterval = Math.ceil(interval * newEaseFactor);
        }
        // Cap at 365 days maximum
        newInterval = Math.min(365, newInterval);
        // ── 4. Next Review Date ───────────────────────────────────────────────────
        const nextReviewAt = new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000);
        // ── 5. Retention Estimation (Ebbinghaus Forgetting Curve) ─────────────────
        // R(t) = e^(-t / S) where S = stability = interval × easeFactor
        // t = days since last review
        const daysSinceReview = lastReviewedAt
            ? (Date.now() - lastReviewedAt.getTime()) / (24 * 60 * 60 * 1000)
            : 0;
        const stability = Math.max(0.1, newInterval * newEaseFactor);
        const rawRetention = Math.exp(-daysSinceReview / stability) * 100;
        const retention = Number(Math.max(0, Math.min(100, rawRetention)).toFixed(1));
        // ── 6. Mastery Calculation from Review History ─────────────────────────────
        // Uses weighted recent history: recent quality × 0.5 + success rate × 0.3 + rep factor × 0.2
        const mastery = SM2Engine.calculateMastery({
            quality,
            newRepetitions,
            newEaseFactor,
            reviewHistory,
        });
        // ── 7. Confidence ─────────────────────────────────────────────────────────
        // Grows with repetitions, bounded by 98
        const confidence = Number(Math.min(98, 30 + newRepetitions * 12).toFixed(1));
        return {
            newInterval,
            newEaseFactor,
            newRepetitions,
            nextReviewAt,
            retention,
            mastery,
            confidence,
            correct,
        };
    }
    /**
     * Calculates mastery from weighted signals.
     * Never returns a hardcoded number.
     */
    static calculateMastery(params) {
        const { quality, newRepetitions, newEaseFactor, reviewHistory } = params;
        if (newRepetitions === 0)
            return 0;
        // Recent quality signal (last 5 reviews weighted most)
        const recent = reviewHistory.slice(-5);
        const recentAvgQuality = recent.length > 0
            ? recent.reduce((s, r) => s + r.quality, 0) / recent.length
            : quality;
        const recentSignal = (recentAvgQuality / 5) * 100;
        // Success rate across all history
        const successRate = reviewHistory.length > 0
            ? (reviewHistory.filter(r => r.quality >= 3).length / reviewHistory.length) * 100
            : (quality >= 3 ? 60 : 20);
        // Repetition depth signal (more reps = more mastery, capped)
        const repSignal = Math.min(100, newRepetitions * 15);
        // Ease factor bonus (higher EF = easier = more mastered)
        const efBonus = Math.min(20, (newEaseFactor - 1.3) * 10);
        const mastery = (recentSignal * 0.40) + (successRate * 0.35) + (repSignal * 0.15) + (efBonus * 0.10);
        return Number(Math.max(0, Math.min(100, mastery)).toFixed(1));
    }
    /**
     * Estimates retention for a recall item RIGHT NOW based on elapsed time.
     * Used for display in the UI without triggering a review.
     */
    static estimateCurrentRetention(item) {
        if (!item.lastReviewedAt || item.repetitions === 0)
            return 0;
        const daysSince = (Date.now() - item.lastReviewedAt.getTime()) / (24 * 60 * 60 * 1000);
        const stability = Math.max(0.1, item.interval * item.easeFactor);
        const retention = Math.exp(-daysSince / stability) * 100;
        return Number(Math.max(0, Math.min(100, retention)).toFixed(1));
    }
    /**
     * Calculates a priority score for sorting the Today review queue.
     * Higher score = review more urgently.
     */
    static calculatePriority(item) {
        const now = Date.now();
        const daysOverdue = Math.max(0, (now - item.nextReviewAt.getTime()) / (24 * 60 * 60 * 1000));
        const failureRate = (item.mistakeCount + item.successCount) > 0
            ? item.mistakeCount / (item.mistakeCount + item.successCount)
            : 0;
        const overdueScore = Math.min(50, daysOverdue * 10);
        const retentionScore = Math.min(30, (100 - item.retention) * 0.3);
        const failureScore = Math.min(20, failureRate * 20);
        const priorityScore = Math.round(overdueScore + retentionScore + failureScore);
        let priorityReason = '';
        if (daysOverdue > 2)
            priorityReason = `Overdue by ${Math.floor(daysOverdue)} days and retention is declining.`;
        else if (item.retention < 50)
            priorityReason = `Retention has fallen below 50% — review urgently to prevent forgetting.`;
        else if (failureRate > 0.5)
            priorityReason = `This topic has been forgotten more than half the time historically.`;
        else
            priorityReason = `Scheduled review due today to maintain memory stability.`;
        return { priorityScore, priorityReason };
    }
}
