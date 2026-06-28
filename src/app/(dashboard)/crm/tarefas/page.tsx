"use client";

import { useEffect, useState, useMemo } from "react";
import { formatDate } from "@/lib/utils";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Plus,
  Calendar,
  X,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Filter,
  ListFilter,
  CalendarDays,
  CalendarRange,
  CheckSquare,
  Square,
  MinusSquare,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { FilterDropdown } from "@/components/crm/filter-dropdown";

interface Task {
  kind?: "task" | "followup";
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  completed: boolean;
  completedAt: string | null;
  priority: string;
  createdAt: string;
  leadId: string | null;
  leadServiceId: string | null;
  assignedToId: string | null;
  lead: { id: string; name: string } | null;
  leadService: { id: string; service: { name: string; color?: string } } | null;
  assignedTo: { id: string; name: string; email: string } | null;
  createdBy: { id: string; name: string } | null;
  // followup-only
  followUpOrder?: number;
  followUpStatus?: string;
  stage?: { id: string; name: string; color: string } | null;
}

interface Lead {
  id: string;
  name: string;
}

type FilterTab = "todas" | "minhas" | "pendentes" | "concluidas" | "atrasadas";
type DatePreset = "all" | "today" | "week" | "month" | "custom";
type GroupKey = "overdue" | "today" | "tomorrow" | "thisWeek" | "later" | "noDate" | "completed";

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
  low: "bg-gray-100 text-gray-600",
};

const priorityBorder: Record<string, string> = {
  urgent: "border-l-red-500",
  high: "border-l-orange-500",
  medium: "border-l-blue-400",
  low: "border-l-gray-300",
};

const groupConfig: Record<GroupKey, { label: string; icon: typeof AlertTriangle; color: string }> = {
  overdue: { label: "Atrasadas", icon: AlertTriangle, color: "text-red-600" },
  today: { label: "Hoje", icon: CalendarDays, color: "text-blue-600" },
  tomorrow: { label: "Amanhã", icon: Calendar, color: "text-indigo-600" },
  thisWeek: { label: "Esta Semana", icon: CalendarRange, color: "text-violet-600" },
  later: { label: "Próximas", icon: Clock, color: "text-gray-500" },
  noDate: { label: "Sem Data", icon: ListFilter, color: "text-gray-400" },
  completed: { label: "Concluídas", icon: CheckCircle2, color: "text-green-600" },
};

const groupOrder: GroupKey[] = ["overdue", "today", "tomorrow", "thisWeek", "later", "noDate", "completed"];

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function endOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? 0 : 7 - day;
  const end = new Date(d);
  end.setDate(end.getDate() + diff);
  return endOfDay(end);
}

function groupTasks(tasks: Task[]): Record<GroupKey, Task[]> {
  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekEnd = endOfWeek(now);

  const groups: Record<GroupKey, Task[]> = {
    overdue: [],
    today: [],
    tomorrow: [],
    thisWeek: [],
    later: [],
    noDate: [],
    completed: [],
  };

  for (const task of tasks) {
    if (task.completed) {
      groups.completed.push(task);
      continue;
    }
    if (!task.dueDate) {
      groups.noDate.push(task);
      continue;
    }
    const due = new Date(task.dueDate);
    if (due < today) {
      groups.overdue.push(task);
    } else if (isSameDay(due, today)) {
      groups.today.push(task);
    } else if (isSameDay(due, tomorrow)) {
      groups.tomorrow.push(task);
    } else if (due <= weekEnd) {
      groups.thisWeek.push(task);
    } else {
      groups.later.push(task);
    }
  }

  return groups;
}

