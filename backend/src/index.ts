import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import multer from 'multer';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { trpcRouter } from './trpc';

// Импорт маршрутов
import pagesRouter from './routes/pages';
import savePageRouter from './routes/savePage';
import newsRouter from './routes/news';
import authRouter from './routes/auth';
import menuRouter from './routes/menu';
import { carouselRouter } from './routes/carousel';
import uploadRoutes from './routes/upload';
import trebyRouter from './routes/treby';
import trebyNewRouter from './routes/trebyNew';
import paymentsRouter from './routes/payments';
import notificationsRouter from './routes/notifications';
import calendarEventsRouter from './routes/calendarEvents';
import требаTypesRouter from './routes/trebaTypes';
import требаFormFieldsRouter from './routes/trebaFormFields';
import требаPricingRulesRouter from './routes/trebaPricingRulesNew';
import scheduleRouter from './routes/schedule';
import calendarRouter from './routes/calendar';
import categoriesRouter from './routes/categories';
import tagsRouter from './routes/tags';
import statsRouter from './routes/stats';
import usersRouter from './routes/users';
import mediaRouter from './routes/media';
import backupRouter from './routes/backup';
import settingsRouter from './routes/settings';
import требаNamesAndStatusRouter from './routes/trebaNamesAndStatus';
import { requestLogger, corsMiddleware } from './middleware/globalMiddleware';
import { errorHandler } from './middleware/errorHandler';

// Загружаем переменные окружения
dotenv.config({ path: path.join(__dirname, '../.env') });
console.log('ADMIN_REGISTRATION_KEY:', process.env.ADMIN_REGISTRATION_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- ГЛОБАЛЬНЫЕ MIDDLEWARE ----------

// Безопасность
app.use(helmet({ 
  contentSecurityPolicy: false // Отключаем CSP для админ-панели
}));

// CORS
app.use(corsMiddleware);
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || '', new RegExp('\\.timeweb\\.app$'), new RegExp('\\.timeweb\\.cloud$')]
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// Логирование и парсинг
app.use(morgan('dev'));
app.use(requestLogger);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ---------- СТАТИЧЕСКИЕ ФАЙЛЫ ----------

// Объединяем пути для статических файлов
app.use('/uploads', express.static('uploads'));
app.use(express.static(path.join(__dirname, '../public')));

// ---------- API МАРШРУТЫ ----------

// tRPC маршрут
app.use(
  '/trpc',
  createExpressMiddleware({
    router: trpcRouter
  })
);

// REST API маршруты
app.use('/api/pages', pagesRouter);
app.use('/api/save-page', savePageRouter);
app.use('/api/news', newsRouter);
app.use('/api/auth', authRouter);
app.use('/api/menu', menuRouter);
app.use('/api/carousel', carouselRouter);
app.use('/api/upload', uploadRoutes);
app.use('/api/treby', trebyRouter); // Старый роутер треб
app.use('/api/v2/treby', trebyNewRouter); // Новый роутер треб с улучшенной структурой
app.use('/api/payments', paymentsRouter); // Роутер платежей
app.use('/api/notifications', notificationsRouter); // Роутер уведомлений
app.use('/api/calendar-events', calendarEventsRouter); // Роутер календарных событий
app.use('/api/treba-types', требаTypesRouter); // Роутер типов треб
app.use('/api/treba-form-fields', требаFormFieldsRouter);
app.use('/api/treba-pricing-rules', требаPricingRulesRouter);
app.use('/api/schedule', scheduleRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/users', usersRouter);
app.use('/api/media', mediaRouter);
app.use('/api/backup', backupRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/treba-names', требаNamesAndStatusRouter);
app.use('/carousel', carouselRouter); // Совместимость со старым API

// ---------- ОБРАБОТКА ОШИБОК ----------

// Middleware для ошибок маршрутизации
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

// Middleware для обработки ошибок
app.use(errorHandler);

// Глобальный обработчик ошибок
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[${new Date().toISOString()}] Ошибка: ${err.message}`);
  console.error(err.stack);
  
  res.status(500).json({ 
    error: 'Внутренняя ошибка сервера', 
    message: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// ---------- ЗАПУСК СЕРВЕРА ----------

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

export default app;
