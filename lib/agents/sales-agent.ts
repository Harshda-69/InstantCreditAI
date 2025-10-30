import type { ConversationState, LoanRequest } from "@/lib/types"

interface SalesResponse {
  message: string
  loanRequest?: LoanRequest
}

class SalesAgent {
  private extractLoanDetails(userMessage: string): { amount?: number; tenure?: number } {
    const amountMatch = userMessage.match(/(\d+)\s*(?:lakh|lac|k|thousand|rupees?|₹)?/i)
    const tenureMatch = userMessage.match(/(\d+)\s*(?:year|yr|years?|yrs?)/i)

    return {
      amount: amountMatch
        ? Number.parseInt(amountMatch[1]) * (amountMatch[0].toLowerCase().includes("lakh") ? 100000 : 1)
        : undefined,
      tenure: tenureMatch ? Number.parseInt(tenureMatch[1]) : undefined,
    }
  }

  async processMessage(userMessage: string, state: ConversationState): Promise<SalesResponse> {
    const { amount, tenure } = this.extractLoanDetails(userMessage)

    if (amount && tenure) {
      // Both loan amount and tenure provided
      const loanRequest: LoanRequest = {
        customerId: state.customerId || "",
        loanAmount: amount,
        tenure,
      }

      return {
        message: `Perfect! You're looking for a loan of ₹${amount.toLocaleString()} for ${tenure} year(s). 

Let me verify your details and check your eligibility. This will only take a moment...`,
        loanRequest,
      }
    } else if (amount) {
      // Only amount provided
      return {
        message: `Great! A loan of ₹${amount.toLocaleString()} sounds good. 

Now, for how many years would you like to repay this loan? (Typically 1-7 years)`,
      }
    } else if (tenure) {
      // Only tenure provided
      return {
        message: `A ${tenure}-year tenure is a good choice for loan repayment.

Could you please specify the loan amount you need? (e.g., 5 lakh, 10 lakh, etc.)`,
      }
    } else {
      // Neither provided, ask again
      return {
        message: `I didn't quite catch the loan details. Could you please provide:
1. The loan amount you need (e.g., "5 lakh" or "500000")
2. The tenure in years (e.g., "3 years" or "5 years")

For example: "I need 5 lakh for 3 years"`,
      }
    }
  }
}

export const salesAgent = new SalesAgent()
