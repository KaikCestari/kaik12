import { db, Destination, TableStatus } from "./db";

export type TableSummary = {
  id: number;
  number: number;
  currentName: string | null;
  status: TableStatus;
  openedAt: string | null;
  orderCount: number;
  total: number;
};

type TableRow = {
  id: number;
  number: number;
  current_name: string | null;
  status: TableStatus;
  opened_at: string | null;
  order_count: number;
  total: number;
};

export async function listTables(): Promise<TableSummary[]> {
  const { data, error } = await db().from("sabom_table_summary").select("*").order("number");
  if (error) throw error;
  return (data as TableRow[]).map(mapTable);
}

export async function tableByNumber(number: number) {
  const { data, error } = await db().from("sabom_table_summary").select("*").eq("number", number).maybeSingle();
  if (error) throw error;
  return data ? mapTable(data as TableRow) : null;
}

export async function activeProducts() {
  const { data, error } = await db().from("sabom_active_products").select("*");
  if (error) throw error;
  return data as Array<{ id: number; name: string; price: number; destination: Destination; category: string }>;
}

export async function sentOrders(tableId: number) {
  const { data, error } = await db().rpc("sabom_sent_order_details", { p_table_id: tableId });
  if (error) throw error;
  return (data as Array<{ id: number; sent_at: string; created_by: string; total: number; items: Array<{ id: number; product_id: number | null; name: string; unit_price: number; quantity: number; destination: Destination; notes: string | null; is_custom: number }> }>).map((order) => ({
    id: order.id,
    sentAt: order.sent_at,
    createdBy: order.created_by,
    total: Number(order.total),
    items: order.items.map((item) => ({
      id: item.product_id ?? item.id,
      name: item.name,
      price: Number(item.unit_price),
      quantity: item.quantity,
      destination: item.destination,
      notes: item.notes ?? "",
      custom: Boolean(item.is_custom),
      category: item.is_custom ? "Avulso" : "",
    })),
  }));
}

function mapTable(row: TableRow): TableSummary {
  return {
    id: row.id,
    number: row.number,
    currentName: row.current_name,
    status: row.status,
    openedAt: row.opened_at,
    orderCount: Number(row.order_count),
    total: Number(row.total),
  };
}
