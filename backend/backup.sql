--
-- PostgreSQL database dump
--

-- Dumped from database version 16.6 (Debian 16.6-1.pgdg120+1)
-- Dumped by pg_dump version 16.6 (Debian 16.6-1.pgdg120+1)

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
-- Name: product_purchases_purchase_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.product_purchases_purchase_status_enum AS ENUM (
    'processed',
    'returned'
);


ALTER TYPE public.product_purchases_purchase_status_enum OWNER TO postgres;

--
-- Name: vehicles_vehicle_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.vehicles_vehicle_status_enum AS ENUM (
    'running',
    'not_running'
);


ALTER TYPE public.vehicles_vehicle_status_enum OWNER TO postgres;

--
-- Name: work_orders_order_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.work_orders_order_status_enum AS ENUM (
    'finished',
    'in_progress',
    'not_started'
);


ALTER TYPE public.work_orders_order_status_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: mileage_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mileage_history (
    mileage_history_id integer NOT NULL,
    vehicle_id integer NOT NULL,
    current_mileage integer NOT NULL,
    registration_date timestamp without time zone NOT NULL
);


ALTER TABLE public.mileage_history OWNER TO postgres;

--
-- Name: mileage_history_mileage_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mileage_history_mileage_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mileage_history_mileage_history_id_seq OWNER TO postgres;

--
-- Name: mileage_history_mileage_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mileage_history_mileage_history_id_seq OWNED BY public.mileage_history.mileage_history_id;


--
-- Name: payment_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_types (
    payment_type_id integer NOT NULL,
    type_name character varying(50) NOT NULL
);


ALTER TABLE public.payment_types OWNER TO postgres;

--
-- Name: payment_types_payment_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payment_types_payment_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_types_payment_type_id_seq OWNER TO postgres;

--
-- Name: payment_types_payment_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payment_types_payment_type_id_seq OWNED BY public.payment_types.payment_type_id;


--
-- Name: persons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.persons (
    person_id integer NOT NULL,
    rut character varying(9) NOT NULL,
    name character varying(50) NOT NULL,
    first_surname character varying(50) NOT NULL,
    second_surname character varying(50),
    email character varying(100) NOT NULL,
    number_phone character varying(15) NOT NULL,
    person_type character varying(20) NOT NULL
);


ALTER TABLE public.persons OWNER TO postgres;

--
-- Name: persons_person_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.persons_person_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.persons_person_id_seq OWNER TO postgres;

--
-- Name: persons_person_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.persons_person_id_seq OWNED BY public.persons.person_id;


--
-- Name: product_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_categories (
    product_category_id integer NOT NULL,
    category_name character varying(50) NOT NULL
);


ALTER TABLE public.product_categories OWNER TO postgres;

--
-- Name: product_categories_product_category_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_categories_product_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_categories_product_category_id_seq OWNER TO postgres;

--
-- Name: product_categories_product_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_categories_product_category_id_seq OWNED BY public.product_categories.product_category_id;


--
-- Name: product_purchases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_purchases (
    product_purchase_id integer NOT NULL,
    product_id integer NOT NULL,
    purchase_history_id integer NOT NULL,
    tax_id integer NOT NULL,
    purchase_status public.product_purchases_purchase_status_enum DEFAULT 'processed'::public.product_purchases_purchase_status_enum NOT NULL,
    purchase_price numeric(10,2) NOT NULL,
    quantity integer NOT NULL,
    total_price numeric(10,2) NOT NULL
);


ALTER TABLE public.product_purchases OWNER TO postgres;

--
-- Name: product_purchases_product_purchase_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_purchases_product_purchase_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_purchases_product_purchase_id_seq OWNER TO postgres;

--
-- Name: product_purchases_product_purchase_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_purchases_product_purchase_id_seq OWNED BY public.product_purchases.product_purchase_id;


--
-- Name: product_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_types (
    product_type_id integer NOT NULL,
    product_category_id integer NOT NULL,
    type_name character varying(50) NOT NULL
);


ALTER TABLE public.product_types OWNER TO postgres;

--
-- Name: product_types_product_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_types_product_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_types_product_type_id_seq OWNER TO postgres;

