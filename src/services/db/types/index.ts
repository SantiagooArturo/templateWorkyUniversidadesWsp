interface UserSession {
  userId: string;
  state: string;
  termsAccepted: boolean;
  cvProcessed: boolean;
  cvCredits: number;
  lastActivity: string;
  currentPosition?: string;
  
  // Sistema de pagos B2C
  payment?: {
    pendingAmount?: number;
    selectedPlan?: "basico" | "estandar" | "premium";
    yapeCaptureUrl?: string;
    transactionId?: string;
    verificationStatus?: "pending" | "verified" | "rejected";
  };
  
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

// Nuevos tipos para el sistema B2C
interface PaymentPlan {
  id: "single" | "triple" | "six";
  name: string;
  credits: number;
  price: number;
  description: string;
  popular?: boolean;
}

interface Transaction {
  id: string;
  userId: string;
  plan: PaymentPlan;
  amount: number;
  yapeCaptureUrl: string;
  status: "pending" | "verified" | "rejected";
  createdAt: any; // Firebase timestamp
  verifiedAt?: any; // Firebase timestamp
  rejectionReason?: string;
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
  
  // Nuevos campos para B2C
  availableCredits: number;
  isNewUser: boolean;
  freeCreditsUsed: boolean;
  transactionHistory: Transaction[];
  
  // Campos del modelo anterior (conservados por compatibilidad)
  isUCALStudent?: boolean;
  totalCreditsUsed?: number;
  totalPayments?: number;
}

interface PromoCode {
  code: string;
  type: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  expiresAt?: string;
}

// Exportar todos los tipos
export type {
  UserSession,
  User,
  PromoCode,
  PaymentPlan,
  Transaction
};
