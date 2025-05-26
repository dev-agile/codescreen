import {
  users, tests, questions, candidates, responses,
  type User, type InsertUser,
  type Test, type InsertTest,
  type Question, type InsertQuestion,
  type Candidate, type InsertCandidate,
  type Response, type InsertResponse
} from "@shared/schema";
import { nanoid } from "nanoid";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Test operations
  getTest(id: number): Promise<Test | undefined>;
  getTestsByUser(userId: number): Promise<Test[]>;
  createTest(test: InsertTest): Promise<Test>;
  updateTest(id: number, test: Partial<InsertTest>): Promise<Test | undefined>;
  deleteTest(id: number): Promise<boolean>;
  
  // Question operations
  getQuestion(id: number): Promise<Question | undefined>;
  getQuestionsByTest(testId: number): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question | undefined>;
  deleteQuestion(id: number): Promise<boolean>;
  
  // Candidate operations
  getCandidate(id: number): Promise<Candidate | null>;
  getCandidateByTestLink(testLink: string): Promise<Candidate | undefined>;
  getCandidatesByTest(testId: number): Promise<Candidate[]>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  updateCandidate(id: number, candidate: Partial<InsertCandidate>): Promise<Candidate | undefined>;
  getCandidatesInProgress(): Promise<Candidate[]>;
  deleteCandidate(id: number): Promise<void>;
  getCandidateByEmailAndTest(email: string, testId: number): Promise<Candidate | null>;
  
  // Response operations
  getResponse(id: number): Promise<Response | undefined>;
  getResponsesByCandidateAndQuestion(candidateId: number, questionId: number): Promise<Response | undefined>;
  getResponsesByCandidate(candidateId: number): Promise<Response[]>;
  createResponse(response: InsertResponse): Promise<Response>;
  updateResponse(id: number, response: Partial<InsertResponse>): Promise<Response | undefined>;
  
  // Stats operations
  getTestStats(testId: number): Promise<{ 
    total: number; 
    completed: number; 
    inProgress: number; 
    pending: number; 
    avgScore: number;
  }>;
  getDashboardStats(userId: number): Promise<{ 
    activeTests: number; 
    pendingAssessments: number; 
    completedTests: number; 
  }>;
  getRecentActivity(userId: number, limit?: number): Promise<any[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tests: Map<number, Test>;
  private questions: Map<number, Question>;
  private candidates: Map<number, Candidate>;
  private responses: Map<number, Response>;
  private currentIds: {
    user: number;
    test: number;
    question: number;
    candidate: number;
    response: number;
  };

  constructor() {
    this.users = new Map();
    this.tests = new Map();
    this.questions = new Map();
    this.candidates = new Map();
    this.responses = new Map();
    this.currentIds = {
      user: 1,
      test: 1,
      question: 1,
      candidate: 1,
      response: 1,
    };
    
    // Add a default user for testing
    this.createUser({
      username: "demo",
      password: "password",
      email: "demo@example.com",
      name: "Alex Johnson",
      company: "Tech Agency Inc."
    });
    
    // Add some sample tests
    this.initSampleData();
  }

  private initSampleData() {
    // Create sample tests
    const testId1 = this.createTest({
      title: "Frontend React Developer Assessment",
      description: "This assessment evaluates React knowledge and practical coding skills.",
      duration: 40,
      passingScore: 70,
      shuffleQuestions: true,
      createdBy: 1,
    }).id;
    
    const testId2 = this.createTest({
      title: "Node.js Backend Assessment",
      description: "Evaluate Node.js backend development skills and API design.",
      duration: 60,
      passingScore: 70,
      shuffleQuestions: false,
      createdBy: 1,
    }).id;
    
    const testId3 = this.createTest({
      title: "Data Structures & Algorithms Test",
      description: "Assess knowledge of core CS concepts and problem-solving skills.",
      duration: 90,
      passingScore: 60,
      shuffleQuestions: false,
      createdBy: 1,
    }).id;
    
    // Create sample questions for first test
    this.createQuestion({
      testId: testId1,
      type: "multipleChoice",
      content: "What is the output of the following JavaScript code?",
      codeSnippet: "console.log(typeof null);",
      options: ["object", "null", "undefined", "null"],
      answer: "0",
      points: 1,
      order: 1,
    });
    
    this.createQuestion({
      testId: testId1,
      type: "coding",
      content: "Implement a function to reverse a string",
      codeSnippet: "function reverseString(str) {\n  // Your code here\n}",
      testCases: [
        { input: "hello", output: "olleh" },
        { input: "world", output: "dlrow" },
        { input: "", output: "" }
      ],
      points: 3,
      order: 2,
    });
    
    this.createQuestion({
      testId: testId1,
      type: "subjective",
      content: "Explain the concept of closures in JavaScript",
      evaluationGuidelines: "Understanding of lexical scope (3 points)\nExplanation of data persistence (3 points)\nExample demonstrating closure (4 points)",
      points: 10,
      order: 3,
    });
    
    // Create sample candidates
    const candidates = [
      {
        name: "Sarah Chen",
        email: "sarah@example.com",
        testId: testId1,
        invitedBy: 1,
        testLink: nanoid(10),
        status: "completed",
        score: 82,
      },
      {
        name: "Michael Johnson",
        email: "michael@example.com",
        testId: testId1,
        invitedBy: 1,
        testLink: nanoid(10),
        status: "in_progress",
      },
      {
        name: "Alex Rodriguez",
        email: "alex@example.com",
        testId: testId2,
        invitedBy: 1,
        testLink: nanoid(10),
        status: "completed",
        score: 65,
        autoSubmitted: true,
      }
    ];
    
    candidates.forEach(candidate => {
      this.createCandidate({
        name: candidate.name,
        email: candidate.email,
        testId: candidate.testId,
        invitedBy: candidate.invitedBy,
        testLink: candidate.testLink,
      });
      
      const candidateId = this.currentIds.candidate - 1;
      if (candidate.status) {
        this.updateCandidate(candidateId, { 
          status: candidate.status as any,
          startedAt: new Date(),
          completedAt: candidate.status === "completed" ? new Date() : undefined,
          score: candidate.score,
          autoSubmitted: candidate.autoSubmitted
        });
      }
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.user++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Test operations
  async getTest(id: number): Promise<Test | undefined> {
    return this.tests.get(id);
  }
  
  async getTestsByUser(userId: number): Promise<Test[]> {
    return Array.from(this.tests.values()).filter(
      (test) => test.createdBy === userId,
    );
  }
  
  async createTest(insertTest: InsertTest): Promise<Test> {
    const id = this.currentIds.test++;
    const test: Test = { 
      ...insertTest, 
      id,
      createdAt: new Date() 
    };
    this.tests.set(id, test);
    return test;
  }
  
  async updateTest(id: number, testUpdate: Partial<InsertTest>): Promise<Test | undefined> {
    const test = this.tests.get(id);
    if (!test) return undefined;
    
    const updatedTest = { ...test, ...testUpdate };
    this.tests.set(id, updatedTest);
    return updatedTest;
  }
  
  async deleteTest(id: number): Promise<boolean> {
    return this.tests.delete(id);
  }
  
  // Question operations
  async getQuestion(id: number): Promise<Question | undefined> {
    return this.questions.get(id);
  }
  
  async getQuestionsByTest(testId: number): Promise<Question[]> {
    return Array.from(this.questions.values())
      .filter((question) => question.testId === testId)
      .sort((a, b) => a.order - b.order);
  }
  
  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = this.currentIds.question++;
    const question: Question = { ...insertQuestion, id };
    this.questions.set(id, question);
    return question;
  }
  
  async updateQuestion(id: number, questionUpdate: Partial<InsertQuestion>): Promise<Question | undefined> {
    const question = this.questions.get(id);
    if (!question) return undefined;
    
    const updatedQuestion = { ...question, ...questionUpdate };
    this.questions.set(id, updatedQuestion);
    return updatedQuestion;
  }
  
  async deleteQuestion(id: number): Promise<boolean> {
    return this.questions.delete(id);
  }
  
  // Candidate operations
  async getCandidate(id: number): Promise<Candidate | null> {
    return this.candidates.get(id);
  }
  
  async getCandidateByTestLink(testLink: string): Promise<Candidate | undefined> {
    return Array.from(this.candidates.values()).find(
      (candidate) => candidate.testLink === testLink,
    );
  }
  
  async getCandidatesByTest(testId: number): Promise<Candidate[]> {
    return Array.from(this.candidates.values()).filter(
      (candidate) => candidate.testId === testId,
    );
  }
  
  async createCandidate(insertCandidate: InsertCandidate): Promise<Candidate> {
    const id = this.currentIds.candidate++;
    const candidate: Candidate = { 
      ...insertCandidate, 
      id,
      status: "pending",
      invitedAt: new Date(),
    };
    this.candidates.set(id, candidate);
    return candidate;
  }
  
  async updateCandidate(id: number, candidateUpdate: Partial<InsertCandidate>): Promise<Candidate | undefined> {
    const candidate = this.candidates.get(id);
    if (!candidate) return undefined;
    
    const updatedCandidate = { ...candidate, ...candidateUpdate };
    this.candidates.set(id, updatedCandidate);
    return updatedCandidate;
  }
  
  async getCandidatesInProgress(): Promise<Candidate[]> {
    return Array.from(this.candidates.values()).filter(c => c.status === 'in_progress' && c.startedAt && !c.completedAt);
  }
  
  async deleteCandidate(id: number): Promise<void> {
    this.candidates.delete(id);
  }
  
  // Response operations
  async getResponse(id: number): Promise<Response | undefined> {
    return this.responses.get(id);
  }
  
  async getResponsesByCandidateAndQuestion(candidateId: number, questionId: number): Promise<Response | undefined> {
    return Array.from(this.responses.values()).find(
      (response) => response.candidateId === candidateId && response.questionId === questionId,
    );
  }
  
  async getResponsesByCandidate(candidateId: number): Promise<Response[]> {
    return Array.from(this.responses.values()).filter(
      (response) => response.candidateId === candidateId,
    );
  }
  
  async createResponse(insertResponse: InsertResponse): Promise<Response> {
    const id = this.currentIds.response++;
    const response: Response = { 
      ...insertResponse, 
      id,
      submittedAt: new Date() 
    };
    this.responses.set(id, response);
    return response;
  }
  
  async updateResponse(id: number, responseUpdate: Partial<InsertResponse>): Promise<Response | undefined> {
    const response = this.responses.get(id);
    if (!response) return undefined;
    
    const updatedResponse = { ...response, ...responseUpdate };
    this.responses.set(id, updatedResponse);
    return updatedResponse;
  }
  
  // Stats operations
  async getTestStats(testId: number): Promise<{ 
    total: number; 
    completed: number; 
    inProgress: number; 
    pending: number; 
    avgScore: number;
  }> {
    const candidates = await this.getCandidatesByTest(testId);
    const completed = candidates.filter(c => c.status === "completed").length;
    const inProgress = candidates.filter(c => c.status === "in_progress").length;
    const pending = candidates.filter(c => c.status === "pending").length;
    
    const scores = candidates
      .filter(c => c.status === "completed" && c.score !== undefined)
      .map(c => c.score as number);
    
    const avgScore = scores.length > 0 
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) 
      : 0;
    
    return {
      total: candidates.length,
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
    const tests = await this.getTestsByUser(userId);
    const testIds = tests.map(test => test.id);
    
    let pendingAssessments = 0;
    let completedTests = 0;
    
    for (const testId of testIds) {
      const candidates = await this.getCandidatesByTest(testId);
      pendingAssessments += candidates.filter(c => c.status === "pending" || c.status === "in_progress").length;
      completedTests += candidates.filter(c => c.status === "completed").length;
    }
    
    return {
      activeTests: tests.length,
      pendingAssessments,
      completedTests
    };
  }
  
  async getRecentActivity(userId: number, limit = 10): Promise<any[]> {
    const tests = await this.getTestsByUser(userId);
    const testMap = new Map(tests.map(test => [test.id, test]));
    
    const activities: any[] = [];
    
    for (const test of tests) {
      const candidates = await this.getCandidatesByTest(test.id);
      
      for (const candidate of candidates) {
        if (candidate.status !== "pending") {
          activities.push({
            candidateId: candidate.id,
            candidateName: candidate.name,
            testId: test.id,
            testTitle: test.title,
            action: candidate.status === "completed" ? "completed" : "started",
            timestamp: candidate.status === "completed" ? candidate.completedAt : candidate.startedAt,
            score: candidate.score,
            autoSubmitted: candidate.autoSubmitted
          });
        }
      }
    }
    
    // Sort by timestamp (most recent first) and limit
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async getCandidateByEmailAndTest(email: string, testId: number): Promise<Candidate | null> {
    const candidates = Array.from(this.candidates.values());
    const candidate = candidates.find(
      (c) => c.email === email && c.testId === testId
    );
    return candidate || null;
  }
}

import { DatabaseStorage } from './database-storage';

export const storage = new DatabaseStorage();
