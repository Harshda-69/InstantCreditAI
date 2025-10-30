import type { ConversationState, UnderwritingResult } from "@/lib/types"
import type { UnderwritingRequest } from "@/app/api/underwriting/evaluate/route"

interface UnderwritingResponse {
  message: string
  approved: boolean
  needsMoreInfo: boolean
  result?: UnderwritingResult
}

class UnderwritingAgent {
  private extractSalary(userMessage: string): number | undefined {
    const salaryMatch = userMessage.match(/(\d+)\s*(?:lakh|lac|k|thousand|rupees?|₹)?/i)
    if (salaryMatch) {
      return Number.parseInt(salaryMatch[1]) * (salaryMatch[0].toLowerCase().includes("lakh") ? 100000 : 1)
    }
    return undefined
  }

  async processMessage(userMessage: string, state: ConversationState): Promise<UnderwritingResponse> {
    if (!state.loanRequest || !state.customerId) {
      return {
        message: "I need your loan details to proceed with underwriting.",
        approved: false,
        needsMoreInfo: true,
      }
    }

    try {
      const underwritingRequest: UnderwritingRequest = {
        customerId: state.customerId,
        loanAmount: state.loanRequest.loanAmount,
        tenure: state.loanRequest.tenure,
        salary: this.extractSalary(userMessage),
      }

      const response = await fetch("/api/underwriting/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(underwritingRequest),
      })

      const result: UnderwritingResult = await response.json()

      if (result.approved) {
        const conditionsText = result.conditions?.join("\n") || ""
        return {
          message: `✓ Great news! Your loan has been approved!\n\n${result.reason}\n\n${conditionsText}`,
          approved: true,
          needsMoreInfo: false,
          result,
        }
      } else if (result.conditions?.some((c) => c.includes("salary slip"))) {
        return {
          message: `${result.reason}\n\nCould you please provide your annual salary so I can verify your EMI capacity?`,
          approved: false,
          needsMoreInfo: true,
          result,
        }
      } else {
        return {
          message: `✗ Unfortunately, we're unable to approve your loan at this time.\n\n${result.reason}\n\n${result.conditions?.join("\n") || ""}`,
          approved: false,
          needsMoreInfo: false,
          result,
        }
      }
    } catch (error) {
      console.error("[v0] Underwriting error:", error)
      return {
        message: "I encountered an issue evaluating your loan. Please try again.",
        approved: false,
        needsMoreInfo: true,
      }
    }
  }
}

export const underwritingAgent = new UnderwritingAgent()