--
-- Name: product_types_product_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_types_product_type_id_seq OWNED BY public.product_types.product_type_id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    product_id integer NOT NULL,
    product_type_id integer NOT NULL,
    product_name character varying(100) NOT NULL,
    profit_margin numeric(5,2) NOT NULL,
    last_purchase_price numeric(10,2) NOT NULL,
    sale_price numeric(10,2) NOT NULL,
    description text NOT NULL,
    product_quantity integer NOT NULL
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: products_product_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_product_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_product_id_seq OWNER TO postgres;

--
-- Name: products_product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_product_id_seq OWNED BY public.products.product_id;


--
-- Name: purchase_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_history (
    purchase_history_id integer NOT NULL,
    purchase_date timestamp without time zone NOT NULL,
    arrival_date timestamp without time zone NOT NULL,
    description text NOT NULL
);


ALTER TABLE public.purchase_history OWNER TO postgres;

--
-- Name: purchase_history_purchase_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.purchase_history_purchase_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_history_purchase_history_id_seq OWNER TO postgres;

--
-- Name: purchase_history_purchase_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.purchase_history_purchase_history_id_seq OWNED BY public.purchase_history.purchase_history_id;


--
-- Name: quotations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quotations (
    quotation_id integer NOT NULL,
    vehicle_id integer NOT NULL,
    mileage_history_id integer NOT NULL,
    description text NOT NULL,
    quotation_status character varying(50) NOT NULL,
    entry_date timestamp without time zone NOT NULL
);


ALTER TABLE public.quotations OWNER TO postgres;

--
-- Name: quotations_quotation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quotations_quotation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quotations_quotation_id_seq OWNER TO postgres;

--
-- Name: quotations_quotation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quotations_quotation_id_seq OWNED BY public.quotations.quotation_id;


--
-- Name: taxes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.taxes (
    tax_id integer NOT NULL,
    tax_rate numeric(5,2) NOT NULL
);


ALTER TABLE public.taxes OWNER TO postgres;

--
-- Name: taxes_tax_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.taxes_tax_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.taxes_tax_id_seq OWNER TO postgres;

--
-- Name: taxes_tax_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.taxes_tax_id_seq OWNED BY public.taxes.tax_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    person_id integer NOT NULL,
    user_role character varying(20) NOT NULL,
    username character varying(30) NOT NULL,
    password character varying(60) NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: vehicle_brands; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicle_brands (
    vehicle_brand_id integer NOT NULL,
    brand_name character varying(50) NOT NULL
);


ALTER TABLE public.vehicle_brands OWNER TO postgres;

--
-- Name: vehicle_brands_vehicle_brand_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vehicle_brands_vehicle_brand_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vehicle_brands_vehicle_brand_id_seq OWNER TO postgres;

--
-- Name: vehicle_brands_vehicle_brand_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vehicle_brands_vehicle_brand_id_seq OWNED BY public.vehicle_brands.vehicle_brand_id;


--
-- Name: vehicle_models; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicle_models (
    vehicle_model_id integer NOT NULL,
    vehicle_brand_id integer NOT NULL,
    model_name character varying(50) NOT NULL
);


ALTER TABLE public.vehicle_models OWNER TO postgres;

--
-- Name: vehicle_models_vehicle_model_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vehicle_models_vehicle_model_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vehicle_models_vehicle_model_id_seq OWNER TO postgres;

--
-- Name: vehicle_models_vehicle_model_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vehicle_models_vehicle_model_id_seq OWNED BY public.vehicle_models.vehicle_model_id;


--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicles (
    vehicle_id integer NOT NULL,
    vehicle_model_id integer NOT NULL,
    person_id integer NOT NULL,
    license_plate character varying(8) NOT NULL,
    vehicle_status public.vehicles_vehicle_status_enum DEFAULT 'running'::public.vehicles_vehicle_status_enum NOT NULL,
    year integer NOT NULL,
    color character varying(30) NOT NULL
);


ALTER TABLE public.vehicles OWNER TO postgres;

--
-- Name: vehicles_vehicle_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vehicles_vehicle_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vehicles_vehicle_id_seq OWNER TO postgres;

--
-- Name: vehicles_vehicle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vehicles_vehicle_id_seq OWNED BY public.vehicles.vehicle_id;


