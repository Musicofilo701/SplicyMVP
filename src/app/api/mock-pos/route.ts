
import { NextResponse } from "next/server";

export async function GET() {
  // Mock order data
  const mockOrder = {
    table_id: "TAVOLO_5",
    items: [
      { id: "1", name: "Pizza Margherita", price: 8.5 },
      { id: "2", name: "Birra Moretti", price: 4.0 },
      { id: "3", name: "Tiramisù", price: 5.0 },
    ],
  };

  return NextResponse.json(mockOrder);
}
