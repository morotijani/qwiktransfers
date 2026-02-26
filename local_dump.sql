--
-- PostgreSQL database dump
--

\restrict cHe8arCOZuIsEfor3g1QUxfYrUkmGwsgYe67d3QRzay0ixpieXQA3xIdSEzZfN5

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AuditLogs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AuditLogs" (
    id integer NOT NULL,
    "userId" integer,
    action character varying(255) NOT NULL,
    details text,
    "ipAddress" character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."AuditLogs" OWNER TO postgres;

--
-- Name: AuditLogs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."AuditLogs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."AuditLogs_id_seq" OWNER TO postgres;

--
-- Name: AuditLogs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."AuditLogs_id_seq" OWNED BY public."AuditLogs".id;


--
-- Name: Notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Notifications" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    type character varying(255) NOT NULL,
    message text NOT NULL,
    "isRead" boolean DEFAULT false,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."Notifications" OWNER TO postgres;

--
-- Name: Notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Notifications_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Notifications_id_seq" OWNER TO postgres;

--
-- Name: Notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Notifications_id_seq" OWNED BY public."Notifications".id;


--
-- Name: PaymentMethods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PaymentMethods" (
    id integer NOT NULL,
    type character varying(255),
    currency character varying(255),
    details text,
    is_active boolean,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."PaymentMethods" OWNER TO postgres;

--
-- Name: PaymentMethods_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PaymentMethods_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PaymentMethods_id_seq" OWNER TO postgres;

--
-- Name: PaymentMethods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PaymentMethods_id_seq" OWNED BY public."PaymentMethods".id;


--
-- Name: RateAlerts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RateAlerts" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "targetRate" numeric NOT NULL,
    direction character varying(255) NOT NULL,
    "isActive" boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."RateAlerts" OWNER TO postgres;

--
-- Name: RateAlerts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."RateAlerts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."RateAlerts_id_seq" OWNER TO postgres;

--
-- Name: RateAlerts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."RateAlerts_id_seq" OWNED BY public."RateAlerts".id;


--
-- Name: Rates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Rates" (
    id integer NOT NULL,
    pair character varying(255),
    rate numeric,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    use_api boolean DEFAULT true,
    manual_rate numeric(10,4),
    spread numeric(5,2) DEFAULT 5
);


ALTER TABLE public."Rates" OWNER TO postgres;

--
-- Name: Rates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Rates_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Rates_id_seq" OWNER TO postgres;

--
-- Name: Rates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Rates_id_seq" OWNED BY public."Rates".id;


--
-- Name: SequelizeMeta; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SequelizeMeta" (
    name character varying(255) NOT NULL
);


ALTER TABLE public."SequelizeMeta" OWNER TO postgres;

--
-- Name: SystemConfigs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SystemConfigs" (
    id integer NOT NULL,
    key character varying(255) NOT NULL,
    value jsonb NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."SystemConfigs" OWNER TO postgres;

--
-- Name: SystemConfigs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."SystemConfigs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."SystemConfigs_id_seq" OWNER TO postgres;

--
-- Name: SystemConfigs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."SystemConfigs_id_seq" OWNED BY public."SystemConfigs".id;


--
-- Name: Transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Transactions" (
    id integer NOT NULL,
    "userId" integer,
    type character varying(255),
    amount_sent numeric,
    exchange_rate numeric,
    amount_received numeric,
    recipient_details jsonb,
    status character varying(255),
    proof_url character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    proof_uploaded_at timestamp with time zone,
    "vendorId" integer,
    sent_at timestamp with time zone,
    rate_locked_until timestamp with time zone,
    locked_rate numeric,
    transaction_id character varying(255)
);


ALTER TABLE public."Transactions" OWNER TO postgres;

--
-- Name: Transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Transactions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Transactions_id_seq" OWNER TO postgres;

--
-- Name: Transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Transactions_id_seq" OWNED BY public."Transactions".id;


--
-- Name: Users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Users" (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255),
    role character varying(255),
    kyc_status character varying(255),
    balance_ghs numeric,
    balance_cad numeric,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    kyc_document character varying(255),
    full_name character varying(255),
    phone character varying(255),
    profile_picture character varying(255),
    country character varying(255),
    transaction_pin character varying(255),
    is_email_verified boolean DEFAULT false,
    verification_token character varying(255),
    reset_password_token character varying(255),
    reset_password_expires timestamp with time zone,
    verification_token_expires timestamp with time zone,
    kyc_document_type character varying(255),
    kyc_document_id character varying(255),
    kyc_front_url character varying(255),
    kyc_back_url character varying(255),
    is_online boolean DEFAULT false,
    is_active boolean DEFAULT true,
    account_number character varying(255)
);


ALTER TABLE public."Users" OWNER TO postgres;

--
-- Name: Users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Users_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Users_id_seq" OWNER TO postgres;

--
-- Name: Users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Users_id_seq" OWNED BY public."Users".id;


--
-- Name: AuditLogs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLogs" ALTER COLUMN id SET DEFAULT nextval('public."AuditLogs_id_seq"'::regclass);


--
-- Name: Notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notifications" ALTER COLUMN id SET DEFAULT nextval('public."Notifications_id_seq"'::regclass);


--
-- Name: PaymentMethods id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PaymentMethods" ALTER COLUMN id SET DEFAULT nextval('public."PaymentMethods_id_seq"'::regclass);


--
-- Name: RateAlerts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RateAlerts" ALTER COLUMN id SET DEFAULT nextval('public."RateAlerts_id_seq"'::regclass);


