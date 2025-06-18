import { initializeApp, FirebaseApp } from "@firebase/app";
import {
  getFirestore,
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  DocumentData,
  QuerySnapshot,
  Timestamp,
  FieldValue,
} from "@firebase/firestore";

// Interfaces para los tipos de datos
interface FirebaseTimestamp {
  seconds: number;
  nanoseconds: number;
}

interface QuestionAndAnswer {
  questionNumber: number;
  transcription: string;
  answerTimestamp: FirebaseTimestamp;
  questionText: string;
}

interface InterviewHistoryItem {
  jobPosition: string;
  startedAt: FirebaseTimestamp;
  completedAt: FirebaseTimestamp | null;
  interviewId: string;
  questionsAndAnswers: QuestionAndAnswer[];
}

interface WorkExperience {
  role: string;
  company: string;
  description: string;
  duration: string;
}

interface Education {
  institution: string;
  degree: string;
  duration?: string;
  description?: string;
}

interface Skill {
  name: string;
  level?: string;
  category?: string;
}

interface CandidateInfo {
  workExperience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  personalInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
  };
}

interface AnalysisData {
  analysisId: string;
  pdf_report_url: string;
  cvUrl: string;
  candidateInfo: CandidateInfo;
  score?: number;
  recommendations?: string[];
  strengths?: string[];
  weaknesses?: string[];
}

interface CVAnalysisHistorialItem {
  analyzedAt: FirebaseTimestamp;
  jobPosition: string;
  analysisData: AnalysisData;
}

interface User {
  phoneNumber: string;
  name: string;
  totalCVAnalyzed: number;
  lastCVAnalysis: FirebaseTimestamp | FieldValue | null;
  createdAt: FirebaseTimestamp | FieldValue;
  lastInterviewActivity: FirebaseTimestamp | FieldValue | null;
  updatedAt: FirebaseTimestamp | FieldValue;
  interviewHistory: InterviewHistoryItem[];
  terminos: boolean; // Nuevo campo para términos y condiciones
  email?: string;
}

interface CVAnalysis {
  analysis: {
    url: string;
  };
  id: string;
  jobPosition: string;
  timestamp?: string;
  userId: string;
  createdAt?: FirebaseTimestamp | FieldValue;
}

interface CVAnalysisDetailed {
  updatedAt: FirebaseTimestamp | FieldValue;
  createdAt: FirebaseTimestamp | FieldValue;
  id: string;
  cvAnalysisHistorial: CVAnalysisHistorialItem[];
}

export class ServicesFireBase {
  private app: FirebaseApp;
  private db: Firestore;

  constructor(firebaseConfig: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  }) {
    this.app = initializeApp(firebaseConfig);
    this.db = getFirestore(this.app);
  }

  // ========== MÉTODOS PARA GESTIÓN DE USUARIOS ==========

  /**
   * Obtiene un usuario por su ID
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      const userRef = doc(this.db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        return userSnap.data() as User;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error al obtener usuario por ID:", error);
      throw error;
    }
  }

  /**
   * Guarda un nuevo usuario
   */
  async saveUser(
    userData: Partial<User> & { phoneNumber: string }
  ): Promise<void> {
    try {
      const userRef = doc(this.db, "users", userData.phoneNumber);

      const newUser: User = {
        phoneNumber: userData.phoneNumber,
        name: userData.name || "Unknown",
        totalCVAnalyzed: userData.totalCVAnalyzed || 0,
        lastCVAnalysis: userData.lastCVAnalysis || null,
        createdAt: userData.createdAt || serverTimestamp(),
        lastInterviewActivity: userData.lastInterviewActivity || null,
        updatedAt: serverTimestamp(),
        interviewHistory: userData.interviewHistory || [],
        terminos: userData.terminos || false,
        email: userData.email || "",
      };

      await setDoc(userRef, newUser);
    } catch (error) {
      console.error("Error al guardar usuario:", error);
      throw error;
    }
  }

  /**
   * Actualiza un usuario existente
   */
  async updateUser(userId: string, updateData: Partial<User>): Promise<void> {
    try {
      const userRef = doc(this.db, "users", userId);

      const dataToUpdate = {
        ...updateData,
        updatedAt: serverTimestamp(),
        lastCVAnalysis: serverTimestamp(),
      };

      await updateDoc(userRef, dataToUpdate);
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      throw error;
    }
  }

  /**
   * Actualiza el estado de términos y condiciones de un usuario
   */
  async updateUserTerminos(userId: string, terminos: boolean): Promise<void> {
    try {
      await this.updateUser(userId, { terminos });
    } catch (error) {
      console.error("Error al actualizar términos del usuario:", error);
      throw error;
    }
  }

  // ========== MÉTODOS PARA ANÁLISIS DE CV ==========

  /**
   * Guarda un análisis de CV simple
   */
  async saveCVAnalysis(analysisData: CVAnalysis): Promise<string> {
    try {
      const docRef = await addDoc(collection(this.db, "user_cv_analysis"), {
        ...analysisData,
        createdAt: serverTimestamp(),
        timestamp: serverTimestamp(),
      });

      return docRef.id;
    } catch (error) {
      console.error("Error al guardar análisis de CV:", error);
      throw error;
    }
  }

  /**
   * Guarda un análisis de CV detallado
   */
  async saveCVAnalysisDetailed(
    userId: string,
    analysisData: Partial<CVAnalysisDetailed>
  ): Promise<void> {
    try {
      const analysisRef = doc(this.db, "analysis_cvs", userId);

      const existingDoc = await getDoc(analysisRef);

      if (existingDoc.exists()) {
        // Actualizar documento existente
        await updateDoc(analysisRef, {
          ...analysisData,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Crear nuevo documento
        const newAnalysis: CVAnalysisDetailed = {
          id: userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          cvAnalysisHistorial: analysisData.cvAnalysisHistorial || [],
          ...analysisData,
        };

        await setDoc(analysisRef, newAnalysis);
      }
    } catch (error) {
      console.error("Error al guardar análisis de CV detallado:", error);
      throw error;
    }
  }

  /**
   * Obtiene el análisis de CV detallado de un usuario
   */
  async getCVAnalysisDetailed(
    userId: string
  ): Promise<CVAnalysisDetailed | null> {
    try {
      const analysisRef = doc(this.db, "cv_analysis_detailed", userId);
      const analysisSnap = await getDoc(analysisRef);

      if (analysisSnap.exists()) {
        return analysisSnap.data() as CVAnalysisDetailed;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error al obtener análisis de CV detallado:", error);
      throw error;
    }
  }

  /**
   * Obtiene todos los análisis de CV de un usuario
   */
  async getCVAnalysisByUser(userId: string): Promise<CVAnalysis[]> {
    try {
      const q = query(
        collection(this.db, "cv_analysis"),
        where("userId", "==", userId)
      );

      const querySnapshot = await getDocs(q);
      const analyses: CVAnalysis[] = [];

      querySnapshot.forEach((doc) => {
        analyses.push({ id: doc.id, ...doc.data() } as CVAnalysis);
      });

      return analyses;
    } catch (error) {
      console.error("Error al obtener análisis de CV por usuario:", error);
      throw error;
    }
  }

  // ========== MÉTODO PARA GUARDAR EN MEMORIA (COMPATIBILIDAD) ==========

  /**
   * Método de compatibilidad para guardar datos en memoria del usuario
   */
  async saveToMemory(userId: string, data: Partial<User>): Promise<void> {
    try {
      await this.updateUser(userId, data);
    } catch (error) {
      console.error("Error al guardar en memoria:", error);
      throw error;
    }
  }
}
