import React, { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { TrpcProvider } from './lib/trpc';
import { HomePage } from './pages/HomePage';
import { ViewNewsPage } from './pages/ViewNewsPage';
import { CreatePage } from './pages/CreatePage';
import { Layout } from './components/layout';
import { NewsEditorPage } from './pages/NewsEditorPage';
import { PrivateRoute } from './components/PrivateRoute';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';
import { AuthProvider } from './contexts/AuthContext';
import { PagesList } from './pages/AdminPage/PagesList';
import { NewsList } from './pages/AdminPage/NewsList';

export const App = () => {
  const [pages, setPages] = useState<{ slug: string; title: string; content: string }[]>([]);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/pages'); // Убедитесь, что URL правильный
        const data = await response.json();
        setPages(data);
      } catch (error) {
        console.error('Ошибка при загрузке страниц:', error);
      }
    };

    fetchPages();
  }, []);

  return (
    <AuthProvider>
      <TrpcProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              {/* Главная страница */}
              <Route index element={<HomePage />} />

              {/* Просмотр новости */}
              <Route path="news/:neww" element={<ViewNewsPage />} />

              {/* Создание страницы */}
              <Route path="create" element={<CreatePage />} />

              {/* Добавление и редактирование новостей */}
              <Route path="news/add" element={<NewsEditorPage />} />
              <Route path="news/edit/:id" element={<NewsEditorPage />} />

              {/* Динамические страницы */}
              {pages.map((page) => (
                <Route
                  key={page.slug}
                  path={page.slug}
                  element={<div dangerouslySetInnerHTML={{ __html: page.content }} />}
                />
              ))}

              {/* Страница авторизации */}
              <Route path="/login" element={<LoginPage />} />

              {/* Админ страница */}
              <Route
                path="/admin"
                element={
                  <PrivateRoute>
                    <AdminPage />
                  </PrivateRoute>
                }
              />

              {/* Админ страницы и новости */}
              <Route path="/admin/pages" element={<PagesList />} />
              <Route path="/admin/news" element={<NewsList />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TrpcProvider>
    </AuthProvider>
  );
};
