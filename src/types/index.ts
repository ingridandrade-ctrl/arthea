import type {
  User,
  Service,
  Lead,
  Pipeline,
  PipelineStage,
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
  leadServiceId: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ActivityWithRelations = Activity & {
  lead: Lead | null;
  leadService: LeadService | null;
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
  leadServiceId: string | null;
  assignedToId: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskWithRelations = Task & {
  lead: Lead | null;
  leadService: LeadService | null;
  assignedTo: User | null;
  createdBy: User;
};

export type LeadWithServices = Lead & {
  services: (LeadService & { service: Service; stage?: PipelineStage | null })[];
};

export type LeadServiceWithRelations = LeadService & {
  lead: LeadWithServices;
  service: Service;
  stage: PipelineStage | null;
  activities: Activity[];
  tasks: Task[];
  followUps: FollowUp[];
};

export type LeadWithRelations = Lead & {
  services: (LeadService & { service: Service; stage?: PipelineStage | null })[];
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
    leadServices: LeadServiceWithRelations[];
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
  totalLeadServices: number;
  totalRevenue: number;
  conversionRate: number;
  leadsByService: { service: string; count: number; color: string }[];
  dealsByStage: { stage: string; count: number; color: string }[];
  recentLeads: LeadWithServices[];
  pendingFollowUpsToday: number;
  staleLeadsCount: number;
}