--
-- Name: work_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.work_orders (
    work_order_id integer NOT NULL,
    vehicle_id integer NOT NULL,
    quotation_id integer NOT NULL,
    person_id integer NOT NULL,
    mileage_history_id integer NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    order_status public.work_orders_order_status_enum DEFAULT 'not_started'::public.work_orders_order_status_enum NOT NULL,
    order_date timestamp without time zone NOT NULL
);


ALTER TABLE public.work_orders OWNER TO postgres;

--
-- Name: work_orders_work_order_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.work_orders_work_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.work_orders_work_order_id_seq OWNER TO postgres;

--
-- Name: work_orders_work_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.work_orders_work_order_id_seq OWNED BY public.work_orders.work_order_id;


--
-- Name: work_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.work_payments (
    work_payment_id integer NOT NULL,
    payment_type_id integer NOT NULL,
    work_order_id integer NOT NULL,
    payment_status character varying(50) NOT NULL,
    amount_paid numeric(10,2) NOT NULL,
    payment_date timestamp without time zone NOT NULL
);


ALTER TABLE public.work_payments OWNER TO postgres;

--
-- Name: work_payments_work_payment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.work_payments_work_payment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.work_payments_work_payment_id_seq OWNER TO postgres;

--
-- Name: work_payments_work_payment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.work_payments_work_payment_id_seq OWNED BY public.work_payments.work_payment_id;


--
-- Name: work_product_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.work_product_details (
    work_product_detail_id integer NOT NULL,
    work_order_id integer NOT NULL,
    product_id integer NOT NULL,
    quotation_id integer NOT NULL,
    tax_id integer NOT NULL,
    quantity integer NOT NULL,
    sale_price numeric(10,2) NOT NULL,
    discount numeric(5,2) NOT NULL,
    labor_price numeric(10,2) NOT NULL
);


ALTER TABLE public.work_product_details OWNER TO postgres;

--
-- Name: work_product_details_work_product_detail_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.work_product_details_work_product_detail_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.work_product_details_work_product_detail_id_seq OWNER TO postgres;

--
-- Name: work_product_details_work_product_detail_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.work_product_details_work_product_detail_id_seq OWNED BY public.work_product_details.work_product_detail_id;


--
-- Name: work_tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.work_tickets (
    work_ticket_id integer NOT NULL,
    work_order_id integer NOT NULL,
    description text NOT NULL,
    ticket_status character varying(50) NOT NULL,
    ticket_date timestamp without time zone NOT NULL
);


ALTER TABLE public.work_tickets OWNER TO postgres;

--
-- Name: work_tickets_work_ticket_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.work_tickets_work_ticket_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.work_tickets_work_ticket_id_seq OWNER TO postgres;

--
-- Name: work_tickets_work_ticket_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.work_tickets_work_ticket_id_seq OWNED BY public.work_tickets.work_ticket_id;


--
-- Name: mileage_history mileage_history_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mileage_history ALTER COLUMN mileage_history_id SET DEFAULT nextval('public.mileage_history_mileage_history_id_seq'::regclass);


--
-- Name: payment_types payment_type_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_types ALTER COLUMN payment_type_id SET DEFAULT nextval('public.payment_types_payment_type_id_seq'::regclass);


--
-- Name: persons person_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.persons ALTER COLUMN person_id SET DEFAULT nextval('public.persons_person_id_seq'::regclass);


--
-- Name: product_categories product_category_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_categories ALTER COLUMN product_category_id SET DEFAULT nextval('public.product_categories_product_category_id_seq'::regclass);


--
-- Name: product_purchases product_purchase_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_purchases ALTER COLUMN product_purchase_id SET DEFAULT nextval('public.product_purchases_product_purchase_id_seq'::regclass);


--
-- Name: product_types product_type_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_types ALTER COLUMN product_type_id SET DEFAULT nextval('public.product_types_product_type_id_seq'::regclass);


--
-- Name: products product_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN product_id SET DEFAULT nextval('public.products_product_id_seq'::regclass);


--
-- Name: purchase_history purchase_history_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_history ALTER COLUMN purchase_history_id SET DEFAULT nextval('public.purchase_history_purchase_history_id_seq'::regclass);


