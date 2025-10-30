export interface Customer {
  id: string
  name: string
  age: number
  city: string
  creditScore: number
  currentLoans: number
  preApprovedLimit: number
  email?: string
  phone?: string
}

export interface LoanRequest {
  customerId: string
  loanAmount: number
  tenure: number
  interestRate?: number
}

export interface VerificationResult {
  verified: boolean
  kycStatus: string
  message: string
}

export interface UnderwritingResult {
  approved: boolean
  reason: string
  sanctionAmount?: number
  conditions?: string[]
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  agentType?: "master" | "sales" | "verification" | "underwriting"
}

export interface ConversationState {
  customerId?: string
  loanRequest?: LoanRequest
  verificationResult?: VerificationResult
  underwritingResult?: UnderwritingResult
  currentAgent: "master" | "sales" | "verification" | "underwriting"
  stage: "greeting" | "sales" | "verification" | "underwriting" | "sanction" | "rejected"
}
