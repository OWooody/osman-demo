import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { ChatKit, useChatKit } from "@openai/chatkit-react";
import type { ChatKitOptions } from "@openai/chatkit-react";
import { createClientSecretFetcher, workflowId } from "../lib/chatkitSession";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { AnimatedNumber } from "./shared/AnimatedNumber";
import { DotGridBackground } from "./DotGridBackground";
import { useDropzone } from "react-dropzone";

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

// File upload types
interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'complete';
}

// Language type
type Language = 'ar' | 'en';

// i18n content
const i18n = {
  ar: {
    placeholder: 'اكتب رسالتك هنا...',
    greeting: 'كيف يمكنني مساعدتك اليوم؟',
    zatcaTool: { label: 'وضع زاتكا', shortLabel: 'زاتكا', placeholder: 'اسأل أي شيء عن زاتكا' },
    searchTool: { label: 'البحث في المستندات', shortLabel: 'المستندات', placeholder: 'البحث في الوثائق' },
    reportTool: { label: 'إنشاء تقرير', shortLabel: 'تقرير', placeholder: 'إنشاء تقرير الأرباح والخسائر' },
    prompts: {
      reconcile: { label: 'مطابقة حسابي البنكي', prompt: 'مطابقة حسابي البنكي' },
      bills: { label: 'تتبع فواتيري ومواعيد استحقاقها', prompt: 'تتبع فواتيري ومواعيد استحقاقها' },
      report: { label: 'إنشاء تقرير الأرباح والخسائر', prompt: 'إنشاء تقرير الأرباح والخسائر' },
    },
    fontFamily: '"IBM Plex Sans Arabic", "Plus Jakarta Sans", system-ui, sans-serif',
  },
  en: {
    placeholder: 'Type your message...',
    greeting: 'How can I help you today?',
    zatcaTool: { label: 'Zatca Mode', shortLabel: 'Zatca', placeholder: 'Ask anything about Zatca' },
    searchTool: { label: 'Search docs', shortLabel: 'Docs', placeholder: 'Search documentation' },
    reportTool: { label: 'Generate report', shortLabel: 'Report', placeholder: 'Generate profit and loss report' },
    prompts: {
      reconcile: { label: 'Reconcile my bank account', prompt: 'Reconcile my bank account' },
      bills: { label: 'Track my bills and due dates', prompt: 'Track my bills and due dates' },
      report: { label: 'Generate a profit and loss report', prompt: 'Generate a profit and loss report' },
    },
    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
  },
};

