import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { OrderItem } from "@/types/api";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const table_id = searchParams.get("table_id");
    console.log("GET request received for orders, table_id:", table_id);

    if (!table_id) {
        console.error("Missing table_id in GET");
        return NextResponse.json(
            { error: "Missing table_id" },
            { status: 400 },
        );
    }

    const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("table_id", table_id);

    if (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Check if any orders were found
    if (!data || data.length === 0) {
        console.error("Order not found for table_id:", table_id);
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = data[0];
    const orderTotal = order.items.reduce(
        (sum: number, item: OrderItem) => sum + Number(item.price),
        0,
    );

    console.log("Order fetched successfully:", order);
    return NextResponse.json({ ...order, orderTotal });
}

export async function POST(request: NextRequest) {
    try {
        const rawText = await request.text();
        console.log("Raw request text:", rawText);

        const data = JSON.parse(rawText);
        console.log("POST request received for orders:", data);

        const { items, table_id } = data;
        if (
            !items ||
            !Array.isArray(items) ||
            items.length === 0 ||
            !table_id
        ) {
            return NextResponse.json(
                { error: "Missing required fields: items or table_id" },
                { status: 400 },
            );
        }

        const { data: newOrder, error } = await supabase
            .from("orders")
            .insert([{ table_id, items, created_at: new Date().toISOString() }])
            .select();

        if (error) {
            console.error("Error inserting order into Supabase:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log("Order created successfully:", newOrder);
        return NextResponse.json(
            { success: true, data: newOrder },
            { status: 201 },
        );
    } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        return NextResponse.json(
            {
                error: "Invalid JSON format in request body",
                details:
                    parseError instanceof Error
                        ? parseError.message
                        : "Unknown parse error",
            },
            { status: 400 },
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const rawText = await request.text();
        console.log("Raw request text for PUT:", rawText);

        const data = JSON.parse(rawText);
        console.log("PUT request received for orders:", data);

        const { table_id, items } = data;

        if (
            !items ||
            !Array.isArray(items) ||
            items.length === 0 ||
            !table_id
        ) {
            return NextResponse.json(
                { error: "Missing required fields: items or table_id" },
                { status: 400 },
            );
        }

        const { data: updatedOrder, error } = await supabase
            .from("orders")
            .update({ items })
            .eq("table_id", table_id)
            .select();

        if (error) {
            console.error("Error updating order in Supabase:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log("Order updated successfully:", updatedOrder);
        return NextResponse.json(
            { success: true, data: updatedOrder },
            { status: 200 },
        );
    } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        return NextResponse.json(
            {
                error: "Invalid JSON format in request body",
                details:
                    parseError instanceof Error
                        ? parseError.message
                        : "Unknown parse error",
            },
            { status: 400 },
        );
    }
}

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const table_id = searchParams.get("table_id");
    console.log(`DELETE request received for table_id: ${table_id}`);

    if (!table_id) {
        console.error("Missing table_id in DELETE");
        return NextResponse.json(
            { error: "Missing table_id" },
            { status: 400 },
        );
    }

    // Create service role client for delete operations
    const serviceSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Log to check what's in the database before deletion
    const { data: existingOrder, error: fetchError } = await serviceSupabase
        .from("orders")
        .select("*")
        .eq("table_id", table_id)
        .single();

    // Confirm if the existing order was found.
    if (fetchError || !existingOrder) {
        console.error("Order not found for deletion:", fetchError);
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    console.log("Existing order for verification before deletion:", existingOrder);

    // Proceed to delete with service role
    const { error } = await serviceSupabase
        .from("orders")
        .delete()
        .eq("table_id", table_id);

    if (error) {
        console.error("Error deleting order:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Confirm deletion by checking if record still exists
    const { data: verifyDeleted } = await serviceSupabase
        .from("orders")
        .select("id")
        .eq("table_id", table_id)
        .single();

    if (verifyDeleted) {
        console.error("Order still exists after delete attempt");
        return NextResponse.json({ error: "Delete failed - order still exists" }, { status: 500 });
    }

    console.log("Order successfully deleted for table_id:", table_id);
    return NextResponse.json({ success: true }, { status: 200 });
}