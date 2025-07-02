// Типы для нового API v2 треб

export interface TrebaTypeV2 {
  id: number;
  name: string;
  description?: string;
  basePrice: number;
  currency: string;
  period: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrebaNameV2 {
  id: number;
  trebaId: number;
  name: string;
  rank?: string;
  isValid: boolean;
  validationError?: string;
  churchForm?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrebaPaymentV2 {
  id: number;
  userId?: number;
  trebaId: number;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  method?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrebaStatusHistoryV2 {
  id: number;
  trebaId: number;
  status: 'PENDING' | 'PAID' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  changedAt: string;
  comment?: string;
}

export interface TrebaNotificationV2 {
  id: number;
  userId?: number;
  trebaId: number;
  type: 'EMAIL' | 'SMS' | 'PUSH';
  status: 'PENDING' | 'SENT' | 'FAILED';
  message: string;
  sentAt?: string;
  createdAt: string;
}

export interface TrebaEventV2 {
  id: number;
  trebaId: number;
  date: string;
  type: string;
  note?: string;
  createdAt: string;
}

export interface TrebaV2 {
  id: number;
  type: string;
  nameType: 'ZA_ZDRAVIE' | 'ZA_UPOKOY';
  period: string;
  status: 'PENDING' | 'PAID' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  note?: string;
  calculatedPrice: number;
  currency: string;
  userId?: number;
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
  customDate?: string;
  dynamicFieldsData?: Record<string, any>;
  
  // Связанные данные
  names: TrebaNameV2[];
  payment?: TrebaPaymentV2;
  user?: any; // User type if needed
  statusHistory: TrebaStatusHistoryV2[];
  notifications: TrebaNotificationV2[];
  events: TrebaEventV2[];
}

export interface TrebaListResponseV2 {
  data: TrebaV2[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateTrebaRequestV2 {
  type: string;
  nameType: 'ZA_ZDRAVIE' | 'ZA_UPOKOY';
  period: string;
  names: Array<{
    name: string;
  }>;
  note?: string;
  email?: string;
  isAnonymous?: boolean;
  customDate?: string;
  dynamicFieldsData?: Record<string, any>;
}

export interface TrebaStatsV2 {
  totalTreby: number;
  pendingTreby: number;
  paidTreby: number;
  completedTreby: number;
  totalRevenue: number;
  currency: string;
}