--
-- Name: Rates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Rates" ALTER COLUMN id SET DEFAULT nextval('public."Rates_id_seq"'::regclass);


--
-- Name: SystemConfigs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SystemConfigs" ALTER COLUMN id SET DEFAULT nextval('public."SystemConfigs_id_seq"'::regclass);


--
-- Name: Transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Transactions" ALTER COLUMN id SET DEFAULT nextval('public."Transactions_id_seq"'::regclass);


--
-- Name: Users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users" ALTER COLUMN id SET DEFAULT nextval('public."Users_id_seq"'::regclass);


--
-- Data for Name: AuditLogs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AuditLogs" (id, "userId", action, details, "ipAddress", "createdAt", "updatedAt") FROM stdin;
1	2	LOGIN	User logged in: admin@qwiktransfers.com	::1	2026-02-16 18:16:27.554+00	2026-02-16 18:16:27.554+00
2	18	LOGIN	User logged in: ama@vendor.com	::1	2026-02-16 18:20:15.407+00	2026-02-16 18:20:15.407+00
3	14	LOGIN	User logged in: tjhackx111@gmail.com	::1	2026-02-16 18:25:32.748+00	2026-02-16 18:25:32.748+00
4	14	LOGIN	User logged in: tjhackx111@gmail.com	::1	2026-02-16 19:59:10.163+00	2026-02-16 19:59:10.163+00
5	14	LOGIN	User logged in: tjhackx111@gmail.com	::1	2026-02-16 20:03:50.032+00	2026-02-16 20:03:50.032+00
6	14	TRANSACTION_CREATE	User created transaction 15 for 40 CAD	::1	2026-02-17 00:29:56.069+00	2026-02-17 00:29:56.069+00
7	14	LOGIN	User logged in: tjhackx111@gmail.com	::1	2026-02-17 11:37:42.876+00	2026-02-17 11:37:42.876+00
8	14	TRANSACTION_PROOF_UPLOAD	User uploaded proof for transaction 15	::1	2026-02-17 12:41:58.048+00	2026-02-17 12:41:58.048+00
9	14	TRANSACTION_CREATE	User created transaction 16 for 30 GHS	::1	2026-02-17 13:07:17.659+00	2026-02-17 13:07:17.659+00
10	14	TRANSACTION_CREATE	User created transaction 17 for 500 CAD	::1	2026-02-17 13:18:58.101+00	2026-02-17 13:18:58.101+00
11	14	TRANSACTION_PROOF_UPLOAD	User uploaded proof for transaction 17	::1	2026-02-17 13:19:22.443+00	2026-02-17 13:19:22.443+00
12	14	TRANSACTION_CREATE	User created transaction 18 for 300 GHS	::1	2026-02-17 13:38:08.491+00	2026-02-17 13:38:08.491+00
13	14	TRANSACTION_PROOF_UPLOAD	User uploaded proof for transaction 18	::1	2026-02-17 13:54:10.735+00	2026-02-17 13:54:10.735+00
14	18	VENDOR_ACCEPT_TRANSACTION	Vendor accepted transaction 18	::1	2026-02-17 13:54:25.504+00	2026-02-17 13:54:25.504+00
15	18	VENDOR_COMPLETE_TRANSACTION	Vendor marked transaction 18 as completed/sent	::1	2026-02-17 13:56:04.958+00	2026-02-17 13:56:04.958+00
16	14	TRANSACTION_CREATE	User created transaction 19 for 20 GHS	::1	2026-02-17 14:19:33.523+00	2026-02-17 14:19:33.523+00
17	14	TRANSACTION_PROOF_UPLOAD	User uploaded proof for transaction 19	::1	2026-02-17 14:20:09.045+00	2026-02-17 14:20:09.045+00
18	18	VENDOR_ACCEPT_TRANSACTION	Vendor accepted transaction 19	::1	2026-02-17 14:20:29.809+00	2026-02-17 14:20:29.809+00
19	18	VENDOR_COMPLETE_TRANSACTION	Vendor marked transaction 19 as completed/sent	::1	2026-02-17 14:20:41.693+00	2026-02-17 14:20:41.693+00
20	14	TRANSACTION_CREATE	User created transaction 20 for 40 CAD	::1	2026-02-17 14:39:13.096+00	2026-02-17 14:39:13.096+00
21	14	TRANSACTION_CREATE	User created transaction 21 for 66 GHS	::1	2026-02-17 19:14:53.472+00	2026-02-17 19:14:53.472+00
22	2	LOGIN	User logged in: admin@qwiktransfers.com	::1	2026-02-17 19:16:06.515+00	2026-02-17 19:16:06.515+00
23	14	LOGIN	User logged in: tjhackx111@gmail.com	::ffff:192.168.79.156	2026-02-19 16:14:33.358+00	2026-02-19 16:14:33.358+00
24	14	TRANSACTION_CREATE	User created transaction 22 for 200 GHS	::ffff:192.168.79.156	2026-02-19 16:19:29.457+00	2026-02-19 16:19:29.457+00
25	14	TRANSACTION_CREATE	User created transaction 23 for 200 GHS	::ffff:192.168.79.156	2026-02-19 16:19:51.009+00	2026-02-19 16:19:51.009+00
26	14	LOGIN	User logged in: tjhackx111@gmail.com	::ffff:192.168.79.156	2026-02-19 16:59:51.996+00	2026-02-19 16:59:51.996+00
27	14	LOGIN	User logged in: tjhackx111@gmail.com	::ffff:192.168.79.156	2026-02-19 19:38:51.287+00	2026-02-19 19:38:51.287+00
28	14	TRANSACTION_CREATE	User created transaction 24 for 5 CAD	::ffff:192.168.79.156	2026-02-19 21:11:19.032+00	2026-02-19 21:11:19.032+00
29	14	LOGIN	User logged in: tjhackx111@gmail.com	::ffff:192.168.79.156	2026-02-19 22:39:33.328+00	2026-02-19 22:39:33.328+00
30	14	TRANSACTION_CREATE	User created transaction 25 for 200 CAD	::ffff:192.168.79.156	2026-02-19 22:45:10.585+00	2026-02-19 22:45:10.585+00
31	14	TRANSACTION_CREATE	User created transaction 26 for 200 CAD	::ffff:192.168.79.156	2026-02-19 22:45:41.155+00	2026-02-19 22:45:41.155+00
32	14	TRANSACTION_CREATE	User created transaction 27 for 50 CAD	::ffff:192.168.79.156	2026-02-19 23:07:44.248+00	2026-02-19 23:07:44.248+00
33	14	TRANSACTION_CREATE	User created transaction 28 for 100 CAD	::ffff:192.168.79.156	2026-02-19 23:15:37.53+00	2026-02-19 23:15:37.53+00
34	14	TRANSACTION_PROOF_UPLOAD	User uploaded proof for transaction 28	::ffff:192.168.79.156	2026-02-19 23:16:19.476+00	2026-02-19 23:16:19.476+00
35	2	LOGIN	User logged in: admin@qwiktransfers.com	::1	2026-02-20 05:08:47.13+00	2026-02-20 05:08:47.13+00
36	14	LOGIN	User logged in: tjhackx111@gmail.com	::ffff:192.168.79.155	2026-02-21 13:23:35.777+00	2026-02-21 13:23:35.777+00
37	14	LOGIN	User logged in: tjhackx111@gmail.com	::ffff:192.168.79.155	2026-02-21 13:52:34.73+00	2026-02-21 13:52:34.73+00
38	14	LOGIN	User logged in: tjhackx111@gmail.com	::ffff:192.168.79.155	2026-02-21 14:25:08.125+00	2026-02-21 14:25:08.125+00
39	14	LOGIN	User logged in: tjhackx111@gmail.com	::ffff:192.168.79.155	2026-02-21 14:28:17.508+00	2026-02-21 14:28:17.508+00
\.


