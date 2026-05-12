"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";
import { Plus, Pencil, Trash2, UserCog, Shield } from "lucide-react";
import { Modal } from "@/components/ui/modal";

export default function UsuariosPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  function fetchUsers() {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => { setUsers(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { fetchUsers(); }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir o usuario "${name}"? Esta acao nao pode ser desfeita.`)) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    fetchUsers();
  }

  const roleColors: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-700",
    MANAGER: "bg-blue-100 text-blue-700",
    AGENT: "bg-gray-100 text-gray-700",
  };

  const roleLabels: Record<string, string> = {
    ADMIN: "Admin",
    MANAGER: "Gerente",
    AGENT: "Agente",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie os usuarios que acessam o CRM</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          Novo Usuario
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground bg-muted/50">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Perfil</th>
              <th className="px-4 py-3 font-medium">Deals</th>
              <th className="px-4 py-3 font-medium">Tarefas</th>
              <th className="px-4 py-3 font-medium">Criado em</th>
              <th className="px-4 py-3 font-medium">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Carregando...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Nenhum usuario</td></tr>
            ) : users.map((user) => (
              <tr key={user.id} className="border-t border-border hover:bg-muted/30 transition">
                <td className="px-4 py-3 font-medium flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  {user.name}
                </td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                    {roleLabels[user.role] || user.role}
                  </span>
                </td>
                <td className="px-4 py-3">{user._count?.deals || 0}</td>
                <td className="px-4 py-3">{user._count?.assignedTasks || 0}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(user.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditingUser(user)} className="p-1.5 rounded hover:bg-muted">
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(user.id, user.name)} className="p-1.5 rounded hover:bg-red-50">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title="Novo Usuario" onClose={() => setShowForm(false)}>
          <UserForm onSaved={() => { setShowForm(false); fetchUsers(); }} />
        </Modal>
      )}

      {editingUser && (
        <Modal title="Editar Usuario" onClose={() => setEditingUser(null)}>
          <UserForm user={editingUser} onSaved={() => { setEditingUser(null); fetchUsers(); }} />
        </Modal>
      )}
    </div>
  );
}

function UserForm({ user, onSaved }: { user?: any; onSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    const body: any = {
      name: fd.get("name"),
      email: fd.get("email"),
      role: fd.get("role"),
    };

    const password = fd.get("password") as string;
    if (password) body.password = password;

    const url = user ? `/api/users/${user.id}` : "/api/users";
    const method = user ? "PUT" : "POST";

    if (!user && !password) {
      setError("Senha é obrigatória para novos usuarios");
      setLoading(false);
      return;
    }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Erro ao salvar");
      setLoading(false);
      return;
    }

    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}
      <div>
        <label className="block text-sm font-medium mb-1">Nome *</label>
        <input name="name" required defaultValue={user?.name} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email *</label>
        <input name="email" type="email" required defaultValue={user?.email} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{user ? "Nova Senha (deixe em branco para manter)" : "Senha *"}</label>
        <input name="password" type="password" minLength={6} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder={user ? "••••••" : ""} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Perfil</label>
        <select name="role" defaultValue={user?.role || "AGENT"} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="AGENT">Agente</option>
          <option value="MANAGER">Gerente</option>
          <option value="ADMIN">Administrador</option>
        </select>
      </div>
      <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50">
        {loading ? "Salvando..." : user ? "Salvar" : "Criar Usuario"}
      </button>
    </form>
  );
}
