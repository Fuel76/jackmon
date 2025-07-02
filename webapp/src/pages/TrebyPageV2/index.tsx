import React, { useState, useEffect } from 'react';
import { CreateTrebaRequestV2, TrebaV2, TrebaTypeV2 } from '../../types/treba-v2';
import { TrebaApiV2, PaymentApiV2, TrebaTypesApiV2 } from '../../services/treba-api-v2';
import './TrebyPageV2.css';
import '../../styles/system-pages.css';

interface NameEntry {
  name: string;
}

const TrebyPageV2: React.FC = () => {
  const [formData, setFormData] = useState({
    type: '',
    nameType: 'ZA_ZDRAVIE' as 'ZA_ZDRAVIE' | 'ZA_UPOKOY',
    period: '',
    note: '',
    email: '',
    isAnonymous: false,
  });
  
  const [names, setNames] = useState<NameEntry[]>([
    { name: '' }
  ]);
  
  const [trebaTypes, setTrebaTypes] = useState<TrebaTypeV2[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdTreba, setCreatedTreba] = useState<TrebaV2 | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  // Загрузка типов треб при монтировании компонента
  useEffect(() => {
    const loadTrebaTypes = async () => {
      try {
        setIsLoadingTypes(true);
        const response = await TrebaTypesApiV2.getActive();
        setTrebaTypes(response.data);
      } catch (error) {
        console.error('Ошибка при загрузке типов треб:', error);
        setError('Ошибка при загрузке типов треб');
      } finally {
        setIsLoadingTypes(false);
      }
    };

    loadTrebaTypes();
  }, []);

  // Конфигурация периодов треб
  const trebaPeriods = [
    { value: 'Разовое', label: 'Разовое' },
    { value: 'Неделя', label: 'Неделя' },
    { value: 'Месяц', label: 'Месяц' },
    { value: '40 дней', label: '40 дней' },
  ];

  const addNameField = () => {
    setNames([...names, { name: '' }]);
  };

  const removeNameField = (index: number) => {
    if (names.length > 1) {
      setNames(names.filter((_, i) => i !== index));
    }
  };

  const updateNameField = (index: number, field: keyof NameEntry, value: string) => {
    const updatedNames = [...names];
    updatedNames[index] = { ...updatedNames[index], [field]: value };
    setNames(updatedNames);
  };

  const calculatePrice = () => {
    // Логика расчета стоимости на основе загруженных типов треб
    const validNames = names.filter(n => n.name.trim() !== '');
    if (validNames.length === 0) return 0;
    
    // Найти выбранный тип требы
    const selectedTrebaType = trebaTypes.find(type => type.name === formData.type);
    if (!selectedTrebaType) return 0;
    
    // Базовая цена из API
    let basePrice = selectedTrebaType.basePrice;
    
    // Множители по периоду (оставляем как было)
    const periodMultipliers: Record<string, number> = {
      'Разовое': 1,
      'Неделя': 3,
      'Месяц': 10,
      '40 дней': 15,
    };
    
    const periodMultiplier = periodMultipliers[formData.period] || 1;
    
    return Math.round(basePrice * periodMultiplier * validNames.length);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    setCreatedTreba(null);
    setPaymentUrl(null);

    // Валидация
    const validNames = names.filter(n => n.name.trim() !== '');
    if (validNames.length === 0) {
      setError('Необходимо указать хотя бы одно имя');
      setIsLoading(false);
      return;
    }

    if (!formData.type) {
      setError('Необходимо выбрать тип требы');
      setIsLoading(false);
      return;
    }

    if (!formData.period) {
      setError('Необходимо выбрать период');
      setIsLoading(false);
      return;
    }

    try {
      const requestData: CreateTrebaRequestV2 = {
        type: formData.type,
        nameType: formData.nameType,
        period: formData.period,
        names: validNames,
        note: formData.note || undefined,
        email: formData.email || undefined,
        isAnonymous: formData.isAnonymous,
      };

      const createdTreba = await TrebaApiV2.createTreba(requestData);
      setCreatedTreba(createdTreba);
      setSuccess(true);

      // Попытка создать платеж, если есть стоимость
      if (createdTreba.calculatedPrice > 0) {
        try {
          const payment = await PaymentApiV2.createPayment(createdTreba.id, 'card');
          if (payment.url) {
            setPaymentUrl(payment.url);
          }
        } catch (paymentError) {
          console.warn('Не удалось создать платеж:', paymentError);
          // Ошибка создания платежа не должна блокировать успешное создание требы
        }
      }

      // Очистка формы после успешной отправки (кроме email)
      setFormData(prev => ({ 
        ...prev, 
        type: '', 
        nameType: 'ZA_ZDRAVIE',
        period: '', 
        note: '', 
        isAnonymous: false 
      }));
      setNames([{ name: '' }]);

    } catch (err: any) {
      setError(err.message || 'Ошибка отправки требы');
    } finally {
      setIsLoading(false);
    }
  };

  const calculatedPrice = calculatePrice();

  return (
    <div className="system-page-container treby-page-v2">
      <div className="system-page-content">
        <h1 className="system-page-title handwritten">Подать записку (API v2)</h1>
        
        {error && (
          <div className="system-alert system-alert-error">
            {error}
          </div>
        )}
        
        {success && createdTreba && (
          <div className="system-alert system-alert-success">
            <h4>Треба успешно подана!</h4>
            <p>Номер требы: <strong>#{createdTreba.id}</strong></p>
            <p>Тип: <strong>{createdTreba.type}</strong></p>
            <p>Период: <strong>{createdTreba.period}</strong></p>
            <p>Стоимость: <strong>{createdTreba.calculatedPrice} {createdTreba.currency}</strong></p>
            <p>Статус: <strong>{createdTreba.status}</strong></p>
            
            {paymentUrl && (
              <div style={{ marginTop: '1rem' }}>
                <a 
                  href={paymentUrl} 
                  className="system-btn system-btn-success"
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Перейти к оплате
                </a>
              </div>
            )}
          </div>
        )}

        <div className="system-content-card">
          <form onSubmit={handleSubmit}>
            {/* Тип требы */}
            <div className="system-form-group">
              <label className="system-form-label">Тип требы *</label>
              <select
                value={formData.type}
                onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="system-input"
                required
                disabled={isLoadingTypes}
              >
                <option value="">
                  {isLoadingTypes ? 'Загрузка типов треб...' : 'Выберите тип требы'}
                </option>
                {trebaTypes.map(type => (
                  <option key={type.id} value={type.name}>
                    {type.name} - {type.basePrice} {type.currency}
                  </option>
                ))}
              </select>
            </div>

            {/* Период */}
            <div className="system-form-group">
              <label className="system-form-label">Период *</label>
              <select
                value={formData.period}
                onChange={e => setFormData(prev => ({ ...prev, period: e.target.value }))}
                className="system-input"
                required
              >
                <option value="">Выберите период</option>
                {trebaPeriods.map(period => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Тип имен */}
            <div className="system-form-group">
              <label className="system-form-label">Тип имен *</label>
              <select
                value={formData.nameType}
                onChange={e => setFormData(prev => ({ ...prev, nameType: e.target.value as 'ZA_ZDRAVIE' | 'ZA_UPOKOY' }))}
                className="system-input"
                required
              >
                <option value="ZA_ZDRAVIE">За здравие</option>
                <option value="ZA_UPOKOY">За упокой</option>
              </select>
            </div>

            {/* Имена */}
            <div className="system-form-group">
              <label className="system-form-label">Имена *</label>
              {names.map((nameEntry, index) => (
                <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    value={nameEntry.name}
                    onChange={e => updateNameField(index, 'name', e.target.value)}
                    placeholder="Введите имя"
                    className="system-input"
                    style={{ flex: 1 }}
                  />
                  {names.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeNameField(index)}
                      className="system-btn system-btn-sm system-btn-danger"
                    >
                      ✗
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addNameField}
                className="system-btn system-btn-sm system-btn-outline"
              >
                + Добавить имя
              </button>
            </div>

            {/* Записка */}
            <div className="system-form-group">
              <label className="system-form-label">Дополнительная записка</label>
              <textarea
                value={formData.note}
                onChange={e => setFormData(prev => ({ ...prev, note: e.target.value }))}
                placeholder="Дополнительные пожелания или указания"
                className="system-input"
                rows={3}
              />
            </div>

            {/* Email */}
            <div className="system-form-group">
              <label className="system-form-label">Email для уведомлений</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
                className="system-input"
              />
            </div>

            {/* Анонимно */}
            <div className="system-form-group">
              <label className="system-form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={formData.isAnonymous}
                  onChange={e => setFormData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                />
                Подать анонимно
              </label>
            </div>

            {/* Расчет стоимости */}
            {calculatedPrice > 0 && (
              <div className="system-alert system-alert-info">
                <strong>Расчетная стоимость: {calculatedPrice} RUB</strong>
              </div>
            )}

            {/* Кнопка отправки */}
            <button
              type="submit"
              disabled={isLoading}
              className="system-btn system-btn-primary system-btn-lg"
              style={{ width: '100%' }}
            >
              {isLoading ? 'Отправка...' : 'Подать требу'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TrebyPageV2;
