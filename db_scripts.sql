-- DB & tables
CREATE DATABASE port_administration if not exists;


create table ferry (
    id uuid PRIMARY KEY,
    name character varying(200) not null,
    car_place integer NOT NULL,
    load_place integer NOT NULL)
;

create table destination (
    id UUID PRIMARY KEY ,
    name VARCHAR(200) not null)
;


create table trip (
    id UUID PRIMARY KEY ,
    ferry_id UUID REFERENCES ferry,
    dest_id UUID REFERENCES destination,
    position integer NOT NULL,
    loads UUID[] default '{}')
;


create table load (
    id UUID PRIMARY KEY ,
    name VARCHAR(200) not null,
    type VARCHAR(4) not null,
    trip_id UUID REFERENCES trip,
    position INTEGER NOT NULL,
    car_type VARCHAR(200) not null)
;

-- User (actions: select, insert, update, delete)

CREATE ROLE port_admin LOGIN ENCRYPTED PASSWORD 'admin';
GRANT  select, insert, update, delete on load, ferry, destination, trip TO port_admin;
