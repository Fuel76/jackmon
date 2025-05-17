import { useState, useEffect } from 'react';
import React from 'react';
import headerImage from '../assets/Шапка.svg';

interface MenuItem {
  id: number;
  title: string;
  link: string;
  mute: boolean;
  children?: MenuItem[];
}

const staticLinks = [
  { label: 'Расписание Богослужений', href: '/schedule' },
  { label: 'Требы', href: '/treby' },
];

function BurgerMenu() {
  const [open, setOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    fetch('http://localhost:3000/api/menu')
      .then((res) => res.json())
      .then((data) => setMenuItems(data.filter((item: MenuItem) => !item.mute)))
      .catch(() => setMenuItems([]));
  }, []);

  const renderMenu = (items: MenuItem[]): React.ReactNode =>
    items.map((item) => (
      <div key={item.id}>
        <a href={item.link} className="burger-menu-link" onClick={() => setOpen(false)}>
          {item.title}
        </a>
        {item.children && item.children.length > 0 && (
          <div style={{ paddingLeft: 16 }}>
            {renderMenu(item.children)}
          </div>
        )}
      </div>
    ));

  return (
    <div className="burger-menu">
      <div className="burger-icon" onClick={() => setOpen(true)}>
        <span></span>
        <span></span>
        <span></span>
      </div>
      {open && (
        <div className="burger-dropdown">
          <button className="burger-close" onClick={() => setOpen(false)}>&times;</button>
          <div className="burger-menu-links">
            {staticLinks.map(link => (
              <a key={link.href} href={link.href} className="burger-menu-link" onClick={() => setOpen(false)}>
                {link.label}
              </a>
            ))}
            {renderMenu(menuItems)}
          </div>
        </div>
      )}
    </div>
  );
}

export const Header = () => {
  return (
    <header className="header">
      <img className="header-background" src={headerImage} alt="Шапка" />
      <div className="button-container">
        <div className="button">
          Расписание <br /> Богослужений
        </div>
        <a href="/treby" className="button">Требы</a>
      </div>
      <BurgerMenu />
    </header>
  );
};