--
-- Data for Name: Notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Notifications" (id, "userId", type, message, "isRead", "createdAt", "updatedAt") FROM stdin;
1	14	TRANSACTION_UPDATE	Proof of payment for transaction #15 has been uploaded and is pending verification.	t	2026-02-17 12:41:58.073+00	2026-02-17 12:43:01.754+00
2	14	RATE_ALERT	Rate Watcher Set: We will notify you when 1 CAD reaches 10.00 GHS (above).	f	2026-02-17 12:55:44.549+00	2026-02-17 12:55:44.549+00
3	14	RATE_ALERT	Rate Watcher Set: We will notify you when 1 CAD reaches 20.00 GHS (above).	f	2026-02-17 12:56:54.989+00	2026-02-17 12:56:54.989+00
4	14	RATE_ALERT	Rate Watcher Set: We will notify you when 1 CAD reaches 7.00 GHS (above).	f	2026-02-17 13:05:56.602+00	2026-02-17 13:05:56.602+00
6	14	RATE_ALERT	Rate Alert: The CAD to GHS rate is now 8.09. This matches your target of 7.00 (above).	f	2026-02-17 13:34:01.699+00	2026-02-17 13:34:01.699+00
7	14	TRANSACTION_UPDATE	Transaction of 300 GHS initiated. Your rate is locked for 15 minutes.	f	2026-02-17 13:38:11.238+00	2026-02-17 13:38:11.238+00
8	14	TRANSACTION_UPDATE	Proof of payment for transaction #18 has been uploaded and is pending verification.	f	2026-02-17 13:54:10.753+00	2026-02-17 13:54:10.753+00
9	14	TRANSACTION_UPDATE	Your transaction #18 has been accepted by a vendor and is being processed.	f	2026-02-17 13:54:25.731+00	2026-02-17 13:54:25.731+00
10	14	TRANSACTION_UPDATE	Good news! Your transaction #18 has been fully processed and sent to the recipient.	f	2026-02-17 13:56:04.961+00	2026-02-17 13:56:04.961+00
11	14	TRANSACTION_UPDATE	Transaction of 20 GHS initiated. Your rate is locked for 15 minutes.	f	2026-02-17 14:19:37.517+00	2026-02-17 14:19:37.517+00
12	14	TRANSACTION_UPDATE	Proof of payment for transaction #19 has been uploaded and is pending verification.	f	2026-02-17 14:20:09.057+00	2026-02-17 14:20:09.057+00
13	14	TRANSACTION_UPDATE	Your transaction #19 has been accepted by a vendor and is being processed.	f	2026-02-17 14:20:29.819+00	2026-02-17 14:20:29.819+00
14	14	TRANSACTION_UPDATE	Good news! Your transaction #19 has been fully processed and sent to the recipient.	f	2026-02-17 14:20:41.729+00	2026-02-17 14:20:41.729+00
15	14	TRANSACTION_UPDATE	Transaction of 40 CAD initiated. Your rate is locked for 15 minutes.	f	2026-02-17 14:39:17.697+00	2026-02-17 14:39:17.697+00
16	14	TRANSACTION_UPDATE	Transaction of 66 GHS initiated. Your rate is locked for 15 minutes.	t	2026-02-17 19:14:58.257+00	2026-02-19 16:18:10.782+00
17	14	TRANSACTION_UPDATE	Transaction of 200 GHS initiated. Your rate is locked for 15 minutes.	f	2026-02-19 16:19:40.532+00	2026-02-19 16:19:40.532+00
18	14	TRANSACTION_UPDATE	Transaction of 200 GHS initiated. Your rate is locked for 15 minutes.	f	2026-02-19 16:20:00.444+00	2026-02-19 16:20:00.444+00
19	14	TRANSACTION_UPDATE	Transaction of 5 CAD initiated. Your rate is locked for 15 minutes.	t	2026-02-19 21:11:24.229+00	2026-02-19 21:15:09.546+00
23	14	TRANSACTION_UPDATE	Transaction of 100 CAD initiated. Your rate is locked for 15 minutes.	t	2026-02-19 23:15:41.375+00	2026-02-21 13:41:32.213+00
22	14	TRANSACTION_UPDATE	Transaction of 50 CAD initiated. Your rate is locked for 15 minutes.	t	2026-02-19 23:07:48.267+00	2026-02-21 13:41:32.44+00
21	14	TRANSACTION_UPDATE	Transaction of 200 CAD initiated. Your rate is locked for 15 minutes.	t	2026-02-19 22:45:43.504+00	2026-02-21 13:41:34.177+00
20	14	TRANSACTION_UPDATE	Transaction of 200 CAD initiated. Your rate is locked for 15 minutes.	t	2026-02-19 22:45:21.314+00	2026-02-21 13:41:35.855+00
24	14	TRANSACTION_UPDATE	Proof of payment for transaction #28 has been uploaded and is pending verification.	t	2026-02-19 23:16:19.485+00	2026-02-21 13:41:37.666+00
25	14	RATE_ALERT	Rate Watcher Set: We will notify you when 1 CAD reaches 8.60 GHS (above).	t	2026-02-20 05:14:21.024+00	2026-02-21 13:43:42.093+00
5	14	TRANSACTION_UPDATE	Proof of payment for transaction #17 has been uploaded and is pending verification.	t	2026-02-17 13:19:22.452+00	2026-02-21 14:30:37.266+00
\.


