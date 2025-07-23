import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ payment_id: string }> },
) {
  const { payment_id } = await params;
  console.log("GET request received for payment_id:", payment_id);

  if (!payment_id) {
    console.error("Missing payment_id in GET");
    return NextResponse.json({ error: "Missing payment_id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("id", payment_id)
    .single();

  if (error) {
    console.error("Error fetching payment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    console.error("Payment not found");
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  console.log("Payment fetched successfully:", data);
  return NextResponse.json({ payment: data });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ payment_id: string }> },
) {
  const { payment_id } = await params;
  console.log("PUT request received for payment_id:", payment_id);

  if (!payment_id) {
    console.error("Missing payment_id in PUT");
    return NextResponse.json({ error: "Missing payment_id" }, { status: 400 });
  }

  try {
    const body = await request.json();
    console.log("Request body for PUT:", JSON.stringify(body, null, 2));

    // First check if the payment exists
    const { data: existingPayment, error: checkError } = await supabase
      .from("payments")
      .select("id")
      .eq("id", payment_id)
      .single();

    if (checkError || !existingPayment) {
      console.error("Payment not found:", payment_id);
      return NextResponse.json(
        { error: `Payment with ID ${payment_id} not found` },
        { status: 404 },
      );
    }

    // Update the payment directly with the provided data
    const { data, error } = await supabase
      .from("payments")
      .update(body)
      .eq("id", payment_id)
      .select();

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json(
        { error: `Update failed: ${error.message}` },
        { status: 500 },
      );
    }

    if (!data || data.length === 0) {
      console.error("No rows updated for payment_id:", payment_id);
      return NextResponse.json(
        { error: "Payment not found or update failed" },
        { status: 404 },
      );
    }

    console.log("Payment updated successfully:", data[0]);
    return NextResponse.json({ success: true, data: data[0] }, { status: 200 });
  } catch (err) {
    console.error("Unexpected error in PUT:", err);
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ payment_id: string }> },
) {
  const { payment_id } = await params;
  console.log("DELETE request received for payment_id:", payment_id);

  if (!payment_id) {
    console.error("Missing payment_id in DELETE");
    return NextResponse.json({ error: "Missing payment_id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("payments")
    .delete()
    .eq("id", payment_id);

  if (error) {
    console.error("Error deleting payment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("Payment deleted successfully");
  return NextResponse.json({ success: true }, { status: 200 });
}