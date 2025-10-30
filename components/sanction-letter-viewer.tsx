"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { ConversationState } from "@/lib/types"

interface SanctionLetterViewerProps {
  conversationState: ConversationState
}

export default function SanctionLetterViewer({ conversationState }: SanctionLetterViewerProps) {
  const [letterHTML, setLetterHTML] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [sanctionNumber, setSanctionNumber] = useState<string>("")

  const generateLetter = async () => {
    if (!conversationState.customerId || !conversationState.loanRequest || !conversationState.underwritingResult) {
      alert("Missing required information to generate sanction letter")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/sanction-letter/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: conversationState.customerId,
          loanRequest: conversationState.loanRequest,
          underwritingResult: conversationState.underwritingResult,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setLetterHTML(data.html)
        setSanctionNumber(data.sanctionLetterNumber)
      }
    } catch (error) {
      console.error("[v0] Error generating sanction letter:", error)
      alert("Failed to generate sanction letter")
    } finally {
      setIsLoading(false)
    }
  }

  const downloadHTML = () => {
    if (!letterHTML) return

    const element = document.createElement("a")
    const file = new Blob([letterHTML], { type: "text/html" })
    element.href = URL.createObjectURL(file)
    element.download = `sanction-letter-${sanctionNumber}.html`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const printLetter = () => {
    if (!letterHTML) return

    const printWindow = window.open("", "", "height=600,width=800")
    if (printWindow) {
      printWindow.document.write(letterHTML)
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <Card className="bg-slate-800 border-slate-700 p-4 flex-shrink-0">
      <h3 className="text-white font-semibold mb-4">Sanction Letter</h3>

      {!letterHTML ? (
        <div className="space-y-3">
          <p className="text-slate-300 text-sm">Generate your official loan sanction letter</p>
          <Button onClick={generateLetter} disabled={isLoading} className="w-full bg-green-600 hover:bg-green-700">
            {isLoading ? "Generating..." : "Generate Sanction Letter"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-green-900 border border-green-700 rounded p-3 text-green-300 text-sm">
            <p className="font-semibold">Letter No: {sanctionNumber}</p>
            <p>Your sanction letter has been generated successfully!</p>
          </div>

          <div className="flex gap-2">
            <Button onClick={downloadHTML} className="flex-1 bg-blue-600 hover:bg-blue-700 text-sm">
              Download
            </Button>
            <Button onClick={printLetter} className="flex-1 bg-purple-600 hover:bg-purple-700 text-sm">
              Print
            </Button>
          </div>

          <div className="bg-slate-700 rounded p-3 max-h-64 overflow-y-auto border border-slate-600">
            <div dangerouslySetInnerHTML={{ __html: letterHTML }} className="text-xs text-slate-200 [&_*]:font-sans" />
          </div>
        </div>
      )}
    </Card>
  )
}
