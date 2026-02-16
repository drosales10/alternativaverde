--
-- PostgreSQL database dump
--

-- Dumped from database version 13.3
-- Dumped by pg_dump version 13.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: collection_centers; Type: TABLE DATA; Schema: public; Owner: -
--

SET SESSION AUTHORIZATION DEFAULT;

ALTER TABLE public.collection_centers DISABLE TRIGGER ALL;

INSERT INTO public.collection_centers (id, name, state, city, address, is_active, created_at) VALUES ('cc_1', 'Centro de Acopio Puerto Ordaz', 'Bolívar', 'Puerto Ordaz', 'Villa Chaparral 10, Edo. Bolívar', true, '2026-02-13 20:19:13.106044-04');
INSERT INTO public.collection_centers (id, name, state, city, address, is_active, created_at) VALUES ('cc_1771272570127', 'Centro de Acopio Los Andes', 'Mérida', 'Mérida', 'Av. Las Américas, Res. El Palmar P1 1D', true, '2026-02-16 16:09:30.189406-04');


ALTER TABLE public.collection_centers ENABLE TRIGGER ALL;

--
-- Data for Name: app_configuration; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.app_configuration DISABLE TRIGGER ALL;

INSERT INTO public.app_configuration (id, collection_center_id, updated_at) VALUES (1, NULL, '2026-02-16 16:23:05.420805-04');


ALTER TABLE public.app_configuration ENABLE TRIGGER ALL;

--
-- Data for Name: collection_center_members; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.collection_center_members DISABLE TRIGGER ALL;

INSERT INTO public.collection_center_members (id, center_id, full_name, phone, role, is_active, created_at, cedula) VALUES ('ccm_1771206449878', 'cc_1', 'Denny Javier Rosales Rangel', '0414-4120225', 'Jefe de Operaciones Estado Bolívar', true, '2026-02-15 21:47:29.93333-04', '11952580');
INSERT INTO public.collection_center_members (id, center_id, full_name, phone, role, is_active, created_at, cedula) VALUES ('ccm_1', 'cc_1', 'Rafael Díaz', '0414-8576794', 'Recolector', true, '2026-02-13 20:19:13.109216-04', '11461751');
INSERT INTO public.collection_center_members (id, center_id, full_name, phone, role, is_active, created_at, cedula) VALUES ('ccm_1771272617291', 'cc_1771272570127', 'Diana Villafraz', '0424-8762299', 'Gerente de Operaciones', true, '2026-02-16 16:10:17.339572-04', '10987654');
INSERT INTO public.collection_center_members (id, center_id, full_name, phone, role, is_active, created_at, cedula) VALUES ('ccm_1771272645371', 'cc_1771272570127', 'Josué Rodríguez', '0414-7682211', 'Recolector', true, '2026-02-16 16:10:45.427042-04', '118762288');


ALTER TABLE public.collection_center_members ENABLE TRIGGER ALL;

--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.vehicles DISABLE TRIGGER ALL;

INSERT INTO public.vehicles (id, plate, brand, model, owner, is_default, created_at, collection_center_id) VALUES ('veh_1', 'LAJ70X', 'JEEP CHEROKEE', 'LIBERTY', 'Denny Rosales', true, '2026-02-13 20:19:13.095479-04', 'cc_1');
INSERT INTO public.vehicles (id, plate, brand, model, owner, is_default, created_at, collection_center_id) VALUES ('veh_2', '57LDBC', 'CHEVROLET', 'LUD D-MAX', 'Freddy Jaimes', false, '2026-02-13 20:19:13.095479-04', 'cc_1');
INSERT INTO public.vehicles (id, plate, brand, model, owner, is_default, created_at, collection_center_id) VALUES ('veh_1771200354176', 'A00AO6D', 'VOLVO', 'CISTERNA', 'Alternativa Verde', false, '2026-02-15 20:05:54.267381-04', 'cc_1');
INSERT INTO public.vehicles (id, plate, brand, model, owner, is_default, created_at, collection_center_id) VALUES ('veh_1771272675690', 'TGR432', 'CHECROLET', 'MONTANA', 'Diana Villafraz', true, '2026-02-16 16:11:15.741399-04', 'cc_1771272570127');


