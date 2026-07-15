import Link from "next/link";
import type { Metadata } from "next";
import { MyOrdersClient } from "@/components/storefront/my-orders-client";

export const metadata: Metadata = {
  title: "My Orders — track every StoreLink order in one place",
  description: "Enter your phone number and any order number to see and track all your orders from StoreLink shops.",
};

export default function MyOrdersPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-bold text-ink">My Orders</h1>
      <p className="mt-1 text-sm text-muted">
        One place for every order you&apos;ve placed at any StoreLink shop — see the status, open tracking, reorder.
      </p>
      <MyOrdersClient />
      <p className="mt-10 rounded-2xl border border-line bg-surface p-4 text-center text-sm text-muted">
        Sell something yourself?{" "}
        <Link href="/?src=my-orders" className="font-medium text-primary hover:underline">
          Open your own shop on StoreLink — free →
        </Link>
      </p>
    </div>
  );
}
