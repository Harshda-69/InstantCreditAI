import type { Customer, ConversationState } from "@/lib/types"
import { salesAgent } from "./sales-agent"
import { verificationAgent } from "./verification-agent"
import { underwritingAgent } from "./underwriting-agent"

interface AgentResponse {
  message: string
  state: ConversationState
  agentType: "master" | "sales" | "verification" | "underwriting"
}

class MasterAgent {
  async greet(customer: Customer): Promise<string> {
    return `Hello ${customer.name}! 👋 Welcome to InstantCreditAI. I'm your personal loan assistant powered by advanced AI. 

I'm here to help you get a personal loan quickly and easily. We have a streamlined process that typically takes just a few minutes.

To get started, could you please tell me:
1. How much loan amount are you looking for?
2. What tenure (in years) would you prefer for repayment?

Let's find the perfect loan solution for you!`
  }

  async processMessage(userMessage: string, state: ConversationState): Promise<AgentResponse> {
    try {
      // Route to appropriate agent based on current stage
      switch (state.stage) {
        case "greeting":
        case "sales":
          return await this.handleSalesStage(userMessage, state)

        case "verification":
          return await this.handleVerificationStage(userMessage, state)

        case "underwriting":
          return await this.handleUnderwritingStage(userMessage, state)

        case "sanction":
          return await this.handleSanctionStage(userMessage, state)

        case "rejected":
          return await this.handleRejectionStage(userMessage, state)

        default:
          return {
            message: "I'm not sure how to proceed. Let me start over. How much loan amount are you looking for?",
            state: { ...state, stage: "sales", currentAgent: "master" },
            agentType: "master",
          }
      }
    } catch (error) {
      console.error("[v0] Master Agent error:", error)
      // Fallback to master agent on error
      return {
        message:
          "I encountered an issue processing your request. Let me help you again. Could you please repeat your loan requirements?",
        state: { ...state, currentAgent: "master", stage: "sales" },
        agentType: "master",
      }
    }
  }

  private async handleSalesStage(userMessage: string, state: ConversationState): Promise<AgentResponse> {
    const salesResponse = await salesAgent.processMessage(userMessage, state)

    if (salesResponse.loanRequest) {
      // Sales stage complete, move to verification
      return {
        message: salesResponse.message,
        state: {
          ...state,
          loanRequest: salesResponse.loanRequest,
          stage: "verification",
          currentAgent: "verification",
        },
        agentType: "sales",
      }
    }

    return {
      message: salesResponse.message,
      state: { ...state, stage: "sales", currentAgent: "sales" },
      agentType: "sales",
    }
  }

  private async handleVerificationStage(userMessage: string, state: ConversationState): Promise<AgentResponse> {
    if (!state.customerId) {
      return {
        message: "I need to verify your identity first. Let me start the verification process.",
        state: { ...state, stage: "verification", currentAgent: "verification" },
        agentType: "master",
      }
    }

    const verificationResponse = await verificationAgent.processMessage(userMessage, state)

    if (verificationResponse.verified) {
      // Verification successful, move to underwriting
      return {
        message: verificationResponse.message,
        state: {
          ...state,
          verificationResult: verificationResponse.result,
          stage: "underwriting",
          currentAgent: "underwriting",
        },
        agentType: "verification",
      }
    } else if (verificationResponse.retry) {
      // Verification failed but can retry
      return {
        message: verificationResponse.message,
        state: { ...state, stage: "verification", currentAgent: "verification" },
        agentType: "verification",
      }
    } else {
      // Verification failed, return to sales
      return {
        message: `${verificationResponse.message}\n\nLet me connect you back to our sales team to explore other options.`,
        state: { ...state, stage: "sales", currentAgent: "sales" },
        agentType: "master",
      }
    }
  }

  private async handleUnderwritingStage(userMessage: string, state: ConversationState): Promise<AgentResponse> {
    if (!state.loanRequest) {
      return {
        message: "I need your loan details to proceed with underwriting. Let me collect that information.",
        state: { ...state, stage: "sales", currentAgent: "sales" },
        agentType: "master",
      }
    }

    const underwritingResponse = await underwritingAgent.processMessage(userMessage, state)

    if (underwritingResponse.approved) {
      // Loan approved, move to sanction
      return {
        message: underwritingResponse.message,
        state: {
          ...state,
          underwritingResult: underwritingResponse.result,
          stage: "sanction",
          currentAgent: "master",
        },
        agentType: "underwriting",
      }
    } else if (underwritingResponse.needsMoreInfo) {
      // Need more information (e.g., salary slip)
      return {
        message: underwritingResponse.message,
        state: { ...state, stage: "underwriting", currentAgent: "underwriting" },
        agentType: "underwriting",
      }
    } else {
      // Loan rejected
      return {
        message: underwritingResponse.message,
        state: {
          ...state,
          underwritingResult: underwritingResponse.result,
          stage: "rejected",
          currentAgent: "master",
        },
        agentType: "underwriting",
      }
    }
  }

  private async handleSanctionStage(userMessage: string, state: ConversationState): Promise<AgentResponse> {
    const sanctionMessage = `Congratulations! 🎉 Your loan has been approved!

**Loan Details:**
- Loan Amount: ₹${state.loanRequest?.loanAmount.toLocaleString()}
- Tenure: ${state.loanRequest?.tenure} years
- Status: APPROVED

Your sanction letter has been generated and will be sent to your registered email shortly. You can download it from your account dashboard.

**Next Steps:**
1. Review the sanction letter
2. Complete the final documentation
3. Funds will be disbursed within 24 hours

Is there anything else you'd like to know about your loan?`

    return {
      message: sanctionMessage,
      state: { ...state, stage: "sanction", currentAgent: "master" },
      agentType: "master",
    }
  }

  private async handleRejectionStage(userMessage: string, state: ConversationState): Promise<AgentResponse> {
    const rejectionMessage = `I understand this might be disappointing. However, based on our underwriting criteria, we're unable to approve your loan at this time.

**Reasons for rejection:**
${state.underwritingResult?.reason || "Loan criteria not met"}

**What you can do:**
1. Improve your credit score by paying existing loans on time
2. Reduce the requested loan amount
3. Increase your tenure to reduce monthly EMI
4. Reapply after 6 months

Would you like to explore any of these options or speak with our support team?`

    return {
      message: rejectionMessage,
      state: { ...state, stage: "rejected", currentAgent: "master" },
      agentType: "master",
    }
  }
}

export const masterAgent = new MasterAgent()
