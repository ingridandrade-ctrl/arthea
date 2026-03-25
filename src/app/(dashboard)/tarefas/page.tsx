"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Plus,
  Calendar,
  X,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  completed: boolean;
  completedAt: string | null;
  priority: string;
  createdAt: string;
  leadId: string | null;
  dealId: string | null;
  assignedToId: string | null;
  lead: { id: string; name: string } | null;
  deal: { id: string; title: string } | null;
  assignedTo: { id: string; name: string; email: string } | null;
  createdBy: { id: string; name: string } | null;
}

interface Lead {
  id: string;
  name: string;
}

type FilterTab = "todas" | "minhas" | "pendentes" | "concluidas" | "atrasadas";

const priorityLabels: Record<string, string> = {
  urgent: "Urgente",
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

const priorityStyles: Record<string, string> = {
  urgent: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-blue-100 text-blue-700",
  low: "bg-gray-100 text-gray-700",
};

export default function TarefasPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("todas");
  const [showForm, setShowForm] = useState(false);

  async function fetchTasks() {
    setLoading(true);
    const params = new URLSearchParams();

    if (activeTab === "minhas") {
      // Will filter client-side after fetching with session user id
      // The API needs assignedToId, but we get it from session
      params.set("assignedToId", "me");
    } else if (activeTab === "pendentes") {
      params.set("completed", "false");
    } else if (activeTab === "concluidas") {
      params.set("completed", "true");
    } else if (activeTab === "atrasadas") {
      params.set("overdue", "true");
    }

    const res = await fetch(`/api/tasks?${params}`);
    const data = await res.json();
    setTasks(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchTasks();
  }, [activeTab]);

  async function toggleComplete(task: Task) {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !task.completed }),
    });
    if (res.ok) {
      fetchTasks();
    }
  }

  function isOverdue(task: Task): boolean {
    if (task.completed || !task.dueDate) return false;
    return new Date(task.dueDate) < new Date();
  }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "todas", label: "Todas" },
    { key: "minhas", label: "Minhas" },
    { key: "pendentes", label: "Pendentes" },
    { key: "concluidas", label: "Concluídas" },
    { key: "atrasadas", label: "Atrasadas" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tarefas</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          Nova Tarefa
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === tab.key
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="px-4 py-8 text-center text-muted-foreground">
            Carregando...
          </div>
        ) : tasks.length === 0 ? (
          <div className="px-4 py-12 text-center text-muted-foreground">
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Nenhuma tarefa encontrada</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition"
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleComplete(task)}
                  className="mt-0.5 shrink-0"
                  title={task.completed ? "Marcar como pendente" : "Marcar como concluída"}
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-sm font-medium ${
                        task.completed
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {task.title}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        priorityStyles[task.priority] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {priorityLabels[task.priority] || task.priority}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {/* Due date */}
                    {task.dueDate && (
                      <span
                        className={`flex items-center gap-1 ${
                          isOverdue(task) ? "text-red-500 font-medium" : ""
                        }`}
                      >
                        {isOverdue(task) ? (
                          <AlertTriangle className="w-3 h-3" />
                        ) : (
                          <Calendar className="w-3 h-3" />
                        )}
                        {formatDate(task.dueDate)}
                      </span>
                    )}

                    {/* Lead */}
                    {task.lead && (
                      <span className="truncate">
                        Lead: {task.lead.name}
                      </span>
                    )}

                    {/* Assigned to */}
                    {task.assignedTo && (
                      <span className="flex items-center gap-1">
                        <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center font-medium">
                          {task.assignedTo.name.charAt(0).toUpperCase()}
                        </span>
                        {task.assignedTo.name}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal - Nova Tarefa */}
      {showForm && (
        <TaskFormModal
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            fetchTasks();
          }}
        />
      )}
    </div>
  );
}

function TaskFormModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    fetch("/api/leads")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLeads(data.map((l: any) => ({ id: l.id, name: l.name })));
        }
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const body = {
      title: formData.get("title"),
      description: formData.get("description") || undefined,
      dueDate: formData.get("dueDate") || undefined,
      priority: formData.get("priority"),
      leadId: formData.get("leadId") || undefined,
      assignedToId: formData.get("assignedToId") || undefined,
    };

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Erro ao criar tarefa");
      setLoading(false);
      return;
    }

    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Nova Tarefa</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Título *</label>
            <input
              name="title"
              required
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ex: Ligar para cliente"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descrição</label>
            <textarea
              name="description"
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Detalhes da tarefa..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data de Vencimento</label>
            <input
              name="dueDate"
              type="date"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Prioridade</label>
            <select
              name="priority"
              defaultValue="medium"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Lead (opcional)</label>
            <select
              name="leadId"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Nenhum</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Responsável (opcional)</label>
            <input
              name="assignedToId"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="ID do usuário"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Criar Tarefa"}
          </button>
        </form>
      </div>
    </div>
  );
}
