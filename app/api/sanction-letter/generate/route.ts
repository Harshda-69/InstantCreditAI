import { generateSanctionLetterHTML, generateSanctionLetterNumber } from "@/lib/pdf-generator"
import { getCustomerById } from "@/lib/dummy-data"
import type { SanctionLetterData } from "@/lib/pdf-generator"
import type { UnderwritingResult, LoanRequest } from "@/lib/types"

export async function POST(request: Request) {
  try {
    const {
      customerId,
      loanRequest,
      underwritingResult,
    }: { customerId: string; loanRequest: LoanRequest; underwritingResult: UnderwritingResult } = await request.json()

    if (!customerId || !loanRequest || !underwritingResult) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    const customer = getCustomerById(customerId)
    if (!customer) {
      return Response.json({ error: "Customer not found" }, { status: 404 })
    }

    if (!underwritingResult.approved) {
      return Response.json({ error: "Cannot generate sanction letter for rejected loan" }, { status: 400 })
    }

    const sanctionLetterData: SanctionLetterData = {
      customer,
      loanRequest,
      underwritingResult,
      generatedDate: new Date(),
      sanctionLetterNumber: generateSanctionLetterNumber(),
    }

    const htmlContent = generateSanctionLetterHTML(sanctionLetterData)

    return Response.json({
      success: true,
      html: htmlContent,
      sanctionLetterNumber: sanctionLetterData.sanctionLetterNumber,
      message: "Sanction letter generated successfully",
    })
  } catch (error) {
    console.error("[v0] Sanction letter generation error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