--
-- Name: quotations quotation_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotations ALTER COLUMN quotation_id SET DEFAULT nextval('public.quotations_quotation_id_seq'::regclass);


--
-- Name: taxes tax_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.taxes ALTER COLUMN tax_id SET DEFAULT nextval('public.taxes_tax_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Name: vehicle_brands vehicle_brand_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_brands ALTER COLUMN vehicle_brand_id SET DEFAULT nextval('public.vehicle_brands_vehicle_brand_id_seq'::regclass);


--
-- Name: vehicle_models vehicle_model_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_models ALTER COLUMN vehicle_model_id SET DEFAULT nextval('public.vehicle_models_vehicle_model_id_seq'::regclass);


--
-- Name: vehicles vehicle_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles ALTER COLUMN vehicle_id SET DEFAULT nextval('public.vehicles_vehicle_id_seq'::regclass);


--
-- Name: work_orders work_order_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_orders ALTER COLUMN work_order_id SET DEFAULT nextval('public.work_orders_work_order_id_seq'::regclass);


--
-- Name: work_payments work_payment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_payments ALTER COLUMN work_payment_id SET DEFAULT nextval('public.work_payments_work_payment_id_seq'::regclass);


--
-- Name: work_product_details work_product_detail_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_product_details ALTER COLUMN work_product_detail_id SET DEFAULT nextval('public.work_product_details_work_product_detail_id_seq'::regclass);


--
-- Name: work_tickets work_ticket_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_tickets ALTER COLUMN work_ticket_id SET DEFAULT nextval('public.work_tickets_work_ticket_id_seq'::regclass);


--
-- Data for Name: mileage_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mileage_history (mileage_history_id, vehicle_id, current_mileage, registration_date) FROM stdin;
\.


--
-- Data for Name: payment_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_types (payment_type_id, type_name) FROM stdin;
\.


--
-- Data for Name: persons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.persons (person_id, rut, name, first_surname, second_surname, email, number_phone, person_type) FROM stdin;
2	204876541	joaquin	sánchez	figueroa	jkea@gmail.com	+56123456789	administrador
\.


--
-- Data for Name: product_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_categories (product_category_id, category_name) FROM stdin;
\.


--
-- Data for Name: product_purchases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_purchases (product_purchase_id, product_id, purchase_history_id, tax_id, purchase_status, purchase_price, quantity, total_price) FROM stdin;
\.


--
-- Data for Name: product_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_types (product_type_id, product_category_id, type_name) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (product_id, product_type_id, product_name, profit_margin, last_purchase_price, sale_price, description, product_quantity) FROM stdin;
\.


--
-- Data for Name: purchase_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchase_history (purchase_history_id, purchase_date, arrival_date, description) FROM stdin;
\.


--
-- Data for Name: quotations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quotations (quotation_id, vehicle_id, mileage_history_id, description, quotation_status, entry_date) FROM stdin;
\.


--
-- Data for Name: taxes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.taxes (tax_id, tax_rate) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, person_id, user_role, username, password) FROM stdin;
1	2	administrador	admin	$2a$10$g61f68/SVRNdY.WvTgOc1OdxPXEP.VBqHzaggx7u94IBhgpA0hiTq
\.


--
-- Data for Name: vehicle_brands; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vehicle_brands (vehicle_brand_id, brand_name) FROM stdin;
\.


--
-- Data for Name: vehicle_models; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vehicle_models (vehicle_model_id, vehicle_brand_id, model_name) FROM stdin;
\.


--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vehicles (vehicle_id, vehicle_model_id, person_id, license_plate, vehicle_status, year, color) FROM stdin;
\.


--
-- Data for Name: work_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.work_orders (work_order_id, vehicle_id, quotation_id, person_id, mileage_history_id, total_amount, order_status, order_date) FROM stdin;
\.


--
-- Data for Name: work_payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.work_payments (work_payment_id, payment_type_id, work_order_id, payment_status, amount_paid, payment_date) FROM stdin;
\.


--
-- Data for Name: work_product_details; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.work_product_details (work_product_detail_id, work_order_id, product_id, quotation_id, tax_id, quantity, sale_price, discount, labor_price) FROM stdin;
\.


