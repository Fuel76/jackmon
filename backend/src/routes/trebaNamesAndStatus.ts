import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Получить имена для требы
router.get('/treba/:trebaId/names', async (req, res) => {
  try {
    const { trebaId } = req.params;
    const names = await prisma.trebaName.findMany({
      where: { trebaId: Number(trebaId) },
      orderBy: { id: 'asc' },
    });
    res.json(names);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении имен' });
  }
});

// Добавить имя в требу
router.post('/treba/:trebaId/names', async (req, res) => {
  try {
    const { trebaId } = req.params;
    const { name, type, rank } = req.body;
    if (!name) return res.status(400).json({ error: 'Имя обязательно' });
    // TODO: автоматическая проверка и нормализация имени
    const trebaName = await prisma.trebaName.create({
      data: {
        trebaId: Number(trebaId),
        name,
        rank,
        isValid: true,
        churchForm: null,
      },
    });
    res.status(201).json(trebaName);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при добавлении имени' });
  }
});

// Удалить имя из требы
router.delete('/names/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.trebaName.delete({ where: { id: Number(id) } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при удалении имени' });
  }
});

// Получить историю статусов требы
router.get('/treba/:trebaId/status-history', async (req, res) => {
  try {
    const { trebaId } = req.params;
    const history = await prisma.trebaStatusHistory.findMany({
      where: { trebaId: Number(trebaId) },
      orderBy: { changedAt: 'asc' },
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении истории статусов' });
  }
});

// Добавить запись в историю статусов требы
router.post('/treba/:trebaId/status-history', async (req, res) => {
  try {
    const { trebaId } = req.params;
    const { status, comment } = req.body;
    if (!status) return res.status(400).json({ error: 'Статус обязателен' });
    const entry = await prisma.trebaStatusHistory.create({
      data: {
        trebaId: Number(trebaId),
        status,
        comment,
      },
    });
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при добавлении статуса' });
  }
});

export default router;
