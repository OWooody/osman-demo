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
        density: "normal",
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
                  let successMessage = "✓ Action completed successfully";
                  if (action.type === "request.submit") {
                    successMessage = "✓ Thanks";
                    

                    
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

    let step = 0;
    const intervalId = setInterval(() => {
      const nextId = reconciliationSequence[step];
      if (nextId) {
        setReconciledIds((prev) =>
          prev.includes(nextId) ? prev : [...prev, nextId]
        );
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
    <div
      className="h-[95vh] w-full max-w-2xl rounded-3xl shadow-lg transition-all duration-300"
      style={{
        background: WARM_COLORS.cream,
        boxShadow: '0 4px 24px rgba(45, 42, 37, 0.08), 0 1px 3px rgba(45, 42, 37, 0.04)',
      }}
    >
      <ChatKit control={chatkit.control} className="h-full w-full" />
    </div>
  );
}
