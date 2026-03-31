import type {
  User,
  Service,
  Lead,
  Pipeline,
  PipelineStage,
  Deal,
  Conversation,
  Message,
  Automation,
  AutomationLog,
  LeadService,
  FollowUp,
  FollowUpTemplate,
} from "@prisma/client";

export type {
  User,
  Service,
  Lead,
  Pipeline,
  PipelineStage,
  Deal,
  Conversation,
  Message,
  Automation,
  AutomationLog,
  LeadService,
  FollowUp,
  FollowUpTemplate,
};

export interface Activity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  leadId: string | null;
  dealId: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ActivityWithRelations = Activity & {
  lead: Lead | null;
  deal: Deal | null;
  user: User;
};

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: Date | null;
  leadId: string | null;
  dealId: string | null;
  assignedToId: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskWithRelations = Task & {
  lead: Lead | null;
  deal: Deal | null;
  assignedTo: User | null;
  createdBy: User;
};

export type LeadWithServices = Lead & {
  services: (LeadService & { service: Service })[];
};

export type DealWithRelations = Deal & {
  lead: LeadWithServices;
  service: Service;
  stage: PipelineStage;
  assignedTo: User | null;
  activities: Activity[];
  tasks: Task[];
  followUps: FollowUp[];
};

export type LeadWithRelations = Lead & {
  services: (LeadService & { service: Service })[];
  deals: Deal[];
  conversations: Conversation[];
  activities: Activity[];
  tasks: Task[];
};

export type ConversationWithRelations = Conversation & {
  lead: Lead;
  messages: Message[];
};

export type PipelineWithStages = Pipeline & {
  stages: (PipelineStage & {
    deals: DealWithRelations[];
  })[];
};

export type AutomationWithLogs = Automation & {
  logs: AutomationLog[];
};

export interface DiagnosticProblem {
  id: string;
  description: string;
  suggestedService: string;
  priority: "high" | "medium" | "low";
  notes: string;
}

export interface DiagnosticNotes {
  problems: DiagnosticProblem[];
  currentInvestment?: string;
  mainGoal?: string;
  timeline?: string;
}

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  userId: string;
  linkUrl: string | null;
  createdAt: Date;
}

export interface ReportData {
  revenueByMonth: { month: string; revenue: number }[];
  conversionByService: { service: string; rate: number; color: string }[];
  leadsBySource: { source: string; count: number }[];
  pipelineVelocity: { stage: string; avgDays: number }[];
  topDeals: { id: string; title: string; value: number; stage: string; leadName: string }[];
}

export interface DashboardStats {
  totalLeads: number;
  totalDeals: number;
  totalRevenue: number;
  conversionRate: number;
  leadsByService: { service: string; count: number; color: string }[];
  dealsByStage: { stage: string; count: number; color: string }[];
  recentLeads: LeadWithServices[];
  pendingFollowUpsToday: number;
  staleLeadsCount: number;
}
