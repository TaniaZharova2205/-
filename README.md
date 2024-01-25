# Домашнее задание по курсу
# «Технологии разработки веб-приложений»
## Вариант: ТРВП-005

## База данных
Для использования базы данных требуется запустить следующие скрипты:
- Создание таблицы `destination`:
```
create table destination (
    id UUID PRIMARY KEY ,
    name VARCHAR(200) not null)
;
```
- Создание таблицы `ferry`:
```
create table ferry (
    id uuid PRIMARY KEY,
    name character varying(200) not null,
    car_place integer NOT NULL,
    load_place integer NOT NULL)
;
```
- Создание таблицы `trip`:
```
create table trip (
    id UUID PRIMARY KEY ,
    ferry_id UUID REFERENCES ferry,
    dest_id UUID REFERENCES destination,
    position integer NOT NULL,
    loads UUID[] default '{}')
;
```
- Создание таблицы `load`:
```
create table load (
    id UUID PRIMARY KEY ,
    name VARCHAR(200) not null,
    type VARCHAR(4) not null,
    trip_id UUID REFERENCES trip,
    position INTEGER NOT NULL,
    car_type VARCHAR(200) not null)
;
```
- Cоздание роли `port_admin`
```
CREATE ROLE port_admin LOGIN ENCRYPTED PASSWORD 'admin';
```
- Предоставление прав роли `port_admin`
```
GRANT  select, insert, update, delete on load, ferry, destination, trip TO port_admin;
```

# Сборка и запуск
Для сборки и запуска приложения используйте:
```
npm run dev-back
```