export default function TarefasPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("todas");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [activeService, setActiveService] = useState("all");
  const [kindFilter, setKindFilter] = useState<"all" | "task" | "followup">("all");
  const [services, setServices] = useState<{ id: string; name: string; slug: string; color: string }[]>([]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"delete" | "complete" | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const [collapsedGroups, setCollapsedGroups] = useState<Set<GroupKey>>(new Set());

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectGroup(groupTasks: Task[]) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = groupTasks.every((t) => next.has(t.id));
      if (allSelected) {
        groupTasks.forEach((t) => next.delete(t.id));
      } else {
        groupTasks.forEach((t) => next.add(t.id));
      }
      return next;
    });
  }

  async function handleBulkDelete() {
    setBulkLoading(true);
    for (const id of selectedIds) {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    }
    setBulkLoading(false);
    setBulkAction(null);
    setSelectedIds(new Set());
    fetchTasks();
  }

  async function handleBulkComplete() {
    setBulkLoading(true);
    for (const id of selectedIds) {
      await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true }),
      });
    }
    setBulkLoading(false);
    setBulkAction(null);
    setSelectedIds(new Set());
    fetchTasks();
  }

  function toggleGroup(key: GroupKey) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function fetchTasks() {
    setLoading(true);
    const params = new URLSearchParams();

    if (activeTab === "minhas") {
      params.set("assignedToId", "me");
    } else if (activeTab === "pendentes") {
      params.set("completed", "false");
    } else if (activeTab === "concluidas") {
      params.set("completed", "true");
    } else if (activeTab === "atrasadas") {
      params.set("overdue", "true");
    }

    if (priorityFilter) {
      params.set("priority", priorityFilter);
    }
    if (activeService !== "all") {
      params.set("service", activeService);
    }
    if (kindFilter !== "all") {
      params.set("kind", kindFilter);
    }

    const now = new Date();
    if (datePreset === "today") {
      const s = startOfDay(now);
      const e = endOfDay(now);
      params.set("dueDateFrom", s.toISOString());
      params.set("dueDateTo", e.toISOString());
    } else if (datePreset === "week") {
      const s = startOfDay(now);
      const e = endOfWeek(now);
      params.set("dueDateFrom", s.toISOString());
      params.set("dueDateTo", e.toISOString());
    } else if (datePreset === "month") {
      const s = startOfDay(now);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      params.set("dueDateFrom", s.toISOString());
      params.set("dueDateTo", e.toISOString());
    } else if (datePreset === "custom") {
      if (customFrom) params.set("dueDateFrom", new Date(customFrom).toISOString());
      if (customTo) params.set("dueDateTo", endOfDay(new Date(customTo)).toISOString());
    }

    const res = await fetch(`/api/tasks?${params}`);
    const data = await res.json();
    setTasks(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    fetchTasks();
  }, [activeTab, datePreset, customFrom, customTo, priorityFilter, activeService, kindFilter]);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => setServices(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  async function toggleComplete(task: Task) {
    if (task.kind === "followup") {
      const res = await fetch(`/api/followups/${task.id}/complete`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: task.completed ? "reopen" : "complete" }),
      });
      if (res.ok) fetchTasks();
      return;
    }
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !task.completed }),
    });
    if (res.ok) fetchTasks();
  }

  const grouped = useMemo(() => groupTasks(tasks), [tasks]);

  const totalPending = tasks.filter((t) => !t.completed).length;
  const totalOverdue = grouped.overdue.length;
  const totalToday = grouped.today.length;

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: "todas", label: "Todas", count: tasks.length },
    { key: "minhas", label: "Atribuídas a mim" },
    { key: "pendentes", label: "Pendentes", count: totalPending },
    { key: "concluidas", label: "Concluídas", count: grouped.completed.length },
    { key: "atrasadas", label: "Atrasadas", count: totalOverdue },
  ];

  const datePresets: { key: DatePreset; label: string }[] = [
    { key: "all", label: "Todas as datas" },
    { key: "today", label: "Hoje" },
    { key: "week", label: "Esta semana" },
    { key: "month", label: "Este mês" },
    { key: "custom", label: "Personalizado" },
  ];

  const hasActiveFilters =
    datePreset !== "all" || priorityFilter !== "" || activeService !== "all" || kindFilter !== "all";

  function clearAllFilters() {
    setDatePreset("all");
    setCustomFrom("");
    setCustomTo("");
    setPriorityFilter("");
    setActiveService("all");
    setKindFilter("all");
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tarefas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalPending} pendente{totalPending !== 1 ? "s" : ""}
            {totalOverdue > 0 && (
              <span className="text-red-500 font-medium"> · {totalOverdue} atrasada{totalOverdue !== 1 ? "s" : ""}</span>
            )}
            {totalToday > 0 && (
              <span className="text-blue-500 font-medium"> · {totalToday} para hoje</span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          Nova Tarefa
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-2 ${
              activeTab === tab.key
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-primary">
            {selectedIds.size} tarefa{selectedIds.size !== 1 ? "s" : ""} selecionada{selectedIds.size !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBulkAction("complete")}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition"
            >
              Concluir Selecionadas
            </button>
            <button
              onClick={() => setBulkAction("delete")}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition"
            >
              Excluir Selecionadas
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="p-1.5 rounded-lg hover:bg-muted transition"
              title="Limpar seleção"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Filtros — dropdowns compactos em linha única */}
      <div className="flex items-center gap-2 flex-wrap">
        <FilterDropdown
          label="Tipo"
          value={kindFilter}
          onChange={(v) => setKindFilter(v as any)}
          defaultLabel="Tudo"
          defaultValue="all"
          options={[
            { value: "task", label: "Tarefa", color: "#0ea5e9" },
            { value: "followup", label: "Follow-up", color: "#f59e0b" },
          ]}
        />
        <FilterDropdown
          label="Serviço"
          value={activeService}
          onChange={setActiveService}
          defaultLabel="Todos"
          options={services.map((s) => ({ value: s.slug, label: s.name, color: s.color }))}
        />
        <FilterDropdown
          icon={<Calendar className="w-3.5 h-3.5" />}
          label="Período"
          value={datePreset}
          onChange={(v) => setDatePreset(v as DatePreset)}
          defaultLabel="Sempre"
          options={datePresets.filter((p) => p.key !== "all").map((p) => ({ value: p.key, label: p.label }))}
        />
        {kindFilter !== "followup" && (
          <FilterDropdown
            icon={<ListFilter className="w-3.5 h-3.5" />}
            label="Prioridade"
            value={priorityFilter || "all"}
            onChange={(v) => setPriorityFilter(v === "all" ? "" : v)}
            defaultLabel="Todas"
            options={[
              { value: "urgent", label: "Urgente", color: "#ef4444" },
              { value: "high", label: "Alta", color: "#f97316" },
              { value: "medium", label: "Média", color: "#3b82f6" },
              { value: "low", label: "Baixa", color: "#94a3b8" },
            ]}
          />
        )}
        {datePreset === "custom" && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-2 py-1.5 border border-border rounded-lg text-xs bg-card focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <span className="text-xs text-muted-foreground">→</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-2 py-1.5 border border-border rounded-lg text-xs bg-card focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        )}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition"
            title="Limpar filtros"
          >
            <X className="w-3.5 h-3.5" />
            Limpar
          </button>
        )}
      </div>

      {/* Task Groups */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-16 text-center text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhuma tarefa encontrada</p>
          <p className="text-sm mt-1">Crie uma nova tarefa para começar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groupOrder.map((key) => {
            const group = grouped[key];
            if (group.length === 0) return null;
            const config = groupConfig[key];
            const Icon = config.icon;
            const isCollapsed = collapsedGroups.has(key);

            return (
              <div key={key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Group Header */}
                <div className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSelectGroup(group); }}
                    className="shrink-0"
                  >
                    {group.every((t) => selectedIds.has(t.id)) ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : group.some((t) => selectedIds.has(t.id)) ? (
                      <MinusSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-300 hover:text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => toggleGroup(key)}
                    className="flex-1 flex items-center gap-3"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
                    <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full">
                      {group.length}
                    </span>
                  </button>
                </div>

                {/* Group Tasks */}
                {!isCollapsed && (
                  <ul className="border-t border-gray-100">
                    {group.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        isOverdue={key === "overdue"}
                        selected={selectedIds.has(task.id)}
                        onSelect={() => toggleSelect(task.id)}
                        onToggle={() => toggleComplete(task)}
                        onEdit={() => setEditingTask(task)}
                        onDelete={() => setDeletingTask(task)}
                      />
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <TaskFormModal
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            fetchTasks();
          }}
        />
      )}

      {editingTask && (
        <Modal title="Editar Tarefa" onClose={() => setEditingTask(null)}>
          <EditTaskForm
            task={editingTask}
            onSaved={() => {
              setEditingTask(null);
              fetchTasks();
            }}
          />
        </Modal>
      )}

      {deletingTask && (
        <Modal
          title={deletingTask.kind === "followup" ? "Remover follow-up" : "Excluir Tarefa"}
          onClose={() => setDeletingTask(null)}
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {deletingTask.kind === "followup" ? (
                <>Remover o follow-up <strong>{deletingTask.title}</strong> da lista de tarefas? (Vai marcar como pulado)</>
              ) : (
                <>Tem certeza que deseja excluir a tarefa <strong>{deletingTask.title}</strong>?</>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingTask(null)}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  setDeletingLoading(true);
                  let res: Response;
                  if (deletingTask.kind === "followup") {
                    res = await fetch(`/api/followups/${deletingTask.id}/complete`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "skip" }),
                    });
                  } else {
                    res = await fetch(`/api/tasks/${deletingTask.id}`, { method: "DELETE" });
                  }
                  if (res.ok) {
                    setDeletingTask(null);
                    await fetchTasks();
                  } else {
                    const data = await res.json().catch(() => ({}));
                    alert(data.error || `Erro ao excluir (HTTP ${res.status})`);
                  }
                  setDeletingLoading(false);
                }}
                disabled={deletingLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
              >
                {deletingLoading ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Bulk Delete Modal */}
      {bulkAction === "delete" && (
        <Modal title="Excluir Tarefas Selecionadas" onClose={() => setBulkAction(null)}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja excluir <strong>{selectedIds.size} tarefa{selectedIds.size !== 1 ? "s" : ""}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setBulkAction(null)}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
              >
                {bulkLoading ? `Excluindo (${selectedIds.size})...` : `Excluir ${selectedIds.size}`}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Bulk Complete Modal */}
      {bulkAction === "complete" && (
        <Modal title="Concluir Tarefas" onClose={() => setBulkAction(null)}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Marcar <strong>{selectedIds.size} tarefa{selectedIds.size !== 1 ? "s" : ""}</strong> como concluída{selectedIds.size !== 1 ? "s" : ""}?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setBulkAction(null)}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkComplete}
                disabled={bulkLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
              >
                {bulkLoading ? "Concluindo..." : "Concluir"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function TaskRow({
  task,
  isOverdue,
  selected,
  onSelect,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task;
  isOverdue: boolean;
  selected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li
      className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition border-l-[3px] ${
        priorityBorder[task.priority] || "border-l-transparent"
      } ${isOverdue ? "bg-red-50/40" : ""} ${selected ? "bg-primary/5" : ""}`}
    >
      <button onClick={onSelect} className="mt-0.5 shrink-0">
        {selected ? (
          <CheckSquare className="w-[18px] h-[18px] text-primary" />
        ) : (
          <Square className="w-[18px] h-[18px] text-gray-300 hover:text-gray-400 transition" />
        )}
      </button>

      <button
        onClick={onToggle}
        className="mt-0.5 shrink-0"
        title={task.completed ? "Marcar como pendente" : "Marcar como concluída"}
      >
        {task.completed ? (
          <CheckCircle2 className="w-[18px] h-[18px] text-green-500" />
        ) : (
          <Circle className="w-[18px] h-[18px] text-gray-300 hover:text-gray-400 transition" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {task.kind === "followup" ? (
            <span
              className={`text-sm font-medium leading-tight ${
                task.completed ? "line-through text-muted-foreground" : "text-foreground"
              }`}
            >
              {task.title}
            </span>
          ) : (
            <button
              onClick={onEdit}
              className={`text-sm font-medium leading-tight text-left hover:underline ${
                task.completed ? "line-through text-muted-foreground" : "text-foreground"
              }`}
            >
              {task.title}
            </button>
          )}
          {task.kind === "followup" ? (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-700 border border-amber-200">
              Follow-up sugerido
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-100 text-sky-700 border border-sky-200">
              Tarefa
            </span>
          )}
          {task.kind !== "followup" && (
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                priorityStyles[task.priority] || "bg-gray-100 text-gray-700"
              }`}
            >
              {priorityLabels[task.priority] || task.priority}
            </span>
          )}
          {task.kind === "followup" && task.stage && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border"
              style={{
                backgroundColor: task.stage.color + "1A",
                borderColor: task.stage.color + "55",
                color: task.stage.color,
              }}
            >
              {task.stage.name}
            </span>
          )}
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
        )}

        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {task.dueDate && (
            <span
              className={`flex items-center gap-1 text-xs ${
                isOverdue ? "text-red-500 font-semibold" : "text-muted-foreground"
              }`}
            >
              {isOverdue ? (
                <AlertTriangle className="w-3 h-3" />
              ) : (
                <Calendar className="w-3 h-3" />
              )}
              {formatDate(task.dueDate)}
            </span>
          )}

          {task.lead && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              {task.lead.name}
            </span>
          )}

          {task.leadService && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              {task.leadService.service.name}
            </span>
          )}

          {task.assignedTo && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center font-semibold">
                {task.assignedTo.name.charAt(0).toUpperCase()}
              </span>
              {task.assignedTo.name}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {task.kind !== "followup" && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-muted-foreground border border-border hover:bg-muted hover:text-foreground transition"
            title="Editar tarefa"
          >
            <Pencil className="w-3 h-3" />
            Editar
          </button>
        )}
        <button
          onClick={onDelete}
          className="p-1.5 rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600 transition"
          title={task.kind === "followup" ? "Remover follow-up" : "Excluir tarefa"}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </li>
  );
}

