import React, { useState, useEffect } from 'react';
import { TrebaV2, TrebaListResponseV2 } from '../../types/treba-v2';
import { TrebaApiV2, NotificationApiV2 } from '../../services/treba-api-v2';

interface MassSummaryItem {
  trebaType: string;
  nameType: 'ZA_ZDRAVIE' | 'ZA_UPOKOY';
  trebyCount: number;
  namesCount: number;
  totalPrice: number;
}

const AdminTrebyPageV2: React.FC = () => {
  const [treby, setTreby] = useState<TrebaV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: '',
  });

  const [massSummary, setMassSummary] = useState<MassSummaryItem[]>([]);
  const [loadingMassSummary, setLoadingMassSummary] = useState(false);

  const loadTreby = async (page = 1) => {
    try {
      setLoading(true);
      const response: TrebaListResponseV2 = await TrebaApiV2.getTreby({
        page,
        limit: pagination.limit,
        ...filters,
      });
      
      setTreby(response.data);
      setPagination(response.pagination);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки треб');
      console.error('Ошибка загрузки треб:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTreby(1);
    loadMassSummary();
  }, [filters]);

  const loadMassSummary = async () => {
    try {
      setLoadingMassSummary(true);
      const response = await fetch('http://localhost:3000/api/v2/treby/mass-summary');
      if (!response.ok) throw new Error('Ошибка загрузки сводки');
      const data = await response.json();
      setMassSummary(data);
    } catch (err: any) {
      console.error('Ошибка загрузки массовой сводки:', err);
    } finally {
      setLoadingMassSummary(false);
    }
  };

  const downloadNamesForTreba = async (trebaId: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/v2/treby/${trebaId}/names/download`);
      if (!response.ok) throw new Error('Ошибка скачивания');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `treba_${trebaId}_names.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(`Ошибка скачивания: ${err.message}`);
    }
  };

  const massDownloadNames = async (trebaType: string, nameType: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/v2/treby/mass-download?trebaType=${encodeURIComponent(trebaType)}&nameType=${encodeURIComponent(nameType)}`);
      if (!response.ok) throw new Error('Ошибка массового скачивания');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${trebaType}_${nameType}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(`Ошибка массового скачивания: ${err.message}`);
    }
  };

  const handleStatusChange = async (trebaId: number, status: 'PENDING' | 'PAID' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED') => {
    try {
      await TrebaApiV2.updateTrebaStatus(trebaId, status, `Статус обновлен администратором`);
      
      // Обновляем список
      await loadTreby(pagination.page);
      
      // Отправляем уведомление об изменении статуса
      if (status === 'COMPLETED') {
        try {
          await NotificationApiV2.sendNotification(
            trebaId,
            'EMAIL',
            'Ваша треба была выполнена'
          );
        } catch (notificationError) {
          console.warn('Не удалось отправить уведомление:', notificationError);
        }
      }
      
    } catch (err: any) {
      alert(`Ошибка обновления статуса: ${err.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'PENDING': { class: 'system-badge-warning', text: 'В ожидании' },
      'PAID': { class: 'system-badge-info', text: 'Оплачено' },
      'IN_PROGRESS': { class: 'system-badge-primary', text: 'В работе' },
      'COMPLETED': { class: 'system-badge-success', text: 'Выполнено' },
      'CANCELLED': { class: 'system-badge-danger', text: 'Отменено' },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { class: 'system-badge-secondary', text: status };
    
    return (
      <span className={`system-badge ${config.class}`}>
        {config.text}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusMap = {
      'PENDING': { class: 'system-badge-warning', text: 'В ожидании' },
      'PAID': { class: 'system-badge-success', text: 'Оплачено' },
      'FAILED': { class: 'system-badge-danger', text: 'Ошибка' },
      'REFUNDED': { class: 'system-badge-secondary', text: 'Возврат' },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { class: 'system-badge-secondary', text: status };
    
    return (
      <span className={`system-badge ${config.class}`}>
        {config.text}
      </span>
    );
  };

  if (loading && treby.length === 0) {
    return (
      <div className="system-page-container">
        <div className="system-page-content">
          <div className="system-alert system-alert-info">Загрузка треб...</div>
        </div>
      </div>
    );
  }

  if (error && treby.length === 0) {
    return (
      <div className="system-page-container">
        <div className="system-page-content">
          <div className="system-alert system-alert-error">{error}</div>
          <button 
            className="system-btn system-btn-primary"
            onClick={() => loadTreby(1)}
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="system-page-container">
      <div className="system-page-content">
        <h1 className="system-page-title">Управление требами (API v2)</h1>
        
        {/* Фильтры */}
        <div className="system-content-card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <label>Статус:</label>
              <select 
                value={filters.status} 
                onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="system-input"
              >
                <option value="">Все</option>
                <option value="PENDING">В ожидании</option>
                <option value="PAID">Оплачено</option>
                <option value="IN_PROGRESS">В работе</option>
                <option value="COMPLETED">Выполнено</option>
                <option value="CANCELLED">Отменено</option>
              </select>
            </div>
            
            <div>
              <label>Тип:</label>
              <input
                type="text"
                value={filters.type}
                onChange={e => setFilters(prev => ({ ...prev, type: e.target.value }))}
                placeholder="Молебен, Панихида..."
                className="system-input"
              />
            </div>
            
            <div>
              <label>Поиск:</label>
              <input
                type="text"
                value={filters.search}
                onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Поиск по именам..."
                className="system-input"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="system-alert system-alert-error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* Массовая обработка */}
        <div className="system-content-card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Массовая обработка необработанных записок</h3>
          {loadingMassSummary ? (
            <div>Загрузка сводки...</div>
          ) : massSummary.length > 0 ? (
            <div className="system-table">
              <table>
                <thead>
                  <tr>
                    <th>Тип требы</th>
                    <th>Тип имен</th>
                    <th>Заказов</th>
                    <th>Имен</th>
                    <th>Общая сумма</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {massSummary.map((item, index) => (
                    <tr key={index}>
                      <td>{item.trebaType}</td>
                      <td>{item.nameType === 'ZA_ZDRAVIE' ? 'За здравие' : 'За упокой'}</td>
                      <td>{item.trebyCount}</td>
                      <td>{item.namesCount}</td>
                      <td>{item.totalPrice} ₽</td>
                      <td>
                        <button
                          className="system-btn system-btn-sm system-btn-primary"
                          onClick={() => massDownloadNames(item.trebaType, item.nameType)}
                        >
                          📥 Скачать все имена
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="system-text-muted">Нет необработанных записок</div>
          )}
        </div>
        
        <div className="system-content-card">
          <div className="system-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Тип</th>
                  <th>Период</th>
                  <th>Имена</th>
                  <th>Стоимость</th>
                  <th>Статус требы</th>
                  <th>Платеж</th>
                  <th>Дата создания</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {treby.map(treba => (
                  <tr key={treba.id}>
                    <td>{treba.id}</td>
                    <td>{treba.type}</td>
                    <td>{treba.period}</td>
                    <td>
                      <div style={{ maxWidth: '200px', overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.85em', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                          {treba.nameType === 'ZA_ZDRAVIE' ? 'За здравие' : 'За упокой'}
                        </div>
                        {treba.names.map(name => (
                          <div key={name.id} style={{ fontSize: '0.9em' }}>
                            {name.name}
                          </div>
                        ))}
                      </div>
                      <button
                        className="system-btn system-btn-sm system-btn-outline"
                        onClick={() => downloadNamesForTreba(treba.id)}
                        style={{ marginTop: '0.5rem', fontSize: '0.8em' }}
                      >
                        📥 Скачать
                      </button>
                    </td>
                    <td>
                      {treba.calculatedPrice} {treba.currency}
                    </td>
                    <td>
                      {getStatusBadge(treba.status)}
                    </td>
                    <td>
                      {treba.payment ? (
                        <div>
                          {getPaymentStatusBadge(treba.payment.status)}
                          <div style={{ fontSize: '0.8em', color: '#666' }}>
                            {treba.payment.amount} {treba.payment.currency}
                          </div>
                        </div>
                      ) : (
                        <span className="system-text-muted">Нет платежа</span>
                      )}
                    </td>
                    <td className="system-text-muted system-text-sm">
                      {new Date(treba.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {/* Управление статусом требы */}
                        {treba.status === 'PENDING' && (
                          <button
                            className="system-btn-outline system-btn-sm system-btn-primary"
                            onClick={() => handleStatusChange(treba.id, 'IN_PROGRESS')}
                          >
                            ▶ В работу
                          </button>
                        )}
                        
                        {treba.status === 'IN_PROGRESS' && (
                          <button
                            className="system-btn-outline system-btn-sm system-btn-success"
                            onClick={() => handleStatusChange(treba.id, 'COMPLETED')}
                          >
                            ✓ Выполнить
                          </button>
                        )}
                        
                        {['PENDING', 'PAID', 'IN_PROGRESS'].includes(treba.status) && (
                          <button
                            className="system-btn-outline system-btn-sm system-btn-danger"
                            onClick={() => handleStatusChange(treba.id, 'CANCELLED')}
                          >
                            ✗ Отменить
                          </button>                        )}

                        {/* Кнопка отмены */}
                        {treba.status !== 'CANCELLED' && (
                          <button
                            className="system-btn-outline system-btn-sm system-btn-danger"
                            onClick={() => handleStatusChange(treba.id, 'CANCELLED')}
                          >
                            ❌ Отменить
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Пагинация */}
          {pagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                className="system-btn system-btn-sm"
                disabled={pagination.page <= 1}
                onClick={() => loadTreby(pagination.page - 1)}
              >
                ← Предыдущая
              </button>
              
              <span style={{ padding: '0.5rem', alignSelf: 'center' }}>
                Страница {pagination.page} из {pagination.pages} 
                (всего: {pagination.total})
              </span>
              
              <button
                className="system-btn system-btn-sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() => loadTreby(pagination.page + 1)}
              >
                Следующая →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTrebyPageV2;
