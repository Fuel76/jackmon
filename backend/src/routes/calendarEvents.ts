import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Получить все календарные события
router.get('/', async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      type,
      trebaId,
      page = 1, 
      limit = 50,
      sortBy = 'date',
      sortOrder = 'asc'
    } = req.query;

    const where: any = {};
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    } else if (startDate) {
      where.date = { gte: new Date(startDate as string) };
    } else if (endDate) {
      where.date = { lte: new Date(endDate as string) };
    }
    
    if (type) where.type = type;
    if (trebaId) where.trebaId = Number(trebaId);

    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        treba: {
          select: { 
            id: true, 
            type: true, 
            status: true,
            period: true,
            names: {
              select: { name: true }
            },
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
      },
      orderBy: { [sortBy as string]: sortOrder },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const total = await prisma.calendarEvent.count({ where });

    res.json({
      data: events,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching Calendar Events:', error);
    res.status(500).json({ error: 'Ошибка при получении событий календаря' });
  }
});

// Получить события за конкретный день
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);
    
    // Начало и конец дня
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const events = await prisma.calendarEvent.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        }
      },
      include: {
        treba: {
          include: {
            names: true,
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
      },
      orderBy: { date: 'asc' },
    });

    res.json({
      date: date,
      events: events,
      total: events.length
    });
  } catch (error) {
    console.error('Error fetching events for date:', error);
    res.status(500).json({ error: 'Ошибка при получении событий за дату' });
  }
});

// Получить календарь на месяц
router.get('/month/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    
    const startOfMonth = new Date(Number(year), Number(month) - 1, 1);
    const endOfMonth = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);

    const events = await prisma.calendarEvent.findMany({
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        }
      },
      include: {
        treba: {
          select: { 
            id: true, 
            type: true, 
            status: true,
            names: {
              select: { name: true }
            }
          }
        },
      },
      orderBy: { date: 'asc' },
    });

    // Группируем события по дням
    const eventsByDay = events.reduce((acc, event) => {
      const day = event.date.getDate();
      if (!acc[day]) acc[day] = [];
      acc[day].push(event);
      return acc;
    }, {} as Record<number, any[]>);

    res.json({
      year: Number(year),
      month: Number(month),
      totalEvents: events.length,
      eventsByDay
    });
  } catch (error) {
    console.error('Error fetching monthly calendar:', error);
    res.status(500).json({ error: 'Ошибка при получении месячного календаря' });
  }
});

// Получить событие по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.calendarEvent.findUnique({
      where: { id: Number(id) },
      include: {
        treba: {
          include: {
            names: true,
            user: {
              select: { id: true, name: true, email: true, phone: true }
            },
            payment: true,
            statusHistory: {
              orderBy: { changedAt: 'desc' }
            }
          }
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Событие не найдено' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error fetching Calendar Event:', error);
    res.status(500).json({ error: 'Ошибка при получении события' });
  }
});

// Создать новое событие
router.post('/', async (req, res) => {
  try {
    const { 
      trebaId, 
      date, 
      type, 
      note 
    } = req.body;

    if (!date || !type) {
      return res.status(400).json({ 
        error: 'Отсутствуют обязательные поля: date, type' 
      });
    }

    // Проверяем, что треба существует (если указана)
    if (trebaId) {
      const treba = await prisma.treba.findUnique({
        where: { id: Number(trebaId) }
      });

      if (!treba) {
        return res.status(404).json({ error: 'Треба не найдена' });
      }
    }

    const event = await prisma.calendarEvent.create({
      data: {
        trebaId: trebaId || null,
        date: new Date(date),
        type,
        note: note || null,
      },
      include: {
        treba: {
          select: { 
            id: true, 
            type: true, 
            status: true,
            names: {
              select: { name: true }
            }
          }
        },
      }
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating Calendar Event:', error);
    res.status(500).json({ error: 'Ошибка при создании события' });
  }
});

export default router;
