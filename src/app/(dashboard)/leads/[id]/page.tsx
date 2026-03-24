"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatPhone, formatDate, formatCurrency } from "@/lib/utils";
import { ArrowLeft, Phone, Mail, Building, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/leads/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setLead(data);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!lead) {
    return <div className="text-center py-8 text-muted-foreground">Lead não encontrado</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">{lead.name}</h1>
        {lead.service && (
          <span
            className="px-3 py-1 rounded-full text-xs text-white font-medium"
            style={{ backgroundColor: lead.service.color }}
          >
            {lead.service.name}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Card */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Informações</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{formatPhone(lead.phone)}</span>
            </div>
            {lead.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{lead.email}</span>
              </div>
            )}
            {lead.company && (
              <div className="flex items-center gap-3">
                <Building className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{lead.company}</span>
              </div>
            )}
          </div>
          {lead.notes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Observações</p>
              <p className="text-sm">{lead.notes}</p>
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Criado em {formatDate(lead.createdAt)}
          </div>
        </div>

        {/* Deals */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Deals</h2>
          {lead.deals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum deal</p>
          ) : (
            <div className="space-y-3">
              {lead.deals.map((deal: any) => (
                <div key={deal.id} className="border border-border rounded-lg p-3">
                  <p className="font-medium text-sm">{deal.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="px-2 py-0.5 rounded text-xs text-white"
                      style={{ backgroundColor: deal.stage?.color || "#6366f1" }}
                    >
                      {deal.stage?.name}
                    </span>
                    {deal.value && (
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(deal.value)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conversations */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Conversas</h2>
          {lead.conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma conversa</p>
          ) : (
            <div className="space-y-3">
              {lead.conversations.map((conv: any) => (
                <Link
                  key={conv.id}
                  href={`/conversations/${conv.id}`}
                  className="block border border-border rounded-lg p-3 hover:bg-muted/30 transition"
                >
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {conv.isAiActive ? "IA ativa" : "Atendimento humano"}
                    </span>
                  </div>
                  {conv.messages[0] && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {conv.messages[0].content}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
