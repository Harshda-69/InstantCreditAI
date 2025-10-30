import type { ConversationState, VerificationResult } from "@/lib/types"

interface VerificationResponse {
  message: string
  verified: boolean
  retry: boolean
  result?: VerificationResult
}

class VerificationAgent {
  async processMessage(userMessage: string, state: ConversationState): Promise<VerificationResponse> {
    if (!state.customerId) {
      return {
        message: "I need your customer ID to proceed with verification.",
        verified: false,
        retry: true,
      }
    }

    try {
      const response = await fetch("/api/crm/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: state.customerId }),
      })

      const result: VerificationResult = await response.json()

      if (result.verified) {
        return {
          message: `✓ ${result.message}\n\nYour KYC is complete. Let me now check your credit profile and loan eligibility...`,
          verified: true,
          retry: false,
          result,
        }
      } else {
        return {
          message: `⚠ ${result.message}\n\nPlease upload the required documents to proceed.`,
          verified: false,
          retry: true,
          result,
        }
      }
    } catch (error) {
      console.error("[v0] Verification error:", error)
      return {
        message: "I encountered an issue verifying your details. Please try again.",
        verified: false,
        retry: true,
      }
    }
  }
}

export const verificationAgent = new VerificationAgent()
