import { getCustomerById } from "@/lib/dummy-data"
import type { VerificationResult } from "@/lib/types"

export async function POST(request: Request) {
  try {
    const { customerId } = await request.json()

    if (!customerId) {
      return Response.json({ error: "Customer ID is required" }, { status: 400 })
    }

    const customer = getCustomerById(customerId)

    if (!customer) {
      return Response.json({ error: "Customer not found" }, { status: 404 })
    }

    // Simulate CRM verification - 90% success rate
    const isVerified = Math.random() > 0.1

    const result: VerificationResult = {
      verified: isVerified,
      kycStatus: isVerified ? "APPROVED" : "PENDING_DOCUMENTS",
      message: isVerified
        ? `KYC verification successful for ${customer.name}. All documents verified.`
        : `KYC verification pending. Additional documents required for ${customer.name}.`,
    }

    return Response.json(result)
  } catch (error) {
    console.error("CRM verification error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
