"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ClientSummary } from "@/features/clients/data";

import { CLIENT_TYPE_LABELS, CLIENT_TYPES } from "../schema";
import { ClientCard } from "./client-card";

const ALL = "all";

type Props = {
  clients: ClientSummary[];
};

export function ClientDirectory({ clients }: Props) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState(ALL);

  const typeItems = useMemo(
    () => [
      { value: ALL, label: "All Types" },
      ...CLIENT_TYPES.map((t) => ({ value: t, label: CLIENT_TYPE_LABELS[t] })),
    ],
    []
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return clients.filter((client) => {
      if (type !== ALL && client.type !== type) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [client.name, client.industry ?? "", client.country ?? "", client.city ?? ""]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [clients, search, type]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, industry, or location..."
            className="h-11 pl-9 md:h-9"
          />
        </div>

        <Select value={type} onValueChange={(next) => setType(next ?? ALL)} items={typeItems}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {typeItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} of {clients.length} clients
      </p>

      {filtered.length === 0 ? (
        <Card className="bg-surface-elevated">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No clients match your filters.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </div>
  );
}
