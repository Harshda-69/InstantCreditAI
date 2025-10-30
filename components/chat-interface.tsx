"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import type { ChatMessage, ConversationState } from "@/lib/types"
import { getRandomCustomer } from "@/lib/dummy-data"
import { masterAgent } from "@/lib/agents/master-agent"
import SanctionLetterViewer from "./sanction-letter-viewer"

const STAGE_LABELS: Record<string, string> = {
  greeting: "Getting Started",
  sales: "Loan Details",
  verification: "KYC Verification",
  underwriting: "Loan Evaluation",
  sanction: "Approved",
  rejected: "Application Closed",
}

const STAGE_COLORS: Record<string, string> = {
  greeting: "bg-blue-500",
  sales: "bg-purple-500",
  verification: "bg-yellow-500",
  underwriting: "bg-orange-500",
  sanction: "bg-green-500",
  rejected: "bg-red-500",
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [conversationState, setConversationState] = useState<ConversationState>({
    currentAgent: "master",
    stage: "greeting",
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [customer, setCustomer] = useState<any>(null)

  // Initialize conversation
  useEffect(() => {
    initializeChat()
  }, [])

  const initializeChat = async () => {
    const selectedCustomer = getRandomCustomer()
    setCustomer(selectedCustomer)
    setConversationState({
      currentAgent: "master",
      stage: "greeting",
      customerId: selectedCustomer.id,
    })

    const greeting = await masterAgent.greet(selectedCustomer)
    setMessages([
      {
        id: "1",
        role: "assistant",
        content: greeting,
        timestamp: new Date(),
        agentType: "master",
      },
    ])
  }

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await masterAgent.processMessage(input, conversationState)

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.message,
        timestamp: new Date(),
        agentType: response.agentType,
      }

      setMessages((prev) => [...prev, assistantMessage])
      setConversationState(response.state)
    } catch (error) {
      console.error("[v0] Error processing message:", error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "system",
        content: "An error occurred. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setMessages([])
    setInput("")
    initializeChat()
  }

  const getAgentColor = (agentType?: string): string => {
    switch (agentType) {
      case "sales":
        return "bg-purple-600"
      case "verification":
        return "bg-yellow-600"
      case "underwriting":
        return "bg-orange-600"
      case "master":
        return "bg-blue-600"
      default:
        return "bg-slate-600"
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-7xl mx-auto p-4 gap-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg p-6 border border-slate-600">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">InstantCreditAI</h1>
            <p className="text-slate-300">Personal Loan Sales Assistant powered by Multi-Agent AI</p>
          </div>
          <Button onClick={handleReset} className="bg-slate-600 hover:bg-slate-700">
            New Conversation
          </Button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Stage Progress */}
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <p className="text-sm text-slate-400 mb-2">Current Stage</p>
            <div className="flex items-center gap-2">
              <div className={`${STAGE_COLORS[conversationState.stage]} w-3 h-3 rounded-full`}></div>
              <span className="text-white font-semibold">{STAGE_LABELS[conversationState.stage]}</span>
              <span className="text-slate-400 text-sm ml-auto">Agent: {conversationState.currentAgent}</span>
            </div>
          </div>

          {/* Chat Messages */}
          <Card className="flex-1 overflow-y-auto p-4 bg-slate-800 border-slate-700">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-sm px-4 py-3 rounded-lg ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white"
                        : msg.role === "system"
                          ? "bg-red-600 text-white"
                          : "bg-slate-700 text-slate-100"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <p className="text-xs opacity-70">{msg.timestamp.toLocaleTimeString()}</p>
                      {msg.agentType && msg.role === "assistant" && (
                        <span className={`${getAgentColor(msg.agentType)} text-white text-xs px-2 py-1 rounded`}>
                          {msg.agentType.charAt(0).toUpperCase() + msg.agentType.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-700 text-slate-100 px-4 py-3 rounded-lg">
                    <div className="flex gap-2 items-center">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </Card>

          {/* Input Area */}
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type your message..."
              disabled={isLoading}
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 px-6"
            >
              Send
            </Button>
          </div>
        </div>

        {/* Sidebar - Customer & Loan Info */}
        <div className="w-96 flex flex-col gap-4 overflow-y-auto">
          {/* Customer Info */}
          {customer && (
            <Card className="bg-slate-800 border-slate-700 p-4 flex-shrink-0">
              <h3 className="text-white font-semibold mb-3">Customer Profile</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Name:</span>
                  <span className="text-white font-medium">{customer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ID:</span>
                  <span className="text-white font-mono text-xs">{customer.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Age:</span>
                  <span className="text-white">{customer.age}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">City:</span>
                  <span className="text-white">{customer.city}</span>
                </div>
                <hr className="border-slate-600 my-2" />
                <div className="flex justify-between">
                  <span className="text-slate-400">Credit Score:</span>
                  <span
                    className={`font-semibold ${customer.creditScore >= 750 ? "text-green-400" : customer.creditScore >= 700 ? "text-yellow-400" : "text-red-400"}`}
                  >
                    {customer.creditScore}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pre-Approved:</span>
                  <span className="text-white">₹{(customer.preApprovedLimit / 100000).toFixed(1)}L</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Loans:</span>
                  <span className="text-white">₹{(customer.currentLoans / 100000).toFixed(1)}L</span>
                </div>
              </div>
            </Card>
          )}

          {/* Loan Request Summary */}
          {conversationState.loanRequest && (
            <Card className="bg-slate-800 border-slate-700 p-4 flex-shrink-0">
              <h3 className="text-white font-semibold mb-3">Loan Request</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount:</span>
                  <span className="text-white font-medium">
                    ₹{(conversationState.loanRequest.loanAmount / 100000).toFixed(1)}L
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tenure:</span>
                  <span className="text-white">{conversationState.loanRequest.tenure} years</span>
                </div>
              </div>
            </Card>
          )}

          {/* Underwriting Result */}
          {conversationState.underwritingResult && (
            <Card
              className={`border-slate-700 p-4 flex-shrink-0 ${conversationState.underwritingResult.approved ? "bg-green-900" : "bg-red-900"}`}
            >
              <h3
                className={`font-semibold mb-3 ${conversationState.underwritingResult.approved ? "text-green-300" : "text-red-300"}`}
              >
                {conversationState.underwritingResult.approved ? "Approved" : "Rejected"}
              </h3>
              <p className="text-sm text-slate-200 mb-2">{conversationState.underwritingResult.reason}</p>
              {conversationState.underwritingResult.sanctionAmount && (
                <div className="text-sm font-semibold text-green-300">
                  Sanction Amount: ₹{(conversationState.underwritingResult.sanctionAmount / 100000).toFixed(1)}L
                </div>
              )}
            </Card>
          )}

          {conversationState.stage === "sanction" && conversationState.underwritingResult?.approved && (
            <SanctionLetterViewer conversationState={conversationState} />
          )}

          {/* Process Flow */}
          <Card className="bg-slate-800 border-slate-700 p-4 flex-shrink-0">
            <h3 className="text-white font-semibold mb-3">Process Flow</h3>
            <div className="space-y-2 text-xs">
              {["greeting", "sales", "verification", "underwriting", "sanction"].map((stage, idx) => (
                <div key={stage} className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      conversationState.stage === stage
                        ? STAGE_COLORS[stage]
                        : ["greeting", "sales", "verification", "underwriting", "sanction"].indexOf(
                              conversationState.stage,
                            ) > idx
                          ? "bg-green-500"
                          : "bg-slate-600"
                    }`}
                  ></div>
                  <span className="text-slate-300">{STAGE_LABELS[stage]}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
