import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Получить все платежи
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      userId, 
      trebaId,
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const where: any = {};
    
    if (status) where.status = status;
    if (userId) where.userId = Number(userId);
    if (trebaId) where.trebaId = Number(trebaId);

    const payments = await prisma.payment.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        treba: {
          select: { 
            id: true, 
            type: true, 
            status: true, 
            createdAt: true,
            names: {
              select: { name: true }
            }
          }
        },
      },
      orderBy: { [sortBy as string]: sortOrder },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const total = await prisma.payment.count({ where });

    res.json({
      data: payments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching Payments:', error);
    res.status(500).json({ error: 'Ошибка при получении платежей' });
  }
});

// Получить платеж по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id: Number(id) },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true }
        },
        treba: {
          include: {
            names: true,
            statusHistory: {
              orderBy: { changedAt: 'desc' }
            }
          }
        },
      },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Платеж не найден' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Error fetching Payment:', error);
    res.status(500).json({ error: 'Ошибка при получении платежа' });
  }
});

// Создать новый платеж
router.post('/', async (req, res) => {
  try {
    const { 
      userId, 
      trebaId, 
      amount, 
      method = 'online',
      currency = 'RUB' 
    } = req.body;

    if (!amount) {
      return res.status(400).json({ 
        error: 'Отсутствует обязательное поле: amount' 
      });
    }

    // Проверяем, что треба существует (если указана)
    if (trebaId) {
      const treba = await prisma.treba.findUnique({
        where: { id: Number(trebaId) },
        include: { payment: true }
      });

      if (!treba) {
        return res.status(404).json({ error: 'Треба не найдена' });
      }

      if (treba.payment) {
        return res.status(400).json({ 
          error: 'Платеж уже существует для этой требы' 
        });
      }
    }

    const payment = await prisma.payment.create({
      data: {
        userId: userId || null,
        trebaId: trebaId || null,
        amount: Number(amount),
        currency,
        method,
        status: 'PENDING',
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        treba: {
          select: { id: true, type: true, status: true }
        },
      }
    });

    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating Payment:', error);
    res.status(500).json({ error: 'Ошибка при создании платежа' });
  }
});

// Обновить статус платежа
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ 
        error: 'Отсутствует обязательное поле: status' 
      });
    }

    const payment = await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: Number(id) },
        data: { 
          status: status as any,
          updatedAt: new Date(),
        },
        include: {
          treba: true
        }
      });

      // Если платеж оплачен, обновляем статус требы
      if (status === 'PAID' && updatedPayment.treba) {
        await tx.treba.update({
          where: { id: updatedPayment.trebaId! },
          data: { status: 'PAID' }
        });

        // Добавляем запись в историю статусов требы
        await tx.trebaStatusHistory.create({
          data: {
            trebaId: updatedPayment.trebaId!,
            status: 'PAID',
            comment: 'Платеж подтвержден',
          }
        });
      }

      return updatedPayment;
    });

    res.json(payment);
  } catch (error) {
    console.error('Error updating Payment status:', error);
    res.status(500).json({ error: 'Ошибка при обновлении статуса платежа' });
  }
});

// Обработать возврат средств
router.post('/:id/refund', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const payment = await prisma.payment.findUnique({
      where: { id: Number(id) },
      include: { treba: true }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Платеж не найден' });
    }

    if (payment.status !== 'PAID') {
      return res.status(400).json({ 
        error: 'Возврат возможен только для оплаченных платежей' 
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Обновляем статус платежа
      const refundedPayment = await tx.payment.update({
        where: { id: Number(id) },
        data: { 
          status: 'REFUNDED',
          updatedAt: new Date(),
        }
      });

      // Обновляем статус требы
      if (payment.treba) {
        await tx.treba.update({
          where: { id: payment.trebaId! },
          data: { status: 'CANCELLED' }
        });

        // Добавляем запись в историю
        await tx.trebaStatusHistory.create({
          data: {
            trebaId: payment.trebaId!,
            status: 'CANCELLED',
            comment: reason ? `Возврат средств: ${reason}` : 'Возврат средств',
          }
        });
      }

      return refundedPayment;
    });

    res.json(result);
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ error: 'Ошибка при обработке возврата' });
  }
});

// Получить статистику платежей
router.get('/stats/summary', async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      userId 
    } = req.query;

    const where: any = {};
    
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }
    
    if (userId) {
      where.userId = Number(userId);
    }

    const [
      totalPayments,
      paidPayments,
      pendingPayments,
      failedPayments,
      refundedPayments,
      totalAmount,
      avgAmount
    ] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.count({ where: { ...where, status: 'PAID' } }),
      prisma.payment.count({ where: { ...where, status: 'PENDING' } }),
      prisma.payment.count({ where: { ...where, status: 'FAILED' } }),
      prisma.payment.count({ where: { ...where, status: 'REFUNDED' } }),
      prisma.payment.aggregate({
        where: { ...where, status: 'PAID' },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: { ...where, status: 'PAID' },
        _avg: { amount: true }
      })
    ]);

    res.json({
      summary: {
        total: totalPayments,
        paid: paidPayments,
        pending: pendingPayments,
        failed: failedPayments,
        refunded: refundedPayments,
      },
      revenue: {
        total: totalAmount._sum.amount || 0,
        average: avgAmount._avg.amount || 0,
      }
    });
  } catch (error) {
    console.error('Error fetching Payment stats:', error);
    res.status(500).json({ error: 'Ошибка при получении статистики' });
  }
});

export default router;