ALTER TABLE public.vehicles ENABLE TRIGGER ALL;

--
-- Data for Name: dispatches; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.dispatches DISABLE TRIGGER ALL;

INSERT INTO public.dispatches (id, date, description, presentation, dispatched_quantity, destination_name, destination_rif, destination_address, vehicle_id, driver_name, driver_id, minec_guide_number, created_at, collection_center_id) VALUES ('disp_1771200302088', '2026-01-15', 'Aceite de Fritura No Apto para Consumo Humano', 'Litros', 100, 'Granja Avícola Chichi', 'J-30563517-0', 'Zona Industrial Maturin Manzana 9 Parcelas 4,5,6,7 Y 8 Detrás De Polar Maturin Edo. Monagas', 'veh_2', 'Merwill Natera', '9672884', 'N°03-05-T-Ac-2024-398', '2026-02-15 20:05:02.207238-04', 'cc_1');


ALTER TABLE public.dispatches ENABLE TRIGGER ALL;

--
-- Data for Name: generators; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.generators DISABLE TRIGGER ALL;

INSERT INTO public.generators (id, name, rif, phone, address, sector, created_at, collection_center_id, collection_mode) VALUES ('gen_1771272727337', 'La Nota', 'J-87611990', '0412-8762233', 'Av. Las Américas cruce La otra Banda', 'Las Américas', '2026-02-16 16:12:07.388603-04', 'cc_1771272570127', 'Quincenal');
INSERT INTO public.generators (id, name, rif, phone, address, sector, created_at, collection_center_id, collection_mode) VALUES ('gen_13', 'D''oro Pizza', 'J-505806491', '0412-9485196', 'Alta Vista, Puerto Ordaz', 'Alta Vista', '2026-02-08 22:07:08.468579-04', 'cc_1', 'Mensual');
INSERT INTO public.generators (id, name, rif, phone, address, sector, created_at, collection_center_id, collection_mode) VALUES ('gen_23', 'King Kebab', 'J-501947279', '0412-9474313', 'Río Negro, Puerto Ordaz', 'Río Negro', '2026-02-08 22:07:08.468579-04', 'cc_1', 'Mensual');
INSERT INTO public.generators (id, name, rif, phone, address, sector, created_at, collection_center_id, collection_mode) VALUES ('gen_4', 'Palace Cantón', 'J-503567430', '0414-7712546', 'C.C. Costa Granada, Puerto Ordaz', 'C.C. Costa Granada', '2026-02-08 22:07:08.468579-04', 'cc_1', 'Quincenal');
INSERT INTO public.generators (id, name, rif, phone, address, sector, created_at, collection_center_id, collection_mode) VALUES ('gen_16', 'Panadería La Bodega', 'J-412916858', '0412-9983218', 'Alta Vista, Puerto Ordaz', 'Alta Vista', '2026-02-08 22:07:08.468579-04', 'cc_1', 'Fortuito');
INSERT INTO public.generators (id, name, rif, phone, address, sector, created_at, collection_center_id, collection_mode) VALUES ('gen_10', 'Phoenix Asian Fast Food', 'J-502408770', '0412-8009054', 'Redoma La Piña, Puerto Ordaz', 'Redoma La Piña', '2026-02-08 22:07:08.468579-04', 'cc_1', 'Mensual');
INSERT INTO public.generators (id, name, rif, phone, address, sector, created_at, collection_center_id, collection_mode) VALUES ('gen_17', 'Pollo Portu''s', 'J-40145989-7', '0424-9746307', 'Unare I, Puerto Ordaz', 'Unare I', '2026-02-08 22:07:08.468579-04', 'cc_1', 'Quincenal');
INSERT INTO public.generators (id, name, rif, phone, address, sector, created_at, collection_center_id, collection_mode) VALUES ('gen_9', 'Procesadora e inversiones DYM', 'J-505342614', '0424-9052317', 'Alta Vista, Puerto Ordaz', 'Alta Vista', '2026-02-08 22:07:08.468579-04', 'cc_1', 'Quincenal');
INSERT INTO public.generators (id, name, rif, phone, address, sector, created_at, collection_center_id, collection_mode) VALUES ('gen_1', 'Restaurant El Gran Cacique', 'J-503225289', '0414-8769919', 'El Caimito, Puerto Ordaz', 'El Caimito', '2026-02-08 22:07:08.468579-04', 'cc_1', 'Semanal');
INSERT INTO public.generators (id, name, rif, phone, address, sector, created_at, collection_center_id, collection_mode) VALUES ('gen_11', 'Pollos Milus', 'J-__________________', '0414-8963801', 'C.C. Alta Vista 2, Puerto Ordaz', 'C.C. Alta Vista 2', '2026-02-08 22:07:08.468579-04', 'cc_1', 'Quincenal');
INSERT INTO public.generators (id, name, rif, phone, address, sector, created_at, collection_center_id, collection_mode) VALUES ('gen_12', 'Restaurant El Yaque', 'J-__________________', '0424-8797614', 'Club Italo, Puerto Ordaz', 'Club Italo', '2026-02-08 22:07:08.468579-04', 'cc_1', 'Mensual');
INSERT INTO public.generators (id, name, rif, phone, address, sector, created_at, collection_center_id, collection_mode) VALUES ('gen_14', 'Buffalo Bill PZO', 'J-__________________', '0412-1341740', 'C.C. Alta Vista I, Puerto Ordaz', 'C.C. Alta Vista I', '2026-02-08 22:07:08.468579-04', 'cc_1', 'Mensual');
INSERT INTO public.generators (id, name, rif, phone, address, sector, created_at, collection_center_id, collection_mode) VALUES ('gen_15', 'Club Campestre Pesca y Paga', 'J-__________________', '0414-8865882', 'El Caimito, Puerto Ordaz', 'El Caimito', '2026-02-08 22:07:08.468579-04', 'cc_1', 'Mensual');
INSERT INTO public.generators (id, name, rif, phone, address, sector, created_at, collection_center_id, collection_mode) VALUES ('gen_18', 'Porkis 286', 'J-__________________', '0424-9436674', 'Unare I, Puerto Ordaz', 'Unare I', '2026-02-08 22:07:08.468579-04', 'cc_1', 'Quincenal');
INSERT INTO public.generators (id, name, rif, phone, address, sector, created_at, collection_center_id, collection_mode) VALUES ('gen_19', 'Pollos Daniels', 'J-__________________', '0412-9475552', 'Unare I, Puerto Ordaz', 'Unare I', '2026-02-08 22:07:08.468579-04', 'cc_1', 'Mensual');
INSERT INTO public.generators (id, name, rif, phone, address, sector, created_at, collection_center_id, collection_mode) VALUES ('gen_2', 'Club Caronoco', 'G-__________________', '0414-8593234', 'Campo C, Puerto Ordaz', 'Campo C', '2026-02-08 22:07:08.468579-04', 'cc_1', 'Semanal');
INSERT INTO public.generators (id, name, rif, phone, address, sector, created_at, collection_center_id, collection_mode) VALUES ('gen_20', 'Chicken King 1990', 'J-__________________', '0424-9219008', 'C.C. Alta Vista II, Puerto Ordaz', 'C.C. Alta Vista II', '2026-02-08 22:07:08.468579-04', 'cc_1', 'Mensual');
INSERT INTO public.generators (id, name, rif, phone, address, sector, created_at, collection_center_id, collection_mode) VALUES ('gen_21', 'Daniel Devera', 'V-__________________', '0424-9036919', 'Los Olivos, Puerto Ordaz', 'Los Olivos', '2026-02-08 22:07:08.468579-04', 'cc_1', 'Mensual');
INSERT INTO public.generators (id, name, rif, phone, address, sector, created_at, collection_center_id, collection_mode) VALUES ('gen_22', 'Chimuelo Burger', 'J-__________________', '0412-0225366', 'Torre Movistar, Puerto Ordaz', 'Torre Movistar', '2026-02-08 22:07:08.468579-04', 'cc_1', 'Mensual');
INSERT INTO public.generators (id, name, rif, phone, address, sector, created_at, collection_center_id, collection_mode) VALUES ('gen_3', 'Aladyn', 'J-__________________', '0424-3031250', 'Alta Vista, Puerto Ordaz', 'Alta Vista', '2026-02-08 22:07:08.468579-04', 'cc_1', 'Mensual');
INSERT INTO public.generators (id, name, rif, phone, address, sector, created_at, collection_center_id, collection_mode) VALUES ('gen_5', 'Pollos Rys', 'J-__________________', '0416-9878050', 'Unare I, Puerto Ordaz', 'Unare I', '2026-02-08 22:07:08.468579-04', 'cc_1', 'Mensual');
INSERT INTO public.generators (id, name, rif, phone, address, sector, created_at, collection_center_id, collection_mode) VALUES ('gen_6', 'Chido Pizzas', 'J-__________________', '0414-8942139', 'C.C. Alta Vista II, Puerto Ordaz', 'C.C. Alta Vista II', '2026-02-08 22:07:08.468579-04', 'cc_1', 'Mensual');
INSERT INTO public.generators (id, name, rif, phone, address, sector, created_at, collection_center_id, collection_mode) VALUES ('gen_7', 'Roof Burger', 'J-__________________', '0426-3933512', 'Calle Hambre, Puerto Ordaz', 'Calle Hambre', '2026-02-08 22:07:08.468579-04', 'cc_1', 'Semanal');
INSERT INTO public.generators (id, name, rif, phone, address, sector, created_at, collection_center_id, collection_mode) VALUES ('gen_8', 'F. Jaimes', 'V-__________________', '0424-9190607', 'Av. Atlántica, Puerto Ordaz', 'Av. Atlántica', '2026-02-08 22:07:08.468579-04', 'cc_1', 'Fortuito');