function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function EditTaskForm({ task, onSaved }: { task: Task; onSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/leads")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setLeads(data.map((l: any) => ({ id: l.id, name: l.name })));
      })
      .catch(() => {});
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data.map((u: any) => ({ id: u.id, name: u.name })));
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const dueDateVal = fd.get("dueDate") as string;
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: fd.get("title"),
        description: fd.get("description") || null,
        priority: fd.get("priority"),
        dueDate: dueDateVal ? new Date(dueDateVal).toISOString() : null,
        leadId: fd.get("leadId") || null,
        assignedToId: fd.get("assignedToId") || null,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Erro ao salvar tarefa");
      setLoading(false);
      return;
    }
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}
      <div>
        <label className="block text-sm font-medium mb-1">Título</label>
        <input
          name="title"
          defaultValue={task.title}
          required
          className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Descrição</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={task.description || ""}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Prioridade</label>
          <select
            name="priority"
            defaultValue={task.priority}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Data e Hora</label>
          <input
            name="dueDate"
            type="datetime-local"
            defaultValue={task.dueDate ? isoToDatetimeLocal(task.dueDate) : ""}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Lead</label>
        <select
          name="leadId"
          defaultValue={task.leadId || ""}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Nenhum</option>
          {leads.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Responsável</label>
        <select
          name="assignedToId"
          defaultValue={task.assignedToId || ""}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Nenhum</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
      >
        {loading ? "Salvando..." : "Salvar"}
      </button>
    </form>
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
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/leads")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLeads(data.map((l: any) => ({ id: l.id, name: l.name })));
        }
      })
      .catch(() => {});
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data.map((u: any) => ({ id: u.id, name: u.name })));
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const dueDateVal = formData.get("dueDate") as string;
    const body = {
      title: formData.get("title"),
      description: formData.get("description") || undefined,
      dueDate: dueDateVal ? new Date(dueDateVal).toISOString() : undefined,
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Data e Hora</label>
              <input
                name="dueDate"
                type="datetime-local"
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
            <select
              name="assignedToId"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Nenhum</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
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
