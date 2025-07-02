import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Функция для транслитерации кириллицы в латиницу
function transliterate(text: string): string {
  const map: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
    'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
    'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
    'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
    'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
    ' ': '_', '/': '_', '\\': '_', '(': '', ')': '', '[': '', ']': '',
    '{': '', '}': '', '|': '_', '?': '', '*': '', '<': '', '>': '',
    '"': '', "'": '', ':': '', ';': '', ',': '', '.': ''
  };

  return text.split('').map(char => map[char] || char).join('');
}

// Функция для валидации и обработки имен
async function processNames(names: { name: string }[]) {
  const processedNames = [];
  
  for (const nameObj of names) {
    const name = nameObj.name;
    
    if (!name || !name.trim()) continue;
    
    // Базовая валидация имени (можно расширить)
    const isValid = name.trim().length > 0 && /^[а-яё\s\-\.]+$/i.test(name.trim());
    
    processedNames.push({
      name: name.trim(),
      isValid,
      validationError: isValid ? null : 'Имя содержит недопустимые символы',
      churchForm: isValid ? name.trim() : null,
    });
  }
  
  return processedNames;
}

// Функция для расчета стоимости на основе типов треб из базы данных
async function calculatePrice(names: any[], type: string, period: string): Promise<number> {
  try {
    // Найти тип требы в базе данных
    const trebaType = await prisma.trebaType.findFirst({
      where: {
        name: type,
        isActive: true
      }
    });

    if (!trebaType) {
      console.warn(`Тип требы "${type}" не найден в базе данных. Используем базовую цену.`);
      return names.length * 50; // fallback цена
    }

    // Базовая цена из базы данных
    let basePrice = trebaType.basePrice;

    // Множители по периоду (должны соответствовать frontend)
    const periodMultipliers: Record<string, number> = {
      'Разовое': 1,
      'Неделя': 3,
      'Месяц': 10,
      '40 дней': 15,
    };

    const periodMultiplier = periodMultipliers[period] || 1;

    return Math.round(basePrice * periodMultiplier * names.length);
  } catch (error) {
    console.error('Ошибка при расчете стоимости:', error);
    return names.length * 50; // fallback цена
  }
}