--
-- Data for Name: work_tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.work_tickets (work_ticket_id, work_order_id, description, ticket_status, ticket_date) FROM stdin;
\.


--
-- Name: mileage_history_mileage_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mileage_history_mileage_history_id_seq', 1, false);


--
-- Name: payment_types_payment_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payment_types_payment_type_id_seq', 1, false);


--
-- Name: persons_person_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.persons_person_id_seq', 2, true);


--
-- Name: product_categories_product_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_categories_product_category_id_seq', 1, false);


--
-- Name: product_purchases_product_purchase_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_purchases_product_purchase_id_seq', 1, false);


--
-- Name: product_types_product_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_types_product_type_id_seq', 1, false);


--
-- Name: products_product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_product_id_seq', 1, false);


--
-- Name: purchase_history_purchase_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.purchase_history_purchase_history_id_seq', 1, false);


--
-- Name: quotations_quotation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quotations_quotation_id_seq', 1, false);


--
-- Name: taxes_tax_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.taxes_tax_id_seq', 1, false);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 1, true);


--
-- Name: vehicle_brands_vehicle_brand_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vehicle_brands_vehicle_brand_id_seq', 1, false);


--
-- Name: vehicle_models_vehicle_model_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vehicle_models_vehicle_model_id_seq', 1, false);


--
-- Name: vehicles_vehicle_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vehicles_vehicle_id_seq', 1, false);


--
-- Name: work_orders_work_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.work_orders_work_order_id_seq', 1, false);


--
-- Name: work_payments_work_payment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.work_payments_work_payment_id_seq', 1, false);


--
-- Name: work_product_details_work_product_detail_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.work_product_details_work_product_detail_id_seq', 1, false);


--
-- Name: work_tickets_work_ticket_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.work_tickets_work_ticket_id_seq', 1, false);


--
-- Name: payment_types PK_2278d2b71920ed69ec15f12d3bd; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_types
    ADD CONSTRAINT "PK_2278d2b71920ed69ec15f12d3bd" PRIMARY KEY (payment_type_id);


--
-- Name: product_categories PK_2afcc545225b72e77cebea240f4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT "PK_2afcc545225b72e77cebea240f4" PRIMARY KEY (product_category_id);


--
-- Name: persons PK_4e645570e666bffc240a8c45328; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.persons
    ADD CONSTRAINT "PK_4e645570e666bffc240a8c45328" PRIMARY KEY (person_id);


--
-- Name: work_product_details PK_50a1914b03bb2808a08bcb52b0a; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_product_details
    ADD CONSTRAINT "PK_50a1914b03bb2808a08bcb52b0a" PRIMARY KEY (work_product_detail_id);


--
-- Name: quotations PK_687f20ddb3d275c2c1a696214e2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT "PK_687f20ddb3d275c2c1a696214e2" PRIMARY KEY (quotation_id);


--
-- Name: mileage_history PK_6ed0dfa47f7ce2f556f5dabb7d7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mileage_history
    ADD CONSTRAINT "PK_6ed0dfa47f7ce2f556f5dabb7d7" PRIMARY KEY (mileage_history_id);


--
-- Name: work_orders PK_7f152ba668488a81576676dc519; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT "PK_7f152ba668488a81576676dc519" PRIMARY KEY (work_order_id);


--
-- Name: vehicle_models PK_86937b7f050dbc729b4b89a28b7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_models
    ADD CONSTRAINT "PK_86937b7f050dbc729b4b89a28b7" PRIMARY KEY (vehicle_model_id);


--
-- Name: product_types PK_91a2058eff2209e67033c7378dd; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_types
    ADD CONSTRAINT "PK_91a2058eff2209e67033c7378dd" PRIMARY KEY (product_type_id);


--
-- Name: work_payments PK_92addaa1546e82adfd1d7b9f46f; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_payments
    ADD CONSTRAINT "PK_92addaa1546e82adfd1d7b9f46f" PRIMARY KEY (work_payment_id);


--
-- Name: users PK_96aac72f1574b88752e9fb00089; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_96aac72f1574b88752e9fb00089" PRIMARY KEY (user_id);


--
-- Name: products PK_a8940a4bf3b90bd7ac15c8f4dd9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "PK_a8940a4bf3b90bd7ac15c8f4dd9" PRIMARY KEY (product_id);


