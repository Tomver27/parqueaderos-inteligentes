# Arquitectura de Base de Datos - Smart Parking

Este documento detalla la estructura de la base de datos para el sistema **Smart Parking**, diseñada para ser implementada en **Supabase (PostgreSQL)**.

## 1. Descripción de las Entidades

La base de datos se divide en las siguientes áreas lógicas:

### Gestión de Usuarios y Roles
- **DocumentTypes**: Definición de documentos de identidad.
- **Roles**: Tipos de acceso (Admin, Cliente, Operador).
- **Users**: Registro principal de usuarios.

### Infraestructura del Parqueadero
- **Parkings**: Sedes de los estacionamientos.
- **Spaces**: Plazas o espacios individuales dentro de cada sede.
- **Parameters**: Configuración de reglas de negocio y costos por sede.
- **ParkingOperators**: Relación de empleados asignados a sedes específicas.

### Operativa y Transaccional
- **TypeVehicles**: Categorización (Carro, Moto, etc.).
- **Vehicle**: Registro de vehículos y su relación con dueños.
- **Reservations**: Control de apartados de cupos.
- **Payments**: Gestión de transacciones y estados de pago.
- **Occupations**: Seguimiento en tiempo real de la entrada y salida de vehículos.

---

## 2. Esquema SQL

A continuación se presenta el script DDL para la creación de las tablas y sus respectivas restricciones de integridad:

```sql
-- ============================================================
-- SMART PARKING - Schema SQL para Supabase (PostgreSQL)
-- ============================================================

-- Tipos de documento
CREATE TABLE "DocumentTypes" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    name_normalized TEXT NOT NULL
);

-- Roles
CREATE TABLE "Roles" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL
);

-- Tipos de vehículo
CREATE TABLE "TypeVehicles" (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL
);

-- Usuarios
CREATE TABLE "Users" (
    id SERIAL PRIMARY KEY,
    document TEXT NOT NULL,
    first_name TEXT NOT NULL,
    second_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone_number TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    id_document_type INTEGER NOT NULL,
    id_role INTEGER NOT NULL,

    CONSTRAINT fk_Users_id_document_type_DocumentTypes
        FOREIGN KEY (id_document_type) REFERENCES "DocumentTypes"(id)
        ON DELETE NO ACTION ON UPDATE NO ACTION,

    CONSTRAINT fk_Users_id_role_Roles
        FOREIGN KEY (id_role) REFERENCES "Roles"(id)
        ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Parqueaderos
CREATE TABLE "Parkings" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    latitude TEXT NOT NULL,
    longitude TEXT NOT NULL
);

-- Espacios
CREATE TABLE "Spaces" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    id_parking INTEGER NOT NULL,
    id_typev INTEGER NOT NULL,

    CONSTRAINT fk_Spaces_id_parking_Parkings
        FOREIGN KEY (id_parking) REFERENCES "Parkings"(id)
        ON DELETE NO ACTION ON UPDATE NO ACTION,

    CONSTRAINT fk_Spaces_id_typev_TypeVehicles
        FOREIGN KEY (id_typev) REFERENCES "TypeVehicles"(id)
        ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Vehículos
CREATE TABLE "Vehicle" (
    id SERIAL PRIMARY KEY,
    plate TEXT NOT NULL,
    id_typev INTEGER NOT NULL,
    id_user INTEGER,

    CONSTRAINT fk_Vehicle_id_typev_TypeVehicles
        FOREIGN KEY (id_typev) REFERENCES "TypeVehicles"(id)
        ON DELETE NO ACTION ON UPDATE NO ACTION,

    CONSTRAINT fk_Cars_id_user_Users
        FOREIGN KEY (id_user) REFERENCES "Users"(id)
        ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Reservas
CREATE TABLE "Reservations" (
    id SERIAL PRIMARY KEY,
    date TIMESTAMP NOT NULL,
    expires_at TIMESTAMP,
    id_space INTEGER NOT NULL,
    id_car INTEGER NOT NULL,

    CONSTRAINT fk_Availabilities_id_space_Spaces
        FOREIGN KEY (id_space) REFERENCES "Spaces"(id)
        ON DELETE NO ACTION ON UPDATE NO ACTION,

    CONSTRAINT fk_Reservations_id_car_Cars
        FOREIGN KEY (id_car) REFERENCES "Vehicle"(id)
        ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Pagos
CREATE TABLE "Payments" (
    id SERIAL PRIMARY KEY,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL,
    idempotency_key TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL,
    id_car INTEGER NOT NULL,
    id_reservation INTEGER NOT NULL,

    CONSTRAINT fk_Payments_id_car_Cars
        FOREIGN KEY (id_car) REFERENCES "Vehicle"(id)
        ON DELETE NO ACTION ON UPDATE NO ACTION,

    CONSTRAINT fk_Payments_id_availability_Availabilities
        FOREIGN KEY (id_reservation) REFERENCES "Reservations"(id)
        ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Ocupaciones
CREATE TABLE "Occupations" (
    id SERIAL PRIMARY KEY,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    id_space INTEGER NOT NULL,
    id_car INTEGER,

    CONSTRAINT fk_Occupations_id_space_Spaces
        FOREIGN KEY (id_space) REFERENCES "Spaces"(id)
        ON DELETE NO ACTION ON UPDATE NO ACTION,

    CONSTRAINT fk_Occupations_id_car_Cars
        FOREIGN KEY (id_car) REFERENCES "Vehicle"(id)
        ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Operadores de parqueadero
CREATE TABLE "ParkingOperators" (
    id SERIAL PRIMARY KEY,
    id_user INTEGER NOT NULL,
    id_parking INTEGER NOT NULL,

    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_ParkingOperators_id_user_Users
        FOREIGN KEY (id_user) REFERENCES "Users"(id)
        ON DELETE NO ACTION ON UPDATE NO ACTION,

    CONSTRAINT fk_ParkingOperators_id_parking_Parkings
        FOREIGN KEY (id_parking) REFERENCES "Parkings"(id)
        ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Parámetros por parqueadero
CREATE TABLE "Parameters" (
    id SERIAL PRIMARY KEY,
    expires_reservation NUMERIC NOT NULL,
    deadline_reservation NUMERIC NOT NULL,
    cost_reservation NUMERIC NOT NULL,
    fee NUMERIC NOT NULL,
    id_parking INTEGER NOT NULL UNIQUE, -- 1-a-1 con Parkings

    CONSTRAINT fk_Parameters_id_parking_Parkings
        FOREIGN KEY (id_parking) REFERENCES "Parkings"(id)
        ON DELETE NO ACTION ON UPDATE NO ACTION
);