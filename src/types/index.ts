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
} from "@prisma/client";

export type { User, Service, Lead, Pipeline, PipelineStage, Deal, Conversation, Message, Automation, AutomationLog };

export type DealWithRelations = Deal & {
  lead: Lead;
  service: Service;
  stage: PipelineStage;
  assignedTo: User | null;
};

export type LeadWithRelations = Lead & {
  service: Service | null;
  deals: Deal[];
  conversations: Conversation[];
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
  service: Service | null;
  logs: AutomationLog[];
};

export interface DashboardStats {
  totalLeads: number;
  totalDeals: number;
  totalRevenue: number;
  conversionRate: number;
  leadsByService: { service: string; count: number; color: string }[];
  dealsByStage: { stage: string; count: number; color: string }[];
  recentLeads: Lead[];
}
