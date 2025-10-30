import { getCustomerById } from "@/lib/dummy-data"

export interface CreditBureauResponse {
  customerId: string
  creditScore: number
  creditHistory: string
  defaultRisk: string
}

export async function POST(request: Request) {
  try {
    const { customerId } = await request.json()

    if (!customerId) {
      return Response.json({ error: "Customer ID is required" }, { status: 400 })
    }

    const customer = getCustomerById(customerId)

    if (!customer) {
      return Response.json({ error: "Customer not found in credit bureau" }, { status: 404 })
    }

    // Determine credit history and default risk based on credit score
    let creditHistory = "Good"
    let defaultRisk = "Low"

    if (customer.creditScore >= 800) {
      creditHistory = "Excellent"
      defaultRisk = "Very Low"
    } else if (customer.creditScore >= 750) {
      creditHistory = "Good"
      defaultRisk = "Low"
    } else if (customer.creditScore >= 700) {
      creditHistory = "Fair"
      defaultRisk = "Medium"
    } else if (customer.creditScore >= 650) {
      creditHistory = "Poor"
      defaultRisk = "High"
    } else {
      creditHistory = "Very Poor"
      defaultRisk = "Very High"
    }

    const response: CreditBureauResponse = {
      customerId,
      creditScore: customer.creditScore,
      creditHistory,
      defaultRisk,
    }

    return Response.json(response)
  } catch (error) {
    console.error("Credit bureau error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
