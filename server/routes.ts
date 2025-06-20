import { Express, Request, Response, NextFunction } from 'express';
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerUploadRoutes } from "./upload-handler";
import { 
  insertUserSchema,
  insertTestSchema,
  insertQuestionSchema,
  insertCandidateSchema,
  insertResponseSchema,
  loginSchema,
  Candidate
} from "@shared/schema";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import cors from 'cors';
import { sendTestInvitation } from "./email-service";
import { ParsedQs } from 'qs';

const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret";

function signJwt(user) {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
}

// Middleware type definitions
const verifyJwt = (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const payload = jwt.verify(auth.split(" ")[1], JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

// Extracted function for candidate test submission
export async function submitCandidateTest(candidate: Candidate, autoSubmitted = false) {
  if (candidate.status === "completed") {
    return { error: "This test has already been completed" };
  }
  const responses = await storage.getResponsesByCandidate(candidate.id);
  const questions = await storage.getQuestionsByTest(candidate.testId);
  let totalScore = 0;
  let totalPoints = 0;
  for (const question of questions) {
    const response = responses.find(r => r.questionId === question.id);
    const questionPoints = question.points || 1;
    totalPoints += questionPoints;
    totalScore += response?.points || 0;
  }
  const finalScore = totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0;
  const updatedCandidate = await storage.updateCandidate(candidate.id, {
    status: "completed",
    completedAt: new Date(),
    autoSubmitted,
    score: finalScore
  });
  return {
    message: "Test submitted successfully",
    score: finalScore,
    totalScore,
    totalPoints
  };
}

// Route handler type definitions
export async function registerRoutes(app: Express): Promise<Server> {
  // Register upload routes

  const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';

  app.use(cors({
    origin: allowedOrigin,
    credentials: true
  }));
  registerUploadRoutes(app);

  // Auth routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const parsed = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(parsed.username);
      if (!user || user.password !== parsed.password) {
        return res.status(401).json({ message: "Incorrect username or password" });
      }
      const token = signJwt(user);
      res.json({
        token,
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        company: user.company
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      const user = await storage.createUser(userData);
      const token = signJwt(user);
      res.status(201).json({
        token,
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        company: user.company
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    // JWT logout is handled client-side by deleting the token
    res.json({ message: "Logged out successfully" });
  });

  app.get("/api/auth/me", verifyJwt, async (req: Request, res: Response) => {
    const user = await storage.getUser(req.user.id);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      company: user.company
    });
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", verifyJwt, async (req: Request, res: Response) => {
    const user = await storage.getUser(req.user.id);
    const stats = await storage.getDashboardStats(user.id);
    res.json(stats);
  });

  app.get("/api/dashboard/recent-activity", verifyJwt, async (req: Request, res: Response) => {
    const user = await storage.getUser(req.user.id);
    const activities = await storage.getRecentActivity(user.id);
    res.json(activities);
  });

  // Test routes
  app.get("/api/tests", verifyJwt, async (req: Request, res: Response) => {
    const user = await storage.getUser(req.user.id);
    const tests = await storage.getTestsByUser(user.id);
    const testsWithStats = await Promise.all(tests.map(async (test) => {
      const stats = await storage.getTestStats(test.id);
      return { ...test, stats };
    }));
    res.json(testsWithStats);
  });

  app.get("/api/tests/:id", verifyJwt, async (req: Request, res: Response) => {
    const testId = parseInt(req.params.id);
    const test = await storage.getTest(testId);
    if (!test) return res.status(404).json({ message: "Test not found" });
    const user = await storage.getUser(req.user.id);
    if (test.createdBy !== user.id) return res.status(403).json({ message: "Unauthorized to access this test" });
    const questions = await storage.getQuestionsByTest(testId);
    const stats = await storage.getTestStats(testId);
    res.json({ ...test, questions, stats });
  });

  app.post("/api/tests", verifyJwt, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.user.id);
      const testData = insertTestSchema.parse({
        ...req.body,
        createdBy: user.id
      });
      
      const test = await storage.createTest(testData);
      res.status(201).json(test);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/tests/:id", verifyJwt, async (req: Request, res: Response) => {
    try {
      const testId = parseInt(req.params.id);
      const test = await storage.getTest(testId);
      
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      const user = await storage.getUser(req.user.id);
      if (test.createdBy !== user.id) {
        return res.status(403).json({ message: "Unauthorized to update this test" });
      }
      
      const updatedTest = await storage.updateTest(testId, req.body);
      res.json(updatedTest);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/tests/:id", verifyJwt, async (req: Request, res: Response) => {
    const testId = parseInt(req.params.id);
    const test = await storage.getTest(testId);
    
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }
    
    const user = await storage.getUser(req.user.id);
    if (test.createdBy !== user.id) {
      return res.status(403).json({ message: "Unauthorized to delete this test" });
    }
    
    const deleted = await storage.deleteTest(testId);
    if (deleted) {
      res.json({ message: "Test deleted successfully" });
    } else {
      res.status(500).json({ message: "Failed to delete test" });
    }
  });

  // Question routes
  app.post("/api/questions", verifyJwt, async (req: Request, res: Response) => {
    try {
      const questionData = insertQuestionSchema.parse(req.body);
      
      // Verify the user owns the test
      const test = await storage.getTest(questionData.testId);
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      const user = await storage.getUser(req.user.id);
      if (test.createdBy !== user.id) {
        return res.status(403).json({ message: "Unauthorized to add questions to this test" });
      }
      
      const question = await storage.createQuestion(questionData);
      res.status(201).json(question);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/questions/:id", verifyJwt, async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      const question = await storage.getQuestion(questionId);
      
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      // Verify the user owns the test
      const test = await storage.getTest(question.testId);
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      const user = await storage.getUser(req.user.id);
      if (test.createdBy !== user.id) {
        return res.status(403).json({ message: "Unauthorized to update questions for this test" });
      }
      
      const updatedQuestion = await storage.updateQuestion(questionId, req.body);
      res.json(updatedQuestion);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/questions/:id", verifyJwt, async (req, res) => {
    const questionId = parseInt(req.params.id);
    const question = await storage.getQuestion(questionId);
    
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    
    // Verify the user owns the test
    const test = await storage.getTest(question.testId);
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }
    
    const user = await storage.getUser(req.user.id);
    if (test.createdBy !== user.id) {
      return res.status(403).json({ message: "Unauthorized to delete questions for this test" });
    }
    
    const deleted = await storage.deleteQuestion(questionId);
    if (deleted) {
      res.json({ message: "Question deleted successfully" });
    } else {
      res.status(500).json({ message: "Failed to delete question" });
    }
  });

  // Candidate routes
  app.post("/api/candidates", verifyJwt, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      const candidateData = insertCandidateSchema.parse({
        ...req.body,
        invitedBy: user.id,
        testLink: nanoid(10),
        status: "pending", // Explicitly set status for new candidates
      });
      
      // Verify the user owns the test
      const test = await storage.getTest(candidateData.testId);
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      if (test.createdBy !== user.id) {
        return res.status(403).json({ message: "Unauthorized to invite candidates for this test" });
      }
      
      const candidate = await storage.createCandidate(candidateData);
      
      // Send invitation email to candidate
      const emailResult = await sendTestInvitation(
        candidate.email,
        candidate.name,
        test.title,
        candidate.testLink,
        test.duration,
        user.company
      );
      
      // Return candidate data with email status
      res.status(201).json({
        ...candidate,
        emailSent: emailResult.success,
        emailError: emailResult.error
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/tests/:id/candidates", verifyJwt, async (req, res) => {
    const testId = parseInt(req.params.id);
    const test = await storage.getTest(testId);
    
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }
    
    const user = await storage.getUser(req.user.id);
    if (test.createdBy !== user.id) {
      return res.status(403).json({ message: "Unauthorized to view candidates for this test" });
    }
    
    const candidates = await storage.getCandidatesByTest(testId);
    res.json(candidates);
  });

  // Candidate test taking routes
  app.get("/api/candidate/:testLink", async (req, res) => {
    const testLink = req.params.testLink;
    const candidate = await storage.getCandidateByTestLink(testLink);
    
    if (!candidate) {
      return res.status(404).json({ message: "Invalid test link" });
    }
    
    const test = await storage.getTest(candidate.testId);
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }
    
    // Don't allow access to completed tests
    if (candidate.status === "completed") {
      return res.status(403).json({ message: "This test has already been completed" });
    }
    
    const questions = await storage.getQuestionsByTest(test.id);
    
    // Shuffle questions if enabled
    let orderedQuestions = [...questions];
    if (test.shuffleQuestions) {
      orderedQuestions = orderedQuestions.sort(() => Math.random() - 0.5);
    }
    
    // Return test details and questions without answers
    res.json({
      candidateId: candidate.id,
      candidateName: candidate.name,
      testId: test.id,
      testTitle: test.title,
      testDescription: test.description,
      duration: test.duration,
      startedAt: candidate.startedAt,
      questions: orderedQuestions.map(q => ({
        id: q.id,
        type: q.type,
        content: q.content,
        codeSnippet: q.codeSnippet,
        options: (q.type === "multipleChoice" || q.type === "patternRecognition") ? q.options : undefined,
        testCases: q.type === "coding" ? q.testCases : undefined,
        evaluationGuidelines: q.type === "subjective" ? q.evaluationGuidelines : undefined,
        imageUrl: q.type === "patternRecognition" ? q.imageUrl : undefined,
      }))
    });
  });

  // Get response for a specific question
  app.get("/api/candidate/:testLink/responses/:questionId", async (req, res) => {
    try {
      const testLink = req.params.testLink;
      const questionId = parseInt(req.params.questionId);
      
      const candidate = await storage.getCandidateByTestLink(testLink);
      if (!candidate) {
        return res.status(404).json({ message: "Invalid test link" });
      }
      
      const response = await storage.getResponsesByCandidateAndQuestion(candidate.id, questionId);
      if (!response) {
        return res.status(404).json({ message: "Response not found" });
      }
      
      res.json(response);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/candidate/:testLink/responses", async (req, res) => {
    try {
      const testLink = req.params.testLink;
      const candidate = await storage.getCandidateByTestLink(testLink);
      
      if (!candidate) {
        return res.status(404).json({ message: "Invalid test link" });
      }
      
      // Don't allow submissions for completed tests
      if (candidate.status === "completed") {
        return res.status(403).json({ message: "This test has already been completed" });
      }
      
      const { questionId, response } = req.body;
      
      if (!questionId || response === undefined) {
        return res.status(400).json({ message: "Missing questionId or response" });
      }
      
      const question = await storage.getQuestion(parseInt(questionId));
      if (!question || question.testId !== candidate.testId) {
        return res.status(404).json({ message: "Question not found or doesn't belong to this test" });
      }

      console.log(questionId,"question", question);
      
      
      let isCorrect = false;
      let points = 0;
      
      // Evaluate based on question type
      switch (question.type) {
        case "multipleChoice":
        case "patternRecognition":
          // For multiple choice, compare the selected option index with the correct answer
          console.log('Debug answer comparison:', {
            questionId,
            response,
            correctAnswer: question.answer,
            responseType: typeof response,
            answerType: typeof question.answer
          });
          // Ensure both are strings for comparison
          isCorrect = String(response) === String(question.answer);
          points = isCorrect ? question.points || 1 : 0;
          console.log('Debug score calculation:', {
            questionId,
            isCorrect,
            points,
            questionPoints: question.points
          });
          break;
          
        case "coding":
          // For coding questions, we'll need to implement test case evaluation
          // For now, we'll just store the response without evaluation
          points = 0;
          break;
          
        case "subjective":
          // For subjective questions, we'll need manual evaluation
          // For now, we'll just store the response without evaluation
          points = 0;
          break;
      }
      
      // Check if a response already exists
      const existingResponse = await storage.getResponsesByCandidateAndQuestion(
        candidate.id,
        parseInt(questionId)
      );
      console.log(existingResponse,"existingResponse");
      
      if (existingResponse) {
        // Update existing response
        const updatedResponse = await storage.updateResponse(existingResponse.id, {
          response,
          isCorrect,
          points
        });
        res.json({
          id: updatedResponse?.id,
          candidateId: updatedResponse?.candidateId,
          questionId: updatedResponse?.questionId,
          response: updatedResponse?.response,
          submittedAt: updatedResponse?.submittedAt
        });
      } else {
        // Create new response
        const newResponse = await storage.createResponse({
          candidateId: candidate.id,
          questionId: parseInt(questionId),
          response,
          isCorrect,
          points
        });
        res.status(201).json({
          id: newResponse.id,
          candidateId: newResponse.candidateId,
          questionId: newResponse.questionId,
          response: newResponse.response,
          submittedAt: newResponse.submittedAt
        });
        console.log(newResponse,"newResponse");
        
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/candidate/:testLink/submit", async (req, res) => {
    const testLink = req.params.testLink;
    const { autoSubmitted = false } = req.body;
    const candidate = await storage.getCandidateByTestLink(testLink);
    if (!candidate) {
      return res.status(404).json({ message: "Invalid test link" });
    }
    const result = await submitCandidateTest(candidate, autoSubmitted);
    if (result.error) {
      return res.status(403).json({ message: result.error });
    }
    res.json(result);
  });

  // Bulk candidate invitation
  app.post("/api/candidates/bulk-invite", verifyJwt, async (req, res) => {
    const { candidates, testId } = req.body;
    if (!Array.isArray(candidates)) {
      return res.status(400).json({ error: "Candidates array is required." });
    }
    if (!testId) {
      return res.status(400).json({ error: "Test ID is required." });
    }

    const user = await storage.getUser(req.user.id);
    const test = await storage.getTest(testId);
    
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }
    
    if (test.createdBy !== user.id) {
      return res.status(403).json({ message: "Unauthorized to invite candidates for this test" });
    }

    const results = [];
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      const { name, phone, email } = c;
      // Basic validation
      if (!name || !phone || !email) {
        results.push({ ...c, success: false, error: "Missing required fields" });
        continue;
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        results.push({ ...c, success: false, error: "Invalid email format" });
        continue;
      }
      if (!/^[0-9+\-\s()]{7,}$/.test(phone)) {
        results.push({ ...c, success: false, error: "Invalid phone number" });
        continue;
      }

      try {
        // Use the same schema validation as single candidate creation
        const candidateData = insertCandidateSchema.parse({
          name,
          email,
          testId: test.id,
          invitedBy: user.id,
          testLink: nanoid(10),
          status: "pending" // Explicitly set status for new candidates
        });

        const candidate = await storage.createCandidate(candidateData);
        
        // Send invitation email
        const emailResult = await sendTestInvitation(
          candidate.email,
          candidate.name,
          test.title,
          candidate.testLink,
          test.duration,
          user.company
        );
        
        results.push({ 
          ...c,
          id: candidate.id,
          testId: candidate.testId,
          testLink: candidate.testLink,
          status: candidate.status,
          invitedAt: candidate.invitedAt,
          success: true 
        });
      } catch (err: any) {
        results.push({ ...c, success: false, error: err.message || "Failed to create candidate" });
      }
    }
    res.json({ results });
  });

  // Add this route with the other candidate routes
  app.delete("/api/candidates/:id", verifyJwt, async (req, res) => {
    const candidateId = parseInt(req.params.id);
    if (isNaN(candidateId)) {
      return res.status(400).json({ error: "Invalid candidate ID" });
    }

    try {
      // Get the candidate first to check permissions
      const candidate = await storage.getCandidate(candidateId);
      if (!candidate) {
        return res.status(404).json({ error: "Candidate not found" });
      }

      // Get the test to check permissions
      const test = await storage.getTest(candidate.testId);
      if (!test) {
        return res.status(404).json({ error: "Test not found" });
      }

      // Check if user has permission to delete candidates for this test
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
      
      if (test.createdBy !== user.id) {
        return res.status(403).json({ error: "Not authorized to delete candidates for this test" });
      }

      // Delete the candidate
      await storage.deleteCandidate(candidateId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting candidate:", error);
      res.status(500).json({ error: "Failed to delete candidate" });
    }
  });

  // Add this route with the other candidate routes
  app.post("/api/candidate/:testLink/start", async (req, res) => {
    const testLink = req.params.testLink;
    const candidate = await storage.getCandidateByTestLink(testLink);
    
    if (!candidate) {
      return res.status(404).json({ message: "Invalid test link" });
    }
    
    // Don't allow starting completed tests
    if (candidate.status === "completed") {
      return res.status(403).json({ message: "This test has already been completed" });
    }
    
    // Don't allow starting tests that are already in progress
    if (candidate.status === "in_progress") {
      return res.status(403).json({ message: "This test is already in progress" });
    }
    
    // Start the test
    const updatedCandidate = await storage.updateCandidate(candidate.id, {
      status: "in_progress",
      startedAt: new Date()
    });
    
    res.json({
      startedAt: updatedCandidate.startedAt
    });
  });

  // Public test registration
  app.post("/api/public-test/:testId/register", async (req, res) => {
    try {
      const testId = parseInt(req.params.testId);
      const { name, email, phone } = req.body;

      // Validate test exists and is public
      const test = await storage.getTest(testId);
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }

      // Check if email already took this test
      const existingCandidate = await storage.getCandidateByEmailAndTest(email, testId);
      if (existingCandidate) {
        return res.status(400).json({ message: "You have already taken this test" });
      }

      // Create candidate
      const candidateData = {
        name,
        email,
        phone,
        testId,
        testLink: nanoid(10),
        status: "pending",
        invitedBy: test.createdBy // Link to test creator
      };

      const candidate = await storage.createCandidate(candidateData);
      
      res.status(201).json({
        testLink: candidate.testLink
      });
    } catch (error: any) {
      console.error("Error registering for public test:", error);
      res.status(500).json({ message: "Failed to register for test" });
    }
  });

  // Setup HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
