interface UserSession {
  userId: string;
  state: string;
  termsAccepted: boolean;
  cvProcessed: boolean;
  cvCredits: number;
  lastActivity: string;
  currentPosition?: string;
  cvAnalysis?: {
    analysisText: string;
    timestamp: string;
    pdfUrl: string;
  };
  interview?: {
    position: string;
    questions: Array<{
      question: string;
      timestamp: string;
    }>;
    answers: Array<{
      answer: string;
      feedback: string;
      audioUrl?: string;
      timestamp: string;
    }>;
    currentQuestionIndex: number;
    isCompleted: boolean;
  };
  promoCode?: {
    code: string;
    used: boolean;
    timestamp: string;
  };
  payments?: Array<{
    packageType: string;
    amount: number;
    timestamp: string;
    verified: boolean;
  }>;
}

interface User {
  userId: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  createdAt: string;
  lastSeen: string;
  totalCVAnalyses: number;
  totalInterviews: number;
  isUCALStudent: boolean;
  totalCreditsUsed: number;
  totalPayments: number;
}

interface PromoCode {
  code: string;
  type: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  expiresAt?: string;
}
