import React from 'react';
import './AboutPage.css';

const AboutPage: React.FC = () => {
  return (
    <div className="about-page">
      <div className="about-container">
        {/* Заголовок страницы */}
        <section className="about-header">
          <h1 className="about-title">Спасо-Яковлевский Димитриев монастырь</h1>
          <p className="about-subtitle">Древняя святыня Ростова Великого</p>
        </section>

        {/* Основная информация */}
        <section className="about-main-info">
          <div className="about-text-block">
            <h2>История монастыря</h2>
            <p>
              Спасо-Яковлевский Димитриев монастырь — один из древнейших монастырей Русской Православной Церкви, 
              основанный в XIV веке святителем Иаковом Ростовским. Расположен на берегу озера Неро в Ростове Великом.
            </p>
            <p>
              В 1764 году к монастырю был присоединен упраздненный Димитриевский монастырь, после чего обитель 
              получила двойное наименование. Здесь покоятся мощи святителя Димитрия Ростовского, одного из 
              наиболее почитаемых святых Русской Церкви.
            </p>
          </div>
          
          <div className="about-image-block">
            <div className="monastery-image-placeholder">
              <span>Фото монастыря</span>
            </div>
          </div>
        </section>

        {/* Настоятель и управление */}
        <section className="abbot-section">
          <h2 className="section-title">Управление монастырем</h2>
          <div className="management-info">
            <div className="management-card">
              <h3>Настоятель</h3>
              <p className="management-description">
                Духовное и административное руководство монастырем осуществляет настоятель, 
                который назначается правящим архиереем Ярославской епархии. Настоятель 
                руководит братией, координирует богослужебную, хозяйственную и 
                просветительскую деятельность обители.
              </p>
            </div>
            
            <div className="management-card">
              <h3>Братский совет</h3>
              <p className="management-description">
                В управлении монастырем участвует братский совет, состоящий из старших 
                насельников. Совет рассматривает важные вопросы внутренней жизни обители, 
                принятия новых послушников и развития монастыря.
              </p>
            </div>
            
            <div className="spiritual-guidance">
              <h4>Духовное окормление</h4>
              <p>
                Монастырь является важным духовным центром, где верующие могут получить 
                духовное окормление, принять участие в богослужениях, исповедаться и 
                причаститься. Священнослужители монастыря ведут активную пастырскую работу.
              </p>
            </div>
          </div>
        </section>

        {/* Монашеская жизнь */}
        <section className="brotherhood-section">
          <h2 className="section-title">Монашеская жизнь</h2>
          <div className="brotherhood-info">
            <p className="brotherhood-description">
              В Спасо-Яковлевском Димитриевом монастыре ведется полноценная монашеская жизнь 
              согласно древним традициям Русской Православной Церкви. Братия монастыря 
              состоит из насельников разного духовного опыта и послушаний.
            </p>
            
            <div className="monastic-life-grid">
              <div className="life-aspect-card">
                <div className="card-icon">☦</div>
                <h4>Богослужебная жизнь</h4>
                <p>Ежедневное совершение утреннего и вечернего богослужений, Божественной литургии, молебнов и панихид</p>
              </div>
              
              <div className="life-aspect-card">
                <div className="card-icon">🕯</div>
                <h4>Молитвенное правило</h4>
                <p>Личное и общее молитвенное правило, чтение Иисусовой молитвы, изучение священных текстов</p>
              </div>
              
              <div className="life-aspect-card">
                <div className="card-icon">⛪</div>
                <h4>Послушания</h4>
                <p>Различные виды монастырских послушаний: алтарное служение, уход за храмом, хозяйственные работы</p>
              </div>
              
              <div className="life-aspect-card">
                <div className="card-icon">📜</div>
                <h4>Духовное образование</h4>
                <p>Изучение богословия, церковной истории, святоотеческого наследия и монашеских традиций</p>
              </div>
            </div>
            
            <div className="brotherhood-structure">
              <h4>Структура братии:</h4>
              <div className="structure-list">
                <div className="structure-item">
                  <strong>Иеромонахи</strong> — священнослужители, совершающие богослужения и таинства
                </div>
                <div className="structure-item">
                  <strong>Иеродиаконы</strong> — диаконы, помогающие в богослужениях
                </div>
                <div className="structure-item">
                  <strong>Монахи</strong> — братия, принявшая монашеские обеты
                </div>
                <div className="structure-item">
                  <strong>Послушники</strong> — готовящиеся к принятию монашества
                </div>
                <div className="structure-item">
                  <strong>Трудники</strong> — помощники в хозяйственных работах
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Святыни и храмы */}
        <section className="shrines-section">
          <h2 className="section-title">Святыни и храмы монастыря</h2>
          <div className="shrines-grid">
            
            <div className="shrine-card">
              <h4>Собор Зачатия Праведной Анны</h4>
              <p>
                Главный храм монастыря, построенный в 1686 году. Здесь находится рака с мощами 
                святителя Димитрия Ростовского.
              </p>
            </div>

            <div className="shrine-card">
              <h4>Церковь Святителя Иакова</h4>
              <p>
                Древнейший храм обители, построенный над гробом основателя монастыря — 
                святителя Иакова Ростовского.
              </p>
            </div>

            <div className="shrine-card">
              <h4>Димитриевский храм</h4>
              <p>
                Храм, построенный в честь святителя Димитрия Ростовского. Здесь совершаются 
                ежедневные богослужения.
              </p>
            </div>

            <div className="shrine-card">
              <h4>Колокольня</h4>
              <p>
                Высокая колокольня XVIII века с уникальным набором колоколов, звон которых 
                слышен далеко за пределами Ростова.
              </p>
            </div>

          </div>
        </section>

        {/* Посещение и контакты */}
        <section className="pilgrimage-section">
          <h2 className="section-title">Посещение монастыря</h2>
          <div className="pilgrimage-info">
            <div className="pilgrimage-text">
              <p>
                Спасо-Яковлевский Димитриев монастырь открыт для посещения верующими и паломниками. 
                Здесь можно помолиться у мощей святителя Димитрия Ростовского, принять участие в 
                богослужениях, получить духовное окормление.
              </p>
              <div className="pilgrimage-schedule">
                <h4>Режим работы:</h4>
                <ul>
                  <li><strong>Ежедневно:</strong> с 7:00 до 19:00</li>
                  <li><strong>Богослужения:</strong> утреня в 7:00, литургия в 8:00, вечерня в 17:00</li>
                  <li><strong>Экскурсии:</strong> по предварительной договорённости</li>
                  <li><strong>Паломнические группы:</strong> принимаются по предварительной записи</li>
                </ul>
              </div>
              
              <div className="services-info">
                <h4>Духовные услуги:</h4>
                <ul>
                  <li>Молебны и панихиды</li>
                  <li>Исповедь и причастие</li>
                  <li>Духовные беседы</li>
                  <li>Венчание и крещение (по договорённости)</li>
                </ul>
              </div>
            </div>
            
            <div className="contact-info">
              <h4>Как добраться:</h4>
              <p><strong>Адрес:</strong> Ярославская область, г. Ростов, ул. Энгельса, 44</p>
              <p><strong>Ориентиры:</strong> Берег озера Неро, исторический центр Ростова Великого</p>
              
              <h4 style={{marginTop: '2rem'}}>Контактная информация:</h4>
              <p><strong>Канцелярия:</strong> +7 (48536) 6-35-44</p>
              <p><strong>Экскурсии:</strong> по предварительной записи</p>
              <p>
                <strong>Примечание:</strong> Актуальную информацию о богослужениях и мероприятиях 
                рекомендуется уточнять по телефону канцелярии.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default AboutPage;
