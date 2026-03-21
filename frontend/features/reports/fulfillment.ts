type FulfillmentReportItem = {
  orderId: number;
  customerName: string;
  productName: string;
  orderedQuantity: number;
  deliveredQuantity: number;
  deliveryStatus: string;
  orderStatus: string;
  isPaid: boolean;
  dueDate: string;
  createdAt: string | null;
};

type FulfillmentReportSummary = {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalItems: number;
  totalDeliveredQuantity: number;
};

type FulfillmentReportPayload = {
  companyName: string;
  reportName: string;
  generatedAt: string;
  dateRange: {
    fromDate: string;
    toDate: string;
  };
  summary: FulfillmentReportSummary;
  items: FulfillmentReportItem[];
};

type ApiEnvelope<T> = {
  status?: "success" | "error";
  data?: T | { data?: T };
  message?: string;
  errors?: Record<string, string[]>;
};

async function parseApiEnvelope<T>(response: Response): Promise<ApiEnvelope<T> | null> {
  const raw = await response.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ApiEnvelope<T>;
  } catch {
    return null;
  }
}

function getData<T>(payload: ApiEnvelope<T> | null): T | null {
  if (!payload || payload.data === undefined) return null;
  const raw = payload.data as unknown;
  if (raw && typeof raw === "object" && "data" in (raw as Record<string, unknown>)) {
    const nested = raw as { data?: T };
    return nested.data ?? null;
  }
  return raw as T;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString();
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function fetchFulfillmentReportToday(): Promise<FulfillmentReportPayload> {
  const today = new Date().toISOString().slice(0, 10);
  const response = await fetch(
    `/api/proxy/reports/fulfillment?fromDate=${today}&toDate=${today}`,
    { cache: "no-store" },
  );
  const payload = await parseApiEnvelope<FulfillmentReportPayload>(response);

  if (!response.ok) {
    const fallback = "Unable to load fulfillment report";
    throw new Error(payload?.message ?? `${fallback} (HTTP ${response.status})`);
  }

  const report = getData<FulfillmentReportPayload>(payload);
  if (!report) {
    throw new Error("Fulfillment report response is missing data");
  }

  return report;
}

function buildReportHtml(report: FulfillmentReportPayload): string {
  const summary = report.summary;
  const rows = report.items
    .map((item) => {
      return `<tr>
        <td>${item.orderId}</td>
        <td>${escapeHtml(item.customerName || "-")}</td>
        <td>${escapeHtml(item.productName)}</td>
        <td>${item.orderedQuantity}</td>
        <td>${item.deliveredQuantity}</td>
        <td>${escapeHtml(item.deliveryStatus)}</td>
        <td>${escapeHtml(item.orderStatus)}</td>
        <td>${item.isPaid ? "Paid" : "Unpaid"}</td>
        <td>${formatDate(item.dueDate)}</td>
      </tr>`;
    })
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(report.reportName)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
    h1 { margin: 0 0 8px; font-size: 22px; }
    .meta { margin-bottom: 14px; font-size: 12px; color: #4b5563; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 12px 0 18px; }
    .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; }
    .label { font-size: 11px; color: #6b7280; margin-bottom: 4px; }
    .value { font-size: 16px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #e5e7eb; padding: 6px; text-align: left; vertical-align: top; }
    th { background: #f9fafb; }
    @media print { .no-print { display: none; } body { margin: 10mm; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(report.companyName)} - ${escapeHtml(report.reportName)}</h1>
  <div class="meta">
    Generated: ${formatDate(report.generatedAt)} | Range: ${formatDate(report.dateRange.fromDate)} to ${formatDate(report.dateRange.toDate)}
  </div>

  <div class="summary">
    <div class="card"><div class="label">Total Orders</div><div class="value">${summary.totalOrders}</div></div>
    <div class="card"><div class="label">Pending / Processing</div><div class="value">${summary.pendingOrders} / ${summary.processingOrders}</div></div>
    <div class="card"><div class="label">Completed / Cancelled</div><div class="value">${summary.completedOrders} / ${summary.cancelledOrders}</div></div>
    <div class="card"><div class="label">Items / Delivered Qty</div><div class="value">${summary.totalItems} / ${summary.totalDeliveredQuantity}</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Order #</th>
        <th>Customer</th>
        <th>Product</th>
        <th>Ordered</th>
        <th>Delivered</th>
        <th>Item Status</th>
        <th>Order Status</th>
        <th>Payment</th>
        <th>Due Date</th>
      </tr>
    </thead>
    <tbody>
      ${rows || `<tr><td colspan="9">No fulfillment rows in this range.</td></tr>`}
    </tbody>
  </table>
</body>
</html>`;
}

export async function downloadAndPrintFulfillmentReportToday() {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("Popup blocked. Please allow popups to print the report.");
  }

  printWindow.document.open();
  printWindow.document.write("<!doctype html><html><body><p>Loading report...</p></body></html>");
  printWindow.document.close();

  try {
    const report = await fetchFulfillmentReportToday();
    const html = buildReportHtml(report);

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    const tryPrint = () => {
      printWindow.focus();
      printWindow.print();
    };

    if (printWindow.document.readyState === "complete") {
      tryPrint();
    } else {
      printWindow.onload = tryPrint;
      setTimeout(tryPrint, 300);
    }
  } catch (error) {
    printWindow.document.open();
    printWindow.document.write(
      "<!doctype html><html><body><h3>Failed to load report</h3><p>Please close this tab and try again.</p></body></html>",
    );
    printWindow.document.close();
    throw error;
  }
}