--
-- Data for Name: PaymentMethods; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PaymentMethods" (id, type, currency, details, is_active, "createdAt", "updatedAt") FROM stdin;
2	interac-cad	CAD	{"email":"pay@qwiktransfers.ca","name":"Qwiktransfers Canada"}	t	2026-02-11 00:58:25.036+00	2026-02-11 00:59:40.704+00
1	momo-ghs	GHS	{"number":"024 123 456","name":"Qwiktransfers Limited"}	t	2026-02-11 00:57:41.67+00	2026-02-11 00:59:41.623+00
\.


--
-- Data for Name: RateAlerts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RateAlerts" (id, "userId", "targetRate", direction, "isActive", "createdAt", "updatedAt") FROM stdin;
5	14	8.5	above	t	2026-02-17 12:11:53.226+00	2026-02-17 12:11:53.226+00
9	14	8.6	above	t	2026-02-20 05:14:20.95+00	2026-02-20 05:14:20.95+00
\.


--
-- Data for Name: Rates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Rates" (id, pair, rate, "createdAt", "updatedAt", use_api, manual_rate, spread) FROM stdin;
2	GHS-CAD	0.114943	2026-02-05 12:53:19.059+00	2026-02-17 12:38:56.357+00	f	8.7000	5.00
\.


--
-- Data for Name: SequelizeMeta; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SequelizeMeta" (name) FROM stdin;
20260203223832-create-user.js
20260203224049-create-transaction.js
20260203224212-create-rate.js
20260205103300-add-kyc-to-users.js
20260205132637-add-profile-fields-to-users.js
20260205144157-add-country-and-pin-to-users.js
20260205155321-add-verification-and-reset-fields-to-users.js
20260205173636-add-verification-token-expires-to-users.js
20260205180758-add-unique-constraint-to-user-email.js
20260206200552-add-kyc-details-to-users.js
20260206233338-add-proof-uploaded-at-to-transactions.js
20260209110642-make-phone-unique.js
20260209141000-add-vendor-fields.js
20260209145854-add-account-status-to-users.js
20260211003145-create-payment-method.js
20260211010351-add-manual-rate-fields-to-rates.js
20260212041202-add_sent_at_to_transactions.js
20260216143429-create-system-config.js
20260216153100-add-account-number-to-users.js
20260216164900-create-audit-log.js
20260216165000-create-notification.js
20260216165100-create-rate-alert.js
20260216165200-add-rate-locking-to-transactions.js
20260217123000-add-unique-pair-to-rates.js
20260221153800-add-transaction-id-to-transactions.js
20260224020300-populate-transaction-ids.js
\.


--
-- Data for Name: SystemConfigs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SystemConfigs" (id, key, value, "createdAt", "updatedAt") FROM stdin;
1	tiered_limits	{"level1": 500, "level2": 5000, "level3": 50000}	2026-02-16 14:45:15.845+00	2026-02-16 14:45:44.169+00
\.


