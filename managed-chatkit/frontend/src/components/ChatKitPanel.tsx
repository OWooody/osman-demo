import { useMemo, useRef, useState, useEffect } from "react";
import { ChatKit, useChatKit } from "@openai/chatkit-react";
import type { ChatKitOptions } from "@openai/chatkit-react";
import { createClientSecretFetcher, workflowId } from "../lib/chatkitSession";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { AnimatedNumber } from "./shared/AnimatedNumber";
import { DotGridBackground } from "./DotGridBackground";

// Warm color palette - matching our design system
const WARM_COLORS = {
  primary: "#E07A5F",      // Warm coral
  primaryLight: "#F4A698",
  primaryDark: "#C35A42",
  sage: "#81B29A",         // Soft sage green
  sageLight: "#A8D4BC",
  sageDark: "#5E9178",
  gold: "#F2CC8F",         // Warm gold
  goldLight: "#F9E4C4",
  cream: "#FAF7F2",
  sand: "#F5F0E8",
  stone: "#E8E2D9",
  gray700: "#4A453D",
  gray800: "#2D2A25",
};

// Helper to add hex alpha to a color (e.g., withOpacity("#F4A698", "40") => "#F4A69840")
function withOpacity(color: string, alpha: string): string {
  return `${color}${alpha}`;
}