--
-- Name: purchase_history PK_be78d0f76ac22bc6c80dfe18826; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_history
    ADD CONSTRAINT "PK_be78d0f76ac22bc6c80dfe18826" PRIMARY KEY (purchase_history_id);


--
-- Name: vehicles PK_daf0b353d75b92156fdbe18791e; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT "PK_daf0b353d75b92156fdbe18791e" PRIMARY KEY (vehicle_id);


--
-- Name: work_tickets PK_e04c739f55e97b1caf1797f19fd; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_tickets
    ADD CONSTRAINT "PK_e04c739f55e97b1caf1797f19fd" PRIMARY KEY (work_ticket_id);


--
-- Name: vehicle_brands PK_e46671291ab0c62696c46ca7b5c; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_brands
    ADD CONSTRAINT "PK_e46671291ab0c62696c46ca7b5c" PRIMARY KEY (vehicle_brand_id);


--
-- Name: product_purchases PK_eaff310ab35893336da2be6d681; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_purchases
    ADD CONSTRAINT "PK_eaff310ab35893336da2be6d681" PRIMARY KEY (product_purchase_id);


--
-- Name: taxes PK_fdc05f4df6b0aaa2b2602a3bab7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.taxes
    ADD CONSTRAINT "PK_fdc05f4df6b0aaa2b2602a3bab7" PRIMARY KEY (tax_id);


--
-- Name: vehicle_brands UQ_0eae59d498a87b3d119d76df204; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_brands
    ADD CONSTRAINT "UQ_0eae59d498a87b3d119d76df204" UNIQUE (brand_name);


--
-- Name: product_categories UQ_29ede20c8ca7fac25e9bb9e1ed3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT "UQ_29ede20c8ca7fac25e9bb9e1ed3" UNIQUE (category_name);


--
-- Name: vehicles UQ_7e9fab2e8625b63613f67bd706c; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT "UQ_7e9fab2e8625b63613f67bd706c" UNIQUE (license_plate);


--
-- Name: persons UQ_855baef39aeda9a54a7697632f4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.persons
    ADD CONSTRAINT "UQ_855baef39aeda9a54a7697632f4" UNIQUE (rut);


--
-- Name: payment_types UQ_ed2982aa23f0b0767b54ea38941; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_types
    ADD CONSTRAINT "UQ_ed2982aa23f0b0767b54ea38941" UNIQUE (type_name);


--
-- Name: users UQ_fe0bb3f6520ee0469504521e710; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE (username);


--
-- Name: work_payments FK_051cff6d9cc81db4a7cdde4bd08; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_payments
    ADD CONSTRAINT "FK_051cff6d9cc81db4a7cdde4bd08" FOREIGN KEY (work_order_id) REFERENCES public.work_orders(work_order_id);


--
-- Name: vehicles FK_0cf2b97124eb0eb2b0c97f3814d; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT "FK_0cf2b97124eb0eb2b0c97f3814d" FOREIGN KEY (vehicle_model_id) REFERENCES public.vehicle_models(vehicle_model_id);


--
-- Name: work_orders FK_18fb19db181c9e178cc8e5b6c8f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT "FK_18fb19db181c9e178cc8e5b6c8f" FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(vehicle_id);


--
-- Name: work_tickets FK_1facbcc9e4d8208f3279fe81dd8; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_tickets
    ADD CONSTRAINT "FK_1facbcc9e4d8208f3279fe81dd8" FOREIGN KEY (work_order_id) REFERENCES public.work_orders(work_order_id);


--
-- Name: product_purchases FK_20b439e0af1363a6a3f162fd6d0; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_purchases
    ADD CONSTRAINT "FK_20b439e0af1363a6a3f162fd6d0" FOREIGN KEY (product_id) REFERENCES public.products(product_id);


--
-- Name: vehicles FK_28bbe8fe6fdc4e6d34ad851ef00; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT "FK_28bbe8fe6fdc4e6d34ad851ef00" FOREIGN KEY (person_id) REFERENCES public.persons(person_id);


--
-- Name: product_purchases FK_4357b44ff7a7707fd9b5259f75d; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_purchases
    ADD CONSTRAINT "FK_4357b44ff7a7707fd9b5259f75d" FOREIGN KEY (tax_id) REFERENCES public.taxes(tax_id);


