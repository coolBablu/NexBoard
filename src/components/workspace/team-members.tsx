"use client";

import { Mail, MoreHorizontal, Plus, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const members = [
  {
    name: "Maya Okonkwo",
    role: "Design Director",
    email: "maya@novaflow.app",
    seed: "Maya",
    status: "Online",
    team: "Design",
  },
  {
    name: "Daniel Park",
    role: "Engineering Lead",
    email: "daniel@novaflow.app",
    seed: "Daniel",
    status: "Online",
    team: "Engineering",
  },
  {
    name: "Sara Patel",
    role: "Head of Product",
    email: "sara@novaflow.app",
    seed: "Sara",
    status: "Away",
    team: "Product",
  },
  {
    name: "Jordan Reyes",
    role: "VP Engineering",
    email: "jordan@novaflow.app",
    seed: "Jordan",
    status: "Offline",
    team: "Engineering",
  },
  {
    name: "Aisha Khan",
    role: "Chief of Staff",
    email: "aisha@novaflow.app",
    seed: "Aisha",
    status: "Online",
    team: "Operations",
  },
  {
    name: "Lucas Müller",
    role: "Staff PM",
    email: "lucas@novaflow.app",
    seed: "Lucas",
    status: "Online",
    team: "Product",
  },
];

const statusDot = {
  Online: "bg-emerald-400",
  Away: "bg-amber-400",
  Offline: "bg-zinc-500",
} as const;

export function TeamMembers() {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Team members</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {members.length} people · 3 online now
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search…" className="h-9 w-48 pl-8" />
          </div>
          <Button size="sm">
            <Plus className="size-3.5" />
            Invite
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {members.map((m) => (
          <div
            key={m.email}
            className="group flex items-center gap-4 rounded-xl border border-transparent p-3 transition-colors hover:border-white/[0.08] hover:bg-white/[0.02]"
          >
            <div className="relative">
              <Avatar>
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m.seed}`}
                />
                <AvatarFallback>{m.seed[0]}</AvatarFallback>
              </Avatar>
              <span
                className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-background ${
                  statusDot[m.status as keyof typeof statusDot]
                }`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">{m.name}</p>
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  {m.team}
                </Badge>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {m.role} · {m.email}
              </p>
            </div>
            <Button variant="ghost" size="icon" aria-label="Email">
              <Mail className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="More">
              <MoreHorizontal className="size-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