--
-- Data for Name: Transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Transactions" (id, "userId", type, amount_sent, exchange_rate, amount_received, recipient_details, status, proof_url, "createdAt", "updatedAt", proof_uploaded_at, "vendorId", sent_at, rate_locked_until, locked_rate, transaction_id) FROM stdin;
2	2	GHS-CAD	500	0.09	45	{"name": "Kwame Mensah", "type": "momo", "account": "0244112233"}	pending	\N	2026-02-05 12:53:19.068+00	2026-02-05 12:53:19.068+00	\N	\N	\N	\N	\N	QT-20260205-1O4R
11	14	CAD-GHS	20	8.800028	176	{"name": "wahidu", "note": "", "type": "momo", "account": "02200202", "bank_name": "", "interac_email": "", "momo_provider": "MTN Momo", "transit_number": "", "admin_reference": "QW-3E2T3", "institution_number": ""}	sent		2026-02-12 03:53:11.502+00	2026-02-12 04:18:43.768+00	\N	\N	2026-02-12 04:18:43.768+00	\N	\N	QT-20260212-DR7P
8	14	CAD-GHS	500	0.1178	58.9	{"name": "gorgina agyei", "note": "vals", "type": "momo", "account": "0244512130", "bank_name": "", "interac_email": "", "momo_provider": "Telecel Cash", "transit_number": "", "admin_reference": "QW-DHY6M", "institution_number": ""}	cancelled		2026-02-06 23:18:52.732+00	2026-02-07 11:12:14.557+00	\N	\N	\N	\N	\N	QT-20260206-MD07
7	14	GHS-CAD	500	0.1178	58.9	{"name": "jefw", "note": "", "type": "interac", "account": "", "bank_name": "", "interac_email": "gerg", "momo_provider": "", "transit_number": "", "admin_reference": "QW-YZX3T", "institution_number": ""}	processing	/uploads/proof-1770462678465-931119833.jpg	2026-02-06 15:07:49.252+00	2026-02-09 13:07:51.028+00	2026-02-07 11:11:18.617+00	\N	\N	\N	\N	QT-20260206-ZWSG
15	14	CAD-GHS	40	8.899964	356	{"name": "kuffor", "note": "", "type": "bank", "account": "202222222", "bank_name": "Ecobank Ghana", "interac_email": "", "momo_provider": "", "transit_number": "", "admin_reference": "QW-8AEXK", "institution_number": ""}	pending	/uploads/proof-1771332116425-819830601.jpg	2026-02-17 00:29:55.969+00	2026-02-17 12:41:56.452+00	2026-02-17 12:41:56.452+00	\N	\N	\N	\N	QT-20260217-930I
9	14	CAD-GHS	10	0.113636	1.13636	{"name": "haruna abass", "note": "", "type": "bank", "account": "202020202020", "bank_name": "GCB Bank", "interac_email": "", "momo_provider": "", "transit_number": "", "admin_reference": "QW-BCEQV", "institution_number": ""}	sent		2026-02-11 17:42:42.932+00	2026-02-12 04:29:48.859+00	\N	19	2026-02-12 04:29:48.859+00	\N	\N	QT-20260211-TXD8
5	14	GHS-CAD	200	0.1178	23.56	{"name": "Ladeen", "note": "for fees", "type": "momo", "account": "02000044", "bank_name": "", "momo_provider": "AirtelTigo Money", "admin_reference": "QW-HMYJG"}	sent	/uploads/proof-1770380310894-972049988.jpeg	2026-02-06 12:17:35.462+00	2026-02-10 23:04:23.723+00	\N	18	\N	\N	\N	QT-20260206-JC14
6	14	GHS-CAD	120	0.1178	14.136000000000001	{"name": "Alhaji", "note": "", "type": "bank", "account": "21843533", "bank_name": "", "interac_email": "", "momo_provider": "", "transit_number": "23423", "admin_reference": "QW-RN9QE", "institution_number": "244"}	processing	/uploads/proof-1770382326753-245619600.jpg	2026-02-06 12:51:27.654+00	2026-02-12 01:37:59.405+00	\N	18	\N	\N	\N	QT-20260206-TA5R
1	1	GHS-CAD	12	0.1	1.2000000000000002	{"name": "Recipient Name", "account": "123456"}	sent	/uploads/proof-1770293853478-823351365.jpg	2026-02-03 23:41:41.634+00	2026-02-12 01:38:24.665+00	\N	18	\N	\N	\N	QT-20260203-VLI7
10	14	GHS-CAD	200	0.113636	22.7272	{"name": "mabel abagine", "note": "for food babe", "type": "interac", "account": "342342423", "bank_name": "", "interac_email": "wefwef@efe.cok", "momo_provider": "", "transit_number": "22324", "admin_reference": "QW-BTM5A", "institution_number": "987"}	processing	/uploads/proof-1770865723386-815510629.pdf	2026-02-11 18:17:58.128+00	2026-02-12 03:09:11.548+00	2026-02-12 03:08:43.393+00	18	\N	\N	\N	QT-20260211-SSNC
16	14	GHS-CAD	30	0.114943	3.45	{"name": "wadud", "note": "", "type": "interac", "account": "", "bank_name": "", "interac_email": "r@ewr.com", "momo_provider": "", "transit_number": "", "admin_reference": "QW-MZ8Y5", "institution_number": ""}	pending		2026-02-17 13:07:17.643+00	2026-02-17 13:07:17.643+00	\N	\N	\N	\N	\N	QT-20260217-SAKQ
14	20	CAD-GHS	5	8.899964	44.5	{"name": "Maa Adwo", "note": "", "type": "momo", "account": "026666666", "bank_name": "", "interac_email": "", "momo_provider": "Telecel Cash", "transit_number": "", "admin_reference": "QW-HCM7L", "institution_number": ""}	processing		2026-02-12 07:03:20.119+00	2026-02-12 07:07:47.46+00	\N	19	\N	\N	\N	QT-20260212-HHEV
20	14	CAD-GHS	40	8.699964	348	{"name": "kapo laazio", "note": "", "type": "momo", "account": "020200202", "bank_name": "", "interac_email": "", "momo_provider": "AirtelTigo Money", "transit_number": "", "admin_reference": "QW-YJCLB", "institution_number": ""}	pending		2026-02-17 14:39:12.682+00	2026-02-17 14:39:12.682+00	\N	\N	\N	\N	\N	QT-20260217-CCKA
21	14	GHS-CAD	66	0.114943	7.59	{"name": "hamza", "note": "", "type": "bank", "account": "202222", "bank_name": "", "interac_email": "", "momo_provider": "", "transit_number": "11111", "admin_reference": "QW-9Z7C4", "institution_number": "333"}	pending		2026-02-17 19:14:53.421+00	2026-02-17 19:14:53.421+00	\N	\N	\N	\N	\N	QT-20260217-EDXW
23	14	GHS-CAD	200	0.114943	22.99	{"name": "Ncnfb", "type": "interac", "email": "Naming"}	pending		2026-02-19 16:19:51.004+00	2026-02-19 16:19:51.004+00	\N	\N	\N	\N	\N	QT-20260219-88OZ
3	2	GHS-CAD	1000	0.09	90	{"name": "Ama Serwaa", "type": "bank", "account": "1002233445"}	sent	/uploads/sample_receipt.jpg	2026-02-04 12:53:19.068+00	2026-02-05 00:53:19.068+00	\N	\N	\N	\N	\N	QT-20260204-PXHR
4	3	GHS-CAD	2500	0.092	230	{"name": "Yaw Boateng", "type": "momo", "account": "0555998877"}	processing	/uploads/proof_test.png	2026-02-05 12:53:19.068+00	2026-02-05 12:53:19.068+00	\N	\N	\N	\N	\N	QT-20260205-2QPB
18	14	GHS-CAD	300	0.114943	34.48	{"name": "prince", "note": "50/2", "type": "interac", "account": "", "bank_name": "", "interac_email": "prince@email.com", "momo_provider": "", "transit_number": "", "admin_reference": "QW-3TN9Z", "institution_number": ""}	sent	/uploads/proof-1771336449390-668260014.jpg	2026-02-17 13:38:08.466+00	2026-02-17 13:56:04.954+00	2026-02-17 13:54:09.436+00	18	2026-02-17 13:56:04.953+00	\N	\N	QT-20260217-ZHHV
22	14	GHS-CAD	200	0.114943	22.99	{"name": "Ncnfb", "type": "interac", "email": "Naming"}	pending		2026-02-19 16:19:29.444+00	2026-02-19 16:19:29.444+00	\N	\N	\N	\N	\N	QT-20260219-8T0A
19	14	GHS-CAD	20	0.114943	2.3	{"name": "baba", "note": "", "type": "interac", "account": "", "bank_name": "", "interac_email": "b@fmf.com", "momo_provider": "", "transit_number": "", "admin_reference": "QW-HFTFF", "institution_number": ""}	sent	/uploads/proof-1771338007877-222160926.jpeg	2026-02-17 14:19:33.477+00	2026-02-17 14:20:41.685+00	2026-02-17 14:20:07.912+00	18	2026-02-17 14:20:41.685+00	\N	\N	QT-20260217-WX96
24	14	CAD-GHS	5	8.699964	43.5	{"name": "Kofi", "note": "Good", "type": "momo", "account": "02444", "momo_provider": "Telecel Cash", "admin_reference": "QW-3L7XQ"}	pending		2026-02-19 21:11:18.994+00	2026-02-19 21:11:18.994+00	\N	\N	\N	\N	\N	QT-20260219-1B6V
25	14	CAD-GHS	200	8.699964	1739.99	{"name": "gorge", "note": "", "type": "bank", "account": "222222", "bank_name": "GCB Bank", "admin_reference": "QW-N827D"}	pending		2026-02-19 22:45:10.578+00	2026-02-19 22:45:10.578+00	\N	\N	\N	\N	\N	QT-20260219-B1DC
26	14	CAD-GHS	200	8.699964	1739.99	{"name": "gorge", "note": "", "type": "bank", "account": "222222", "bank_name": "GCB Bank", "admin_reference": "QW-N827D"}	pending		2026-02-19 22:45:41.15+00	2026-02-19 22:45:41.15+00	\N	\N	\N	\N	\N	QT-20260219-QD92
27	14	CAD-GHS	50	8.699964	435	{"name": "Kiki", "note": "Food wai", "type": "momo", "account": "055555", "momo_provider": "Telecel Cash", "admin_reference": "QW-GB7X6"}	pending		2026-02-19 23:07:44.224+00	2026-02-19 23:07:44.224+00	\N	\N	\N	\N	\N	QT-20260219-RM2X
13	20	GHS-CAD	200	0.113636	22.73	{"name": "Henry Asamoah", "note": "pocket money", "type": "bank", "account": "20202020202020", "bank_name": "", "interac_email": "", "momo_provider": "", "transit_number": "12344", "admin_reference": "QW-5CMDF", "institution_number": "123"}	sent	/uploads/proof-1770872786132-525197332.png	2026-02-12 05:04:04.009+00	2026-02-12 07:08:42.986+00	2026-02-12 05:06:26.206+00	19	2026-02-12 07:08:42.985+00	\N	\N	QT-20260212-B1PR
12	14	GHS-CAD	400	0.113636	45.45	{"name": "toffic", "note": "food", "type": "bank", "account": "2032029329932939", "bank_name": "", "interac_email": "", "momo_provider": "", "transit_number": "1234", "admin_reference": "QW-2FQFY", "institution_number": "323"}	sent		2026-02-12 03:54:14.113+00	2026-02-12 04:07:51.024+00	\N	19	\N	\N	\N	QT-20260212-INYR
17	14	CAD-GHS	500	8.699964	4349.98	{"name": "kapo", "note": "we the best", "type": "bank", "account": "404040404", "bank_name": "GCB Bank", "interac_email": "", "momo_provider": "", "transit_number": "", "admin_reference": "QW-M39Q6", "institution_number": ""}	pending	/uploads/proof-1771334361390-44831496.pdf	2026-02-17 13:18:58.069+00	2026-02-17 13:19:21.428+00	2026-02-17 13:19:21.426+00	\N	\N	\N	\N	QT-20260217-5K7E
28	14	CAD-GHS	100	8.699964	870	{"name": "Hen", "note": "Does", "type": "momo", "account": "024444", "momo_provider": "MTN Momo", "admin_reference": "QW-XWZ8N"}	pending	/uploads/proof-1771542978123-468555540.png	2026-02-19 23:15:37.523+00	2026-02-19 23:16:18.82+00	2026-02-19 23:16:18.819+00	\N	\N	\N	\N	QT-20260219-ER44
\.


