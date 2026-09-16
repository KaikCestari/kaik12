import { db, TableStatus } from "./db";

export type NightOrderStatus = "PAID" | "UNPAID";
export type NightOrder = {
  id: number;
  tableNumber: number;
  tableName: string;
  status: NightOrderStatus;
  tableStatus: TableStatus;
  firstSentAt: string;
  lastSentAt: string;
  closedAt: string | null;
  createdBy: string;
  orderCount: number;
  itemCount: number;
  total: number;
};

type NightOrderRow = {
  id: number;
  table_number: number;
  table_name: string | null;
  order_status: "SENT" | "CLOSED";
  table_status: TableStatus;
  first_sent_at: string;
  last_sent_at: string;
  closed_at: string | null;
  created_by: string;
  order_count: number;
  item_count: number;
  total: number;
};

export async function nightOrders(): Promise<NightOrder[]> {
  const { data, error } = await db().rpc("sabom_night_order_details");
  if (error) throw error;
  const rows = data as NightOrderRow[];

  return rows.map((row) => ({
    id: row.id,
    tableNumber: row.table_number,
    tableName: row.table_name ?? `Mesa ${row.table_number}`,
    status: row.order_status === "CLOSED" ? "PAID" : "UNPAID",
    tableStatus: row.table_status,
    firstSentAt: row.first_sent_at,
    lastSentAt: row.last_sent_at,
    closedAt: row.closed_at,
    createdBy: row.created_by,
    orderCount: Number(row.order_count),
    itemCount: Number(row.item_count),
    total: Number(row.total),
  }));
}