--
-- Name: users FK_5ed72dcd00d6e5a88c6a6ba3d18; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "FK_5ed72dcd00d6e5a88c6a6ba3d18" FOREIGN KEY (person_id) REFERENCES public.persons(person_id);


--
-- Name: quotations FK_6360416ee5e7ffea21129226c10; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT "FK_6360416ee5e7ffea21129226c10" FOREIGN KEY (mileage_history_id) REFERENCES public.mileage_history(mileage_history_id);


--
-- Name: work_product_details FK_6c5f61ab2d2cb049704bc519865; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_product_details
    ADD CONSTRAINT "FK_6c5f61ab2d2cb049704bc519865" FOREIGN KEY (product_id) REFERENCES public.products(product_id);


--
-- Name: work_product_details FK_6d59c5042f4e6499db993ca15ba; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_product_details
    ADD CONSTRAINT "FK_6d59c5042f4e6499db993ca15ba" FOREIGN KEY (work_order_id) REFERENCES public.work_orders(work_order_id);


--
-- Name: work_orders FK_75ecbf49130d4ab56bf65dbc965; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT "FK_75ecbf49130d4ab56bf65dbc965" FOREIGN KEY (quotation_id) REFERENCES public.quotations(quotation_id);


--
-- Name: work_orders FK_7a47f0f20f4639d58e424e4d9d0; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT "FK_7a47f0f20f4639d58e424e4d9d0" FOREIGN KEY (person_id) REFERENCES public.persons(person_id);


--
-- Name: quotations FK_85f1f4b160e1b5825d383242d41; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT "FK_85f1f4b160e1b5825d383242d41" FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(vehicle_id);


--
-- Name: work_product_details FK_93fba8c621a908edb880864943d; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_product_details
    ADD CONSTRAINT "FK_93fba8c621a908edb880864943d" FOREIGN KEY (tax_id) REFERENCES public.taxes(tax_id);


--
-- Name: work_orders FK_9674ed3a7ded040e8fa7c3bad41; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT "FK_9674ed3a7ded040e8fa7c3bad41" FOREIGN KEY (mileage_history_id) REFERENCES public.mileage_history(mileage_history_id);


--
-- Name: products FK_9adb63f24f86528856373f0ab9a; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "FK_9adb63f24f86528856373f0ab9a" FOREIGN KEY (product_type_id) REFERENCES public.product_types(product_type_id);


--
-- Name: mileage_history FK_b302f548d90fd022f14c3d14a6e; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mileage_history
    ADD CONSTRAINT "FK_b302f548d90fd022f14c3d14a6e" FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(vehicle_id);


--
-- Name: vehicle_models FK_b8f74f8091616bbedf5be859e1a; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_models
    ADD CONSTRAINT "FK_b8f74f8091616bbedf5be859e1a" FOREIGN KEY (vehicle_brand_id) REFERENCES public.vehicle_brands(vehicle_brand_id);


--
-- Name: work_product_details FK_dc4f495ca4fac1fc5813ea7c77c; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_product_details
    ADD CONSTRAINT "FK_dc4f495ca4fac1fc5813ea7c77c" FOREIGN KEY (quotation_id) REFERENCES public.quotations(quotation_id);


--
-- Name: work_payments FK_e9d158b77cc06e1c9fbfb4da470; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_payments
    ADD CONSTRAINT "FK_e9d158b77cc06e1c9fbfb4da470" FOREIGN KEY (payment_type_id) REFERENCES public.payment_types(payment_type_id);


--
-- Name: product_purchases FK_ea4139aded37e88fd13efe766bf; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_purchases
    ADD CONSTRAINT "FK_ea4139aded37e88fd13efe766bf" FOREIGN KEY (purchase_history_id) REFERENCES public.purchase_history(purchase_history_id);


--
-- Name: product_types FK_f8be1d3d32796232ce61edd4636; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_types
    ADD CONSTRAINT "FK_f8be1d3d32796232ce61edd4636" FOREIGN KEY (product_category_id) REFERENCES public.product_categories(product_category_id);


--
-- PostgreSQL database dump complete
--