--
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Users" (id, email, password, role, kyc_status, balance_ghs, balance_cad, "createdAt", "updatedAt", kyc_document, full_name, phone, profile_picture, country, transaction_pin, is_email_verified, verification_token, reset_password_token, reset_password_expires, verification_token_expires, kyc_document_type, kyc_document_id, kyc_front_url, kyc_back_url, is_online, is_active, account_number) FROM stdin;
16	frimpong@gmail.com	$2b$10$.6nv0WXQ2s0hKbs0bcCw8.EkhKy8ux9cFDRD6QdEjYO93Q5ZvERGm	user	unverified	0	0	2026-02-09 10:55:08.961+00	2026-02-16 15:45:29.777+00	\N	frimpong agyei	\N	\N	Ghana	$2b$10$XEmzYjYhzyo2qy952oC57.b6u1BXcm0mLH6dJXVQV/v2h.zODIOpC	f	da3acabc615bf56723cde4ce99f143d83729a3f3bd8cc7b991639287c931fcd5	\N	\N	2026-02-10 10:55:08.928+00	\N	\N	\N	\N	f	t	QT-273777
17	tjhackx111@gmail.com1	$2b$10$FHf20cIYsIhEKW2r7JjGKOiTLMfGURrKTWwAMzJCHWhmzQd/lRAPa	user	unverified	0	0	2026-02-09 11:44:31.668+00	2026-02-16 15:45:29.788+00	\N	ewfew	+233255213120	\N	Ghana	$2b$10$ayt9o8CXTnZIRdVSxopM5.enOoKVjKMxCHVFfGF5beN.tPNIt.fTe	f	f0b99f0c7466961bb6b1568fc48c460d89472172964ee519c7007c950daf1516	\N	\N	2026-02-10 11:44:31.664+00	\N	\N	\N	\N	f	t	QT-808012
1	tj@gmail.com	$2b$10$6TqpzvLXuwqHaAc1N7eFOumaXv61008.6N2oeLGQkeY34QnsIyI26	user	unverified	0	0	2026-02-03 23:41:30.252+00	2026-02-16 15:45:29.8+00	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	f	t	QT-625339
14	tjhackx111@gmail.com	$2b$10$Xo.VFf9NDhIU7ZdI2Akgg.jkz/pSAjSABa7EVpMmPkU8XH6IYD8Hy	user	unverified	0	0	2026-02-05 23:37:58.424+00	2026-02-21 13:53:31.414+00	\N	Tijani Moro	+233553477150	/uploads/avatar-1771682011396-982118430.jpeg	Ghana	$2b$10$8ze1RWDqwNA.ua97VikgdeocGG7G9k9aJvn.AZuzUsCTy4lNjaZUq	t	cf699c73b05ef3f32fb5d3b056aae77955ee6d6c320ad7cf4ef2bda72900fd2d	\N	\N	2026-02-06 23:37:58.341+00	\N	\N	\N	\N	f	t	QT-212460
3	user@example.com	$2b$10$NDg/LKrKeBrvTxLhr2jWJ.PLZWFQtkUNwAb1jpDndy6VHZubjpfhG	user	unverified	200	0	2026-02-05 12:53:18.996+00	2026-02-16 15:45:29.809+00	\N	Tijani Moro	0553477150	/uploads/avatar-1770300265627-329219701.png	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	f	t	QT-341015
20	testmetj@gmail.com	$2b$10$y5m1FJDqNRUfNo.oqw5cG.8DkGT5mnkMy7EjSXs8wmx5q2jaME0yi	user	pending	0	0	2026-02-12 04:51:28.942+00	2026-02-16 15:45:29.818+00	\N	Jeffery Frimpong	+233244512121	/uploads/avatar-1770872913717-20636866.png	Ghana	$2b$10$9DvbRFUIbb0p.GY.Db0xxOsOdcrWIlB5cFnX1VnLGRwYbMk.39EK.	t	249a1ffca99fafe0e34dba6e02cfe35e880a4c7492daeea2151e326f70f7ffe7	\N	\N	2026-02-13 04:51:28.905+00	ghana_card	GH-123344-123	/uploads/front-1770872227700-123028245.png	/uploads/back-1770872227735-64989153.png	f	t	QT-475305
2	admin@qwiktransfers.com	$2b$10$NDg/LKrKeBrvTxLhr2jWJ.PLZWFQtkUNwAb1jpDndy6VHZubjpfhG	admin	verified	1000	500	2026-02-05 12:53:18.996+00	2026-02-16 15:45:29.837+00	\N	\N	\N	/uploads/avatar-1770861218145-877940415.png	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	f	t	QT-563645
19	ama.vendor@qwiktransfers.com	$2b$10$BTe7K9dt8R2KHFRGU/a7TerTMdrhFBRJuGmGEy37jdDiYDiMseR.e	vendor	verified	\N	\N	2026-02-11 17:44:04.696+00	2026-02-16 15:45:29.845+00	\N	ama kuffour	05555555	\N	Canada	$2b$10$5Tx27XnEvT4/UriEzQQM/.gztS/W.9a.ldMoUmqKEOwejL6OE68NO	t	\N	\N	\N	\N	\N	\N	\N	\N	f	t	QT-V-9095
18	ama@vendor.com	$2b$10$WUI0kh894Ho5kFTEOXALj.ueEaw7IX58NJ8IQB0yMZkfKUQldrHoq	vendor	verified	\N	\N	2026-02-10 22:55:54.897+00	2026-02-16 15:45:29.854+00	\N	kujo mula	+23355347715	/uploads/avatar-1770865307699-964898177.png	Ghana	$2b$10$DQ/Gd1E8if8BxexPFXkDKundvefUOg2JBMX.akJFoU5/4PEWo1SkG	t	\N	\N	\N	\N	\N	\N	\N	\N	t	t	QT-V-5522
21	milco.vendor@qwiktransfer.com	$2b$10$dow2hhMPQoisiCgqBAiRYOpAstuNde7nE2j55SeO7ZjnH8P/BNxLe	vendor	verified	\N	\N	2026-02-12 06:09:35.979+00	2026-02-16 15:45:29.862+00	\N	Milco Asare	+233123456789	\N	All	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	t	t	QT-V-4220
4	verified@example.com	$2b$10$NDg/LKrKeBrvTxLhr2jWJ.PLZWFQtkUNwAb1jpDndy6VHZubjpfhG	user	verified	5000	0	2026-02-05 12:53:18.996+00	2026-02-16 15:45:29.707+00	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	f	t	QT-596560
15	testmetj1@gmail.com	$2b$10$a8h0SoHkcHkYQUS/3KIyn.yWFNOKG90Pos4iZRixWUxoayzOIDwEq	user	verified	0	0	2026-02-06 21:03:15.026+00	2026-02-16 15:45:29.766+00	\N	Donna Lopez	+233255213121	\N	Ghana	\N	f	97bd095a24bb20ed7969762a7f7c4f222234be4194ce9bcef9637f21867922c0	\N	\N	2026-02-07 21:03:15.003+00	ghana_card	GH-awdw	/uploads/front-1770413242476-209826609.jpg	/uploads/back-1770413242518-175820179.jpg	f	t	QT-699314
\.