export function ChatKitPanel() {
  const [showReport, setShowReport] = useState(false); // TODO: set back to false when done
  const [showReconcile, setShowReconcile] = useState(false);
  const [showBillsPaying, setShowBillsPaying] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(false);
  const [reconciledIds, setReconciledIds] = useState<string[]>([]);
  const [paidBillIds, setPaidBillIds] = useState<string[]>([]);
  const [justMatchedId, setJustMatchedId] = useState<string | null>(null);

  const getClientSecret = useMemo(
    () => createClientSecretFetcher(workflowId),
    []
  );

  const chatkitRef = useRef<ReturnType<typeof useChatKit> | null>(null);

  // Profit and Loss data - matching the design
  const profitLossData = [
    { month: "Jan", profit: 18000 },
    { month: "Feb", profit: 21000 },
    { month: "Mar", profit: 19500 },
    { month: "Apr", profit: 23000 },
    { month: "May", profit: 25000 },
    { month: "Jun", profit: 24000 },
    { month: "Jul", profit: 26000 },
    { month: "Aug", profit: 24500 },
    { month: "Sep", profit: 27000 },
    { month: "Oct", profit: 26100 },
    { month: "Nov", profit: 27500 },
    { month: "Dec", profit: 28300 },
  ];

  // Current month data
  const currentMonth = profitLossData[profitLossData.length - 1];
  const previousMonth = profitLossData[profitLossData.length - 2];
  const currentProfit = currentMonth.profit;
  const previousProfit = previousMonth.profit;
  const profitChange = ((currentProfit - previousProfit) / previousProfit) * 100;
  
  // Revenue and Expenses for footer
  const currentRevenue = 124500;
  const currentExpenses = 96200;

  // Reconciliation data
  const reconciliationTransactions = useMemo(
    () => [
      { id: "tx-1", vendor: "TECHFLOW INC", type: "Wire Transfer", date: "Jan 15", amount: 8900, direction: "in" },
      { id: "tx-2", vendor: "ANTHROPIC PBC", type: "Recurring Payment", date: "Jan 14", amount: -3247, direction: "out" },
      { id: "tx-3", vendor: "OPENAI", type: "Recurring Payment", date: "Jan 14", amount: -2856, direction: "out" },
      { id: "tx-4", vendor: "OPENAI", type: "Debit Card", date: "Jan 14", amount: -428, direction: "out" },
      { id: "tx-5", vendor: "AMZN PMTS", type: "AWS", date: "Jan 13", amount: -4235, direction: "out" },
      { id: "tx-6", vendor: "GOOGLE *CLOUD", type: "ACH Debit", date: "Jan 13", amount: -1890, direction: "out" },
      { id: "tx-7", vendor: "VERCEL INC", type: "Recurring Payment", date: "Jan 13", amount: -892, direction: "out" },
    ],
    []
  );

  const chartOfAccounts = useMemo(
    () => [
      {
        name: "Revenue",
        balance: 12500,
        children: [
          { name: "Customer Payments", balance: 12500, id: "tx-1" },
          { name: "Recurring Revenue", balance: 0 },
        ],
      },
      {
        name: "Cost of Revenue",
        balance: 0,
        children: [{ name: "AI Provider Expenses", balance: 0, id: "tx-3" }],
      },
      {
        name: "Operating Expenses",
        balance: 0,
        children: [
          { name: "Infrastructure & Hosting", balance: 0, id: "tx-5" },
          { name: "Payroll & Benefits", balance: 0 },
          { name: "Insurance", balance: 0 },
          { name: "SaaS & Tooling", balance: 0, id: "tx-7" },
          { name: "Professional Services", balance: 0, id: "tx-6" },
          { name: "Research & Development", balance: 0, id: "tx-2" },
          { name: "Bank Fees", balance: 0, id: "tx-4" },
        ],
      },
    ],
    []
  );

  const reconciliationSequence = useMemo(
    () => reconciliationTransactions.map((tx) => tx.id),
    [reconciliationTransactions]
  );

  // Bills data for payment simulation
  const billsToPay = useMemo(
    () => [
      { id: "bill-1", vendor: "AWS", account: "****3847", amount: 4235.00 },
      { id: "bill-2", vendor: "Microsoft 365", account: "****9012", amount: 1299.00 },
      { id: "bill-3", vendor: "Electricity for Dec", account: "****5521", amount: 847.50 },
      { id: "bill-4", vendor: "Slack", account: "****7734", amount: 425.00 },
    ],
    []
  );

  const billsSequence = useMemo(
    () => billsToPay.map((bill) => bill.id),
    [billsToPay]
  );

  const totalBillsAmount = useMemo(
    () => billsToPay.reduce((sum, bill) => sum + bill.amount, 0),
    [billsToPay]
  );

  const paidAmount = useMemo(
    () => billsToPay.filter(b => paidBillIds.includes(b.id)).reduce((sum, bill) => sum + bill.amount, 0),
    [billsToPay, paidBillIds]
  );

  const activeTransactionId =
    showReconcile && reconciliationSequence.length > 0
      ? reconciliationSequence[Math.min(reconciledIds.length, reconciliationSequence.length - 1)]
      : null;

  const reconciliationProgress = Math.min(
    (reconciledIds.length / reconciliationTransactions.length) * 100,
    100
  );

  // Helper to get transaction amount by ID
  const getTransactionAmount = (txId: string) => {
    const tx = reconciliationTransactions.find(t => t.id === txId);
    return tx ? Math.abs(tx.amount) : 0;
  };

  // Compute dynamic balances based on reconciled transactions
  const getAccountBalance = (accountId?: string) => {
    if (!accountId) return 0;
    if (!reconciledIds.includes(accountId)) return 0;
    return getTransactionAmount(accountId);
  };

  // Compute section totals
  const getSectionBalance = (children: Array<{ id?: string }>) => {
    return children.reduce((sum, child) => sum + getAccountBalance(child.id), 0);
  };

  const options: ChatKitOptions = useMemo(
    () => ({
      api: {
        getClientSecret,
      },
      theme: {
        colorScheme: "light",
        radius: 'round',  // Softer, more approachable corners
        density: "spacious",
        color: {
          accent: {
            primary: WARM_COLORS.primary,  // Warm coral instead of cold purple
            level: 1,
          },
        },
        typography: {
          baseSize: 16,
          fontFamily:
            '"Plus Jakarta Sans", "OpenAI Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          fontFamilyMono:
            '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSources: [
            {
              family: "Plus Jakarta Sans",
              src: "https://cdn.jsdelivr.net/fontsource/fonts/plus-jakarta-sans@latest/latin-400-normal.woff2",
              weight: 400,
              style: "normal",
              display: "swap",
            },
            {
              family: "Plus Jakarta Sans",
              src: "https://cdn.jsdelivr.net/fontsource/fonts/plus-jakarta-sans@latest/latin-600-normal.woff2",
              weight: 600,
              style: "normal",
              display: "swap",
            },
          ],
        },
      },
      composer: {
        placeholder: '',
        attachments: {
          enabled: true,
          maxCount: 5,
          maxSize: 10485760,
        },
        tools: [
          {
            id: 'create_theme',
            label: 'Zatca Mode',
            shortLabel: 'Zatca Mode',
            placeholderOverride: 'Ask anything about Zatca',
            icon: 'book-open',
            pinned: true
          },
          {
            id: "search_docs",
            label: "Search docs",
            shortLabel: "Docs",
            placeholderOverride: "Search documentation",
            icon: "book-open",
            pinned: false,
          },
          {
            id: "generate_report",
            label: "Generate report",
            shortLabel: "Report",
            placeholderOverride: "Generate profit and loss report",
            icon: "chart",
            pinned: false,
          },
        ],
      },
      startScreen: {
        greeting: "",
        prompts: [
          {
            icon: "document",
            label: "Create an invoice for a client",
            prompt: "Create an invoice for a client",
          },
          {
            icon: "check-circle",
            label: "Reconcile my bank account",
            prompt: "Reconcile my bank account",
          },
          {
            icon: "calendar",
            label: "Track my bills and due dates",
            prompt: "Track my bills and due dates",
          },
          {
            icon: "chart",
            label: "Generate a profit and loss report",
            prompt: "Generate a profit and loss report",
          },
        ],
      },
      onClientTool: async (toolCall) => {
        console.log("🔧 Tool called from workflow:", toolCall);
        console.log("Tool name:", toolCall.name);
        console.log("Tool params:", toolCall.params);
        
        if (toolCall.name === "generate_report") {
          console.log("📊 generate_report tool called with:", toolCall);
          setShowReport(true);
          setShowReconcile(false);
        }
        
        if (toolCall.name === "reconcile") {
          console.log("🔄 reconcile tool called with:", toolCall);
          setShowReconcile(true);
          setShowReport(false);
          setInvoiceData(null);
          setReconciledIds([]);
        }
        
        // Return a result for the tool call
        // You can return any data structure here
        return {
          success: true,
          message: `Tool ${toolCall.name} executed successfully`,
        };
      },
      widgets: {
        async onAction(action, widgetItem) {
          console.log("=== WIDGET ACTION TRIGGERED ===");
          console.log("Action type:", action.type);
          console.log("Action payload:", action.payload);
          console.log("Action payload type:", typeof action.payload);
          console.log("Action payload keys:", action.payload && typeof action.payload === 'object' ? Object.keys(action.payload) : 'N/A');
          console.log("Full action object:", JSON.stringify(action, null, 2));
          console.log("Widget item:", widgetItem);
          console.log("Widget item keys:", widgetItem ? Object.keys(widgetItem) : 'N/A');
          console.log("Widget item widget:", widgetItem?.widget);
          console.log("Widget item widget keys:", widgetItem?.widget && typeof widgetItem.widget === 'object' ? Object.keys(widgetItem.widget) : 'N/A');

          // Forward the action back to the workflow so it can respond
          const chatkit = chatkitRef.current;
          if (chatkit && "sendCustomAction" in chatkit && typeof chatkit.sendCustomAction === "function") {
            try {
              await chatkit.sendCustomAction(
                {
                  type: action.type,
                  payload: action.payload,
                },
                widgetItem?.id
              );
              console.log(`Action ${action.type} forwarded to workflow`);

              // Show success confirmation in the chat
              if (chatkit && "sendUserMessage" in chatkit && typeof chatkit.sendUserMessage === "function") {
                try {
                  // Determine success message based on action type
                  let successMessage = "Thanks 🌹";
                  if (action.type === "request.submit") {
                    successMessage = "Thanks 🌹";
                    

                    
                    // Extract invoice data from payload
                    let invoice: any = {};
                    if (action.payload && typeof action.payload === 'object') {
                      invoice = action.payload;
                    } else if (action.payload) {
                      invoice = { data: action.payload, confirmed: true };
                    } else {
                      // Create a basic invoice structure from widget if available
                      const widget = widgetItem?.widget;
                      if (widget && typeof widget === 'object') {
                        invoice = { 
                          confirmed: true, 
                          timestamp: new Date().toISOString(),
                          widgetData: widget
                        };
                      } else {
                        invoice = { confirmed: true, timestamp: new Date().toISOString() };
                      }
                    }
                    
                    console.log("Setting invoice data:", invoice);
                    setInvoiceData(invoice);
                    setShowReport(false); // Hide report if showing
                  } else if (action.type === "request.discard") {
                    successMessage = "✓ Discard";
                  } else if (action.type === "bills.pay") {
                    // Don't send any message for bills.pay
                    successMessage = "";
                  }

                  if (successMessage) {
                    await chatkit.sendUserMessage({ text: successMessage });
                  }
                } catch (error) {
                  console.error("Error sending success message:", error);
                }
              }
            } catch (error) {
              console.error("Error forwarding action to workflow:", error);
              
              // Show error message in chat if action failed
              if (chatkit && "sendUserMessage" in chatkit && typeof chatkit.sendUserMessage === "function") {
                try {
                  await chatkit.sendUserMessage({ 
                    text: "❌ Action failed. Please try again." 
                  });
                } catch (msgError) {
                  console.error("Error sending error message:", msgError);
                }
              }
            }
          }

          // Additional logging for debugging
          if (action.type === "request.submit") {
            console.log("=== REQUEST.SUBMIT - Additional Info ===");
            console.log("Payload (stringified):", JSON.stringify(action.payload, null, 2));
            console.log("Widget (stringified):", JSON.stringify(widgetItem?.widget, null, 2));
          } else if (action.type === "request.discard") {
            console.log("=== REQUEST.DISCARD DETECTED ===");
            console.log("User discarded/cancelled:", action.payload);
            // Clear invoice if discarded
            setInvoiceData(null);
            console.log("Invoice data cleared");
          } else if (action.type === "bills.pay") {
            console.log("=== BILLS.PAY TRIGGERED ===");
            setShowBillsPaying(true);
            setShowReport(false);
            setShowReconcile(false);
            setInvoiceData(null);
            setPaidBillIds([]);
          }
        },
      },
    }),
    [getClientSecret]
  );

  const chatkit = useChatKit(options);
  chatkitRef.current = chatkit;

  // Drive reconciliation animation
  useEffect(() => {
    if (!showReconcile) {
      return;
    }

    setReconciledIds([]);
    setJustMatchedId(null);

    let step = 0;
    const intervalId = setInterval(() => {
      const nextId = reconciliationSequence[step];
      if (nextId) {
        // Set the "just matched" state for glow animation
        setJustMatchedId(nextId);
        
        // Add to reconciled list
        setReconciledIds((prev) =>
          prev.includes(nextId) ? prev : [...prev, nextId]
        );
        
        // Clear the glow after animation completes
        setTimeout(() => {
          setJustMatchedId((current) => current === nextId ? null : current);
        }, 800);
      }

      step += 1;
      if (step >= reconciliationSequence.length) {
        clearInterval(intervalId);
      }
    }, 1200);

    return () => clearInterval(intervalId);
  }, [reconciliationSequence, showReconcile]);

  // Drive bills payment animation
  useEffect(() => {
    if (!showBillsPaying) return;
    setPaidBillIds([]);

    let step = 0;
    const intervalId = setInterval(() => {
      const nextId = billsSequence[step];
      if (nextId) {
        setPaidBillIds((prev) => prev.includes(nextId) ? prev : [...prev, nextId]);
      }
      step += 1;
      if (step >= billsSequence.length) {
        clearInterval(intervalId);
      }
    }, 1800);

    return () => clearInterval(intervalId);
  }, [billsSequence, showBillsPaying]);

  // Determine if right panel should be visible
  const hasContent = invoiceData || showReport || showReconcile || showBillsPaying;

  return (
    <div className="h-[95vh] w-full rounded-3xl shadow-lg overflow-hidden transition-all duration-300 relative">
      <ChatKit control={chatkit.control} className="h-full w-full" />
      
      {/* Reconciliation Overlay */}
      {showReconcile && (
        <div 
          className="absolute inset-0 z-50 flex flex-col"
          style={{ 
            background: `linear-gradient(135deg, ${WARM_COLORS.cream} 0%, ${WARM_COLORS.sand} 100%)`,
            animation: 'slide-up 1.5s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Keyframe animations */}
          <style>{`
            @keyframes slide-up {
              0% {
                transform: translateY(100%);
                opacity: 0;
              }
              100% {
                transform: translateY(0);
                opacity: 1;
              }
            }
            @keyframes pulse-glow {
              0% {
                box-shadow: 0 0 0px ${withOpacity(WARM_COLORS.sage, "00")}, 0 0 0 1px ${withOpacity(WARM_COLORS.sage, "40")};
              }
              50% {
                box-shadow: 0 0 16px ${withOpacity(WARM_COLORS.sage, "35")}, 0 0 0 2px ${WARM_COLORS.sage};
              }
              100% {
                box-shadow: 0 0 12px ${withOpacity(WARM_COLORS.sage, "25")}, 0 0 0 2px ${WARM_COLORS.sage};
              }
            }
            @keyframes pulse-glow-inset {
              0% {
                box-shadow: inset 0 0 0px ${withOpacity(WARM_COLORS.sage, "00")};
              }
              50% {
                box-shadow: inset 0 0 16px ${withOpacity(WARM_COLORS.sage, "25")};
              }
              100% {
                box-shadow: inset 0 0 12px ${withOpacity(WARM_COLORS.sage, "20")};
              }
            }
          `}</style>
          
          {/* Header */}
          <div 
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: WARM_COLORS.stone }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: withOpacity(WARM_COLORS.sage, "20") }}
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke={WARM_COLORS.sage} 
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: WARM_COLORS.gray800 }}>
                  Bank Reconciliation
                </h2>
                <p className="text-sm" style={{ color: WARM_COLORS.gray700 }}>
                  Matching transactions to your chart of accounts
                </p>
              </div>
            </div>
            
            {/* Progress indicator */}
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium" style={{ color: WARM_COLORS.gray700 }}>
                  {reconciledIds.length} of {reconciliationTransactions.length} matched
                </span>
                <div 
                  className="w-32 h-2 rounded-full overflow-hidden mt-1"
                  style={{ backgroundColor: WARM_COLORS.stone }}
                >
                  <div 
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ 
                      width: `${reconciliationProgress}%`,
                      backgroundColor: WARM_COLORS.sage 
                    }}
                  />
                </div>
              </div>
              
              <button
                onClick={() => setShowReconcile(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke={WARM_COLORS.gray700} viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Main content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Bank Transactions */}
            <div className="w-1/2 p-6 overflow-y-auto border-r" style={{ borderColor: WARM_COLORS.stone }}>
              <h3 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: WARM_COLORS.gray700 }}>
                Bank Transactions
              </h3>
              <div className="space-y-2">
                {reconciliationTransactions.map((tx) => {
                  const isReconciled = reconciledIds.includes(tx.id);
                  const isActive = activeTransactionId === tx.id;
                  const isJustMatched = justMatchedId === tx.id;
                  
                  return (
                    <div
                      key={tx.id}
                      className={`p-4 rounded-xl border transition-all duration-500 ease-out ${
                        isJustMatched ? "scale-[1.01]" : ""
                      }`}
                      style={{
                        backgroundColor: isJustMatched
                          ? withOpacity(WARM_COLORS.sage, "12")
                          : isReconciled 
                            ? withOpacity(WARM_COLORS.sage, "08") 
                            : "white",
                        borderColor: isJustMatched
                          ? WARM_COLORS.sage
                          : isActive 
                            ? WARM_COLORS.sage 
                            : isReconciled 
                              ? withOpacity(WARM_COLORS.sage, "40")
                              : WARM_COLORS.stone,
                        animation: isJustMatched ? 'pulse-glow 0.8s ease-out' : undefined,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Status indicator */}
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 ease-out"
                            style={{ 
                              backgroundColor: isReconciled || isJustMatched
                                ? WARM_COLORS.sage 
                                : WARM_COLORS.stone,
                            }}
                          >
                            {(isReconciled || isJustMatched) && (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          
                          <div>
                            <p className="font-medium" style={{ color: WARM_COLORS.gray800 }}>
                              {tx.vendor}
                            </p>
                            <p className="text-xs" style={{ color: WARM_COLORS.gray700 }}>
                              {tx.type} • {tx.date}
                            </p>
                          </div>
                        </div>
                        
                        <span 
                          className="font-semibold tabular-nums"
                          style={{ 
                            color: tx.amount > 0 ? WARM_COLORS.sage : WARM_COLORS.gray800 
                          }}
                        >
                          {tx.amount > 0 ? "+" : ""}${Math.abs(tx.amount).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Right: Chart of Accounts */}
            <div className="w-1/2 p-6 overflow-y-auto">
              <h3 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: WARM_COLORS.gray700 }}>
                Chart of Accounts
              </h3>
              <div className="space-y-4">
                {chartOfAccounts.map((section) => {
                  const sectionBalance = getSectionBalance(section.children as Array<{ id?: string }>);
                  
                  return (
                    <div 
                      key={section.name}
                      className="rounded-xl border overflow-hidden"
                      style={{ 
                        backgroundColor: "white",
                        borderColor: WARM_COLORS.stone 
                      }}
                    >
                      {/* Section header */}
                      <div 
                        className="px-4 py-3 flex items-center justify-between"
                        style={{ backgroundColor: withOpacity(WARM_COLORS.primary, "08") }}
                      >
                        <span className="font-semibold" style={{ color: WARM_COLORS.gray800 }}>
                          {section.name}
                        </span>
                        <span 
                          className="font-semibold tabular-nums transition-all duration-300"
                          style={{ color: sectionBalance > 0 ? WARM_COLORS.sage : WARM_COLORS.gray700 }}
                        >
                          ${sectionBalance.toLocaleString()}
                        </span>
                      </div>
                      
                      {/* Account items */}
                      <div className="divide-y" style={{ borderColor: WARM_COLORS.stone }}>
                        {section.children.map((account) => {
                          const accountBalance = getAccountBalance(account.id);
                          const isLinked = account.id && reconciledIds.includes(account.id);
                          const isJustMatched = account.id && justMatchedId === account.id;
                          
                          return (
                            <div
                              key={account.name}
                              className="px-4 py-3 flex items-center justify-between transition-all duration-500 ease-out"
                              style={{
                                backgroundColor: isJustMatched
                                  ? withOpacity(WARM_COLORS.sage, "12")
                                  : isLinked 
                                    ? withOpacity(WARM_COLORS.sage, "06") 
                                    : "transparent",
                                animation: isJustMatched ? 'pulse-glow-inset 0.8s ease-out' : undefined,
                              }}
                            >
                              <div className="flex items-center gap-2">
                                {(isLinked || isJustMatched) && (
                                  <div 
                                    className="w-4 h-4 rounded-full flex items-center justify-center transition-all duration-500 ease-out"
                                    style={{ backgroundColor: WARM_COLORS.sage }}
                                  >
                                    <svg 
                                      className="w-2.5 h-2.5 text-white" 
                                      fill="none" 
                                      stroke="currentColor" 
                                      viewBox="0 0 24 24" 
                                      strokeWidth={3}
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                )}
                                <span 
                                  className="text-sm transition-all duration-500 ease-out"
                                  style={{ 
                                    color: isLinked || isJustMatched ? WARM_COLORS.gray800 : WARM_COLORS.gray700,
                                    fontWeight: isLinked || isJustMatched ? 500 : 400
                                  }}
                                >
                                  {account.name}
                                </span>
                              </div>
                              <span 
                                className="text-sm tabular-nums transition-all duration-500 ease-out"
                                style={{ 
                                  color: accountBalance > 0 || isJustMatched ? WARM_COLORS.sage : WARM_COLORS.gray700,
                                  fontWeight: accountBalance > 0 || isJustMatched ? 600 : 400,
                                }}
                              >
                                ${accountBalance.toLocaleString()}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div 
            className="px-6 py-4 border-t flex items-center justify-between"
            style={{ 
              borderColor: WARM_COLORS.stone,
              backgroundColor: "white" 
            }}
          >
            <div className="flex items-center gap-2">
              {reconciliationProgress === 100 ? (
                <>
                  <svg className="w-5 h-5" fill={WARM_COLORS.sage} viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium" style={{ color: WARM_COLORS.sage }}>
                    All transactions reconciled!
                  </span>
                </>
              ) : (
                <>
                  <div 
                    className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: `${WARM_COLORS.primary} transparent ${WARM_COLORS.primary} ${WARM_COLORS.primary}` }}
                  />
                  <span className="text-sm" style={{ color: WARM_COLORS.gray700 }}>
                    Reconciling transactions...
                  </span>
                </>
              )}
            </div>
            
            <button
              onClick={() => setShowReconcile(false)}
              className="px-4 py-2 rounded-lg font-medium transition-colors hover:opacity-90"
              style={{ 
                backgroundColor: reconciliationProgress === 100 ? WARM_COLORS.sage : WARM_COLORS.stone,
                color: reconciliationProgress === 100 ? "white" : WARM_COLORS.gray700
              }}
            >
              {reconciliationProgress === 100 ? "Done" : "Cancel"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
