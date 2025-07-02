import { 
  TrebaV2, 
  TrebaListResponseV2, 
  CreateTrebaRequestV2, 
  TrebaStatsV2,
  TrebaTypeV2
} from '../types/treba-v2';

const API_BASE = 'http://localhost:3000/api/v2';
const API_BASE_V1 = 'http://localhost:3000/api';

export class TrebaApiV2 {
  
  // Получить список треб с пагинацией
  static async getTreby(params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    search?: string;
  }): Promise<TrebaListResponseV2> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);
    if (params?.type) searchParams.set('type', params.type);
    if (params?.search) searchParams.set('search', params.search);
    
    const url = `${API_BASE}/treby${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Ошибка загрузки треб: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  // Получить конкретную требу
  static async getTreba(id: number): Promise<TrebaV2> {
    const response = await fetch(`${API_BASE}/treby/${id}`);
    if (!response.ok) {
      throw new Error(`Ошибка загрузки требы: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  // Создать новую требу
  static async createTreba(data: CreateTrebaRequestV2): Promise<TrebaV2> {
    const response = await fetch(`${API_BASE}/treby`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Ошибка создания требы');
    }
    
    return response.json();
  }
  
  // Обновить статус требы
  static async updateTrebaStatus(
    trebaId: number, 
    status: 'PENDING' | 'PAID' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
    comment?: string
  ): Promise<TrebaV2> {
    const response = await fetch(`${API_BASE}/treby/${trebaId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, comment }),
    });
    
    if (!response.ok) {
      throw new Error(`Ошибка обновления статуса: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  // Добавить имя к требе
  static async addNameToTreba(
    trebaId: number, 
    name: string, 
    type: 'ZA_ZDRAVIE' | 'ZA_UPOKOY'
  ): Promise<any> {
    const response = await fetch(`${API_BASE}/treby/${trebaId}/names`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, type }),
    });
    
    if (!response.ok) {
      throw new Error(`Ошибка добавления имени: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  // Получить статистику треб
  static async getStats(): Promise<TrebaStatsV2> {
    const response = await fetch(`${API_BASE}/treby/stats`);
    if (!response.ok) {
      throw new Error(`Ошибка загрузки статистики: ${response.statusText}`);
    }
    
    return response.json();
  }
}

// Сервис для работы с платежами
export class PaymentApiV2 {
  
  // Получить все платежи
  static async getAll(): Promise<{ data: any[] }> {
    const response = await fetch(`${API_BASE}/payments`);
    if (!response.ok) {
      throw new Error(`Ошибка загрузки платежей: ${response.statusText}`);
    }
    return response.json();
  }
  
  // Создать платеж для требы
  static async createPayment(trebaId: number, method?: string): Promise<any> {
    const response = await fetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trebaId, method }),
    });
    
    if (!response.ok) {
      throw new Error(`Ошибка создания платежа: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  // Обновить статус платежа
  static async updateStatus(
    paymentId: number, 
    status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED'
  ): Promise<any> {
    const response = await fetch(`${API_BASE}/payments/${paymentId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      throw new Error(`Ошибка обновления платежа: ${response.statusText}`);
    }
    
    return response.json();
  }
}

// Сервис для работы с уведомлениями  
export class NotificationApiV2 {
  
  // Получить все уведомления
  static async getAll(): Promise<{ data: any[] }> {
    const response = await fetch(`${API_BASE}/notifications`);
    if (!response.ok) {
      throw new Error(`Ошибка загрузки уведомлений: ${response.statusText}`);
    }
    return response.json();
  }
  
  // Отправить уведомление
  static async sendNotification(
    trebaId: number,
    type: 'EMAIL' | 'SMS' | 'PUSH',
    message: string,
    userId?: number
  ): Promise<any> {
    const response = await fetch(`${API_BASE}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trebaId, type, message, userId }),
    });
    
    if (!response.ok) {
      throw new Error(`Ошибка отправки уведомления: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  // Повторно отправить уведомление
  static async resend(notificationId: number): Promise<any> {
    const response = await fetch(`${API_BASE}/notifications/${notificationId}/resend`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error(`Ошибка повторной отправки уведомления: ${response.statusText}`);
    }
    
    return response.json();
  }
}

// Сервис для работы с календарными событиями
export class CalendarEventApiV2 {
  
  // Получить события по месяцу
  static async getByMonth(year: number, month: number): Promise<{ data: any[] }> {
    const response = await fetch(`${API_BASE}/calendar-events?year=${year}&month=${month}`);
    if (!response.ok) {
      throw new Error(`Ошибка загрузки событий: ${response.statusText}`);
    }
    return response.json();
  }
  
  // Создать событие для требы
  static async createEvent(
    trebaId: number,
    date: string,
    type: string,
    note?: string
  ): Promise<any> {
    const response = await fetch(`${API_BASE}/calendar-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trebaId, date, type, note }),
    });
    
    if (!response.ok) {
      throw new Error(`Ошибка создания события: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  // Удалить событие
  static async delete(eventId: number): Promise<any> {
    const response = await fetch(`${API_BASE}/calendar-events/${eventId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Ошибка удаления события: ${response.statusText}`);
    }
    
    return response.json();
  }
}

// Сервис для работы с типами треб
export class TrebaTypesApiV2 {
  
  // Получить все типы треб
  static async getAll(): Promise<{ data: TrebaTypeV2[], total: number }> {
    const response = await fetch(`${API_BASE_V1}/treba-types`);
    if (!response.ok) {
      throw new Error(`Ошибка загрузки типов треб: ${response.statusText}`);
    }
    return response.json();
  }
  
  // Получить активные типы треб
  static async getActive(): Promise<{ data: TrebaTypeV2[], total: number }> {
    const response = await fetch(`${API_BASE_V1}/treba-types/active`);
    if (!response.ok) {
      throw new Error(`Ошибка загрузки активных типов треб: ${response.statusText}`);
    }
    return response.json();
  }
  
  // Получить конкретный тип требы
  static async getById(id: number): Promise<TrebaTypeV2> {
    const response = await fetch(`${API_BASE_V1}/treba-types/${id}`);
    if (!response.ok) {
      throw new Error(`Ошибка загрузки типа требы: ${response.statusText}`);
    }
    return response.json();
  }
  
  // Создать новый тип требы
  static async create(data: {
    name: string;
    description?: string;
    basePrice: number;
    currency?: string;
    period?: string;
    isActive?: boolean;
  }): Promise<TrebaTypeV2> {
    const response = await fetch(`${API_BASE_V1}/treba-types`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Ошибка создания типа требы: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  // Обновить тип требы
  static async update(id: number, data: {
    name: string;
    description?: string;
    basePrice: number;
    currency?: string;
    period?: string;
    isActive?: boolean;
  }): Promise<TrebaTypeV2> {
    const response = await fetch(`${API_BASE_V1}/treba-types/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Ошибка обновления типа требы: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  // Переключить активность типа требы
  static async toggleActive(id: number): Promise<TrebaTypeV2> {
    const response = await fetch(`${API_BASE_V1}/treba-types/${id}/toggle-active`, {
      method: 'PATCH',
    });
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `Ошибка изменения статуса типа требы: ${response.statusText}`);
      } catch (parseError) {
        throw new Error(`Ошибка изменения статуса типа требы: ${response.statusText}`);
      }
    }
    
    return response.json();
  }

  // Удалить тип требы
  static async delete(id: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_V1}/treba-types/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      // Попробуем получить детальное сообщение об ошибке
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `Ошибка удаления типа требы: ${response.statusText}`);
      } catch (parseError) {
        throw new Error(`Ошибка удаления типа требы: ${response.statusText}`);
      }
    }
    
    return response.json();
  }

  // Скачать имена для конкретной требы
  static async downloadNamesForTreba(trebaId: number): Promise<Blob> {
    const response = await fetch(`${API_BASE}/treby/${trebaId}/names/download`);
    if (!response.ok) {
      throw new Error(`Ошибка скачивания имен: ${response.statusText}`);
    }
    
    return response.blob();
  }

  // Массовое скачивание имен по типу требы и типу имен
  static async massDownloadNames(trebaType: string, nameType: string, status?: string): Promise<Blob> {
    const searchParams = new URLSearchParams();
    searchParams.set('trebaType', trebaType);
    searchParams.set('nameType', nameType);
    if (status) searchParams.set('status', status);

    const response = await fetch(`${API_BASE}/treby/mass-download?${searchParams.toString()}`);
    if (!response.ok) {
      throw new Error(`Ошибка массового скачивания: ${response.statusText}`);
    }
    
    return response.blob();
  }

  // Получить сводку по необработанным требам для массовой обработки
  static async getMassSummary(): Promise<Array<{
    trebaType: string;
    nameType: 'ZA_ZDRAVIE' | 'ZA_UPOKOY';
    trebyCount: number;
    namesCount: number;
    totalPrice: number;
  }>> {
    const response = await fetch(`${API_BASE}/treby/mass-summary`);
    if (!response.ok) {
      throw new Error(`Ошибка получения сводки: ${response.statusText}`);
    }
    
    return response.json();
  }
}