--
-- Name: AuditLogs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."AuditLogs_id_seq"', 67, true);


--
-- Name: Notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Notifications_id_seq"', 57, true);


--
-- Name: PaymentMethods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PaymentMethods_id_seq"', 2, true);


--
-- Name: RateAlerts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."RateAlerts_id_seq"', 41, true);


--
-- Name: Rates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Rates_id_seq"', 2, true);


--
-- Name: SystemConfigs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."SystemConfigs_id_seq"', 1, true);


--
-- Name: Transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Transactions_id_seq"', 28, true);


--
-- Name: Users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Users_id_seq"', 21, true);


--
-- Name: AuditLogs AuditLogs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLogs"
    ADD CONSTRAINT "AuditLogs_pkey" PRIMARY KEY (id);


--
-- Name: Notifications Notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notifications"
    ADD CONSTRAINT "Notifications_pkey" PRIMARY KEY (id);


--
-- Name: PaymentMethods PaymentMethods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PaymentMethods"
    ADD CONSTRAINT "PaymentMethods_pkey" PRIMARY KEY (id);


--
-- Name: RateAlerts RateAlerts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RateAlerts"
    ADD CONSTRAINT "RateAlerts_pkey" PRIMARY KEY (id);


--
-- Name: Rates Rates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Rates"
    ADD CONSTRAINT "Rates_pkey" PRIMARY KEY (id);


