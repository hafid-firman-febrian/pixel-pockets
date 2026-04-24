import { sheets, type sheets_v4 } from "@googleapis/sheets";
import { JWT } from "google-auth-library";

import type { TransactionRecord } from "@/lib/transactions";

const HEADER_ROW = [
  "ID",
  "Date",
  "Type",
  "Amount",
  "Category",
  "Description",
  "Created At",
] as const;

const DEFAULT_TAB_NAME = "transactions";

interface SheetsConfig {
  credentials: {
    client_email: string;
    private_key: string;
  };
  spreadsheetId: string;
  tabName: string;
}

function readConfig(): SheetsConfig | null {
  const raw = process.env.GOOGLE_SHEETS_CREDENTIALS;
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  if (!raw || !spreadsheetId) return null;

  let decoded: string;
  try {
    decoded = Buffer.from(raw, "base64").toString("utf8");
  } catch {
    throw new Error(
      "GOOGLE_SHEETS_CREDENTIALS could not be base64-decoded. Did you paste the raw JSON instead of the base64 of the JSON?",
    );
  }

  let creds: { client_email?: string; private_key?: string };
  try {
    creds = JSON.parse(decoded);
  } catch {
    throw new Error(
      "GOOGLE_SHEETS_CREDENTIALS is not valid JSON after base64-decode.",
    );
  }

  if (!creds.client_email || !creds.private_key) {
    throw new Error(
      "GOOGLE_SHEETS_CREDENTIALS is missing client_email or private_key fields.",
    );
  }

  return {
    credentials: {
      client_email: creds.client_email,
      private_key: creds.private_key.replace(/\\n/g, "\n"),
    },
    spreadsheetId,
    tabName: process.env.GOOGLE_SHEETS_TAB_NAME ?? DEFAULT_TAB_NAME,
  };
}

export function isSheetSyncConfigured(): boolean {
  return (
    Boolean(process.env.GOOGLE_SHEETS_CREDENTIALS) &&
    Boolean(process.env.GOOGLE_SHEETS_ID)
  );
}

// Cache the authenticated client + resolved tab numeric id across calls
// in the same server process. Cleared when the process recycles.
let cachedClient: sheets_v4.Sheets | null = null;
let cachedTabId: { tabName: string; sheetId: number } | null = null;

function getClient(config: SheetsConfig): sheets_v4.Sheets {
  if (cachedClient) return cachedClient;
  const auth = new JWT({
    email: config.credentials.client_email,
    key: config.credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  cachedClient = sheets({ version: "v4", auth });
  return cachedClient;
}

async function resolveTabId(
  config: SheetsConfig,
  client: sheets_v4.Sheets,
): Promise<number> {
  if (cachedTabId && cachedTabId.tabName === config.tabName) {
    return cachedTabId.sheetId;
  }
  const resp = await client.spreadsheets.get({
    spreadsheetId: config.spreadsheetId,
  });
  const tab = resp.data.sheets?.find(
    (s) => s.properties?.title === config.tabName,
  );
  if (!tab?.properties?.sheetId && tab?.properties?.sheetId !== 0) {
    throw new Error(
      `Tab "${config.tabName}" not found in spreadsheet ${config.spreadsheetId}. Run 'npm run sheet:resync' to create it.`,
    );
  }
  cachedTabId = {
    tabName: config.tabName,
    sheetId: tab.properties.sheetId!,
  };
  return cachedTabId.sheetId;
}

function recordToRow(r: TransactionRecord): (string | number)[] {
  return [
    Number(r.id),
    r.date,
    r.type,
    r.amount,
    r.category,
    r.description,
    r.createdAt,
  ];
}

async function findRowNumberById(
  config: SheetsConfig,
  client: sheets_v4.Sheets,
  id: string,
): Promise<number | null> {
  const resp = await client.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId,
    range: `${config.tabName}!A:A`,
    majorDimension: "COLUMNS",
  });
  const column = resp.data.values?.[0] ?? [];
  // column[0] is the header "ID"; column[i] is the id of sheet row i+1.
  for (let i = 1; i < column.length; i++) {
    if (String(column[i]) === String(id)) {
      return i + 1; // 1-based sheet row number
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Public operations
// ---------------------------------------------------------------------------

export async function appendRow(record: TransactionRecord): Promise<void> {
  const config = readConfig();
  if (!config) return;
  const client = getClient(config);
  await client.spreadsheets.values.append({
    spreadsheetId: config.spreadsheetId,
    range: `${config.tabName}!A:G`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [recordToRow(record)] },
  });
}

export async function updateRow(record: TransactionRecord): Promise<void> {
  const config = readConfig();
  if (!config) return;
  const client = getClient(config);
  const rowNum = await findRowNumberById(config, client, record.id);
  if (rowNum === null) {
    // Row missing in sheet (maybe drift) — append instead of silently dropping
    await appendRow(record);
    return;
  }
  await client.spreadsheets.values.update({
    spreadsheetId: config.spreadsheetId,
    range: `${config.tabName}!A${rowNum}:G${rowNum}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [recordToRow(record)] },
  });
}

export async function deleteRow(id: string): Promise<void> {
  const config = readConfig();
  if (!config) return;
  const client = getClient(config);
  const rowNum = await findRowNumberById(config, client, id);
  if (rowNum === null) return;
  const sheetId = await resolveTabId(config, client);
  await client.spreadsheets.batchUpdate({
    spreadsheetId: config.spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowNum - 1,
              endIndex: rowNum,
            },
          },
        },
      ],
    },
  });
}

/**
 * Full rebuild: ensure the tab exists with correct headers, clear all data
 * rows, then bulk-append the provided records. Used by scripts/resync-sheet.ts.
 */
export async function resync(records: TransactionRecord[]): Promise<void> {
  const config = readConfig();
  if (!config) {
    throw new Error(
      "Sheet sync is not configured. Set GOOGLE_SHEETS_CREDENTIALS and GOOGLE_SHEETS_ID in .env.local.",
    );
  }
  const client = getClient(config);

  // Ensure the tab exists. If missing, add it.
  const meta = await client.spreadsheets.get({
    spreadsheetId: config.spreadsheetId,
  });
  const existing = meta.data.sheets?.find(
    (s) => s.properties?.title === config.tabName,
  );
  let sheetId: number;
  if (!existing) {
    const add = await client.spreadsheets.batchUpdate({
      spreadsheetId: config.spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title: config.tabName },
            },
          },
        ],
      },
    });
    sheetId = add.data.replies?.[0]?.addSheet?.properties?.sheetId ?? 0;
  } else {
    sheetId = existing.properties?.sheetId ?? 0;
  }
  cachedTabId = { tabName: config.tabName, sheetId };

  // Clear the tab completely, then write header + data in one call.
  await client.spreadsheets.values.clear({
    spreadsheetId: config.spreadsheetId,
    range: `${config.tabName}!A:Z`,
  });

  const values: (string | number)[][] = [
    [...HEADER_ROW],
    ...records.map(recordToRow),
  ];

  await client.spreadsheets.values.update({
    spreadsheetId: config.spreadsheetId,
    range: `${config.tabName}!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}
