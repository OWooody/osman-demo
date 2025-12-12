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
    <div className="flex h-[95vh] w-full gap-5">
      {/* Left Panel - ChatKit - Warm, rounded container */}
      <div
        className="flex-1 rounded-3xl shadow-lg transition-all duration-300"
        style={{
          background: WARM_COLORS.cream,
          boxShadow: '0 4px 24px rgba(45, 42, 37, 0.08), 0 1px 3px rgba(45, 42, 37, 0.04)',
        }}
      >
        <ChatKit control={chatkit.control} className="h-full w-full" />
      </div>

      {/* Right Panel - Organic, warm aesthetic */}
      {hasContent ? (
        <div
          className="flex-1 transition-all duration-500 pt-6 px-6 overflow-visible panel-slide-in"
          style={{
            fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
            background: 'transparent',
          }}
        >
        {invoiceData ? (
          <div className="h-full flex flex-col overflow-y-auto p-4 pb-6 -ml-4">
            {/* Invoice Details - Warm, Friendly Design */}
            <div
              className="invoice-container animate-in flex-1 p-8 my-4"
              style={{
                background: WARM_COLORS.cream,
                boxShadow: '0 8px 32px rgba(45, 42, 37, 0.1), 0 2px 8px rgba(45, 42, 37, 0.05)',
                borderRadius: '24px',
              }}
            >
              <div className="max-w-2xl">
                {/* Invoice Header - Warm accent bar */}
                <div
                  className="mb-8 pb-6"
                  style={{ borderBottom: `2px solid ${WARM_COLORS.stone}` }}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h1
                        className="text-3xl font-bold mb-2"
                        style={{ color: WARM_COLORS.gray800 }}
                      >
                        Invoice
                      </h1>
                      <div className="text-sm" style={{ color: WARM_COLORS.gray700 }}>
                        <div>
                          Invoice Number:{' '}
                          <span className="font-semibold" style={{ color: WARM_COLORS.gray800 }}>
                            {invoiceData.invoiceNumber || 'INV-2025-001'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      className="text-right px-4 py-2 rounded-2xl"
                      style={{ background: WARM_COLORS.goldLight }}
                    >
                      <div className="text-xs mb-0.5" style={{ color: WARM_COLORS.gray700 }}>
                        Date
                      </div>
                      <div className="text-sm font-semibold" style={{ color: WARM_COLORS.gray800 }}>
                        {invoiceData.date || invoiceData.invoiceDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div
                      className="p-4 rounded-xl"
                      style={{ background: WARM_COLORS.sand }}
                    >
                      <div
                        className="text-xs uppercase tracking-wider mb-2"
                        style={{ color: WARM_COLORS.primary }}
                      >
                        Bill From
                      </div>
                      <div className="text-sm font-semibold" style={{ color: WARM_COLORS.gray800 }}>
                        Your Company Name
                      </div>
                      <div className="text-sm" style={{ color: WARM_COLORS.gray700 }}>
                        123 Business Street
                      </div>
                      <div className="text-sm" style={{ color: WARM_COLORS.gray700 }}>
                        City, State 12345
                      </div>
                    </div>
                    <div
                      className="p-4 rounded-xl"
                      style={{ background: WARM_COLORS.sand }}
                    >
                      <div
                        className="text-xs uppercase tracking-wider mb-2"
                        style={{ color: WARM_COLORS.sage }}
                      >
                        Bill To
                      </div>
                      <div className="text-sm font-semibold" style={{ color: WARM_COLORS.gray800 }}>
                        {invoiceData.client || invoiceData.clientName || 'Acme Corporation'}
                      </div>
                      <div className="text-sm" style={{ color: WARM_COLORS.gray700 }}>
                        Client Address
                      </div>
                      <div className="text-sm" style={{ color: WARM_COLORS.gray700 }}>
                        City, State ZIP
                      </div>
                    </div>
                  </div>
                </div>

                {/* Line Items Table - Soft styling */}
                <div className="mb-8">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${WARM_COLORS.stone}` }}>
                        <th
                          className="text-left py-3 px-4 text-xs uppercase tracking-wider font-semibold"
                          style={{ color: WARM_COLORS.gray700 }}
                        >
                          Description
                        </th>
                        <th
                          className="text-center py-3 px-4 text-xs uppercase tracking-wider font-semibold"
                          style={{ color: WARM_COLORS.gray700 }}
                        >
                          Qty
                        </th>
                        <th
                          className="text-right py-3 px-4 text-xs uppercase tracking-wider font-semibold"
                          style={{ color: WARM_COLORS.gray700 }}
                        >
                          Rate
                        </th>
                        <th
                          className="text-right py-3 px-4 text-xs uppercase tracking-wider font-semibold"
                          style={{ color: WARM_COLORS.gray700 }}
                        >
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(invoiceData.items || invoiceData.lineItems || [
                        { description: 'Web Development Services', quantity: 40, rate: 250, amount: 10000 },
                        { description: 'UI/UX Design', quantity: 20, rate: 125, amount: 2500 }
                      ]).map((item: any, index: number) => (
                        <tr
                          key={index}
                          className="table-row-hover"
                          style={{
                            borderBottom: `1px solid ${WARM_COLORS.stone}`,
                            background: index % 2 === 0 ? 'transparent' : WARM_COLORS.sand,
                          }}
                        >
                          <td className="py-4 px-4 text-sm" style={{ color: WARM_COLORS.gray800 }}>
                            {item.description || item.name}
                          </td>
                          <td className="py-4 px-4 text-sm text-center" style={{ color: WARM_COLORS.gray700 }}>
                            {item.quantity || '-'}
                          </td>
                          <td className="py-4 px-4 text-sm text-right" style={{ color: WARM_COLORS.gray700 }}>
                            {item.currency || 'SAR'} {(item.rate || 0).toLocaleString()}
                          </td>
                          <td className="py-4 px-4 text-sm font-semibold text-right" style={{ color: WARM_COLORS.gray800 }}>
                            {item.currency || 'SAR'} {(item.amount || item.price || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Section - Warm highlight */}
                <div className="flex justify-end mb-8">
                  <div
                    className="w-72 p-4 rounded-2xl"
                    style={{ background: WARM_COLORS.sand }}
                  >
                    <div className="flex justify-between py-2 text-sm" style={{ color: WARM_COLORS.gray700 }}>
                      <span>Subtotal:</span>
                      <span>{invoiceData.currency || 'SAR'} {((invoiceData.amount || invoiceData.total || invoiceData.totalAmount || 12500) * 0.95).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 text-sm" style={{ color: WARM_COLORS.gray700 }}>
                      <span>Tax (5%):</span>
                      <span>{invoiceData.currency || 'SAR'} {((invoiceData.amount || invoiceData.total || invoiceData.totalAmount || 12500) * 0.05).toLocaleString()}</span>
                    </div>
                    <div
                      className="flex justify-between py-4 mt-2"
                      style={{ borderTop: `2px solid ${WARM_COLORS.stone}` }}
                    >
                      <span className="text-lg font-bold" style={{ color: WARM_COLORS.gray800 }}>
                        Total:
                      </span>
                      <span
                        className="text-2xl font-bold"
                        style={{ color: WARM_COLORS.primary }}
                      >
                        <AnimatedNumber
                          value={invoiceData.amount || invoiceData.total || invoiceData.totalAmount || 12500}
                          prefix={`${invoiceData.currency || 'SAR'} `}
                          duration={800}
                        />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Terms - Friendly footer */}
                <div
                  className="pt-6 px-4 py-4 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${withOpacity(WARM_COLORS.sageLight, '20')}, ${withOpacity(WARM_COLORS.goldLight, '30')})`,
                    borderTop: `1px solid ${WARM_COLORS.stone}`,
                  }}
                >
                  <div className="text-xs uppercase tracking-wider mb-2" style={{ color: WARM_COLORS.sage }}>
                    Payment Terms
                  </div>
                  <div className="text-sm" style={{ color: WARM_COLORS.gray700 }}>
                    Payment due by:{' '}
                    <span className="font-semibold" style={{ color: WARM_COLORS.gray800 }}>
                      {invoiceData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="text-sm mt-3" style={{ color: WARM_COLORS.primary }}>
                    ✨ Thank you for your business!
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : showReport ? (
          <div className="h-full flex flex-col overflow-hidden -ml-10 -mr-6">
            {/* Header Section - Warm styling */}
            <div className="flex-shrink-0 flex items-start justify-between mb-6 pl-10 pr-6 report-fade-in">
              <div className="flex-1">
                <h2
                  className="text-xl font-semibold mb-2"
                  style={{ color: WARM_COLORS.gray800 }}
                >
                  Profit & Loss
                </h2>
                <div
                  className="text-4xl font-bold mb-1"
                  style={{ color: WARM_COLORS.primary }}
                >
                  <AnimatedNumber value={currentProfit} duration={1000} />
                </div>
                <div
                  className="text-sm font-medium flex items-center gap-2"
                  style={{ color: WARM_COLORS.sage }}
                >
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
                    style={{
                      background: profitChange >= 0 ? withOpacity(WARM_COLORS.sageLight, '40') : withOpacity(WARM_COLORS.primaryLight, '40'),
                      color: profitChange >= 0 ? WARM_COLORS.sageDark : WARM_COLORS.primaryDark,
                    }}
                  >
                    {profitChange >= 0 ? '↑' : '↓'} {Math.abs(profitChange).toFixed(1)}%
                  </span>
                  <span style={{ color: WARM_COLORS.gray700 }}>
                    vs {previousMonth.month} 2025
                  </span>
                </div>
              </div>
              <div
                className="px-4 py-2 rounded-2xl text-sm font-medium"
                style={{
                  background: WARM_COLORS.goldLight,
                  color: WARM_COLORS.gray800,
                }}
              >
                Dec 2025
              </div>
            </div>

            {/* Chart Section with Warm Gradient */}
            <div className="flex-1 min-h-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={profitLossData}
                  margin={{ top: 0, right: 0, left: -20, bottom: -50 }}
                >
                  <defs>
                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={WARM_COLORS.primary} stopOpacity={0.35} />
                      <stop offset="50%" stopColor={WARM_COLORS.primaryLight} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={WARM_COLORS.gold} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={WARM_COLORS.stone}
                    horizontal={true}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={false}
                  />
                  <YAxis
                    width={0}
                    axisLine={false}
                    tickLine={false}
                    tick={false}
                    domain={[0, 'auto']}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke={WARM_COLORS.primary}
                    strokeWidth={3}
                    fill="url(#profitGradient)"
                    baseValue={0}
                    isAnimationActive={true}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>

              {/* Footer Section - Warm card overlay */}
              <div
                className="absolute bottom-0 left-0 right-0 pl-10 pr-6 pb-6 pt-4 report-fade-in"
                style={{
                  background: `linear-gradient(to top, ${WARM_COLORS.cream} 70%, transparent)`,
                }}
              >
                <div
                  className="p-4 rounded-2xl"
                  style={{
                    background: WARM_COLORS.sand,
                    boxShadow: '0 -4px 20px rgba(45, 42, 37, 0.05)',
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ background: WARM_COLORS.sage }}
                      />
                      <span className="text-sm" style={{ color: WARM_COLORS.gray700 }}>
                        Revenue
                      </span>
                    </div>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: WARM_COLORS.gray800 }}
                    >
                      SAR {currentRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ background: WARM_COLORS.primaryLight }}
                      />
                      <span className="text-sm" style={{ color: WARM_COLORS.gray700 }}>
                        Expenses
                      </span>
                    </div>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: WARM_COLORS.gray800 }}
                    >
                      SAR {currentExpenses.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : showReconcile ? (
          <div className="h-full flex flex-col overflow-hidden space-y-4 -ml-4 pb-6 reconcile-fade-in">
            {/* Header - Warm styling */}
            <div className="flex items-start justify-between">
              <div>
                <h2
                  className="text-2xl font-semibold"
                  style={{ color: WARM_COLORS.gray800 }}
                >
                  Matching transactions
                </h2>
                <p className="text-sm mt-1" style={{ color: WARM_COLORS.gray700 }}>
                  Auto-matching with your chart of accounts
                </p>
              </div>
              <div
                className="px-4 py-2 rounded-2xl text-sm font-semibold flex items-center gap-2"
                style={{
                  background: `linear-gradient(135deg, ${withOpacity(WARM_COLORS.primaryLight, '30')}, ${withOpacity(WARM_COLORS.goldLight, '50')})`,
                  color: WARM_COLORS.primary,
                  border: `1px solid ${withOpacity(WARM_COLORS.primaryLight, '40')}`,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ background: WARM_COLORS.primary }}
                />
                <AnimatedNumber value={Math.round(reconciliationProgress)} duration={400} suffix="% complete" />
              </div>
            </div>

            {/* Two panel layout - Warm cards */}
            <div className="grid grid-cols-2 gap-5 flex-1 min-h-0">
              {/* Transactions Panel */}
              <div
                className="rounded-2xl p-5 flex flex-col overflow-hidden"
                style={{
                  background: WARM_COLORS.sand,
                  border: `1px solid ${WARM_COLORS.stone}`,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold" style={{ color: WARM_COLORS.gray800 }}>
                    Transactions
                  </span>
                  <span
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ background: WARM_COLORS.stone, color: WARM_COLORS.gray700 }}
                  >
                    Bank feed
                  </span>
                </div>
                <div className="flex-1 overflow-auto space-y-2 stagger-children">
                  {reconciliationTransactions.map((tx, index) => {
                    const isMatched = reconciledIds.includes(tx.id);
                    const isActive = activeTransactionId === tx.id && !isMatched;
                    return (
                      <div
                        key={tx.id}
                        className={`flex items-center justify-between rounded-xl px-4 py-3 transition-all duration-300 ${
                          isMatched
                            ? "reconcile-matched"
                            : isActive
                            ? "reconcile-active"
                            : ""
                        }`}
                        style={{
                          background: isMatched
                            ? withOpacity(WARM_COLORS.sageLight, '30')
                            : isActive
                            ? withOpacity(WARM_COLORS.primaryLight, '20')
                            : WARM_COLORS.cream,
                          border: `1px solid ${
                            isMatched
                              ? WARM_COLORS.sage
                              : isActive
                              ? WARM_COLORS.primary
                              : WARM_COLORS.stone
                          }`,
                          boxShadow: isActive
                            ? `0 4px 16px ${withOpacity(WARM_COLORS.primary, '20')}`
                            : '0 1px 3px rgba(45, 42, 37, 0.05)',
                          animationDelay: `${index * 50}ms`,
                        }}
                      >
                        <div>
                          <div
                            className="text-sm font-semibold"
                            style={{ color: WARM_COLORS.gray800 }}
                          >
                            {tx.vendor}
                          </div>
                          <div
                            className="text-xs uppercase tracking-wider"
                            style={{ color: WARM_COLORS.gray700 }}
                          >
                            {tx.type}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs" style={{ color: WARM_COLORS.gray700 }}>
                            {tx.date}
                          </div>
                          <div
                            className="text-sm font-semibold"
                            style={{
                              color: tx.amount >= 0 ? WARM_COLORS.sage : WARM_COLORS.gray800,
                            }}
                          >
                            {tx.amount >= 0 ? '+' : ''}
                            {tx.amount.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chart of Accounts Panel */}
              <div
                className="rounded-2xl p-5 flex flex-col overflow-hidden"
                style={{
                  background: WARM_COLORS.sand,
                  border: `1px solid ${WARM_COLORS.stone}`,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold" style={{ color: WARM_COLORS.gray800 }}>
                    Chart of Accounts
                  </span>
                  <span
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ background: WARM_COLORS.stone, color: WARM_COLORS.gray700 }}
                  >
                    Mapping
                  </span>
                </div>
                <div className="flex-1 overflow-auto space-y-3">
                  {chartOfAccounts.map((section) => {
                    const sectionTotal = getSectionBalance(section.children || []);
                    return (
                      <div
                        key={section.name}
                        className="rounded-xl overflow-hidden"
                        style={{
                          background: WARM_COLORS.cream,
                          border: `1px solid ${WARM_COLORS.stone}`,
                        }}
                      >
                        <div
                          className="flex items-center justify-between px-4 py-3"
                          style={{
                            background: WARM_COLORS.sand,
                            borderBottom: `1px solid ${WARM_COLORS.stone}`,
                          }}
                        >
                          <div
                            className="text-sm font-semibold"
                            style={{ color: WARM_COLORS.gray800 }}
                          >
                            {section.name}
                          </div>
                          <div
                            className="text-sm font-semibold transition-all duration-300"
                            style={{
                              color: sectionTotal > 0 ? WARM_COLORS.sage : WARM_COLORS.gray700,
                            }}
                          >
                            ${sectionTotal.toLocaleString()}
                          </div>
                        </div>
                        {section.children && (
                          <div>
                            {section.children.map((child, childIndex) => {
                              const isMatched = child.id && reconciledIds.includes(child.id);
                              const isActive = child.id && activeTransactionId === child.id && !isMatched;
                              const childBalance = getAccountBalance(child.id);
                              return (
                                <div
                                  key={child.name}
                                  className={`flex items-center justify-between px-4 py-2.5 text-sm transition-all duration-300 ${
                                    isMatched ? 'reconcile-matched' : isActive ? 'reconcile-active' : ''
                                  }`}
                                  style={{
                                    background: isMatched
                                      ? withOpacity(WARM_COLORS.sageLight, '25')
                                      : isActive
                                      ? withOpacity(WARM_COLORS.primaryLight, '15')
                                      : 'transparent',
                                    borderBottom:
                                      childIndex < (section.children?.length ?? 0) - 1
                                        ? `1px solid ${withOpacity(WARM_COLORS.stone, '50')}`
                                        : 'none',
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                                      style={{
                                        background: isMatched ? WARM_COLORS.sage : WARM_COLORS.stone,
                                        color: isMatched ? 'white' : WARM_COLORS.gray700,
                                      }}
                                    >
                                      {isMatched ? '✓' : '›'}
                                    </span>
                                    <span style={{ color: isMatched ? WARM_COLORS.sageDark : WARM_COLORS.gray700 }}>
                                      {child.name}
                                    </span>
                                  </div>
                                  <span
                                    className={`font-medium transition-all duration-300 ${
                                      childBalance > 0 ? 'balance-pop' : ''
                                    }`}
                                    style={{
                                      color: childBalance > 0 ? WARM_COLORS.sage : WARM_COLORS.gray700,
                                    }}
                                  >
                                    ${childBalance.toLocaleString()}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : showBillsPaying ? (
          <div className="h-full flex flex-col -ml-4 pb-6">
            {/* Bank Card Header - Warm gradient */}
            <div
              className="rounded-3xl p-6 mb-6 max-w-[340px] aspect-[1.586/1] flex flex-col"
              style={{
                background: `linear-gradient(135deg, ${WARM_COLORS.gray800} 0%, ${WARM_COLORS.gray700} 50%, ${withOpacity(WARM_COLORS.primaryDark, '40')} 100%)`,
                boxShadow: '0 12px 40px rgba(45, 42, 37, 0.2), 0 4px 12px rgba(45, 42, 37, 0.1)',
              }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p
                    className="text-[10px] font-medium tracking-wider uppercase"
                    style={{ color: WARM_COLORS.goldLight }}
                  >
                    Paying from
                  </p>
                  <p className="text-white text-sm font-semibold mt-0.5">Business Account</p>
                </div>
                <div className="flex gap-1">
                  <div
                    className="w-7 h-7 rounded-full"
                    style={{ background: WARM_COLORS.primary, opacity: 0.9 }}
                  />
                  <div
                    className="w-7 h-7 rounded-full -ml-3"
                    style={{ background: WARM_COLORS.gold, opacity: 0.9 }}
                  />
                </div>
              </div>
              <div className="space-y-0.5 mt-4">
                <p className="text-[10px]" style={{ color: WARM_COLORS.goldLight }}>
                  Available Balance
                </p>
                <p className="text-white text-2xl font-semibold tracking-tight">
                  <AnimatedNumber
                    value={52840.00 - paidAmount}
                    prefix="SAR "
                    decimals={2}
                    duration={600}
                  />
                </p>
              </div>
              <div className="mt-auto pt-3 flex items-center justify-between">
                <p className="text-xs tracking-widest" style={{ color: WARM_COLORS.stone }}>
                  •••• 4892
                </p>
                <p className="text-[10px]" style={{ color: WARM_COLORS.goldLight }}>
                  Corporate Bank
                </p>
              </div>
            </div>

            {/* Payment Summary - Warm styling */}
            <div className="flex items-center justify-between mb-4 px-1">
              <div>
                <p
                  className="text-xs uppercase tracking-wider"
                  style={{ color: WARM_COLORS.gray700 }}
                >
                  Total Payment
                </p>
                <p
                  className="text-2xl font-bold"
                  style={{ color: WARM_COLORS.gray800 }}
                >
                  SAR {totalBillsAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right">
                <p
                  className="text-xs uppercase tracking-wider"
                  style={{ color: WARM_COLORS.gray700 }}
                >
                  Status
                </p>
                <p
                  className="text-sm font-semibold"
                  style={{
                    color: paidBillIds.length === billsToPay.length
                      ? WARM_COLORS.sage
                      : WARM_COLORS.gold,
                  }}
                >
                  {paidBillIds.length === billsToPay.length
                    ? '✓ Complete'
                    : `${paidBillIds.length} of ${billsToPay.length}`}
                </p>
              </div>
            </div>

            {/* Progress Line - Warm gradient */}
            <div
              className="h-2 rounded-full mb-6 overflow-hidden"
              style={{ background: WARM_COLORS.stone }}
            >
              <div
                className="h-full rounded-full transition-all duration-700 ease-out progress-shimmer"
                style={{
                  width: `${(paidBillIds.length / billsToPay.length) * 100}%`,
                  background: `linear-gradient(90deg, ${WARM_COLORS.sage}, ${WARM_COLORS.sageLight})`,
                }}
              />
            </div>

            {/* Bills List - Warm cards */}
            <div className="flex-1 overflow-auto space-y-3 stagger-children">
              {billsToPay.map((bill, index) => {
                const isPaid = paidBillIds.includes(bill.id);
                const isProcessing = !isPaid && paidBillIds.length === index;
                return (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between p-4 rounded-2xl transition-all duration-500"
                    style={{
                      background: isPaid
                        ? withOpacity(WARM_COLORS.sageLight, '30')
                        : isProcessing
                        ? WARM_COLORS.cream
                        : WARM_COLORS.sand,
                      border: `1px solid ${
                        isPaid
                          ? WARM_COLORS.sage
                          : isProcessing
                          ? WARM_COLORS.primary
                          : WARM_COLORS.stone
                      }`,
                      boxShadow: isProcessing
                        ? `0 8px 24px ${withOpacity(WARM_COLORS.primary, '15')}`
                        : '0 2px 8px rgba(45, 42, 37, 0.04)',
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500"
                        style={{
                          background: isPaid
                            ? WARM_COLORS.sage
                            : isProcessing
                            ? WARM_COLORS.primary
                            : WARM_COLORS.stone,
                        }}
                      >
                        {isPaid ? (
                          <svg className="w-5 h-5 text-white checkmark-draw scale-pop" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : isProcessing ? (
                          <div
                            className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                            style={{ borderColor: `white transparent transparent transparent` }}
                          />
                        ) : (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{ color: WARM_COLORS.gray700 }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p
                          className="font-semibold transition-colors duration-300"
                          style={{
                            color: isPaid ? WARM_COLORS.sageDark : WARM_COLORS.gray800,
                          }}
                        >
                          {bill.vendor}
                        </p>
                        <p className="text-sm" style={{ color: WARM_COLORS.gray700 }}>
                          {bill.account}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className="font-bold tabular-nums transition-colors duration-300"
                        style={{
                          color: isPaid
                            ? WARM_COLORS.sage
                            : isProcessing
                            ? WARM_COLORS.primary
                            : WARM_COLORS.gray800,
                        }}
                      >
                        SAR {bill.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p
                        className="text-xs font-medium transition-colors duration-300"
                        style={{
                          color: isPaid
                            ? WARM_COLORS.sage
                            : isProcessing
                            ? WARM_COLORS.primary
                            : WARM_COLORS.gray700,
                        }}
                      >
                        {isPaid ? 'Paid ✓' : isProcessing ? 'Processing...' : 'Pending'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
        </div>
      ) : (
        <div className="flex-1 relative overflow-hidden pb-6 rounded-3xl">
          <DotGridBackground />
        </div>
      )}
    </div>
  );
}