--
-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);


--
-- Name: SystemConfigs SystemConfigs_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SystemConfigs"
    ADD CONSTRAINT "SystemConfigs_key_key" UNIQUE (key);


--
-- Name: SystemConfigs SystemConfigs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SystemConfigs"
    ADD CONSTRAINT "SystemConfigs_pkey" PRIMARY KEY (id);


--
-- Name: Transactions Transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Transactions"
    ADD CONSTRAINT "Transactions_pkey" PRIMARY KEY (id);


--
-- Name: Transactions Transactions_transaction_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Transactions"
    ADD CONSTRAINT "Transactions_transaction_id_key" UNIQUE (transaction_id);


--
-- Name: Users Users_account_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_account_number_key" UNIQUE (account_number);


--
-- Name: Users Users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key" UNIQUE (email);


--
-- Name: Users Users_phone_unique_constraint; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_phone_unique_constraint" UNIQUE (phone);


--
-- Name: Users Users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);


--
-- Name: rates_pair_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX rates_pair_unique ON public."Rates" USING btree (pair);


--
-- Name: AuditLogs AuditLogs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLogs"
    ADD CONSTRAINT "AuditLogs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Notifications Notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notifications"
    ADD CONSTRAINT "Notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RateAlerts RateAlerts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RateAlerts"
    ADD CONSTRAINT "RateAlerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Transactions Transactions_vendorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Transactions"
    ADD CONSTRAINT "Transactions_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict cHe8arCOZuIsEfor3g1QUxfYrUkmGwsgYe67d3QRzay0ixpieXQA3xIdSEzZfN5