ALTER TABLE public.generators ENABLE TRIGGER ALL;

--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.tickets DISABLE TRIGGER ALL;

INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_10', 'AV-BOL-2026-0010', '9/01/2026', 'gen_8', 'F. Jaimes', 'Aceite Vegetal Usado (AVU) - No Peligroso', 60, 'Bruto', 'Rafael Díaz', 'LAJ70X', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_2', 'AV-BOL-2026-0002', '3/01/2026', 'gen_2', 'Club Caronoco', 'Aceite Vegetal Usado (AVU) - No Peligroso', 150, 'Bruto', 'Rafael Díaz', 'LAJ70X', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_3', 'AV-BOL-2026-0003', '8/01/2026', 'gen_1', 'Restaurant El Gran Cacique', 'Aceite Vegetal Usado (AVU) - No Peligroso', 54, 'Bruto', 'Rafael Díaz', 'LAJ70X', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_4', 'AV-BOL-2026-0004', '8/01/2026', 'gen_2', 'Club Caronoco', 'Aceite Vegetal Usado (AVU) - No Peligroso', 50, 'Bruto', 'Rafael Díaz', 'LAJ70X', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_5', 'AV-BOL-2026-0005', '9/01/2026', 'gen_3', 'Aladyn', 'Aceite Vegetal Usado (AVU) - No Peligroso', 330, 'Bruto', 'Rafael Díaz', 'LAJ70X', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_7', 'AV-BOL-2026-0007', '9/01/2026', 'gen_5', 'Pollos Rys', 'Aceite Vegetal Usado (AVU) - No Peligroso', 100, 'Bruto', 'Rafael Díaz', 'LAJ70X', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_8', 'AV-BOL-2026-0008', '9/01/2026', 'gen_6', 'Chido Pizzas', 'Aceite Vegetal Usado (AVU) - No Peligroso', 4, 'Bruto', 'Rafael Díaz', 'LAJ70X', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_9', 'AV-BOL-2026-0009', '9/01/2026', 'gen_7', 'Roof Burger', 'Aceite Vegetal Usado (AVU) - No Peligroso', 12, 'Bruto', 'Rafael Díaz', 'LAJ70X', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_6', 'AV-BOL-2026-0006', '9/01/2026', 'gen_4', 'Palace Cantón', 'Aceite Vegetal Usado (AVU) - No Peligroso', 150, 'Bruto', 'Rafael Díaz', 'LAJ70X', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_1771272744691', 'AV-MER-2026-0001', '16/02/2026', 'gen_1771272727337', 'La Nota', 'Aceite Vegetal Usado (AVU) - No Peligroso', 150, 'Filtrado', 'Diana Villafraz', 'TGR432', '2026-02-16 16:12:24.739414-04', 'cc_1771272570127', 'ccm_1771272617291');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_12', 'AV-BOL-2026-0012', '10/01/2026', 'gen_10', 'Phoenix Asian Fast Food', 'Aceite Vegetal Usado (AVU) - No Peligroso', 80, 'Bruto', 'Rafael Díaz', 'LAJ70X', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_14', 'AV-BOL-2026-0014', '10/01/2026', 'gen_12', 'Restaurant El Yaque', 'Aceite Vegetal Usado (AVU) - No Peligroso', 135, 'Bruto', 'Rafael Díaz', 'LAJ70X', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_16', 'AV-BOL-2026-0016', '10/01/2026', 'gen_14', 'Buffalo Bill PZO', 'Aceite Vegetal Usado (AVU) - No Peligroso', 30, 'Bruto', 'Rafael Díaz', 'LAJ70X', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_18', 'AV-BOL-2026-0018', '12/01/2026', 'gen_15', 'Club Campestre Pesca y Paga', 'Aceite Vegetal Usado (AVU) - No Peligroso', 205, 'Bruto', 'Rafael Díaz', 'LAJ70X', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_20', 'AV-BOL-2026-0020', '17/01/2026', 'gen_16', 'Panadería La Bodega', 'Aceite Vegetal Usado (AVU) - No Peligroso', 190, 'Bruto', 'Rafael Díaz', '57lDBC', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_22', 'AV-BOL-2026-0022', '17/01/2026', 'gen_18', 'Porkis 286', 'Aceite Vegetal Usado (AVU) - No Peligroso', 36, 'Bruto', 'Rafael Díaz', '57lDBC', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_13', 'AV-BOL-2026-0013', '10/01/2026', 'gen_11', 'Pollos Milus', 'Aceite Vegetal Usado (AVU) - No Peligroso', 25, 'Bruto', 'Rafael Díaz', 'LAJ70X', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_15', 'AV-BOL-2026-0015', '10/01/2026', 'gen_13', 'D''oro Pizza', 'Aceite Vegetal Usado (AVU) - No Peligroso', 30, 'Bruto', 'Rafael Díaz', 'LAJ70X', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_17', 'AV-BOL-2026-0017', '12/01/2026', 'gen_1', 'Restaurant El Gran Cacique', 'Aceite Vegetal Usado (AVU) - No Peligroso', 70, 'Bruto', 'Rafael Díaz', 'LAJ70X', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_19', 'AV-BOL-2026-0019', '17/01/2026', 'gen_2', 'Club Caronoco', 'Aceite Vegetal Usado (AVU) - No Peligroso', 133, 'Bruto', 'Rafael Díaz', '57lDBC', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_21', 'AV-BOL-2026-0021', '17/01/2026', 'gen_17', 'Pollo Portu''s', 'Aceite Vegetal Usado (AVU) - No Peligroso', 30, 'Bruto', 'Rafael Díaz', '57lDBC', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_23', 'AV-BOL-2026-0023', '17/01/2026', 'gen_7', 'Roof Burger', 'Aceite Vegetal Usado (AVU) - No Peligroso', 11, 'Bruto', 'Rafael Díaz', '57lDBC', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_11', 'AV-BOL-2026-0011', '9/01/2026', 'gen_9', 'Procesadora e inversiones DYM', 'Aceite Vegetal Usado (AVU) - No Peligroso', 70, 'Bruto', 'Rafael Díaz', 'LAJ70X', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_1771272763122', 'AV-MER-2026-0002', '15/02/2026', 'gen_1771272727337', 'La Nota', 'Aceite Vegetal Usado (AVU) - No Peligroso', 80, 'Bruto', 'Diana Villafraz', 'TGR432', '2026-02-16 16:12:43.129479-04', 'cc_1771272570127', 'ccm_1771272617291');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_27', 'AV-BOL-2026-0027', '20/01/2026', 'gen_20', 'Chicken King 1990', 'Aceite Vegetal Usado (AVU) - No Peligroso', 212, 'Bruto', 'Rafael Díaz', '57lDBC', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_30', 'AV-BOL-2026-0030', '20/01/2026', 'gen_21', 'Daniel Devera', 'Aceite Vegetal Usado (AVU) - No Peligroso', 116, 'Bruto', 'Rafael Díaz', '57lDBC', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_33', 'AV-BOL-2026-0033', '26/01/2026', 'gen_22', 'Chimuelo Burger', 'Aceite Vegetal Usado (AVU) - No Peligroso', 36, 'Bruto', 'Rafael Díaz', '57lDBC', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_35', 'AV-BOL-2026-0035', '26/01/2026', 'gen_8', 'F. Jaimes', 'Aceite Vegetal Usado (AVU) - No Peligroso', 36, 'Bruto', 'Rafael Díaz', '57lDBC', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_29', 'AV-BOL-2026-0029', '20/01/2026', 'gen_8', 'F. Jaimes', 'Aceite Vegetal Usado (AVU) - No Peligroso', 12, 'Bruto', 'Rafael Díaz', '57lDBC', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_36', 'AV-BOL-2026-0036', '26/01/2026', 'gen_9', 'Procesadora e inversiones DYM', 'Aceite Vegetal Usado (AVU) - No Peligroso', 108, 'Bruto', 'Rafael Díaz', '57lDBC', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_1', 'AV-BOL-2026-0001', '02/01/2026', 'gen_1', 'Restaurant El Gran Cacique', 'Aceite Vegetal Usado (AVU) - No Peligroso', 50, 'Bruto', 'Rafael Díaz', 'LAJ70X', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_24', 'AV-BOL-2026-0024', '19/01/2026', 'gen_1', 'Restaurant El Gran Cacique', 'Aceite Vegetal Usado (AVU) - No Peligroso', 97, 'Bruto', 'Rafael Díaz', '57lDBC', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_25', 'AV-BOL-2026-0025', '19/01/2026', 'gen_19', 'Pollos Daniels', 'Aceite Vegetal Usado (AVU) - No Peligroso', 75, 'Bruto', 'Rafael Díaz', '57lDBC', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_26', 'AV-BOL-2026-0026', '19/01/2026', 'gen_9', 'Procesadora e inversiones DYM', 'Aceite Vegetal Usado (AVU) - No Peligroso', 40, 'Bruto', 'Rafael Díaz', '57lDBC', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_1771272789698', 'AV-MER-2026-0003', '13/02/2026', 'gen_1771272727337', 'La Nota', 'Aceite Vegetal Usado (AVU) - No Peligroso', 80, 'Filtrado', 'Diana Villafraz', 'TGR432', '2026-02-16 16:13:09.705997-04', 'cc_1771272570127', 'ccm_1771272617291');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_28', 'AV-BOL-2026-0028', '20/01/2026', 'gen_2', 'Club Caronoco', 'Aceite Vegetal Usado (AVU) - No Peligroso', 60, 'Bruto', 'Rafael Díaz', '57lDBC', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_31', 'AV-BOL-2026-0031', '26/01/2026', 'gen_1', 'Restaurant El Gran Cacique', 'Aceite Vegetal Usado (AVU) - No Peligroso', 88, 'Bruto', 'Rafael Díaz', '57lDBC', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_32', 'AV-BOL-2026-0032', '26/01/2026', 'gen_2', 'Club Caronoco', 'Aceite Vegetal Usado (AVU) - No Peligroso', 136, 'Bruto', 'Rafael Díaz', '57lDBC', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');
INSERT INTO public.tickets (id, ticket_number, date, generator_id, generator_name, material_type, quantity, material_state, collector_name, vehicle_plate, created_at, collection_center_id, collector_member_id) VALUES ('t_34', 'AV-BOL-2026-0034', '26/01/2026', 'gen_23', 'King Kebab', 'Aceite Vegetal Usado (AVU) - No Peligroso', 23, 'Bruto', 'Rafael Díaz', '57lDBC', '2026-02-08 22:07:08.479419-04', 'cc_1', 'ccm_1');


ALTER TABLE public.tickets ENABLE TRIGGER ALL;

--
-- PostgreSQL database dump complete
--