export function ChatKitPanel() {
  const [language, setLanguage] = useState<Language>('ar');
  const [showReport, setShowReport] = useState(false); // TODO: set back to false when done
  const [showReconcile, setShowReconcile] = useState(false);
  const [showBillsPaying, setShowBillsPaying] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(false);
  const [reconciledIds, setReconciledIds] = useState<string[]>([]);
  const [paidBillIds, setPaidBillIds] = useState<string[]>([]);
  const [justMatchedId, setJustMatchedId] = useState<string | null>(null);
  const [isReconcileClosing, setIsReconcileClosing] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<UploadingFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const t = i18n[language];

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

  // Close reconcile overlay with animation
  const closeReconcile = () => {
    setIsReconcileClosing(true);
    setTimeout(() => {
      setShowReconcile(false);
      setIsReconcileClosing(false);
    }, 400);
  };

  const options: ChatKitOptions = useMemo(
    () => ({
      api: {
        getClientSecret,
      },
      locale: language,
      theme: {
        colorScheme: "light",
        radius: 'round',
        density: "spacious",
        color: {
          accent: {
            primary: WARM_COLORS.primary,
            level: 1,
          },
        },
        typography: {
          baseSize: 16,
          fontFamily: t.fontFamily,
          fontFamilyMono:
            '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSources: [
            {
              family: "IBM Plex Sans Arabic",
              src: "https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-sans-arabic@latest/arabic-400-normal.woff2",
              weight: 400,
              style: "normal",
              display: "swap",
            },
            {
              family: "IBM Plex Sans Arabic",
              src: "https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-sans-arabic@latest/arabic-600-normal.woff2",
              weight: 600,
              style: "normal",
              display: "swap",
            },
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
        placeholder: t.placeholder,
        attachments: { enabled: false },
        tools: [
          {
            id: 'create_theme',
            label: t.zatcaTool.label,
            shortLabel: t.zatcaTool.shortLabel,
            placeholderOverride: t.zatcaTool.placeholder,
            icon: 'book-open',
            pinned: true
          },
          {
            id: "search_docs",
            label: t.searchTool.label,
            shortLabel: t.searchTool.shortLabel,
            placeholderOverride: t.searchTool.placeholder,
            icon: "book-open",
            pinned: false,
          },
          {
            id: "generate_report",
            label: t.reportTool.label,
            shortLabel: t.reportTool.shortLabel,
            placeholderOverride: t.reportTool.placeholder,
            icon: "chart",
            pinned: false,
          },
        ],
      },
      startScreen: {
        greeting: t.greeting,
        prompts: [
          {
            icon: "check-circle",
            label: t.prompts.reconcile.label,
            prompt: t.prompts.reconcile.prompt,
          },
          {
            icon: "calendar",
            label: t.prompts.bills.label,
            prompt: t.prompts.bills.prompt,
          },
          {
            icon: "chart",
            label: t.prompts.report.label,
            prompt: t.prompts.report.prompt,
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
    [getClientSecret, language, t]
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

  // File helpers
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('spreadsheet') || mimeType.includes('csv')) return '📊';
    if (mimeType.includes('text')) return '📝';
    return '📎';
  };

  // Simulate file upload
  const simulateUpload = useCallback((file: File) => {
    setUploadingFile({ file, progress: 0, status: 'uploading' });
    
    const duration = 1500 + Math.random() * 1000;
    const start = Date.now();
    
    const tick = () => {
      const progress = Math.min(((Date.now() - start) / duration) * 100, 100);
      
      if (progress < 100) {
        setUploadingFile(prev => prev ? { ...prev, progress } : null);
        requestAnimationFrame(tick);
      } else {
        setUploadingFile(prev => prev ? { ...prev, progress: 100, status: 'processing' } : null);
        
        setTimeout(() => {
          setUploadingFile(prev => prev ? { ...prev, status: 'complete' } : null);
          
          setTimeout(() => {
            const ck = chatkitRef.current;
            console.log('📤 Sending message, chatkit ref:', ck);
            if (ck?.sendUserMessage) {
              const msg = `${getFileIcon(file.type)} I've uploaded multiple files, please process them. (${formatFileSize(file.size)})`;
              console.log('📤 Message:', msg);
              ck.sendUserMessage({ text: msg });
            } else {
              console.warn('⚠️ sendUserMessage not available');
            }
            setUploadingFile(null);
          }, 400);
        }, 500);
      }
    };
    
    requestAnimationFrame(tick);
  }, []);

  // Track dragging via document events (more reliable)
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault();
        setIsDragging(true);
        
        // Reset timeout on every dragover
        if (dragTimeoutRef.current) {
          clearTimeout(dragTimeoutRef.current);
        }
        // Hide after 150ms of no dragover events
        dragTimeoutRef.current = setTimeout(() => {
          setIsDragging(false);
        }, 150);
      }
    };
    
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      console.log('📥 Document drop detected');
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
      setIsDragging(false);
      
      // Handle files directly here
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        console.log('📁 Files from drop:', files[0].name);
        simulateUpload(files[0]);
      }
    };

    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);
    
    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
    };
  }, [simulateUpload]);

  // Dropzone for handling the actual drop
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (files) => {
      console.log('🎯 Files dropped:', files);
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
      setIsDragging(false);
      if (files.length > 0) {
        console.log('🎯 Starting upload simulation for:', files[0].name);
        simulateUpload(files[0]);
      }
    },
    noClick: true,
    noKeyboard: true,
  });

  const showDropIndicator = isDragging && !uploadingFile;

  return (
    <div className="h-[95vh] w-full rounded-3xl shadow-lg overflow-hidden transition-all duration-300 relative">
      <ChatKit control={chatkit.control} className="h-full w-full" />
      
      {/* Language Toggle Button */}
      <button
        onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
        className="absolute top-4 left-4 z-30 flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          backgroundColor: WARM_COLORS.cream,
          borderColor: WARM_COLORS.stone,
          color: WARM_COLORS.gray800,
          boxShadow: `0 2px 8px ${withOpacity(WARM_COLORS.gray800, "10")}`,
        }}
        title={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
      >
        <span className="text-lg">{language === 'ar' ? '🇬🇧' : '🇸🇦'}</span>
        <span className="text-sm font-medium">{language === 'ar' ? 'EN' : 'عربي'}</span>
      </button>
      
      {/* Dropzone layer - shows when dragging files */}
      {(isDragging || uploadingFile) && (
        <div
          {...getRootProps()}
          className="absolute inset-0 z-40 transition-all duration-200"
          style={{ 
            background: showDropIndicator ? withOpacity(WARM_COLORS.primary, "10") : 'transparent',
          }}
        >
        <input {...getInputProps()} />
        
        {/* Drop indicator */}
        {showDropIndicator && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="p-8 rounded-2xl border-2 border-dashed flex flex-col items-center gap-4"
              style={{ 
                borderColor: WARM_COLORS.primary,
                backgroundColor: withOpacity(WARM_COLORS.cream, "95"),
                boxShadow: `0 8px 32px ${withOpacity(WARM_COLORS.primary, "25")}`,
              }}
            >
              <div 
                className="w-16 h-16 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: withOpacity(WARM_COLORS.primary, "15") }}
              >
                <svg className="w-8 h-8" fill="none" stroke={WARM_COLORS.primary} viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg" style={{ color: WARM_COLORS.gray800 }}>Drop to upload</p>
                <p className="text-sm" style={{ color: WARM_COLORS.gray700 }}>PDF, images, or documents</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Upload progress */}
        {uploadingFile && (
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: withOpacity(WARM_COLORS.gray800, "25"), backdropFilter: 'blur(2px)' }}
          >
            <style>{`
              @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
              @keyframes pop { 0% { transform: scale(0); } 60% { transform: scale(1.1); } 100% { transform: scale(1); } }
            `}</style>
            <div 
              className="p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 min-w-[280px]"
              style={{ backgroundColor: WARM_COLORS.cream }}
            >
              <div 
                className="w-16 h-16 rounded-xl flex items-center justify-center"
                style={{ 
                  backgroundColor: uploadingFile.status === 'complete' 
                    ? withOpacity(WARM_COLORS.sage, "20") 
                    : withOpacity(WARM_COLORS.primary, "15"),
                  animation: uploadingFile.status === 'uploading' ? 'bounce 1s ease-in-out infinite' : undefined,
                }}
              >
                {uploadingFile.status === 'complete' ? (
                  <svg className="w-8 h-8" fill="none" stroke={WARM_COLORS.sage} viewBox="0 0 24 24" strokeWidth={2.5} style={{ animation: 'pop 0.3s ease-out' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" stroke={WARM_COLORS.primary} viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                )}
              </div>
              
              <div className="text-center">
                <p className="font-medium truncate max-w-[220px]" style={{ color: WARM_COLORS.gray800 }}>{uploadingFile.file.name}</p>
                <p className="text-sm" style={{ color: WARM_COLORS.gray700 }}>{formatFileSize(uploadingFile.file.size)}</p>
              </div>
              
              {uploadingFile.status !== 'complete' ? (
                <div className="w-full">
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: WARM_COLORS.stone }}>
                    <div 
                      className="h-full rounded-full transition-all duration-100"
                      style={{ width: `${uploadingFile.progress}%`, backgroundColor: WARM_COLORS.primary }}
                    />
                  </div>
                  <p className="text-sm mt-2 text-center" style={{ color: WARM_COLORS.gray700 }}>
                    {uploadingFile.status === 'uploading' ? `${Math.round(uploadingFile.progress)}%` : 'Processing...'}
                  </p>
                </div>
              ) : (
                <p className="text-sm font-medium" style={{ color: WARM_COLORS.sage }}>Upload complete!</p>
              )}
            </div>
          </div>
        )}
        </div>
      )}
      
      {/* Reconciliation Overlay */}
      {showReconcile && (
        <div 
          className="absolute inset-0 z-50 flex flex-col"
          style={{ 
            background: `linear-gradient(135deg, ${WARM_COLORS.cream} 0%, ${WARM_COLORS.sand} 100%)`,
            animation: isReconcileClosing 
              ? 'slide-down 0.4s cubic-bezier(0.7, 0, 0.84, 0) forwards'
              : 'slide-up 1.5s cubic-bezier(0.16, 1, 0.3, 1)',
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
            @keyframes slide-down {
              0% {
                transform: translateY(0);
                opacity: 1;
              }
              100% {
                transform: translateY(100%);
                opacity: 0;
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
                  Bookkeeping
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
                onClick={closeReconcile}
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
                Invoices
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
                    Matching transactions...
                  </span>
                </>
              )}
            </div>
            
            <button
              onClick={closeReconcile}
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