// Создать новую требу
router.post('/', async (req, res) => {
  try {
    const { 
      type, 
      nameType,
      names, 
      note, 
      period = 'Разовое', 
      userId, 
      isAnonymous = false,
      customDate,
      dynamicFieldsData 
    } = req.body;

    // Валидация входных данных
    if (!type || !nameType || !names || !Array.isArray(names)) {
      return res.status(400).json({ 
        error: 'Отсутствуют обязательные поля: type, nameType, names (должен быть массивом)' 
      });
    }

    // Обработка имен
    const processedNames = await processNames(names);
    
    // Расчет стоимости (асинхронный вызов)
    const calculatedPrice = await calculatePrice(processedNames, type, period);

    // Создание требы с транзакцией
    const result = await prisma.$transaction(async (tx) => {
      // Создаем требу
      const treba = await tx.treba.create({
        data: {
          type,
          nameType,
          period,
          note,
          userId: userId || null,
          isAnonymous,
          customDate: customDate ? new Date(customDate) : null,
          dynamicFieldsData: dynamicFieldsData || null,
          calculatedPrice,
          currency: 'RUB',
        }
      });

      // Создаем имена
      const createdNames = await Promise.all(
        processedNames.map(nameData => 
          tx.trebaName.create({
            data: {
              ...nameData,
              trebaId: treba.id,
            }
          })
        )
      );

      // Создаем запись в истории статусов
      await tx.trebaStatusHistory.create({
        data: {
          trebaId: treba.id,
          status: 'PENDING',
          comment: 'Треба создана',
        }
      });

      return { treba, names: createdNames };
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating Treba:', error);
    res.status(500).json({ error: 'Ошибка при создании заявки' });
  }
});

// Получить все требы с полной информацией
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      type, 
      userId, 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const where: any = {};
    
    if (status) where.status = status;
    if (type) where.type = type;
    if (userId) where.userId = Number(userId);

    const treby = await prisma.treba.findMany({
      where,
      include: {
        names: true,
        payment: true,
        user: {
          select: { id: true, name: true, email: true }
        },
        statusHistory: {
          orderBy: { changedAt: 'desc' }
        },
        notifications: true,
        events: true,
      },
      orderBy: { [sortBy as string]: sortOrder },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const total = await prisma.treba.count({ where });

    res.json({
      data: treby,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching Treby:', error);
    res.status(500).json({ error: 'Ошибка при получении заявок' });
  }
});

// Получение сводки по типам треб и именам
router.get('/mass-summary', async (req, res) => {
  try {
    const { status } = req.query;

    const where: any = {};
    
    // Фильтр по статусу (только необработанные по умолчанию)
    if (status) {
      where.status = status as string;
    } else {
      where.status = { in: ['PENDING', 'PAID'] }; // Необработанные
    }

    const treby = await prisma.treba.findMany({
      where,
      include: {
        _count: {
          select: {
            names: true
          }
        }
      }
    });

    // Группируем по типу требы и типу имен
    const summary: Record<string, Record<string, { count: number; namesCount: number }>> = {};

    treby.forEach(treba => {
      const trebaType = treba.type;
      const nameType = treba.nameType || 'UNKNOWN';
      
      if (!summary[trebaType]) {
        summary[trebaType] = {};
      }
      
      if (!summary[trebaType][nameType]) {
        summary[trebaType][nameType] = { count: 0, namesCount: 0 };
      }
      
      summary[trebaType][nameType].count += 1;
      summary[trebaType][nameType].namesCount += treba._count.names;
    });

    res.json({ summary });
  } catch (error) {
    console.error('Error getting mass summary:', error);
    res.status(500).json({ error: 'Ошибка при получении сводки' });
  }
});

// Массовое скачивание имен по типу требы и типу имен
router.get('/mass-download', async (req, res) => {
  try {
    const { trebaType, nameType, status } = req.query;

    if (!trebaType || !nameType) {
      return res.status(400).json({ 
        error: 'Необходимо указать trebaType и nameType' 
      });
    }

    const where: any = {
      type: trebaType as string,
      nameType: nameType as any,
    };

    // Фильтр по статусу (только необработанные по умолчанию)
    if (status) {
      where.status = status as string;
    } else {
      where.status = { in: ['PENDING', 'PAID'] }; // Необработанные
    }

    const treby = await prisma.treba.findMany({
      where,
      include: {
        names: {
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    if (treby.length === 0) {
      return res.status(404).json({ 
        error: 'Не найдено треб по указанным критериям' 
      });
    }

    // Формируем объединенный CSV
    const nameTypeText = nameType === 'ZA_ZDRAVIE' ? 'за здравие' : 'за упокой';
    let csvContent = `Треба: ${trebaType} (${nameTypeText})\n`;
    csvContent += `Количество заказов: ${treby.length}\n`;
    csvContent += `Дата формирования: ${new Date().toLocaleDateString('ru-RU')}\n\n`;

    let totalNames = 0;
    treby.forEach((treba, trebaIndex) => {
      csvContent += `\n--- Заказ ${trebaIndex + 1} (ID: ${treba.id}) ---\n`;
      csvContent += `Дата: ${new Date(treba.createdAt).toLocaleDateString('ru-RU')}\n`;
      csvContent += `Статус: ${treba.status}\n`;
      if (treba.note) {
        csvContent += `Примечание: ${treba.note}\n`;
      }
      csvContent += `Имена:\n`;
      
      treba.names.forEach((name: any, nameIndex: number) => {
        csvContent += `${nameIndex + 1}. ${name.name}\n`;
        totalNames++;
      });
    });

    csvContent += `\n--- ИТОГО ---\n`;
    csvContent += `Всего имен: ${totalNames}\n`;

    // Создаем безопасное имя файла с транслитерацией
    const nameTypeForFile = nameType === 'ZA_ZDRAVIE' ? 'za_zdravie' : 'za_upokoy';
    const safeTreebaType = transliterate(trebaType as string);
    const date = new Date().toISOString().split('T')[0];
    const filename = `${safeTreebaType}_${nameTypeForFile}_${date}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Encoding', 'UTF-8');
    
    // Добавляем BOM для корректного отображения кириллицы в Excel
    res.write('\uFEFF');
    res.end(csvContent);
  } catch (error) {
    console.error('Error mass downloading names:', error);
    res.status(500).json({ error: 'Ошибка при массовом скачивании имен' });
  }
});

// Получить одну требу по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const treba = await prisma.treba.findUnique({
      where: { id: Number(id) },
      include: {
        names: true,
        payment: true,
        user: {
          select: { id: true, name: true, email: true, phone: true }
        },
        statusHistory: {
          orderBy: { changedAt: 'desc' }
        },
        notifications: {
          orderBy: { createdAt: 'desc' }
        },
        events: {
          orderBy: { date: 'asc' }
        },
      },
    });

    if (!treba) {
      return res.status(404).json({ error: 'Треба не найдена' });
    }

    res.json(treba);
  } catch (error) {
    console.error('Error fetching Treba:', error);
    res.status(500).json({ error: 'Ошибка при получении заявки' });
  }
});

// Обновить статус требы
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Отсутствует обязательное поле: status' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Обновляем требу
      const treba = await tx.treba.update({
        where: { id: Number(id) },
        data: { 
          status: status as any,
          updatedAt: new Date(),
        }
      });

      // Добавляем запись в историю
      await tx.trebaStatusHistory.create({
        data: {
          trebaId: Number(id),
          status: status as any,
          comment: comment || null,
        }
      });

      return treba;
    });

    res.json(result);
  } catch (error) {
    console.error('Error updating Treba status:', error);
    res.status(500).json({ error: 'Ошибка при обновлении статуса' });
  }
});

// Создать платеж для требы
router.post('/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, method, userId } = req.body;

    // Проверяем, что треба существует
    const treba = await prisma.treba.findUnique({
      where: { id: Number(id) },
      include: { payment: true }
    });

    if (!treba) {
      return res.status(404).json({ error: 'Треба не найдена' });
    }

    if (treba.payment) {
      return res.status(400).json({ error: 'Платеж уже существует для этой требы' });
    }

    const payment = await prisma.payment.create({
      data: {
        trebaId: Number(id),
        userId: userId || treba.userId,
        amount: amount || treba.calculatedPrice || 0,
        method: method || 'online',
        status: 'PENDING',
      }
    });

    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating Payment:', error);
    res.status(500).json({ error: 'Ошибка при создании платежа' });
  }
});

// Добавить событие в календарь для требы
router.post('/:id/calendar-event', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, type: eventType, note } = req.body;

    if (!date || !eventType) {
      return res.status(400).json({ 
        error: 'Отсутствуют обязательные поля: date, type' 
      });
    }

    const event = await prisma.calendarEvent.create({
      data: {
        trebaId: Number(id),
        date: new Date(date),
        type: eventType,
        note: note || null,
      }
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating Calendar Event:', error);
    res.status(500).json({ error: 'Ошибка при создании события' });
  }
});

// Отправить уведомление
router.post('/:id/notification', async (req, res) => {
  try {
    const { id } = req.params;
    const { type: notificationType, message, userId } = req.body;

    if (!notificationType || !message) {
      return res.status(400).json({ 
        error: 'Отсутствуют обязательные поля: type, message' 
      });
    }

    const notification = await prisma.notification.create({
      data: {
        trebaId: Number(id),
        userId: userId || null,
        type: notificationType as any,
        message,
        status: 'PENDING',
      }
    });

    // Здесь можно добавить логику отправки уведомления
    // await sendNotification(notification);

    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating Notification:', error);
    res.status(500).json({ error: 'Ошибка при создании уведомления' });
  }
});

// Удалить требу (мягкое удаление)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.$transaction(async (tx) => {
      // Обновляем статус на CANCELLED
      await tx.treba.update({
        where: { id: Number(id) },
        data: { 
          status: 'CANCELLED',
          updatedAt: new Date(),
        }
      });

      // Добавляем запись в историю
      await tx.trebaStatusHistory.create({
        data: {
          trebaId: Number(id),
          status: 'CANCELLED',
          comment: 'Треба отменена',
        }
      });
    });

    res.json({ message: 'Треба успешно отменена' });
  } catch (error) {
    console.error('Error cancelling Treba:', error);
    res.status(500).json({ error: 'Ошибка при отмене заявки' });
  }
});

export default router;
