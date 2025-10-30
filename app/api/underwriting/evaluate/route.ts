import { getCustomerById } from "@/lib/dummy-data"
import type { UnderwritingResult } from "@/lib/types"

export interface UnderwritingRequest {
  customerId: string
  loanAmount: number
  tenure: number
  salary?: number
}

export async function POST(request: Request) {
  try {
    const { customerId, loanAmount, tenure, salary }: UnderwritingRequest = await request.json()

    if (!customerId || !loanAmount || !tenure) {
      return Response.json({ error: "Missing required fields: customerId, loanAmount, tenure" }, { status: 400 })
    }

    const customer = getCustomerById(customerId)

    if (!customer) {
      return Response.json({ error: "Customer not found" }, { status: 404 })
    }

    let result: UnderwritingResult

    // Rule 1: Loan <= pre-approved limit → Approve instantly
    if (loanAmount <= customer.preApprovedLimit) {
      const interestRate = customer.creditScore >= 750 ? 8.5 : 10.5
      const monthlyEMI =
        (loanAmount * (interestRate / 100 / 12) * Math.pow(1 + interestRate / 100 / 12, tenure * 12)) /
        (Math.pow(1 + interestRate / 100 / 12, tenure * 12) - 1)

      result = {
        approved: true,
        reason: "Loan amount within pre-approved limit. Instant approval granted.",
        sanctionAmount: loanAmount,
        conditions: [
          `Interest Rate: ${interestRate}% per annum`,
          `Monthly EMI: ₹${Math.round(monthlyEMI)}`,
          `Tenure: ${tenure} years`,
        ],
      }
    }
    // Rule 2: Loan <= 2× pre-approved limit → Request salary slip; approve if EMI <= 50% of salary
    else if (loanAmount <= customer.preApprovedLimit * 2) {
      if (!salary) {
        result = {
          approved: false,
          reason: "Loan amount exceeds pre-approved limit. Salary slip verification required.",
          conditions: ["Please provide your latest salary slip for verification"],
        }
      } else {
        const interestRate = customer.creditScore >= 750 ? 9.5 : 11.5
        const monthlyEMI =
          (loanAmount * (interestRate / 100 / 12) * Math.pow(1 + interestRate / 100 / 12, tenure * 12)) /
          (Math.pow(1 + interestRate / 100 / 12, tenure * 12) - 1)
        const monthlySalary = salary / 12
        const emiToSalaryRatio = (monthlyEMI / monthlySalary) * 100

        if (emiToSalaryRatio <= 50) {
          result = {
            approved: true,
            reason: `Loan approved. EMI (${emiToSalaryRatio.toFixed(1)}%) is within acceptable limits (≤50% of salary).`,
            sanctionAmount: loanAmount,
            conditions: [
              `Interest Rate: ${interestRate}% per annum`,
              `Monthly EMI: ₹${Math.round(monthlyEMI)}`,
              `EMI to Salary Ratio: ${emiToSalaryRatio.toFixed(1)}%`,
              `Tenure: ${tenure} years`,
            ],
          }
        } else {
          result = {
            approved: false,
            reason: `Loan rejected. EMI (${emiToSalaryRatio.toFixed(1)}%) exceeds acceptable limit (50% of salary).`,
            conditions: ["Consider reducing loan amount or increasing tenure"],
          }
        }
      }
    }
    // Rule 3: Loan > 2× limit or credit score < 700 → Reject
    else if (loanAmount > customer.preApprovedLimit * 2 || customer.creditScore < 700) {
      result = {
        approved: false,
        reason:
          loanAmount > customer.preApprovedLimit * 2
            ? "Loan amount exceeds maximum limit (2× pre-approved limit)."
            : "Credit score below minimum threshold (700). Loan cannot be approved.",
        conditions: ["Consider reapplying after improving credit score or requesting a lower amount"],
      }
    } else {
      result = {
        approved: false,
        reason: "Loan evaluation failed. Please contact support.",
        conditions: [],
      }
    }

    return Response.json(result)
  } catch (error) {
    console.error("Underwriting evaluation error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
