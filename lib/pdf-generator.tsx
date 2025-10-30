import type { Customer, UnderwritingResult, LoanRequest } from "./types"

export interface SanctionLetterData {
  customer: Customer
  loanRequest: LoanRequest
  underwritingResult: UnderwritingResult
  generatedDate: Date
  sanctionLetterNumber: string
}

export function generateSanctionLetterHTML(data: SanctionLetterData): string {
  const monthlyEMI =
    data.underwritingResult.conditions?.find((c) => c.includes("Monthly EMI"))?.match(/₹([\d,]+)/)?.[1] || "N/A"

  const interestRate =
    data.underwritingResult.conditions?.find((c) => c.includes("Interest Rate"))?.match(/([\d.]+)%/)?.[1] || "N/A"

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background-color: white;
          padding: 40px;
          border: 2px solid #1e40af;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #1e40af;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0;
          color: #1e40af;
          font-size: 28px;
        }
        .header p {
          margin: 5px 0;
          color: #666;
          font-size: 12px;
        }
        .letter-number {
          text-align: right;
          font-size: 12px;
          color: #666;
          margin-bottom: 20px;
        }
        .date {
          text-align: right;
          font-size: 12px;
          color: #666;
          margin-bottom: 20px;
        }
        .recipient {
          margin-bottom: 30px;
        }
        .recipient p {
          margin: 5px 0;
          font-size: 14px;
        }
        .greeting {
          margin-bottom: 20px;
          font-size: 14px;
          line-height: 1.6;
        }
        .content {
          margin-bottom: 30px;
          font-size: 14px;
          line-height: 1.6;
        }
        .content p {
          margin: 10px 0;
        }
        .loan-details {
          background-color: #f0f4ff;
          border-left: 4px solid #1e40af;
          padding: 15px;
          margin: 20px 0;
          font-size: 14px;
        }
        .loan-details table {
          width: 100%;
          border-collapse: collapse;
        }
        .loan-details td {
          padding: 8px;
          border-bottom: 1px solid #ddd;
        }
        .loan-details td:first-child {
          font-weight: bold;
          width: 50%;
          color: #1e40af;
        }
        .conditions {
          background-color: #fff9e6;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          font-size: 13px;
        }
        .conditions h3 {
          margin-top: 0;
          color: #d97706;
        }
        .conditions ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        .conditions li {
          margin: 5px 0;
        }
        .closing {
          margin-top: 30px;
          font-size: 14px;
          line-height: 1.6;
        }
        .signature-section {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
        }
        .signature {
          text-align: center;
          width: 45%;
        }
        .signature-line {
          border-top: 1px solid #000;
          margin-top: 40px;
          padding-top: 5px;
          font-size: 12px;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 11px;
          color: #666;
        }
        .approved-stamp {
          color: #16a34a;
          font-size: 48px;
          font-weight: bold;
          transform: rotate(-15deg);
          position: absolute;
          top: 100px;
          right: 50px;
          opacity: 0.3;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="approved-stamp">APPROVED</div>
        
        <div class="header">
          <h1>LOAN SANCTION LETTER</h1>
          <p>InstantCreditAI - Personal Loan Division</p>
          <p>Email: support@instantcreditai.com | Phone: 1800-INSTANT</p>
        </div>

        <div class="letter-number">
          <strong>Sanction Letter No.:</strong> ${data.sanctionLetterNumber}
        </div>

        <div class="date">
          <strong>Date:</strong> ${data.generatedDate.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
        </div>

        <div class="recipient">
          <p><strong>${data.customer.name}</strong></p>
          <p>${data.customer.city}</p>
          <p>Customer ID: ${data.customer.id}</p>
        </div>

        <div class="greeting">
          <p>Dear ${data.customer.name},</p>
        </div>

        <div class="content">
          <p>We are pleased to inform you that your application for a personal loan has been <strong>APPROVED</strong> by our underwriting team.</p>
          
          <p>Based on your credit profile, income verification, and our assessment criteria, we are sanctioning a loan as per the details mentioned below:</p>

          <div class="loan-details">
            <table>
              <tr>
                <td>Loan Amount Sanctioned</td>
                <td><strong>₹${data.loanRequest.loanAmount.toLocaleString("en-IN")}</strong></td>
              </tr>
              <tr>
                <td>Loan Tenure</td>
                <td><strong>${data.loanRequest.tenure} Years</strong></td>
              </tr>
              <tr>
                <td>Rate of Interest</td>
                <td><strong>${interestRate}% per annum</strong></td>
              </tr>
              <tr>
                <td>Monthly EMI</td>
                <td><strong>₹${monthlyEMI}</strong></td>
              </tr>
              <tr>
                <td>Total Amount Payable</td>
                <td><strong>₹${(Number.parseInt(monthlyEMI.replace(/,/g, "")) * data.loanRequest.tenure * 12).toLocaleString("en-IN")}</strong></td>
              </tr>
              <tr>
                <td>Processing Fee</td>
                <td><strong>₹${Math.round(data.loanRequest.loanAmount * 0.01).toLocaleString("en-IN")} (1%)</strong></td>
              </tr>
            </table>
          </div>

          <p>This sanction is valid for <strong>30 days</strong> from the date of this letter. The loan amount will be disbursed to your registered bank account within 24 hours of document verification.</p>
        </div>

        <div class="conditions">
          <h3>Terms & Conditions:</h3>
          <ul>
            <li>The loan is sanctioned subject to satisfactory completion of all documentation and verification procedures.</li>
            <li>The interest rate is fixed for the entire tenure of the loan.</li>
            <li>Monthly EMI payments must be made on or before the due date to avoid penalties.</li>
            <li>Late payment charges of 1% per month will be applicable on overdue EMI.</li>
            <li>Prepayment is allowed without any penalty after 12 months from disbursement.</li>
            <li>The loan is subject to our standard terms and conditions and applicable laws.</li>
            <li>Insurance coverage (optional) can be added at an additional cost.</li>
          </ul>
        </div>

        <div class="closing">
          <p>Please note that this sanction letter is valid only upon acceptance of all terms and conditions mentioned herein. To proceed with the loan disbursement, please:</p>
          <ol>
            <li>Sign and return this letter with your acceptance</li>
            <li>Submit any additional documents if requested</li>
            <li>Provide your bank account details for fund transfer</li>
          </ol>
          <p>If you have any questions or require clarification, please do not hesitate to contact our customer support team.</p>
          <p>We look forward to serving you!</p>
        </div>

        <div class="signature-section">
          <div class="signature">
            <div class="signature-line">
              Authorized Signatory<br>
              InstantCreditAI
            </div>
          </div>
          <div class="signature">
            <div class="signature-line">
              Customer Acceptance<br>
              ${data.customer.name}
            </div>
          </div>
        </div>

        <div class="footer">
          <p>This is a computer-generated document and does not require a physical signature.</p>
          <p>InstantCreditAI | Registered Office: Mumbai, India | License No: BFSI-2024-001</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function generateSanctionLetterNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(5, "0")
  return `SL-${year}${month}-${random}`
}
