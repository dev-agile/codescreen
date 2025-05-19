import { eq, and, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from './db';
import {
  users, tests, questions, candidates, responses,
  type User, type InsertUser,
  type Test, type InsertTest,
  type Question, type InsertQuestion,
  type Candidate, type InsertCandidate,
  type Response, type InsertResponse
} from '@shared/schema';
import type { IStorage } from './storage';

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username));
    return results[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.email, email));
    return results[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const results = await db.insert(users).values(user).returning();
    return results[0];
  }

  // Test operations
  async getTest(id: number): Promise<Test | undefined> {
    const results = await db.select().from(tests).where(eq(tests.id, id));
    return results[0];
  }

  async getTestsByUser(userId: number): Promise<Test[]> {
    return await db.select().from(tests).where(eq(tests.createdBy, userId));
  }

  async createTest(test: InsertTest): Promise<Test> {
    const results = await db.insert(tests).values(test).returning();
    return results[0];
  }

  async updateTest(id: number, testUpdate: Partial<InsertTest>): Promise<Test | undefined> {
    const results = await db
      .update(tests)
      .set(testUpdate)
      .where(eq(tests.id, id))
      .returning();
    return results[0];
  }

  async deleteTest(id: number): Promise<boolean> {
    const results = await db.delete(tests).where(eq(tests.id, id)).returning();
    return results.length > 0;
  }

  // Question operations
  async getQuestion(id: number): Promise<Question | undefined> {
    const results = await db.select().from(questions).where(eq(questions.id, id));
    return results[0];
  }

  async getQuestionsByTest(testId: number): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .where(eq(questions.testId, testId))
      .orderBy(questions.order);
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const results = await db.insert(questions).values(question).returning();
    return results[0];
  }

  async updateQuestion(id: number, questionUpdate: Partial<InsertQuestion>): Promise<Question | undefined> {
    const results = await db
      .update(questions)
      .set(questionUpdate)
      .where(eq(questions.id, id))
      .returning();
    return results[0];
  }

  async deleteQuestion(id: number): Promise<boolean> {
    const results = await db.delete(questions).where(eq(questions.id, id)).returning();
    return results.length > 0;
  }

  // Candidate operations
  async getCandidate(id: number): Promise<Candidate | null> {
    const results = await db.select().from(candidates).where(eq(candidates.id, id));
    return results[0] || null;
  }

  async getCandidateByTestLink(testLink: string): Promise<Candidate | undefined> {
    const results = await db.select().from(candidates).where(eq(candidates.testLink, testLink));
    return results[0];
  }

  async getCandidatesByTest(testId: number): Promise<Candidate[]> {
    return await db.select().from(candidates).where(eq(candidates.testId, testId));
  }

  async createCandidate(candidate: InsertCandidate): Promise<Candidate> {
    // Generate a unique test link if not provided
    if (!candidate.testLink) {
      candidate.testLink = nanoid(10);
    }
    
    const results = await db.insert(candidates).values(candidate).returning();
    console.log(results,'resultssssssssss');
    
    return results[0];
  }

  async updateCandidate(id: number, candidateUpdate: Partial<InsertCandidate>): Promise<Candidate | undefined> {
    const results = await db
      .update(candidates)
      .set(candidateUpdate)
      .where(eq(candidates.id, id))
      .returning();
    return results[0];
  }

  async deleteCandidate(id: number): Promise<void> {
    await db.delete(candidates).where(eq(candidates.id, id));
  }

  // Response operations
  async getResponse(id: number): Promise<Response | undefined> {
    const results = await db.select().from(responses).where(eq(responses.id, id));
    return results[0];
  }

  async getResponsesByCandidateAndQuestion(candidateId: number, questionId: number): Promise<Response | undefined> {
    const results = await db
      .select()
      .from(responses)
      .where(
        and(
          eq(responses.candidateId, candidateId),
          eq(responses.questionId, questionId)
        )
      );
    return results[0];
  }

  async getResponsesByCandidate(candidateId: number): Promise<Response[]> {
    return await db.select().from(responses).where(eq(responses.candidateId, candidateId));
  }

  async createResponse(response: InsertResponse): Promise<Response> {
    // Check if a response already exists
    const existing = await this.getResponsesByCandidateAndQuestion(
      response.candidateId,
      response.questionId
    );

    if (existing) {
      // Update the existing response
      return await this.updateResponse(existing.id, response) as Response;
    } else {
      // Create a new response
      const results = await db.insert(responses).values(response).returning();
      return results[0];
    }
  }

  async updateResponse(id: number, responseUpdate: Partial<InsertResponse>): Promise<Response | undefined> {
    const results = await db
      .update(responses)
      .set(responseUpdate)
      .where(eq(responses.id, id))
      .returning();
    return results[0];
  }

  // Stats operations
  async getTestStats(testId: number): Promise<{ 
    total: number; 
    completed: number; 
    inProgress: number; 
    pending: number; 
    avgScore: number;
  }> {
    const testCandidates = await this.getCandidatesByTest(testId);
    
    const total = testCandidates.length;
    const completed = testCandidates.filter(c => c.status === 'completed').length;
    const inProgress = testCandidates.filter(c => c.status === 'in_progress').length;
    const pending = testCandidates.filter(c => c.status === 'pending').length;
    
    // Calculate average score from completed candidates
    const completedWithScores = testCandidates.filter(c => c.status === 'completed' && c.score !== null);
    const avgScore = completedWithScores.length > 0
      ? completedWithScores.reduce((acc, c) => acc + (c.score || 0), 0) / completedWithScores.length
      : 0;
    
    return {
      total,
      completed,
      inProgress,
      pending,
      avgScore
    };
  }

  async getDashboardStats(userId: number): Promise<{ 
    activeTests: number; 
    pendingAssessments: number; 
    completedTests: number; 
  }> {
    // Get all tests created by this user
    const userTests = await this.getTestsByUser(userId);
    const testIds = userTests.map(test => test.id);
    
    // Initialize stats
    let pendingAssessments = 0;
    let completedTests = 0;
    
    // If user has tests, get candidate stats
    if (testIds.length > 0) {
      // For each test, get candidates
      for (const testId of testIds) {
        const candidates = await this.getCandidatesByTest(testId);
        pendingAssessments += candidates.filter(c => c.status !== 'completed').length;
        completedTests += candidates.filter(c => c.status === 'completed').length;
      }
    }
    
    return {
      activeTests: userTests.length,
      pendingAssessments,
      completedTests
    };
  }

  async getRecentActivity(userId: number, limit = 10): Promise<any[]> {
    // Get all tests created by this user
    const userTests = await this.getTestsByUser(userId);
    const testIds = userTests.map(test => test.id);
    
    if (testIds.length === 0) {
      return [];
    }
    
    // Construct activity records
    let activities: any[] = [];
    
    // For each test
    for (const testId of testIds) {
      const test = await this.getTest(testId);
      if (!test) continue;
      
      const candidates = await this.getCandidatesByTest(testId);
      
      // Add activities for each candidate
      for (const candidate of candidates) {
        // Add 'completed' activity if the test was completed
        if (candidate.status === 'completed' && candidate.completedAt) {
          activities.push({
            candidateId: candidate.id,
            candidateName: candidate.name,
            testId: test.id,
            testTitle: test.title,
            action: 'completed',
            timestamp: candidate.completedAt,
            score: candidate.score,
            autoSubmitted: candidate.autoSubmitted
          });
        }
        
        // Add 'started' activity if the test was started
        if (candidate.startedAt) {
          activities.push({
            candidateId: candidate.id,
            candidateName: candidate.name,
            testId: test.id,
            testTitle: test.title,
            action: 'started',
            timestamp: candidate.startedAt
          });
        }
      }
    }
    
    // Sort by timestamp (descending) and limit results
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async getCandidatesInProgress(): Promise<Candidate[]> {
    return await db.select().from(candidates)
      .where(
        and(
          eq(candidates.status, 'in_progress'),
          sql`${candidates.startedAt} IS NOT NULL`,
          sql`${candidates.completedAt} IS NULL`
        )
      );
  }
}