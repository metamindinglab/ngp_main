--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Ubuntu 14.18-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 14.18 (Ubuntu 14.18-0ubuntu0.22.04.1)

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
-- Name: AdContainerStatus; Type: TYPE; Schema: public; Owner: ngp_user
--

CREATE TYPE public."AdContainerStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'MAINTENANCE'
);


ALTER TYPE public."AdContainerStatus" OWNER TO ngp_user;

--
-- Name: AdContainerType; Type: TYPE; Schema: public; Owner: ngp_user
--

CREATE TYPE public."AdContainerType" AS ENUM (
    'DISPLAY',
    'NPC',
    'MINIGAME'
);


ALTER TYPE public."AdContainerType" OWNER TO ngp_user;

--
-- Name: MetricType; Type: TYPE; Schema: public; Owner: ngp_user
--

CREATE TYPE public."MetricType" AS ENUM (
    'd1_retention',
    'd7_retention',
    'd1_stickiness',
    'd7_stickiness',
    'daily_active_users',
    'average_play_time_minutes',
    'average_session_length_minutes',
    'monthly_active_users_by_day',
    'demographics_gender',
    'demographics_country',
    'demographics_language',
    'demographics_age_group'
);


ALTER TYPE public."MetricType" OWNER TO ngp_user;

--
-- Name: check_deletion_count(); Type: FUNCTION; Schema: public; Owner: ngp_user
--

CREATE FUNCTION public.check_deletion_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    deletion_count INTEGER;
    total_count INTEGER;
    threshold INTEGER;
BEGIN
    -- Get the table name from TG_TABLE_NAME
    EXECUTE format('SELECT COUNT(*) FROM %I', TG_TABLE_NAME) INTO total_count;
    
    -- Calculate threshold (50% of total records or 100, whichever is larger)
    threshold := GREATEST(total_count * 0.5, 100);
    
    -- For DELETE operations
    IF TG_OP = 'DELETE' THEN
        -- Count records that would be deleted
        IF TG_LEVEL = 'ROW' THEN
            deletion_count := 1;
        ELSE
            deletion_count := total_count;  -- For TRUNCATE
        END IF;
        
        -- Check if deletion count exceeds threshold
        IF deletion_count > threshold THEN
            RAISE EXCEPTION 'Mass deletion protection: Attempting to delete % records from %. This exceeds the threshold of % records.', 
                deletion_count, TG_TABLE_NAME, threshold;
        END IF;
    END IF;
    
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.check_deletion_count() OWNER TO ngp_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AdContainer; Type: TABLE; Schema: public; Owner: ngp_user
--

CREATE TABLE public."AdContainer" (
    id text NOT NULL,
    "gameId" text NOT NULL,
    name text NOT NULL,
    description text,
    type public."AdContainerType" NOT NULL,
    "position" jsonb NOT NULL,
    status public."AdContainerStatus" DEFAULT 'ACTIVE'::public."AdContainerStatus" NOT NULL,
    "currentAdId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AdContainer" OWNER TO ngp_user;

--
-- Name: AdEngagement; Type: TABLE; Schema: public; Owner: ngp_user
--

CREATE TABLE public."AdEngagement" (
    id text NOT NULL,
    "containerId" text NOT NULL,
    "adId" text,
    "eventType" text NOT NULL,
    data jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AdEngagement" OWNER TO ngp_user;

--
-- Name: Asset; Type: TABLE; Schema: public; Owner: ngp_user
--

CREATE TABLE public."Asset" (
    id text NOT NULL,
    name text NOT NULL,
    type text,
    status text,
    "robloxId" text,
    creator jsonb,
    metadata jsonb,
    versions jsonb,
    relationships jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Asset" OWNER TO ngp_user;

--
-- Name: Game; Type: TABLE; Schema: public; Owner: ngp_user
--

CREATE TABLE public."Game" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    genre text,
    "robloxLink" text,
    thumbnail text,
    metrics jsonb,
    dates jsonb,
    owner jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "gameOwnerId" text,
    "robloxAuthorization" jsonb,
    "serverApiKey" text,
    "serverApiKeyCreatedAt" timestamp(3) without time zone,
    "serverApiKeyStatus" text,
    "robloxInfo" jsonb
);


ALTER TABLE public."Game" OWNER TO ngp_user;

--
-- Name: GameAd; Type: TABLE; Schema: public; Owner: ngp_user
--

CREATE TABLE public."GameAd" (
    id text NOT NULL,
    "gameId" text NOT NULL,
    name text NOT NULL,
    type text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    assets jsonb
);


ALTER TABLE public."GameAd" OWNER TO ngp_user;

--
-- Name: GameAdPerformance; Type: TABLE; Schema: public; Owner: ngp_user
--

CREATE TABLE public."GameAdPerformance" (
    id text NOT NULL,
    "gameAdId" text NOT NULL,
    "gameId" text NOT NULL,
    "playlistId" text,
    date timestamp(3) without time zone NOT NULL,
    metrics jsonb,
    demographics jsonb,
    engagements jsonb,
    "playerDetails" jsonb,
    "timeDistribution" jsonb,
    "performanceTrends" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."GameAdPerformance" OWNER TO ngp_user;

--
-- Name: GameDeployment; Type: TABLE; Schema: public; Owner: ngp_user
--

CREATE TABLE public."GameDeployment" (
    id text NOT NULL,
    "scheduleId" text NOT NULL,
    "gameId" text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."GameDeployment" OWNER TO ngp_user;

--
-- Name: GameMedia; Type: TABLE; Schema: public; Owner: ngp_user
--

CREATE TABLE public."GameMedia" (
    id text NOT NULL,
    type text NOT NULL,
    title text,
    "localPath" text NOT NULL,
    "thumbnailUrl" text,
    "gameId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    width integer,
    height integer,
    duration integer,
    approved boolean DEFAULT true NOT NULL,
    "uploadedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "robloxId" text,
    "altText" text
);


ALTER TABLE public."GameMedia" OWNER TO ngp_user;

--
-- Name: GameMetricData; Type: TABLE; Schema: public; Owner: ngp_user
--

CREATE TABLE public."GameMetricData" (
    id text NOT NULL,
    "gameId" text NOT NULL,
    "metricType" public."MetricType" NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    value double precision NOT NULL,
    category text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    breakdown text DEFAULT 'Total'::text NOT NULL,
    series text
);


ALTER TABLE public."GameMetricData" OWNER TO ngp_user;

--
-- Name: GameOwner; Type: TABLE; Schema: public; Owner: ngp_user
--

CREATE TABLE public."GameOwner" (
    id text NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    password text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."GameOwner" OWNER TO ngp_user;

--
-- Name: Playlist; Type: TABLE; Schema: public; Owner: ngp_user
--

CREATE TABLE public."Playlist" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    type text,
    "createdBy" text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Playlist" OWNER TO ngp_user;

--
-- Name: PlaylistSchedule; Type: TABLE; Schema: public; Owner: ngp_user
--

CREATE TABLE public."PlaylistSchedule" (
    id text NOT NULL,
    "playlistId" text NOT NULL,
    "gameAdId" text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    duration integer NOT NULL,
    status text DEFAULT 'scheduled'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PlaylistSchedule" OWNER TO ngp_user;

--
-- Name: RemovableAsset; Type: TABLE; Schema: public; Owner: ngp_user
--

CREATE TABLE public."RemovableAsset" (
    id text NOT NULL,
    "robloxAssetId" text NOT NULL,
    name text NOT NULL,
    "replacedBy" text,
    reason text,
    "dateMarkedRemovable" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."RemovableAsset" OWNER TO ngp_user;

--
-- Name: _AssetPlaylists; Type: TABLE; Schema: public; Owner: ngp_user
--

CREATE TABLE public."_AssetPlaylists" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_AssetPlaylists" OWNER TO ngp_user;

--
-- Name: _GameAssets; Type: TABLE; Schema: public; Owner: ngp_user
--

CREATE TABLE public."_GameAssets" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_GameAssets" OWNER TO ngp_user;

--
-- Name: _GamePlaylists; Type: TABLE; Schema: public; Owner: ngp_user
--

CREATE TABLE public."_GamePlaylists" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_GamePlaylists" OWNER TO ngp_user;

--
-- Name: _GameToAds; Type: TABLE; Schema: public; Owner: ngp_user
--

CREATE TABLE public."_GameToAds" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_GameToAds" OWNER TO ngp_user;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: ngp_user
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO ngp_user;

--
-- Data for Name: AdContainer; Type: TABLE DATA; Schema: public; Owner: ngp_user
--

COPY public."AdContainer" (id, "gameId", name, description, type, "position", status, "currentAdId", "createdAt", "updatedAt") FROM stdin;
92d3eec5-ef65-4ba4-98d9-5cfd8e6de864	game_006	NPC-Ad-SpawnZone	NPC Ad by the Spawn zone	NPC	{"x": 120, "y": 20, "z": 305}	ACTIVE	\N	2025-07-09 15:50:25.77	2025-07-09 18:23:10.689
\.


--
-- Data for Name: AdEngagement; Type: TABLE DATA; Schema: public; Owner: ngp_user
--

COPY public."AdEngagement" (id, "containerId", "adId", "eventType", data, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Asset; Type: TABLE DATA; Schema: public; Owner: ngp_user
--

COPY public."Asset" (id, name, type, status, "robloxId", creator, metadata, versions, relationships, "createdAt", "updatedAt") FROM stdin;
k1	TechTrix	kol_character	active	12345671	null	"{\\"description\\":\\"Tech-savvy gaming influencer with a vibrant personality\\",\\"tags\\":[\\"gaming\\",\\"tech\\",\\"influencer\\"],\\"characterType\\":\\"Streamer\\",\\"appearance\\":{\\"gender\\":\\"Female\\",\\"style\\":[\\"Streetwear\\",\\"Tech-wear\\",\\"Urban\\"],\\"hairStyle\\":\\"Neon Purple Bob Cut\\",\\"hairColor\\":\\"Purple\\",\\"height\\":\\"Medium\\",\\"features\\":[\\"RGB Glasses\\",\\"Holographic Accessories\\",\\"Tech Tattoos\\"]},\\"personality\\":[\\"Energetic\\",\\"Tech-Savvy\\",\\"Trendy\\"],\\"defaultAnimations\\":[\\"Victory Dance\\",\\"Gaming Pose\\",\\"Energetic Wave\\"],\\"suitableFor\\":{\\"brands\\":[\\"Gaming Peripherals\\",\\"Energy Drinks\\",\\"Tech Gadgets\\"],\\"products\\":[\\"Gaming Chairs\\",\\"Headphones\\",\\"Custom PC Builds\\"],\\"gameTypes\\":[\\"Esports Arenas\\",\\"Gaming Cafes\\",\\"Tech Conventions\\"]},\\"marketingCapabilities\\":[\\"Brand Integration\\",\\"Live Game Reviews\\",\\"Tech Unboxing\\"]}"	null	null	2024-03-01 00:00:00	2024-03-20 00:00:00
c1	White & Black Stitches Cozy Hoodie	Model	active	16478590766	null	"{\\"description\\":\\"The white & black variant of the Eternos Digital STITCHES cozy hoodie series.\\",\\"tags\\":[\\"nike\\",\\"hoodie\\",\\"casual\\"],\\"image\\":\\"/customization/outfits/Nike-hoodie.png\\",\\"previewImage\\":\\"/customization/outfits/Nike-hoodie-preview.png\\",\\"compatibility\\":[\\"Gamer\\",\\"Athlete\\",\\"Lifestyle\\",\\"Artist\\",\\"Fashion\\"],\\"brands\\":[\\"Nike\\"],\\"size\\":[\\"S\\",\\"M\\",\\"L\\",\\"XL\\"],\\"itemType\\":\\"Clothing\\",\\"lastUpdated\\":\\"2025-06-24T05:45:18.182Z\\"}"	null	null	2024-03-01 00:00:00	2025-06-24 05:45:19.603
mg1	Wheel Of Luck	minigame	active	112978636478580	null	"{\\"description\\":\\"Embark on a journey of luck and excitement with our exclusive Wheel of Fortune Spinner with your brand logo! This eye catching game accessory brings the thrill of spinning for prizes right to your avatar, good branding exposure.\\",\\"tags\\":[\\"game\\",\\"interactive\\",\\"wheel\\"],\\"marketingCapabilities\\":[\\"Brand Awareness\\",\\"Product Showcase\\",\\"Lead Generation\\"],\\"difficulty\\":\\"Easy\\",\\"maxPlayers\\":1,\\"gameplayDuration\\":\\"45 seconds\\",\\"customizableElements\\":[{\\"id\\":\\"wheel-bg\\",\\"name\\":\\"Wheel Background\\",\\"type\\":\\"image\\",\\"description\\":\\"Background image behind the wheel\\"}]}"	null	null	2024-03-01 00:00:00	2025-03-29 04:49:39.129
h1	White 94 Baseball Cap	hat	active	17881926945	null	"{\\"description\\":\\"More UGC: https://www.roblox.com/catalog?Category=1&CreatorName=Rey%20x%20Noob&CreatorType=Group&salesTypeFilter=1\\\\n\\",\\"tags\\":[\\"supreme\\",\\"cap\\",\\"streetwear\\"],\\"image\\":\\"/customization/hats/supreme-cap.png\\",\\"compatibility\\":[\\"Lifestyle\\",\\"Fashion\\"],\\"brands\\":[\\"Supreme\\"]}"	null	null	2024-03-01 00:00:00	2025-03-21 14:53:38.21
a1	Frosty Flair - Tommy Hilfiger	animation	active	10214406616	null	"{\\"description\\":\\"Celebratory dance animation for victory moments\\",\\"tags\\":[\\"dance\\",\\"celebration\\"],\\"compatibility\\":[\\"All\\"],\\"duration\\":\\"3.5 seconds\\",\\"category\\":\\"emote\\",\\"previewUrl\\":\\"/animations/victory-dance-preview.mp4\\"}"	null	null	2024-03-01 00:00:00	2025-03-21 15:54:01.72
img1	Brand Logo Collection	image	active	12345676	null	"{\\"description\\":\\"High-resolution brand logos for in-game displays\\",\\"tags\\":[\\"logos\\",\\"branding\\",\\"marketing\\"],\\"url\\":\\"/images/brand-logos.png\\",\\"dimensions\\":{\\"width\\":1920,\\"height\\":1080},\\"fileFormat\\":\\"png\\",\\"fileSize\\":2048}"	null	null	2024-03-01 00:00:00	2024-03-20 00:00:00
aud1	Victory Fanfare	audio	active	12345677	null	"{\\"description\\":\\"Triumphant music for victory moments\\",\\"tags\\":[\\"music\\",\\"victory\\",\\"fanfare\\"],\\"duration\\":\\"5.5 seconds\\",\\"url\\":\\"/audio/victory-fanfare.mp3\\",\\"fileFormat\\":\\"mp3\\",\\"fileSize\\":1024}"	null	null	2024-03-01 00:00:00	2024-03-20 00:00:00
vid1	Brand Introduction	video	active	12345678	null	"{\\"description\\":\\"Video introduction for brand partnership\\",\\"tags\\":[\\"brand\\",\\"intro\\",\\"marketing\\"],\\"duration\\":\\"30 seconds\\",\\"url\\":\\"/videos/brand-intro.mp4\\",\\"dimensions\\":{\\"width\\":1920,\\"height\\":1080},\\"fileFormat\\":\\"mp4\\",\\"fileSize\\":15360}"	null	null	2024-03-01 00:00:00	2024-03-20 00:00:00
s1	Dr. Boots	shoes	active	93915499446569	null	"{\\"description\\":\\"Dr. Marten Boot (Black)\\",\\"tags\\":[\\"boots\\",\\"dr-martens\\",\\"fashion\\"],\\"image\\":\\"/customization/outfits/DrMartenBoots.png\\",\\"compatibility\\":[\\"Artist\\",\\"Fashion\\"],\\"brands\\":[\\"Dr. Martens\\"],\\"size\\":[\\"UK6\\",\\"UK7\\",\\"UK8\\",\\"UK9\\",\\"UK10\\"]}"	null	null	2024-03-01 00:00:00	2025-03-21 14:57:36.763
k2	SportStar	kol_character	active	12345681	null	"{\\"description\\":\\"Professional athlete influencer focused on sports and fitness\\",\\"tags\\":[\\"sports\\",\\"fitness\\",\\"athlete\\"],\\"characterType\\":\\"Athlete\\",\\"appearance\\":{\\"gender\\":\\"Male\\",\\"style\\":[\\"Athletic\\",\\"Sporty\\",\\"Modern\\"],\\"hairStyle\\":\\"Fade Cut\\",\\"hairColor\\":\\"Black\\",\\"height\\":\\"Tall\\",\\"features\\":[\\"Athletic Build\\",\\"Sports Accessories\\",\\"Team Jersey\\"]},\\"personality\\":[\\"Competitive\\",\\"Motivational\\",\\"Team Player\\"],\\"defaultAnimations\\":[\\"Sports Celebration\\",\\"Training Routine\\",\\"Victory Pose\\"],\\"suitableFor\\":{\\"brands\\":[\\"Sports Apparel\\",\\"Fitness Equipment\\",\\"Health Supplements\\"],\\"products\\":[\\"Athletic Shoes\\",\\"Sports Gear\\",\\"Energy Bars\\"],\\"gameTypes\\":[\\"Sports Games\\",\\"Training Simulators\\",\\"Competition Venues\\"]},\\"marketingCapabilities\\":[\\"Brand Endorsements\\",\\"Fitness Challenges\\",\\"Sports Events\\"]}"	null	null	2024-03-01 00:00:00	2024-03-20 00:00:00
k3	ArtisticSoul	kol_character	active	12345682	null	"{\\"description\\":\\"Creative digital artist and design influencer\\",\\"tags\\":[\\"art\\",\\"design\\",\\"creative\\"],\\"characterType\\":\\"Artist\\",\\"appearance\\":{\\"gender\\":\\"Neutral\\",\\"style\\":[\\"Artistic\\",\\"Bohemian\\",\\"Creative\\"],\\"hairStyle\\":\\"Colorful Undercut\\",\\"hairColor\\":\\"Rainbow\\",\\"height\\":\\"Medium\\",\\"features\\":[\\"Paint Splatter Clothes\\",\\"Digital Tablet\\",\\"Creative Accessories\\"]},\\"personality\\":[\\"Creative\\",\\"Expressive\\",\\"Inspiring\\"],\\"defaultAnimations\\":[\\"Drawing Pose\\",\\"Creative Expression\\",\\"Artistic Flourish\\"],\\"suitableFor\\":{\\"brands\\":[\\"Art Supplies\\",\\"Digital Tools\\",\\"Creative Software\\"],\\"products\\":[\\"Drawing Tablets\\",\\"Art Materials\\",\\"Creative Tools\\"],\\"gameTypes\\":[\\"Art Studios\\",\\"Creative Spaces\\",\\"Design Workshops\\"]},\\"marketingCapabilities\\":[\\"Art Tutorials\\",\\"Creative Collaborations\\",\\"Digital Art Showcases\\"]}"	null	null	2024-03-01 00:00:00	2024-03-20 00:00:00
k4	StyleIcon	kol_character	active	12345683	null	"{\\"description\\":\\"Fashion and lifestyle influencer with a keen eye for trends\\",\\"tags\\":[\\"fashion\\",\\"lifestyle\\",\\"luxury\\"],\\"characterType\\":\\"Fashion Influencer\\",\\"appearance\\":{\\"gender\\":\\"Female\\",\\"style\\":[\\"High Fashion\\",\\"Trendy\\",\\"Luxury\\"],\\"hairStyle\\":\\"Long Wavy\\",\\"hairColor\\":\\"Blonde\\",\\"height\\":\\"Tall\\",\\"features\\":[\\"Designer Accessories\\",\\"Premium Outfits\\",\\"Runway Walk\\"]},\\"personality\\":[\\"Sophisticated\\",\\"Trendsetter\\",\\"Charismatic\\"],\\"defaultAnimations\\":[\\"Catwalk\\",\\"Photo Pose\\",\\"Elegant Wave\\"],\\"suitableFor\\":{\\"brands\\":[\\"Fashion Brands\\",\\"Luxury Items\\",\\"Beauty Products\\"],\\"products\\":[\\"Designer Clothes\\",\\"Accessories\\",\\"Cosmetics\\"],\\"gameTypes\\":[\\"Fashion Shows\\",\\"Shopping Centers\\",\\"Beauty Studios\\"]},\\"marketingCapabilities\\":[\\"Fashion Showcases\\",\\"Style Tips\\",\\"Brand Collaborations\\"]}"	null	null	2024-03-01 00:00:00	2024-03-20 00:00:00
c2	Adidas Black Professional Shirt	clothing	active	16099347638	null	"{\\"description\\":\\"Adidas Black Professional Shirt\\",\\"tags\\":[\\"adidas\\",\\"sports\\",\\"athletic\\"],\\"image\\":\\"/customization/outfits/White-shirt-Adidas.png\\",\\"compatibility\\":[\\"Athlete\\",\\"Lifestyle\\"],\\"brands\\":[\\"Adidas\\"],\\"size\\":[\\"S\\",\\"M\\",\\"L\\",\\"XL\\"]}"	null	null	2024-03-01 00:00:00	2025-03-21 15:03:59.656
c3	Adidas Anger Tracksuit Top	clothing	active	15503479545	null	"{\\"description\\":\\"Adidas Anger Tracksuit Top (Red)\\",\\"tags\\":[\\"streetwear\\",\\"casual\\",\\"Adidas\\"],\\"image\\":\\"/customization/outfits/White-Shirt-Supreme.png\\",\\"compatibility\\":[\\"Lifestyle\\",\\"Artist\\"],\\"brands\\":[\\"Adidas\\"],\\"size\\":[\\"S\\",\\"M\\",\\"L\\",\\"XL\\"]}"	null	null	2024-03-01 00:00:00	2025-03-21 15:13:12.926
c4	Naruto Jacket	clothing	active	88031588525790	null	"{\\"description\\":\\"Channel your inner ninja with this high-quality jacket inspired by Naruto Uzumaki.\\",\\"tags\\":[\\"gucci\\",\\"luxury\\",\\"jacket\\"],\\"image\\":\\"/customization/outfits/Color-jacket-Gucci.png\\",\\"compatibility\\":[\\"Fashion\\",\\"Lifestyle\\"],\\"brands\\":[\\"Naruto\\"],\\"size\\":[\\"S\\",\\"M\\",\\"L\\",\\"XL\\"]}"	null	null	2024-03-01 00:00:00	2025-03-21 15:00:48.705
s2	Nike Air 1's Sneakers	shoes	active	18474543214	null	"{\\"description\\":\\"Nike Air One (Green)\\",\\"tags\\":[\\"nike\\",\\"sneakers\\",\\"athletic\\"],\\"image\\":\\"/customization/outfits/MixColor-Nike-AirMax.png\\",\\"compatibility\\":[\\"Athlete\\",\\"Lifestyle\\"],\\"brands\\":[\\"Nike\\"],\\"size\\":[\\"US7\\",\\"US8\\",\\"US9\\",\\"US10\\",\\"US11\\"]}"	null	null	2024-03-01 00:00:00	2025-03-21 15:18:31.166
s3	Large Classic Billboard	multi_display	active	13158731202	null	"{\\"description\\":\\"Large Classic Billboard\\",\\"tags\\":[\\"Billboard\\"],\\"image\\":\\"/customization/outfits/Red-shoes-Adidas-Superstar.png\\",\\"compatibility\\":[\\"Lifestyle\\",\\"Fashion\\"],\\"brands\\":[\\"Adidas\\"],\\"size\\":[\\"US7\\",\\"US8\\",\\"US9\\",\\"US10\\",\\"US11\\"]}"	null	null	2024-03-01 00:00:00	2025-03-21 15:50:27.126
i1	Coke	item	active	17165457035	null	"{\\"description\\":\\"Coca Coka Red can\\",\\"tags\\":[\\"drink\\",\\"prop\\",\\"beverage\\"],\\"image\\":\\"/customization/items/CocaCola.png\\",\\"brands\\":[\\"Coca-Cola\\"]}"	null	null	2024-03-01 00:00:00	2025-03-21 15:40:21.022
i2	Pepsi Blue Soda Can	item	active	15548194077	null	"{\\"description\\":\\"Pepsi Blue Soda Can\\",\\"tags\\":[\\"drink\\",\\"prop\\",\\"beverage\\"],\\"image\\":\\"/customization/items/Pepsi.png\\",\\"brands\\":[\\"Pepsi\\"]}"	null	null	2024-03-01 00:00:00	2025-03-21 15:43:40.602
i3	Redbull	item	active	73652546319715	null	"{\\"description\\":\\"Redbull \\",\\"tags\\":[\\"drink\\",\\"prop\\",\\"energy\\",\\"Redbull\\"],\\"image\\":\\"/customization/items/Redbull.png\\",\\"brands\\":[\\"Red Bull\\"]}"	null	null	2024-03-01 00:00:00	2025-03-21 15:45:16.222
i4	Monster Energy	item	active	17166207664	null	"{\\"description\\":\\"Interactive Monster Energy can prop\\",\\"tags\\":[\\"drink\\",\\"prop\\",\\"energy\\",\\"Monster\\"],\\"image\\":\\"/customization/items/MonsterEnergy.png\\",\\"brands\\":[\\"Monster\\"]}"	null	null	2024-03-01 00:00:00	2025-03-21 15:37:18.649
a2	Hips Poppin' - Zara Larsson	Animation	active	6797919579	null	"{\\"description\\":\\"Get your groove on!\\",\\"tags\\":[\\"dance\\",\\"hip-hop\\",\\"emote\\"],\\"compatibility\\":[\\"Lifestyle\\",\\"Artist\\"],\\"itemType\\":\\"Animation\\",\\"duration\\":\\"4.0 seconds\\",\\"category\\":\\"emote\\",\\"previewUrl\\":\\"/customization/animations/hiphop.png\\",\\"lastUpdated\\":\\"2025-04-27T23:55:54.632Z\\"}"	null	null	2024-03-01 00:00:00	2025-04-27 23:55:56.153
a3	Victory Dance	animation	active	15506503658	null	"{\\"description\\":\\"BIG WINNER ENERGY\\",\\"tags\\":[\\"victory\\",\\"celebration\\",\\"emote\\"],\\"compatibility\\":[\\"Athlete\\",\\"Gamer\\"],\\"duration\\":\\"3.0 seconds\\",\\"category\\":\\"emote\\",\\"previewUrl\\":\\"/customization/animations/Victory.png\\"}"	null	null	2024-03-01 00:00:00	2025-03-21 15:56:26.216
a4	Drink Animation	animation	active	12345695	null	"{\\"description\\":\\"Generic drinking animation\\",\\"tags\\":[\\"drink\\",\\"action\\",\\"emote\\"],\\"duration\\":\\"2.5 seconds\\",\\"category\\":\\"action\\",\\"previewUrl\\":\\"/customization/animations/Drinking.png\\"}"	null	null	2024-03-01 00:00:00	2024-03-20 00:00:00
bb1	Premium Billboard - Landscape	multiMediaSignage	active	132490376647395	null	"{\\"description\\":\\"Large format landscape billboard for premium game advertising\\",\\"tags\\":[\\"billboard\\",\\"landscape\\",\\"premium\\"],\\"dimensions\\":{\\"width\\":1920,\\"height\\":1080}}"	null	null	2024-03-01 00:00:00	2025-03-29 03:34:56.184
bb2	City Square Billboard	multiMediaSignage	active	102908986501799	null	"{\\"description\\":\\"Central square billboard with high visibility\\",\\"tags\\":[\\"billboard\\",\\"square\\",\\"central\\"],\\"dimensions\\":{\\"width\\":2560,\\"height\\":1440}}"	null	null	2024-03-01 00:00:00	2025-03-29 03:20:54.561
bb3	Digital Billboard - Portrait	multiMediaSignage	active	75331195844178	null	"{\\"description\\":\\"Vertical digital billboard with animation support\\",\\"tags\\":[\\"billboard\\",\\"portrait\\",\\"digital\\"],\\"dimensions\\":{\\"width\\":1080,\\"height\\":1920}}"	null	null	2024-03-01 00:00:00	2025-03-29 03:33:25.663
asset_004	Default KOL character (Male)	kol_character	active	128800353489791	null	"{\\"description\\":\\"Male teenager in-game KOL character with short hair, medium build body. \\",\\"tags\\":[\\"male\\",\\"teenager\\",\\"short hair\\",\\"medium build body\\"]}"	null	null	2025-03-29 03:59:38.739	2025-03-29 04:00:13.148
asset_005	Basketball shooting machine with Ad display	minigame	active	118281644248656	null	"{\\"description\\":\\"A fun arcade basketball shooting machine providing advertisement embedding.  Optional function to distribute rewards.  \\",\\"tags\\":[\\"basketball\\",\\"shooting\\",\\"arcade\\",\\"ad\\",\\"reward\\"]}"	null	null	2025-03-29 04:43:38.593	2025-03-29 04:44:56.391
asset_006	Amnesty International Hoodie (Yellow)	clothing	active	102652418299443	null	"{\\"description\\":\\"Amnesty International Hoodie (Yellow)\\",\\"tags\\":[\\"Amnesty International\\",\\"NGO\\",\\"Hoodie\\"]}"	null	null	2025-03-29 10:29:52.91	2025-03-29 16:11:01.676
asset_007	Pepsi logo	image	active	87526574011188	null	"{\\"description\\":\\"Pepsi logo (Blue Round)\\",\\"tags\\":[\\"Pepsi\\",\\"Blue\\",\\"Round\\"]}"	null	null	2025-04-01 16:55:02.067	2025-04-01 16:55:02.067
asset_008	APT_Dance_Song	audio	active	110671947384464	null	"{\\"description\\":\\"Popular APT Song by Rose and Bruno Mars\\",\\"tags\\":[\\"APT\\",\\"Dance\\",\\"Song\\"]}"	null	null	2025-04-07 13:59:45.232	2025-04-07 13:59:45.232
asset_009	YAS Insurance logo (Updated)	Decal	active	136394278819679	null	"{\\"description\\":\\"The logo of the YAS insurance app\\",\\"tags\\":[\\"YAS\\",\\"insurance\\",\\"logo\\"],\\"itemType\\":\\"image\\",\\"lastUpdated\\":\\"2025-04-08T15:36:30.777Z\\"}"	null	null	2025-04-08 05:39:11.585	2025-04-08 15:36:39.375
asset_010	TikTok Popular Dance 1	animation	active	116987473079382	null	"{\\"description\\":\\"TikTok Popular Dance 1\\",\\"tags\\":[\\"TikTok Popular Dance\\",\\"style\\"],\\"itemType\\":\\"Animation\\"}"	null	null	2025-04-09 15:55:15.472	2025-04-09 15:55:15.472
\.


--
-- Data for Name: Game; Type: TABLE DATA; Schema: public; Owner: ngp_user
--

COPY public."Game" (id, name, description, genre, "robloxLink", thumbnail, metrics, dates, owner, "createdAt", "updatedAt", "gameOwnerId", "robloxAuthorization", "serverApiKey", "serverApiKeyCreatedAt", "serverApiKeyStatus", "robloxInfo") FROM stdin;
game_001	Adopt Me!	Adopt pets, trade items, and build your dream home in this enchanting role-playing experience!	Role-Playing	https://www.roblox.com/games/920587237/Adopt-Me	/games/adopt-me.png	{"dau": 250000, "mau": 4500000, "day1Retention": 45.2, "topGeographicPlayers": [{"country": "United States", "percentage": 35.5}, {"country": "Brazil", "percentage": 15.2}, {"country": "United Kingdom", "percentage": 12.8}, {"country": "Canada", "percentage": 8.5}, {"country": "Germany", "percentage": 6.2}]}	{"created": "2017-07-14T00:00:00Z", "mgnJoined": "2023-01-15T00:00:00Z", "lastUpdated": "2024-03-15T00:00:00Z"}	{"name": "DreamCraft Studios", "email": "contact@dreamcraftstudios.com", "country": "United States", "discordId": "dreamcraft#1234"}	2025-07-02 13:03:03.33	2025-07-02 13:03:03.33	9d8257c5-b7ef-437d-95cc-e4cb8cb0201a	{}	\N	\N	\N	\N
game_002	Blox Fruits	Become the strongest warrior in this One Piece inspired fighting game! Train, battle, and collect rare fruits to gain powerful abilities.	Fighting	https://www.roblox.com/games/2753915549/Blox-Fruits	/games/blox-fruits.png	{"dau": 180000, "mau": 3200000, "day1Retention": 42.8, "topGeographicPlayers": [{"country": "Philippines", "percentage": 28.5}, {"country": "United States", "percentage": 22.3}, {"country": "Indonesia", "percentage": 15.7}, {"country": "Thailand", "percentage": 10.2}, {"country": "Brazil", "percentage": 8.9}]}	{"created": "2019-01-25T00:00:00Z", "mgnJoined": "2023-03-20T00:00:00Z", "lastUpdated": "2024-03-18T00:00:00Z"}	{"name": "Gamer Robot Inc", "email": "support@gamerrobot.com", "country": "Canada", "discordId": "gamerrobot#5678"}	2025-07-02 13:03:03.403	2025-07-02 13:03:03.403	dd698dec-8b90-4dd3-86b4-cd7d3d12f675	{}	\N	\N	\N	\N
game_003	Phantom Forces	Experience intense tactical combat in this modern military FPS! Choose your loadout, join a team, and compete in various game modes.	First-Person Shooter	https://www.roblox.com/games/292439477/Phantom-Forces	/games/phantom-forces.png	{"dau": 120000, "mau": 2800000, "day1Retention": 38.5, "topGeographicPlayers": [{"country": "United States", "percentage": 32.1}, {"country": "Russia", "percentage": 18.4}, {"country": "Germany", "percentage": 12.6}, {"country": "United Kingdom", "percentage": 9.8}, {"country": "France", "percentage": 7.5}]}	{"created": "2015-09-10T00:00:00Z", "mgnJoined": "2023-06-01T00:00:00Z", "lastUpdated": "2024-03-12T00:00:00Z"}	{"name": "StyLiS Studios", "email": "contact@stylisstudios.com", "country": "United States", "discordId": "stylis#9012"}	2025-07-02 13:03:03.408	2025-07-02 13:03:03.408	5c95f626-dc17-42db-b2f8-18ca07ec03dc	{}	\N	\N	\N	\N
game_004	Tower Defense Simulator	Team up with friends to defend against waves of enemies! Place towers strategically and upgrade them to overcome challenging missions.	Strategy	https://www.roblox.com/games/3260590327/Tower-Defense-Simulator	/games/tower-defense-simulator.png	{"dau": 95000, "mau": 1800000, "day1Retention": 41.3, "topGeographicPlayers": [{"country": "United States", "percentage": 28.9}, {"country": "Brazil", "percentage": 16.7}, {"country": "Mexico", "percentage": 13.4}, {"country": "Canada", "percentage": 11.2}, {"country": "Argentina", "percentage": 8.1}]}	{"created": "2019-06-05T00:00:00Z", "mgnJoined": "2023-09-10T00:00:00Z", "lastUpdated": "2024-03-19T00:00:00Z"}	{"name": "ParadoxStudios", "email": "info@paradoxstudios.net", "country": "Australia", "discordId": "paradox#3456"}	2025-07-02 13:03:03.419	2025-07-02 13:03:03.419	3e3829e3-a41b-40de-ab4c-85f71515c73e	{}	\N	\N	\N	\N
game_006	Metaminding Demo #2	A demo Game Ads demo game for MetaMinding Lab	DEMO	https://www.roblox.com/games/99879465899023/MetaMinding-Lab-Demo#!/about		{"dau": 0, "mau": 0, "day1Retention": 0}	{}	{"name": "MetaMinding Lab", "email": "info@metamindinglab.com", "country": "Hong Kong"}	2025-07-02 13:03:03.451	2025-07-11 15:31:09.834	9be282ab-42b0-4e1d-a9fa-c8facfea9470	{}	RBXG-4e05dabc3cf0cb31be561afb7dc61fd0c99773607c411572	2025-07-09 16:23:10.889	active	\N
game_005	Escape to Freedom [FULL GAME!]	An utterly unique escape game that will challenge your ability to handle a potentially disastrous situation. The journey to freedom will not only test your survival skills but will provide a taste of a life-changing experience.\nObjective: Complete the game safely and quickly, figure out challenges along the journey by noting instructions and status information.  Why not work with your friends in the multiplayer mode stages? \n\n🏆 Aim high at the leaderboard or just play for fun.....the choice is yours. To achieve an even higher score, just replay different parts of the game. \n\n🎮 💻 📱 Play Escape to Freedom on any device!\n⚙️ Feedback/questions/complaints? Let us know on our socials! \n\nMember of MML Game Network\nCreated by MetaMinding Lab in association with Amnesty International.  Credit to Skilled Studio. \n\n⚠️ WARNING: The game contains distressing imagery and themes related to war and refugee experiences. Parental guidance is advised.	All	https://www.roblox.com/games/4785787141	/media/game_005/1742794313661-ETF-V3.webp	{"dau": 0, "mau": 0, "day1Retention": 0, "topGeographicPlayers": []}	{"created": "2023-06-19T03:48:29.263Z", "mgnJoined": "2025-03-22T17:56:38.521Z", "lastUpdated": "2025-03-24T07:10:04.129Z", "lastRobloxSync": "2025-03-22T17:56:38.521Z"}	{"name": "MetaMinding Lab - Amnesty", "email": "", "country": "Hong Kong", "robloxId": 32528272, "discordId": ""}	2025-07-02 13:03:03.424	2025-07-12 10:40:38.395	\N	{"type": "api_key", "apiKey": "5o02SKlLRUmKXr4cVQL3roBCmZK2BytRhRbRmBADUkLSxphvZXlKaGJHY2lPaUpTVXpJMU5pSXNJbXRwWkNJNkluTnBaeTB5TURJeExUQTNMVEV6VkRFNE9qVXhPalE1V2lJc0luUjVjQ0k2SWtwWFZDSjkuZXlKaVlYTmxRWEJwUzJWNUlqb2lOVzh3TWxOTGJFeFNWVzFMV0hJMFkxWlJURE55YjBKRGJWcExNa0o1ZEZKb1VtSlNiVUpCUkZWclRGTjRjR2gySWl3aWIzZHVaWEpKWkNJNklqTTFNRFExTVRBek5UWWlMQ0poZFdRaU9pSlNiMkpzYjNoSmJuUmxjbTVoYkNJc0ltbHpjeUk2SWtOc2IzVmtRWFYwYUdWdWRHbGpZWFJwYjI1VFpYSjJhV05sSWl3aVpYaHdJam94TnpVeU16QTRNemN4TENKcFlYUWlPakUzTlRJek1EUTNOekVzSW01aVppSTZNVGMxTWpNd05EYzNNWDAua2Z4Zi1veE9sVE9oUkpIMV9LcmE3dDFGSGh6aXBBM19oekhIOUNjSk5XdkVPdFBnXzUtaTFJaFJhZUlQZzF6MGFpUjFWQ0NHeVFuNVNIY1ZYdVhwOG5iMjNTV0h4QXN5ZVJMSTE2MUt0bE1taG1uS2hXMHV2bnk5NHgyTV9GbDRuSTRfN20weUltTkpXMEdENjctMXp0dzJDLWRvYmhrZk9aaUFMVERWU3ZvSjR0ZlJ4WE1BTlNDWWY4MmxFeDRSWllnNDRGRncwMDJHeTZ3Z1ltbkp4RHFmZXFPc0NlakNJR0FDSE1SWDhFOHQ2T0FQdVEwTmlBMkw1LU9qbEQ0bjJtS08yUnZ3bTN2YjJmZ2xESDdWQ3B1ZDRzNks5WDFZS2V4akd0UVFoM2RPT1cteVMzU3BRVFQzOUpwaE1SS3lVQUJYMlpSd2FWdjBfbS1WZ2NpQUZn", "status": "active", "lastVerified": "2025-07-12T10:39:36.647Z"}	\N	\N	\N	\N
\.


--
-- Data for Name: GameAd; Type: TABLE DATA; Schema: public; Owner: ngp_user
--

COPY public."GameAd" (id, "gameId", name, type, "createdAt", "updatedAt", assets) FROM stdin;
ad_1742883681966	game_005	Sign board	multimedia_display	2025-03-25 06:21:22.295	2025-03-25 06:21:22.295	[{"assetId": "s3", "assetType": "multi_display", "robloxAssetId": "13158731202"}, {"assetId": "aud1", "assetType": "audio", "robloxAssetId": "12345677"}]
ad_1744021614595	game_005	Amnesty+MonsterDrink+NikeAirShoe+WhiteCap (Male hiphop KOL)	dancing_npc	2025-04-07 10:26:55.134	2025-04-07 10:26:55.134	[{"assetId": "asset_004", "assetType": "kol_character", "robloxAssetId": "128800353489791"}, {"assetId": "h1", "assetType": "hat", "robloxAssetId": "17881926945"}, {"assetId": "asset_006", "assetType": "clothing", "robloxAssetId": "102652418299443"}, {"assetId": "i4", "assetType": "item", "robloxAssetId": "17166207664"}, {"assetId": "s2", "assetType": "shoes", "robloxAssetId": "18474543214"}, {"assetId": "a1", "assetType": "animation", "robloxAssetId": "10214406616"}, {"assetId": "aud1", "assetType": "audio", "robloxAssetId": "12345677"}]
ad_1742820645812	game_005	Adidas+Pepsi+DrMartenBoots	dancing_npc	2025-03-24 12:50:45.987	2025-07-07 16:43:18.97	[{"assetId": "asset_004", "assetType": "kol_character", "robloxAssetId": "128800353489791"}, {"assetId": "c2", "assetType": "clothing", "robloxAssetId": "16099347638"}, {"assetId": "i2", "assetType": "item", "robloxAssetId": "15548194077"}, {"assetId": "s1", "assetType": "shoes", "robloxAssetId": "93915499446569"}, {"assetId": "a2", "assetType": "animation", "robloxAssetId": "6797919579"}, {"assetId": "aud1", "assetType": "audio", "robloxAssetId": "12345677"}]
\.


--
-- Data for Name: GameAdPerformance; Type: TABLE DATA; Schema: public; Owner: ngp_user
--

COPY public."GameAdPerformance" (id, "gameAdId", "gameId", "playlistId", date, metrics, demographics, engagements, "playerDetails", "timeDistribution", "performanceTrends", "createdAt", "updatedAt") FROM stdin;
perf_001	ad_1742820645812	game_001	playlist_1742835474241	2024-03-20 00:00:00	"{\\"totalImpressions\\":15000,\\"uniqueImpressions\\":12000,\\"totalEngagements\\":4500,\\"uniqueEngagements\\":3800,\\"averageEngagementDuration\\":45,\\"engagementRate\\":30,\\"completionRate\\":85,\\"conversionRate\\":31.67}"	"{\\"gender\\":{\\"male\\":55,\\"female\\":40,\\"other\\":3,\\"unknown\\":2},\\"ageGroup\\":{\\"under13\\":65,\\"over13\\":30,\\"unknown\\":5},\\"geographicRegion\\":{\\"North America\\":40,\\"Europe\\":25,\\"Asia\\":20,\\"South America\\":10,\\"Oceania\\":5},\\"language\\":{\\"English\\":45,\\"Spanish\\":15,\\"French\\":10,\\"German\\":8,\\"Portuguese\\":7,\\"Other\\":15},\\"deviceType\\":{\\"desktop\\":40,\\"mobile\\":35,\\"tablet\\":15,\\"console\\":8,\\"unknown\\":2},\\"platform\\":{\\"windows\\":35,\\"mac\\":15,\\"ios\\":20,\\"android\\":15,\\"xbox\\":10,\\"unknown\\":5}}"	"[{\\"timestamp\\":\\"2024-03-20T10:15:30Z\\",\\"duration\\":60,\\"interactionType\\":\\"view\\",\\"interactionDetails\\":{\\"timeSpent\\":60}},{\\"timestamp\\":\\"2024-03-20T10:16:00Z\\",\\"duration\\":120,\\"interactionType\\":\\"interact\\",\\"interactionDetails\\":{\\"buttonClicked\\":\\"shop_button\\",\\"timeSpent\\":120,\\"completionStatus\\":\\"completed\\"}}]"	"{\\"totalPlayers\\":15000,\\"uniquePlayers\\":12000,\\"returningPlayers\\":8000,\\"newPlayers\\":4000}"	"{\\"hourOfDay\\":{\\"0\\":500,\\"1\\":300,\\"2\\":200,\\"3\\":150,\\"4\\":100,\\"5\\":150,\\"6\\":300,\\"7\\":600,\\"8\\":1000,\\"9\\":1500,\\"10\\":2000,\\"11\\":2500,\\"12\\":3000,\\"13\\":2800,\\"14\\":2500,\\"15\\":2200,\\"16\\":2000,\\"17\\":1800,\\"18\\":1600,\\"19\\":1400,\\"20\\":1200,\\"21\\":1000,\\"22\\":800,\\"23\\":600},\\"dayOfWeek\\":{\\"0\\":2500,\\"1\\":2200,\\"2\\":2000,\\"3\\":1800,\\"4\\":1600,\\"5\\":3000,\\"6\\":2800}}"	"{\\"daily\\":[{\\"date\\":\\"2024-03-14\\",\\"impressions\\":14000,\\"engagements\\":4200,\\"engagementRate\\":30},{\\"date\\":\\"2024-03-15\\",\\"impressions\\":14500,\\"engagements\\":4350,\\"engagementRate\\":30},{\\"date\\":\\"2024-03-16\\",\\"impressions\\":15000,\\"engagements\\":4500,\\"engagementRate\\":30}],\\"weekly\\":[{\\"weekStart\\":\\"2024-03-14\\",\\"impressions\\":43500,\\"engagements\\":13050,\\"engagementRate\\":30}]}"	2025-07-02 13:03:03.639	2025-07-02 13:03:03.639
\.


--
-- Data for Name: GameDeployment; Type: TABLE DATA; Schema: public; Owner: ngp_user
--

COPY public."GameDeployment" (id, "scheduleId", "gameId", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: GameMedia; Type: TABLE DATA; Schema: public; Owner: ngp_user
--

COPY public."GameMedia" (id, type, title, "localPath", "thumbnailUrl", "gameId", "createdAt", "updatedAt", width, height, duration, approved, "uploadedAt", "robloxId", "altText") FROM stdin;
image_1742794313661	image	ETF-V3.webp	/media/game_005/1742794313661-ETF-V3.webp	/media/game_005/1742794313661-ETF-V3.webp	game_005	2025-07-02 13:03:03.432	2025-07-02 13:03:03.437	768	432	\N	t	2025-03-24 05:31:53.662	\N	\N
image_1742794313862	image	ETF-v2.webp	/media/game_005/1742794313862-ETF-v2.webp	/media/game_005/1742794313862-ETF-v2.webp	game_005	2025-07-02 13:03:03.442	2025-07-02 13:03:03.447	768	432	\N	t	2025-03-24 05:31:53.862	\N	\N
\.


--
-- Data for Name: GameMetricData; Type: TABLE DATA; Schema: public; Owner: ngp_user
--

COPY public."GameMetricData" (id, "gameId", "metricType", date, value, category, "createdAt", "updatedAt", breakdown, series) FROM stdin;
game_006_demographics_age_group_18+	game_006	demographics_age_group	2025-07-11 08:12:14.666	15034	18+	2025-07-11 08:12:14.666	2025-07-11 08:12:14.666	Total	\N
game_006_demographics_language_Indonesian	game_006	demographics_language	2025-07-11 08:12:14.668	946	Indonesian	2025-07-11 08:12:14.668	2025-07-11 08:12:14.668	Total	\N
game_006_demographics_language_Arabic	game_006	demographics_language	2025-07-11 08:12:14.668	418	Arabic	2025-07-11 08:12:14.668	2025-07-11 08:12:14.668	Total	\N
game_006_demographics_age_group_Date	game_006	demographics_age_group	2025-07-11 08:12:14.666	2025	Date	2025-07-11 08:12:14.666	2025-07-11 08:12:14.666	Total	\N
game_006_demographics_language_English	game_006	demographics_language	2025-07-11 08:12:14.668	13246	English	2025-07-11 08:12:14.668	2025-07-11 08:12:14.668	Total	\N
game_006_demographics_language_French	game_006	demographics_language	2025-07-11 08:12:14.668	595	French	2025-07-11 08:12:14.668	2025-07-11 08:12:14.668	Total	\N
game_006_demographics_age_group_Unknown	game_006	demographics_age_group	2025-07-11 08:12:14.666	192	Unknown	2025-07-11 08:12:14.666	2025-07-11 08:12:14.666	Total	\N
game_006_demographics_language_Russian	game_006	demographics_language	2025-07-11 08:12:14.668	1738	Russian	2025-07-11 08:12:14.668	2025-07-11 08:12:14.668	Total	\N
game_006_demographics_language_German	game_006	demographics_language	2025-07-11 08:12:14.668	310	German	2025-07-11 08:12:14.668	2025-07-11 08:12:14.668	Total	\N
game_006_demographics_language_Vietnamese	game_006	demographics_language	2025-07-11 08:12:14.668	400	Vietnamese	2025-07-11 08:12:14.668	2025-07-11 08:12:14.668	Total	\N
game_006_demographics_age_group_9-12	game_006	demographics_age_group	2025-07-11 08:12:14.666	1135	9-12	2025-07-11 08:12:14.666	2025-07-11 08:12:14.666	Total	\N
game_006_demographics_language_Date	game_006	demographics_language	2025-07-11 08:12:14.668	2025	Date	2025-07-11 08:12:14.668	2025-07-11 08:12:14.668	Total	\N
game_006_demographics_age_group_<9	game_006	demographics_age_group	2025-07-11 08:12:14.666	540	<9	2025-07-11 08:12:14.666	2025-07-11 08:12:14.666	Total	\N
game_006_demographics_age_group_13-17	game_006	demographics_age_group	2025-07-11 08:12:14.666	6392	13-17	2025-07-11 08:12:14.666	2025-07-11 08:12:14.666	Total	\N
game_006_demographics_language_Portuguese	game_006	demographics_language	2025-07-11 08:12:14.668	1640	Portuguese	2025-07-11 08:12:14.668	2025-07-11 08:12:14.668	Total	\N
game_006_demographics_language_Thai	game_006	demographics_language	2025-07-11 08:12:14.668	324	Thai	2025-07-11 08:12:14.668	2025-07-11 08:12:14.668	Total	\N
game_006_demographics_gender_Unknown	game_006	demographics_gender	2025-07-11 08:12:14.669	2096	Unknown	2025-07-11 08:12:14.669	2025-07-11 08:12:14.669	Total	\N
game_006_demographics_gender_Date	game_006	demographics_gender	2025-07-11 08:12:14.669	2025	Date	2025-07-11 08:12:14.669	2025-07-11 08:12:14.669	Total	\N
game_006_demographics_country_Date	game_006	demographics_country	2025-07-11 08:12:14.681	2025	Date	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_gender_Female	game_006	demographics_gender	2025-07-11 08:12:14.669	9557	Female	2025-07-11 08:12:14.669	2025-07-11 08:12:14.669	Total	\N
game_006_demographics_gender_Male	game_006	demographics_gender	2025-07-11 08:12:14.669	11475	Male	2025-07-11 08:12:14.669	2025-07-11 08:12:14.669	Total	\N
game_006_demographics_country_United States	game_006	demographics_country	2025-07-11 08:12:14.681	6379	United States	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Brazil	game_006	demographics_country	2025-07-11 08:12:14.681	1629	Brazil	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Russian Federation	game_006	demographics_country	2025-07-11 08:12:14.681	1408	Russian Federation	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Vietnam	game_006	demographics_country	2025-07-11 08:12:14.681	519	Vietnam	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Philippines	game_006	demographics_country	2025-07-11 08:12:14.681	941	Philippines	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_United Kingdom	game_006	demographics_country	2025-07-11 08:12:14.681	921	United Kingdom	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Indonesia	game_006	demographics_country	2025-07-11 08:12:14.681	1189	Indonesia	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Mexico	game_006	demographics_country	2025-07-11 08:12:14.681	809	Mexico	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_France	game_006	demographics_country	2025-07-11 08:12:14.681	466	France	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Canada	game_006	demographics_country	2025-07-11 08:12:14.681	443	Canada	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Saudi Arabia	game_006	demographics_country	2025-07-11 08:12:14.681	439	Saudi Arabia	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Thailand	game_006	demographics_country	2025-07-11 08:12:14.681	423	Thailand	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_India	game_006	demographics_country	2025-07-11 08:12:14.681	411	India	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Argentina	game_006	demographics_country	2025-07-11 08:12:14.681	324	Argentina	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Germany	game_006	demographics_country	2025-07-11 08:12:14.681	404	Germany	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Malaysia	game_006	demographics_country	2025-07-11 08:12:14.681	299	Malaysia	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Italy	game_006	demographics_country	2025-07-11 08:12:14.681	308	Italy	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Australia	game_006	demographics_country	2025-07-11 08:12:14.681	271	Australia	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Ukraine	game_006	demographics_country	2025-07-11 08:12:14.681	269	Ukraine	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_language_Spanish	game_006	demographics_language	2025-07-11 08:12:14.668	2181	Spanish	2025-07-11 08:12:14.668	2025-07-11 08:12:14.668	Total	\N
game_006_demographics_country_Poland	game_006	demographics_country	2025-07-11 08:12:14.681	253	Poland	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Chile	game_006	demographics_country	2025-07-11 08:12:14.681	220	Chile	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Colombia	game_006	demographics_country	2025-07-11 08:12:14.681	188	Colombia	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Japan	game_006	demographics_country	2025-07-11 08:12:14.681	203	Japan	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Romania	game_006	demographics_country	2025-07-11 08:12:14.681	182	Romania	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Netherlands	game_006	demographics_country	2025-07-11 08:12:14.681	181	Netherlands	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Spain	game_006	demographics_country	2025-07-11 08:12:14.681	182	Spain	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Korea	game_006	demographics_country	2025-07-11 08:12:14.681	167	Korea	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Iraq	game_006	demographics_country	2025-07-11 08:12:14.681	160	Iraq	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Egypt	game_006	demographics_country	2025-07-11 08:12:14.681	160	Egypt	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Sweden	game_006	demographics_country	2025-07-11 08:12:14.681	134	Sweden	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Belgium	game_006	demographics_country	2025-07-11 08:12:14.681	125	Belgium	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Kazakhstan	game_006	demographics_country	2025-07-11 08:12:14.681	123	Kazakhstan	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_New Zealand	game_006	demographics_country	2025-07-11 08:12:14.681	110	New Zealand	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_United Arab Emirates	game_006	demographics_country	2025-07-11 08:12:14.681	101	United Arab Emirates	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Peru	game_006	demographics_country	2025-07-11 08:12:14.681	93	Peru	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Portugal	game_006	demographics_country	2025-07-11 08:12:14.681	92	Portugal	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Morocco	game_006	demographics_country	2025-07-11 08:12:14.681	67	Morocco	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Dominican Republic	game_006	demographics_country	2025-07-11 08:12:14.681	55	Dominican Republic	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Switzerland	game_006	demographics_country	2025-07-11 08:12:14.681	43	Switzerland	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Bangladesh	game_006	demographics_country	2025-07-11 08:12:14.681	29	Bangladesh	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Tunisia	game_006	demographics_country	2025-07-11 08:12:14.681	23	Tunisia	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Slovenia	game_006	demographics_country	2025-07-11 08:12:14.681	16	Slovenia	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Mauritius	game_006	demographics_country	2025-07-11 08:12:14.681	10	Mauritius	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Jersey	game_006	demographics_country	2025-07-11 08:12:14.681	1	Jersey	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_monthly_active_users_by_day_Total_2025-06-14T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-14 00:00:00	18174	Total	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Total_2025-06-25T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-25 00:00:00	16216	Total	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Total_2025-07-06T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-07-06 00:00:00	19793	Total	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-16T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-16 00:00:00	108360	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-25T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-25 00:00:00	115003	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-07-03T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-07-03 00:00:00	123736	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_average_session_length_minutes_Total_2025-06-15T00:00:00.000Z	game_006	average_session_length_minutes	2025-06-15 00:00:00	5.844844818115234	Total	2025-07-11 08:12:14.689	2025-07-11 08:12:14.689	Total	\N
game_006_average_session_length_minutes_Total_2025-06-24T00:00:00.000Z	game_006	average_session_length_minutes	2025-06-24 00:00:00	6.310691356658936	Total	2025-07-11 08:12:14.689	2025-07-11 08:12:14.689	Total	\N
game_006_average_session_length_minutes_Total_2025-07-03T00:00:00.000Z	game_006	average_session_length_minutes	2025-07-03 00:00:00	7.75367546081543	Total	2025-07-11 08:12:14.689	2025-07-11 08:12:14.689	Total	\N
game_006_average_play_time_minutes_Total_2025-06-14T00:00:00.000Z	game_006	average_play_time_minutes	2025-06-14 00:00:00	7.029649257659912	Total	2025-07-11 08:12:14.691	2025-07-11 08:12:14.691	Total	\N
game_006_average_play_time_minutes_Total_2025-06-23T00:00:00.000Z	game_006	average_play_time_minutes	2025-06-23 00:00:00	8.34627628326416	Total	2025-07-11 08:12:14.691	2025-07-11 08:12:14.691	Total	\N
game_006_average_play_time_minutes_Total_2025-07-02T00:00:00.000Z	game_006	average_play_time_minutes	2025-07-02 00:00:00	10.85298442840576	Total	2025-07-11 08:12:14.691	2025-07-11 08:12:14.691	Total	\N
game_006_daily_active_users_Total_2025-06-13T00:00:00.000Z	game_006	daily_active_users	2025-06-13 00:00:00	803	Total	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Total_2025-06-21T00:00:00.000Z	game_006	daily_active_users	2025-06-21 00:00:00	493	Total	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Total_2025-07-03T00:00:00.000Z	game_006	daily_active_users	2025-07-03 00:00:00	736	Total	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Total_2025-06-29T00:00:00.000Z	game_006	daily_active_users	2025-06-29 00:00:00	526	Total	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-21T00:00:00.000Z	game_006	daily_active_users	2025-06-21 00:00:00	5618	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-30T00:00:00.000Z	game_006	daily_active_users	2025-06-30 00:00:00	5874	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Benchmark (Top 10,000 experience)_2025-07-09T00:00:00.000Z	game_006	daily_active_users	2025-07-09 00:00:00	5864	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_d7_stickiness_Total_2025-06-20T00:00:00.000Z	game_006	d7_stickiness	2025-06-20 00:00:00	0.003735990030691028	Total	2025-07-11 08:12:14.696	2025-07-11 08:12:14.696	Total	\N
game_006_d7_stickiness_Total_2025-07-01T00:00:00.000Z	game_006	d7_stickiness	2025-07-01 00:00:00	0	Total	2025-07-11 08:12:14.696	2025-07-11 08:12:14.696	Total	\N
game_006_d7_stickiness_Total_2025-06-30T00:00:00.000Z	game_006	d7_stickiness	2025-06-30 00:00:00	0	Total	2025-07-11 08:12:14.696	2025-07-11 08:12:14.696	Total	\N
game_006_d1_stickiness_Total_2025-06-19T00:00:00.000Z	game_006	d1_stickiness	2025-06-19 00:00:00	0.02307692356407642	Total	2025-07-11 08:12:14.699	2025-07-11 08:12:14.699	Total	\N
game_006_d1_stickiness_Total_2025-06-26T00:00:00.000Z	game_006	d1_stickiness	2025-06-26 00:00:00	0.02369668334722519	Total	2025-07-11 08:12:14.699	2025-07-11 08:12:14.699	Total	\N
game_006_d1_stickiness_Total_2025-07-03T00:00:00.000Z	game_006	d1_stickiness	2025-07-03 00:00:00	0.02696871571242809	Total	2025-07-11 08:12:14.699	2025-07-11 08:12:14.699	Total	\N
game_006_d7_retention_Total_2025-06-14T00:00:00.000Z	game_006	d7_retention	2025-06-14 00:00:00	0.001683501643128693	Total	2025-07-11 08:12:14.7	2025-07-11 08:12:14.7	Total	\N
game_006_d7_retention_Total_2025-06-23T00:00:00.000Z	game_006	d7_retention	2025-06-23 00:00:00	0	Total	2025-07-11 08:12:14.7	2025-07-11 08:12:14.7	Total	\N
game_006_d7_retention_Total_2025-07-03T00:00:00.000Z	game_006	d7_retention	2025-07-03 00:00:00	0	Total	2025-07-11 08:12:14.7	2025-07-11 08:12:14.7	Total	\N
game_006_d1_retention_Total_2025-06-14T00:00:00.000Z	game_006	d1_retention	2025-06-14 00:00:00	0.02574525773525238	Total	2025-07-11 08:12:14.701	2025-07-11 08:12:14.701	Total	\N
game_006_d1_retention_Total_2025-06-23T00:00:00.000Z	game_006	d1_retention	2025-06-23 00:00:00	0.04456824436783791	Total	2025-07-11 08:12:14.701	2025-07-11 08:12:14.701	Total	\N
game_006_d1_retention_Total_2025-07-03T00:00:00.000Z	game_006	d1_retention	2025-07-03 00:00:00	0.02527075819671154	Total	2025-07-11 08:12:14.701	2025-07-11 08:12:14.701	Total	\N
game_005_demographics_language_Date	game_005	demographics_language	2025-07-11 10:44:16.38	2025	Date	2025-07-11 10:44:16.38	2025-07-11 10:44:16.38	Total	\N
game_005_demographics_gender_Date	game_005	demographics_gender	2025-07-11 10:44:16.381	2025	Date	2025-07-11 10:44:16.381	2025-07-11 10:44:16.381	Total	\N
game_005_demographics_language_Portuguese	game_005	demographics_language	2025-07-11 10:44:16.38	1640	Portuguese	2025-07-11 10:44:16.38	2025-07-11 10:44:16.38	Total	\N
game_005_demographics_country_Mexico	game_005	demographics_country	2025-07-11 10:44:16.393	809	Mexico	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Argentina	game_005	demographics_country	2025-07-11 10:44:16.393	324	Argentina	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Chile	game_005	demographics_country	2025-07-11 10:44:16.393	220	Chile	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Belgium	game_005	demographics_country	2025-07-11 10:44:16.393	125	Belgium	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Israel	game_005	demographics_country	2025-07-11 10:44:16.393	72	Israel	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Greece	game_005	demographics_country	2025-07-11 10:44:16.393	58	Greece	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Turkey	game_005	demographics_country	2025-07-11 10:44:16.393	49	Turkey	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_006_demographics_country_Czech Republic	game_006	demographics_country	2025-07-11 08:12:14.681	90	Czech Republic	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Denmark	game_006	demographics_country	2025-07-11 08:12:14.681	59	Denmark	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Jordan	game_006	demographics_country	2025-07-11 08:12:14.681	50	Jordan	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Serbia	game_006	demographics_country	2025-07-11 08:12:14.681	37	Serbia	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Myanmar	game_006	demographics_country	2025-07-11 08:12:14.681	26	Myanmar	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Panama	game_006	demographics_country	2025-07-11 08:12:14.681	21	Panama	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Nepal	game_006	demographics_country	2025-07-11 08:12:14.681	14	Nepal	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Cyprus	game_006	demographics_country	2025-07-11 08:12:14.681	7	Cyprus	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Libya	game_006	demographics_country	2025-07-11 08:12:14.681	2	Libya	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_monthly_active_users_by_day_Total_2025-06-23T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-23 00:00:00	16629	Total	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Total_2025-06-27T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-27 00:00:00	15770	Total	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-12T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-12 00:00:00	104406	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-20T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-20 00:00:00	111527	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-29T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-29 00:00:00	121518	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-07-08T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-07-08 00:00:00	127811	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_average_session_length_minutes_Total_2025-06-19T00:00:00.000Z	game_006	average_session_length_minutes	2025-06-19 00:00:00	6.302659034729004	Total	2025-07-11 08:12:14.689	2025-07-11 08:12:14.689	Total	\N
game_006_average_session_length_minutes_Total_2025-06-28T00:00:00.000Z	game_006	average_session_length_minutes	2025-06-28 00:00:00	6.197031497955322	Total	2025-07-11 08:12:14.689	2025-07-11 08:12:14.689	Total	\N
game_006_average_session_length_minutes_Total_2025-07-07T00:00:00.000Z	game_006	average_session_length_minutes	2025-07-07 00:00:00	9.997283935546875	Total	2025-07-11 08:12:14.689	2025-07-11 08:12:14.689	Total	\N
game_006_average_play_time_minutes_Total_2025-06-18T00:00:00.000Z	game_006	average_play_time_minutes	2025-06-18 00:00:00	7.176111221313477	Total	2025-07-11 08:12:14.691	2025-07-11 08:12:14.691	Total	\N
game_006_average_play_time_minutes_Total_2025-06-27T00:00:00.000Z	game_006	average_play_time_minutes	2025-06-27 00:00:00	8.818431854248047	Total	2025-07-11 08:12:14.691	2025-07-11 08:12:14.691	Total	\N
game_006_average_play_time_minutes_Total_2025-07-06T00:00:00.000Z	game_006	average_play_time_minutes	2025-07-06 00:00:00	10.53421211242676	Total	2025-07-11 08:12:14.691	2025-07-11 08:12:14.691	Total	\N
game_006_daily_active_users_Total_2025-06-17T00:00:00.000Z	game_006	daily_active_users	2025-06-17 00:00:00	398	Total	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Total_2025-06-25T00:00:00.000Z	game_006	daily_active_users	2025-06-25 00:00:00	422	Total	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Total_2025-07-04T00:00:00.000Z	game_006	daily_active_users	2025-07-04 00:00:00	909	Total	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-17T00:00:00.000Z	game_006	daily_active_users	2025-06-17 00:00:00	4442	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-25T00:00:00.000Z	game_006	daily_active_users	2025-06-25 00:00:00	5123	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Benchmark (Top 10,000 experience)_2025-07-04T00:00:00.000Z	game_006	daily_active_users	2025-07-04 00:00:00	5333	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_d7_stickiness_Total_2025-06-15T00:00:00.000Z	game_006	d7_stickiness	2025-06-15 00:00:00	0	Total	2025-07-11 08:12:14.696	2025-07-11 08:12:14.696	Total	\N
game_006_d7_stickiness_Total_2025-06-23T00:00:00.000Z	game_006	d7_stickiness	2025-06-23 00:00:00	0	Total	2025-07-11 08:12:14.696	2025-07-11 08:12:14.696	Total	\N
game_006_d7_stickiness_Total_2025-07-05T00:00:00.000Z	game_006	d7_stickiness	2025-07-05 00:00:00	0	Total	2025-07-11 08:12:14.696	2025-07-11 08:12:14.696	Total	\N
game_006_d7_stickiness_Total_2025-07-06T00:00:00.000Z	game_006	d7_stickiness	2025-07-06 00:00:00	0.003802281338721514	Total	2025-07-11 08:12:14.696	2025-07-11 08:12:14.696	Total	\N
game_006_d1_stickiness_Total_2025-06-18T00:00:00.000Z	game_006	d1_stickiness	2025-06-18 00:00:00	0.02010050229728222	Total	2025-07-11 08:12:14.699	2025-07-11 08:12:14.699	Total	\N
game_006_d1_stickiness_Total_2025-06-30T00:00:00.000Z	game_006	d1_stickiness	2025-06-30 00:00:00	0.028517110273242	Total	2025-07-11 08:12:14.699	2025-07-11 08:12:14.699	Total	\N
game_006_d1_stickiness_Total_2025-07-07T00:00:00.000Z	game_006	d1_stickiness	2025-07-07 00:00:00	0.02742278948426247	Total	2025-07-11 08:12:14.699	2025-07-11 08:12:14.699	Total	\N
game_006_d7_retention_Total_2025-06-18T00:00:00.000Z	game_006	d7_retention	2025-06-18 00:00:00	0	Total	2025-07-11 08:12:14.7	2025-07-11 08:12:14.7	Total	\N
game_006_d7_retention_Total_2025-06-27T00:00:00.000Z	game_006	d7_retention	2025-06-27 00:00:00	0	Total	2025-07-11 08:12:14.7	2025-07-11 08:12:14.7	Total	\N
game_006_d7_retention_Total_2025-07-08T00:00:00.000Z	game_006	d7_retention	2025-07-08 00:00:00	0.001788908732123673	Total	2025-07-11 08:12:14.7	2025-07-11 08:12:14.7	Total	\N
game_006_d1_retention_Total_2025-06-19T00:00:00.000Z	game_006	d1_retention	2025-06-19 00:00:00	0.02506963722407818	Total	2025-07-11 08:12:14.701	2025-07-11 08:12:14.701	Total	\N
game_006_d1_retention_Total_2025-06-24T00:00:00.000Z	game_006	d1_retention	2025-06-24 00:00:00	0.04437869787216187	Total	2025-07-11 08:12:14.701	2025-07-11 08:12:14.701	Total	\N
game_006_d1_retention_Total_2025-07-08T00:00:00.000Z	game_006	d1_retention	2025-07-08 00:00:00	0.03170028701424599	Total	2025-07-11 08:12:14.701	2025-07-11 08:12:14.701	Total	\N
game_005_demographics_age_group_Date	game_005	demographics_age_group	2025-07-11 10:44:16.377	2025	Date	2025-07-11 10:44:16.377	2025-07-11 10:44:16.377	Total	\N
game_005_demographics_language_Arabic	game_005	demographics_language	2025-07-11 10:44:16.38	418	Arabic	2025-07-11 10:44:16.38	2025-07-11 10:44:16.38	Total	\N
game_005_demographics_country_Brazil	game_005	demographics_country	2025-07-11 10:44:16.393	1629	Brazil	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Romania	game_005	demographics_country	2025-07-11 10:44:16.393	182	Romania	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Kazakhstan	game_005	demographics_country	2025-07-11 10:44:16.393	123	Kazakhstan	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Belarus	game_005	demographics_country	2025-07-11 10:44:16.393	72	Belarus	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Azerbaijan	game_005	demographics_country	2025-07-11 10:44:16.393	52	Azerbaijan	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Hong Kong	game_005	demographics_country	2025-07-11 10:44:16.393	41	Hong Kong	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Croatia	game_005	demographics_country	2025-07-11 10:44:16.393	28	Croatia	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_El Salvador	game_005	demographics_country	2025-07-11 10:44:16.393	21	El Salvador	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_006_demographics_country_South Africa	game_006	demographics_country	2025-07-11 08:12:14.681	83	South Africa	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Finland	game_006	demographics_country	2025-07-11 08:12:14.681	59	Finland	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Puerto Rico	game_006	demographics_country	2025-07-11 08:12:14.681	46	Puerto Rico	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Jamaica	game_006	demographics_country	2025-07-11 08:12:14.681	32	Jamaica	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Bolivia	game_006	demographics_country	2025-07-11 08:12:14.681	26	Bolivia	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Lebanon	game_006	demographics_country	2025-07-11 08:12:14.681	16	Lebanon	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Albania	game_006	demographics_country	2025-07-11 08:12:14.681	14	Albania	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Iran	game_006	demographics_country	2025-07-11 08:12:14.681	6	Iran	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_monthly_active_users_by_day_Total_2025-06-12T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-12 00:00:00	18043	Total	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Total_2025-06-24T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-24 00:00:00	16429	Total	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Total_2025-07-01T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-07-01 00:00:00	15341	Total	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Total_2025-07-05T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-07-05 00:00:00	16842	Total	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-24T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-24 00:00:00	114292	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-30T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-30 00:00:00	121900	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-07-09T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-07-09 00:00:00	129362	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_average_session_length_minutes_Total_2025-06-20T00:00:00.000Z	game_006	average_session_length_minutes	2025-06-20 00:00:00	6.269298076629639	Total	2025-07-11 08:12:14.689	2025-07-11 08:12:14.689	Total	\N
game_006_average_session_length_minutes_Total_2025-06-29T00:00:00.000Z	game_006	average_session_length_minutes	2025-06-29 00:00:00	6.711361408233643	Total	2025-07-11 08:12:14.689	2025-07-11 08:12:14.689	Total	\N
game_006_average_session_length_minutes_Total_2025-07-08T00:00:00.000Z	game_006	average_session_length_minutes	2025-07-08 00:00:00	8.971120834350586	Total	2025-07-11 08:12:14.689	2025-07-11 08:12:14.689	Total	\N
game_006_average_play_time_minutes_Total_2025-06-19T00:00:00.000Z	game_006	average_play_time_minutes	2025-06-19 00:00:00	7.731662750244141	Total	2025-07-11 08:12:14.691	2025-07-11 08:12:14.691	Total	\N
game_006_average_play_time_minutes_Total_2025-06-30T00:00:00.000Z	game_006	average_play_time_minutes	2025-06-30 00:00:00	9.310379028320312	Total	2025-07-11 08:12:14.691	2025-07-11 08:12:14.691	Total	\N
game_006_average_play_time_minutes_Total_2025-07-09T00:00:00.000Z	game_006	average_play_time_minutes	2025-07-09 00:00:00	10.56297969818115	Total	2025-07-11 08:12:14.691	2025-07-11 08:12:14.691	Total	\N
game_006_daily_active_users_Total_2025-06-19T00:00:00.000Z	game_006	daily_active_users	2025-06-19 00:00:00	419	Total	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Total_2025-07-01T00:00:00.000Z	game_006	daily_active_users	2025-07-01 00:00:00	609	Total	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Total_2025-07-08T00:00:00.000Z	game_006	daily_active_users	2025-07-08 00:00:00	2473	Total	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-15T00:00:00.000Z	game_006	daily_active_users	2025-06-15 00:00:00	5155	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-26T00:00:00.000Z	game_006	daily_active_users	2025-06-26 00:00:00	5111	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Benchmark (Top 10,000 experience)_2025-07-08T00:00:00.000Z	game_006	daily_active_users	2025-07-08 00:00:00	5717	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_d7_stickiness_Total_2025-06-19T00:00:00.000Z	game_006	d7_stickiness	2025-06-19 00:00:00	0	Total	2025-07-11 08:12:14.696	2025-07-11 08:12:14.696	Total	\N
game_006_d7_stickiness_Total_2025-06-25T00:00:00.000Z	game_006	d7_stickiness	2025-06-25 00:00:00	0	Total	2025-07-11 08:12:14.696	2025-07-11 08:12:14.696	Total	\N
game_006_d7_stickiness_Total_2025-07-08T00:00:00.000Z	game_006	d7_stickiness	2025-07-08 00:00:00	0.001642036135308444	Total	2025-07-11 08:12:14.696	2025-07-11 08:12:14.696	Total	\N
game_006_d1_stickiness_Total_2025-06-16T00:00:00.000Z	game_006	d1_stickiness	2025-06-16 00:00:00	0.02914798259735107	Total	2025-07-11 08:12:14.699	2025-07-11 08:12:14.699	Total	\N
game_006_d1_stickiness_Total_2025-07-09T00:00:00.000Z	game_006	d1_stickiness	2025-07-09 00:00:00	0.02507076412439346	Total	2025-07-11 08:12:14.699	2025-07-11 08:12:14.699	Total	\N
game_006_d7_retention_Total_2025-06-19T00:00:00.000Z	game_006	d7_retention	2025-06-19 00:00:00	0	Total	2025-07-11 08:12:14.7	2025-07-11 08:12:14.7	Total	\N
game_006_d7_retention_Total_2025-07-01T00:00:00.000Z	game_006	d7_retention	2025-07-01 00:00:00	0	Total	2025-07-11 08:12:14.7	2025-07-11 08:12:14.7	Total	\N
game_006_d7_retention_Total_2025-07-07T00:00:00.000Z	game_006	d7_retention	2025-07-07 00:00:00	0.003316749585792422	Total	2025-07-11 08:12:14.7	2025-07-11 08:12:14.7	Total	\N
game_006_d1_retention_Total_2025-06-20T00:00:00.000Z	game_006	d1_retention	2025-06-20 00:00:00	0.01269035506993532	Total	2025-07-11 08:12:14.701	2025-07-11 08:12:14.701	Total	\N
game_006_d1_retention_Total_2025-07-04T00:00:00.000Z	game_006	d1_retention	2025-07-04 00:00:00	0.03215926513075829	Total	2025-07-11 08:12:14.701	2025-07-11 08:12:14.701	Total	\N
game_006_d1_retention_Total_2025-06-26T00:00:00.000Z	game_006	d1_retention	2025-06-26 00:00:00	0.01995012536644936	Total	2025-07-11 08:12:14.701	2025-07-11 08:12:14.701	Total	\N
game_005_demographics_language_Russian	game_005	demographics_language	2025-07-11 10:44:16.38	1738	Russian	2025-07-11 10:44:16.38	2025-07-11 10:44:16.38	Total	\N
game_005_demographics_language_Indonesian	game_005	demographics_language	2025-07-11 10:44:16.38	946	Indonesian	2025-07-11 10:44:16.38	2025-07-11 10:44:16.38	Total	\N
game_005_demographics_age_group_Unknown	game_005	demographics_age_group	2025-07-11 10:44:16.377	192	Unknown	2025-07-11 10:44:16.377	2025-07-11 10:44:16.377	Total	\N
game_005_demographics_country_France	game_005	demographics_country	2025-07-11 10:44:16.393	466	France	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Italy	game_005	demographics_country	2025-07-11 10:44:16.393	308	Italy	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Colombia	game_005	demographics_country	2025-07-11 10:44:16.393	188	Colombia	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_New Zealand	game_005	demographics_country	2025-07-11 10:44:16.393	110	New Zealand	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Venezuela	game_005	demographics_country	2025-07-11 10:44:16.393	76	Venezuela	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Norway	game_005	demographics_country	2025-07-11 10:44:16.393	57	Norway	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Bulgaria	game_005	demographics_country	2025-07-11 10:44:16.393	45	Bulgaria	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Jamaica	game_005	demographics_country	2025-07-11 10:44:16.393	32	Jamaica	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Estonia	game_005	demographics_country	2025-07-11 10:44:16.393	25	Estonia	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_006_demographics_country_Pakistan	game_006	demographics_country	2025-07-11 08:12:14.681	83	Pakistan	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Hungary	game_006	demographics_country	2025-07-11 08:12:14.681	60	Hungary	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Lithuania	game_006	demographics_country	2025-07-11 08:12:14.681	53	Lithuania	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Austria	game_006	demographics_country	2025-07-11 08:12:14.681	42	Austria	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Uzbekistan	game_006	demographics_country	2025-07-11 08:12:14.681	27	Uzbekistan	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Guatemala	game_006	demographics_country	2025-07-11 08:12:14.681	22	Guatemala	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Kyrgyzstan	game_006	demographics_country	2025-07-11 08:12:14.681	15	Kyrgyzstan	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Kosovo	game_006	demographics_country	2025-07-11 08:12:14.681	7	Kosovo	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Virgin Islands (US)	game_006	demographics_country	2025-07-11 08:12:14.681	3	Virgin Islands (US)	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_monthly_active_users_by_day_Total_2025-06-20T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-20 00:00:00	17437	Total	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Total_2025-06-30T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-30 00:00:00	15399	Total	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Total_2025-07-07T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-07-07 00:00:00	21368	Total	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-18T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-18 00:00:00	109063	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-28T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-28 00:00:00	119599	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-07-07T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-07-07 00:00:00	127452	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_average_session_length_minutes_Total_2025-06-17T00:00:00.000Z	game_006	average_session_length_minutes	2025-06-17 00:00:00	6.892302513122559	Total	2025-07-11 08:12:14.689	2025-07-11 08:12:14.689	Total	\N
game_006_average_session_length_minutes_Total_2025-06-25T00:00:00.000Z	game_006	average_session_length_minutes	2025-06-25 00:00:00	5.641634464263916	Total	2025-07-11 08:12:14.689	2025-07-11 08:12:14.689	Total	\N
game_006_average_session_length_minutes_Total_2025-07-05T00:00:00.000Z	game_006	average_session_length_minutes	2025-07-05 00:00:00	7.890049457550049	Total	2025-07-11 08:12:14.689	2025-07-11 08:12:14.689	Total	\N
game_006_average_play_time_minutes_Total_2025-06-15T00:00:00.000Z	game_006	average_play_time_minutes	2025-06-15 00:00:00	6.906352996826172	Total	2025-07-11 08:12:14.691	2025-07-11 08:12:14.691	Total	\N
game_006_average_play_time_minutes_Total_2025-06-25T00:00:00.000Z	game_006	average_play_time_minutes	2025-06-25 00:00:00	6.925039291381836	Total	2025-07-11 08:12:14.691	2025-07-11 08:12:14.691	Total	\N
game_006_average_play_time_minutes_Total_2025-07-03T00:00:00.000Z	game_006	average_play_time_minutes	2025-07-03 00:00:00	9.028396606445312	Total	2025-07-11 08:12:14.691	2025-07-11 08:12:14.691	Total	\N
game_006_daily_active_users_Total_2025-06-16T00:00:00.000Z	game_006	daily_active_users	2025-06-16 00:00:00	422	Total	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Total_2025-06-26T00:00:00.000Z	game_006	daily_active_users	2025-06-26 00:00:00	448	Total	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Total_2025-07-02T00:00:00.000Z	game_006	daily_active_users	2025-07-02 00:00:00	927	Total	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-16T00:00:00.000Z	game_006	daily_active_users	2025-06-16 00:00:00	4476	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-23T00:00:00.000Z	game_006	daily_active_users	2025-06-23 00:00:00	5030	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Benchmark (Top 10,000 experience)_2025-07-01T00:00:00.000Z	game_006	daily_active_users	2025-07-01 00:00:00	5475	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_d7_stickiness_Total_2025-06-14T00:00:00.000Z	game_006	d7_stickiness	2025-06-14 00:00:00	0.001584786106832325	Total	2025-07-11 08:12:14.696	2025-07-11 08:12:14.696	Total	\N
game_006_d7_stickiness_Total_2025-06-24T00:00:00.000Z	game_006	d7_stickiness	2025-06-24 00:00:00	0.002512562787160277	Total	2025-07-11 08:12:14.696	2025-07-11 08:12:14.696	Total	\N
game_006_d7_stickiness_Total_2025-07-04T00:00:00.000Z	game_006	d7_stickiness	2025-07-04 00:00:00	0.002118644071742892	Total	2025-07-11 08:12:14.696	2025-07-11 08:12:14.696	Total	\N
game_006_d1_stickiness_Total_2025-06-15T00:00:00.000Z	game_006	d1_stickiness	2025-06-15 00:00:00	0.01676829345524311	Total	2025-07-11 08:12:14.699	2025-07-11 08:12:14.699	Total	\N
game_006_d1_stickiness_Total_2025-06-24T00:00:00.000Z	game_006	d1_stickiness	2025-06-24 00:00:00	0.0452127642929554	Total	2025-07-11 08:12:14.699	2025-07-11 08:12:14.699	Total	\N
game_006_d1_stickiness_Total_2025-06-27T00:00:00.000Z	game_006	d1_stickiness	2025-06-27 00:00:00	0.01339285727590322	Total	2025-07-11 08:12:14.699	2025-07-11 08:12:14.699	Total	\N
game_006_d1_stickiness_Total_2025-07-05T00:00:00.000Z	game_006	d1_stickiness	2025-07-05 00:00:00	0.03850385174155235	Total	2025-07-11 08:12:14.699	2025-07-11 08:12:14.699	Total	\N
game_006_d7_retention_Total_2025-06-16T00:00:00.000Z	game_006	d7_retention	2025-06-16 00:00:00	0.00220264308154583	Total	2025-07-11 08:12:14.7	2025-07-11 08:12:14.7	Total	\N
game_006_d7_retention_Total_2025-06-24T00:00:00.000Z	game_006	d7_retention	2025-06-24 00:00:00	0.002717391354963183	Total	2025-07-11 08:12:14.7	2025-07-11 08:12:14.7	Total	\N
game_006_d7_retention_Total_2025-07-05T00:00:00.000Z	game_006	d7_retention	2025-07-05 00:00:00	0	Total	2025-07-11 08:12:14.7	2025-07-11 08:12:14.7	Total	\N
game_006_d1_retention_Total_2025-06-16T00:00:00.000Z	game_006	d1_retention	2025-06-16 00:00:00	0.0191846527159214	Total	2025-07-11 08:12:14.701	2025-07-11 08:12:14.701	Total	\N
game_006_d1_retention_Total_2025-06-27T00:00:00.000Z	game_006	d1_retention	2025-06-27 00:00:00	0.01179245300590992	Total	2025-07-11 08:12:14.701	2025-07-11 08:12:14.701	Total	\N
game_006_d1_retention_Total_2025-07-06T00:00:00.000Z	game_006	d1_retention	2025-07-06 00:00:00	0.02520385384559631	Total	2025-07-11 08:12:14.701	2025-07-11 08:12:14.701	Total	\N
game_005_demographics_age_group_18+	game_005	demographics_age_group	2025-07-11 10:44:16.377	15034	18+	2025-07-11 10:44:16.377	2025-07-11 10:44:16.377	Total	\N
game_005_demographics_gender_Male	game_005	demographics_gender	2025-07-11 10:44:16.381	11475	Male	2025-07-11 10:44:16.381	2025-07-11 10:44:16.381	Total	\N
game_005_demographics_country_Russian Federation	game_005	demographics_country	2025-07-11 10:44:16.393	1408	Russian Federation	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Canada	game_005	demographics_country	2025-07-11 10:44:16.393	443	Canada	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Malaysia	game_005	demographics_country	2025-07-11 10:44:16.393	299	Malaysia	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Korea	game_005	demographics_country	2025-07-11 10:44:16.393	167	Korea	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Peru	game_005	demographics_country	2025-07-11 10:44:16.393	93	Peru	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Ecuador	game_005	demographics_country	2025-07-11 10:44:16.393	71	Ecuador	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Dominican Republic	game_005	demographics_country	2025-07-11 10:44:16.393	55	Dominican Republic	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Finland	game_005	demographics_country	2025-07-11 10:44:16.393	59	Finland	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_006_demographics_country_Belarus	game_006	demographics_country	2025-07-11 08:12:14.681	72	Belarus	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Israel	game_006	demographics_country	2025-07-11 08:12:14.681	72	Israel	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Algeria	game_006	demographics_country	2025-07-11 08:12:14.681	62	Algeria	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Ireland	game_006	demographics_country	2025-07-11 08:12:14.681	60	Ireland	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Taiwan	game_006	demographics_country	2025-07-11 08:12:14.681	54	Taiwan	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Azerbaijan	game_006	demographics_country	2025-07-11 08:12:14.681	52	Azerbaijan	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Hong Kong	game_006	demographics_country	2025-07-11 08:12:14.681	41	Hong Kong	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Honduras	game_006	demographics_country	2025-07-11 08:12:14.681	38	Honduras	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Croatia	game_006	demographics_country	2025-07-11 08:12:14.681	28	Croatia	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Georgia	game_006	demographics_country	2025-07-11 08:12:14.681	28	Georgia	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Qatar	game_006	demographics_country	2025-07-11 08:12:14.681	22	Qatar	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_El Salvador	game_006	demographics_country	2025-07-11 08:12:14.681	21	El Salvador	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Brunei Darussalam	game_006	demographics_country	2025-07-11 08:12:14.681	16	Brunei Darussalam	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Trinidad and Tobago	game_006	demographics_country	2025-07-11 08:12:14.681	15	Trinidad and Tobago	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Mongolia	game_006	demographics_country	2025-07-11 08:12:14.681	9	Mongolia	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Reunion	game_006	demographics_country	2025-07-11 08:12:14.681	8	Reunion	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_monthly_active_users_by_day_Total_2025-06-13T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-13 00:00:00	18237	Total	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Total_2025-06-16T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-16 00:00:00	17993	Total	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Total_2025-06-15T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-15 00:00:00	17983	Total	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Total_2025-06-19T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-19 00:00:00	17696	Total	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Total_2025-06-22T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-22 00:00:00	17006	Total	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Total_2025-06-29T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-29 00:00:00	15567	Total	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Total_2025-07-08T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-07-08 00:00:00	23146	Total	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Total_2025-07-09T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-07-09 00:00:00	24516	Total	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-19T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-19 00:00:00	109938	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-17T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-17 00:00:00	107747	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-26T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-26 00:00:00	115601	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-27T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-27 00:00:00	117647	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-07-05T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-07-05 00:00:00	126032	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-07-06T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-07-06 00:00:00	127400	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_average_session_length_minutes_Total_2025-06-16T00:00:00.000Z	game_006	average_session_length_minutes	2025-06-16 00:00:00	7.510462284088135	Total	2025-07-11 08:12:14.689	2025-07-11 08:12:14.689	Total	\N
game_006_average_session_length_minutes_Total_2025-06-18T00:00:00.000Z	game_006	average_session_length_minutes	2025-06-18 00:00:00	6.097349166870117	Total	2025-07-11 08:12:14.689	2025-07-11 08:12:14.689	Total	\N
game_006_average_session_length_minutes_Total_2025-06-26T00:00:00.000Z	game_006	average_session_length_minutes	2025-06-26 00:00:00	7.557888507843018	Total	2025-07-11 08:12:14.689	2025-07-11 08:12:14.689	Total	\N
game_006_average_session_length_minutes_Total_2025-06-27T00:00:00.000Z	game_006	average_session_length_minutes	2025-06-27 00:00:00	7.31511402130127	Total	2025-07-11 08:12:14.689	2025-07-11 08:12:14.689	Total	\N
game_006_average_session_length_minutes_Total_2025-07-04T00:00:00.000Z	game_006	average_session_length_minutes	2025-07-04 00:00:00	8.57078742980957	Total	2025-07-11 08:12:14.689	2025-07-11 08:12:14.689	Total	\N
game_006_average_session_length_minutes_Total_2025-07-06T00:00:00.000Z	game_006	average_session_length_minutes	2025-07-06 00:00:00	8.48884391784668	Total	2025-07-11 08:12:14.689	2025-07-11 08:12:14.689	Total	\N
game_006_average_play_time_minutes_Total_2025-06-17T00:00:00.000Z	game_006	average_play_time_minutes	2025-06-17 00:00:00	8.398911476135254	Total	2025-07-11 08:12:14.691	2025-07-11 08:12:14.691	Total	\N
game_006_average_play_time_minutes_Total_2025-06-16T00:00:00.000Z	game_006	average_play_time_minutes	2025-06-16 00:00:00	8.987638473510742	Total	2025-07-11 08:12:14.691	2025-07-11 08:12:14.691	Total	\N
game_006_average_play_time_minutes_Total_2025-06-24T00:00:00.000Z	game_006	average_play_time_minutes	2025-06-24 00:00:00	7.367232322692871	Total	2025-07-11 08:12:14.691	2025-07-11 08:12:14.691	Total	\N
game_006_average_play_time_minutes_Total_2025-06-26T00:00:00.000Z	game_006	average_play_time_minutes	2025-06-26 00:00:00	9.160565376281738	Total	2025-07-11 08:12:14.691	2025-07-11 08:12:14.691	Total	\N
game_006_average_play_time_minutes_Total_2025-07-04T00:00:00.000Z	game_006	average_play_time_minutes	2025-07-04 00:00:00	10.18311309814453	Total	2025-07-11 08:12:14.691	2025-07-11 08:12:14.691	Total	\N
game_006_average_play_time_minutes_Total_2025-07-05T00:00:00.000Z	game_006	average_play_time_minutes	2025-07-05 00:00:00	9.31640911102295	Total	2025-07-11 08:12:14.691	2025-07-11 08:12:14.691	Total	\N
game_006_daily_active_users_Total_2025-06-14T00:00:00.000Z	game_006	daily_active_users	2025-06-14 00:00:00	656	Total	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Total_2025-06-15T00:00:00.000Z	game_006	daily_active_users	2025-06-15 00:00:00	446	Total	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Total_2025-06-22T00:00:00.000Z	game_006	daily_active_users	2025-06-22 00:00:00	376	Total	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Total_2025-06-24T00:00:00.000Z	game_006	daily_active_users	2025-06-24 00:00:00	442	Total	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Total_2025-07-07T00:00:00.000Z	game_006	daily_active_users	2025-07-07 00:00:00	2305	Total	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Total_2025-07-06T00:00:00.000Z	game_006	daily_active_users	2025-07-06 00:00:00	3756	Total	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_demographics_country_Ecuador	game_006	demographics_country	2025-07-11 08:12:14.681	71	Ecuador	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Norway	game_006	demographics_country	2025-07-11 08:12:14.681	57	Norway	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Turkey	game_006	demographics_country	2025-07-11 08:12:14.681	49	Turkey	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Costa Rica	game_006	demographics_country	2025-07-11 08:12:14.681	31	Costa Rica	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Latvia	game_006	demographics_country	2025-07-11 08:12:14.681	25	Latvia	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Armenia	game_006	demographics_country	2025-07-11 08:12:14.681	18	Armenia	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Nicaragua	game_006	demographics_country	2025-07-11 08:12:14.681	14	Nicaragua	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Angola	game_006	demographics_country	2025-07-11 08:12:14.681	4	Angola	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_monthly_active_users_by_day_Total_2025-06-18T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-18 00:00:00	17843	Total	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Total_2025-06-26T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-26 00:00:00	16027	Total	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Total_2025-07-03T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-07-03 00:00:00	15862	Total	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-13T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-13 00:00:00	105314	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-21T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-21 00:00:00	113458	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-07-02T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-07-02 00:00:00	122652	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_average_session_length_minutes_Total_2025-06-12T00:00:00.000Z	game_006	average_session_length_minutes	2025-06-12 00:00:00	6.146860599517822	Total	2025-07-11 08:12:14.689	2025-07-11 08:12:14.689	Total	\N
game_006_average_session_length_minutes_Total_2025-06-22T00:00:00.000Z	game_006	average_session_length_minutes	2025-06-22 00:00:00	7.56123685836792	Total	2025-07-11 08:12:14.689	2025-07-11 08:12:14.689	Total	\N
game_006_average_session_length_minutes_Total_2025-07-01T00:00:00.000Z	game_006	average_session_length_minutes	2025-07-01 00:00:00	7.774129390716553	Total	2025-07-11 08:12:14.689	2025-07-11 08:12:14.689	Total	\N
game_006_average_play_time_minutes_Total_2025-06-12T00:00:00.000Z	game_006	average_play_time_minutes	2025-06-12 00:00:00	7.15092945098877	Total	2025-07-11 08:12:14.691	2025-07-11 08:12:14.691	Total	\N
game_006_average_play_time_minutes_Total_2025-06-22T00:00:00.000Z	game_006	average_play_time_minutes	2025-06-22 00:00:00	8.88847541809082	Total	2025-07-11 08:12:14.691	2025-07-11 08:12:14.691	Total	\N
game_006_average_play_time_minutes_Total_2025-06-28T00:00:00.000Z	game_006	average_play_time_minutes	2025-06-28 00:00:00	7.52297306060791	Total	2025-07-11 08:12:14.691	2025-07-11 08:12:14.691	Total	\N
game_006_average_play_time_minutes_Total_2025-07-07T00:00:00.000Z	game_006	average_play_time_minutes	2025-07-07 00:00:00	11.89698505401611	Total	2025-07-11 08:12:14.691	2025-07-11 08:12:14.691	Total	\N
game_006_daily_active_users_Total_2025-06-20T00:00:00.000Z	game_006	daily_active_users	2025-06-20 00:00:00	409	Total	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Total_2025-06-30T00:00:00.000Z	game_006	daily_active_users	2025-06-30 00:00:00	660	Total	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Total_2025-07-05T00:00:00.000Z	game_006	daily_active_users	2025-07-05 00:00:00	1488	Total	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-14T00:00:00.000Z	game_006	daily_active_users	2025-06-14 00:00:00	5199	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-20T00:00:00.000Z	game_006	daily_active_users	2025-06-20 00:00:00	5112	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-24T00:00:00.000Z	game_006	daily_active_users	2025-06-24 00:00:00	4917	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-27T00:00:00.000Z	game_006	daily_active_users	2025-06-27 00:00:00	5795	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Benchmark (Top 10,000 experience)_2025-07-02T00:00:00.000Z	game_006	daily_active_users	2025-07-02 00:00:00	5513	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Benchmark (Top 10,000 experience)_2025-07-05T00:00:00.000Z	game_006	daily_active_users	2025-07-05 00:00:00	5609	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_d7_stickiness_Total_2025-06-13T00:00:00.000Z	game_006	d7_stickiness	2025-06-13 00:00:00	0.001483679516240954	Total	2025-07-11 08:12:14.696	2025-07-11 08:12:14.696	Total	\N
game_006_d7_stickiness_Total_2025-06-16T00:00:00.000Z	game_006	d7_stickiness	2025-06-16 00:00:00	0.002049180213361979	Total	2025-07-11 08:12:14.696	2025-07-11 08:12:14.696	Total	\N
game_006_d7_stickiness_Total_2025-06-22T00:00:00.000Z	game_006	d7_stickiness	2025-06-22 00:00:00	0	Total	2025-07-11 08:12:14.696	2025-07-11 08:12:14.696	Total	\N
game_006_d7_stickiness_Total_2025-06-27T00:00:00.000Z	game_006	d7_stickiness	2025-06-27 00:00:00	0	Total	2025-07-11 08:12:14.696	2025-07-11 08:12:14.696	Total	\N
game_006_d7_stickiness_Total_2025-07-02T00:00:00.000Z	game_006	d7_stickiness	2025-07-02 00:00:00	0	Total	2025-07-11 08:12:14.696	2025-07-11 08:12:14.696	Total	\N
game_006_d7_stickiness_Total_2025-07-09T00:00:00.000Z	game_006	d7_stickiness	2025-07-09 00:00:00	0.00323624606244266	Total	2025-07-11 08:12:14.696	2025-07-11 08:12:14.696	Total	\N
game_006_d1_stickiness_Total_2025-06-14T00:00:00.000Z	game_006	d1_stickiness	2025-06-14 00:00:00	0.02615193091332912	Total	2025-07-11 08:12:14.699	2025-07-11 08:12:14.699	Total	\N
game_006_d1_stickiness_Total_2025-06-17T00:00:00.000Z	game_006	d1_stickiness	2025-06-17 00:00:00	0.03554502502083778	Total	2025-07-11 08:12:14.699	2025-07-11 08:12:14.699	Total	\N
game_006_d1_stickiness_Total_2025-06-22T00:00:00.000Z	game_006	d1_stickiness	2025-06-22 00:00:00	0.01622718013823032	Total	2025-07-11 08:12:14.699	2025-07-11 08:12:14.699	Total	\N
game_006_d1_stickiness_Total_2025-06-25T00:00:00.000Z	game_006	d1_stickiness	2025-06-25 00:00:00	0.02262443490326405	Total	2025-07-11 08:12:14.699	2025-07-11 08:12:14.699	Total	\N
game_006_d1_stickiness_Total_2025-06-28T00:00:00.000Z	game_006	d1_stickiness	2025-06-28 00:00:00	0.02542372792959213	Total	2025-07-11 08:12:14.699	2025-07-11 08:12:14.699	Total	\N
game_006_d1_stickiness_Total_2025-07-01T00:00:00.000Z	game_006	d1_stickiness	2025-07-01 00:00:00	0.03181818127632141	Total	2025-07-11 08:12:14.699	2025-07-11 08:12:14.699	Total	\N
game_006_d1_stickiness_Total_2025-07-06T00:00:00.000Z	game_006	d1_stickiness	2025-07-06 00:00:00	0.02620967663824558	Total	2025-07-11 08:12:14.699	2025-07-11 08:12:14.699	Total	\N
game_006_d7_retention_Total_2025-06-13T00:00:00.000Z	game_006	d7_retention	2025-06-13 00:00:00	0	Total	2025-07-11 08:12:14.7	2025-07-11 08:12:14.7	Total	\N
game_006_d7_retention_Total_2025-06-17T00:00:00.000Z	game_006	d7_retention	2025-06-17 00:00:00	0	Total	2025-07-11 08:12:14.7	2025-07-11 08:12:14.7	Total	\N
game_006_d7_retention_Total_2025-06-22T00:00:00.000Z	game_006	d7_retention	2025-06-22 00:00:00	0	Total	2025-07-11 08:12:14.7	2025-07-11 08:12:14.7	Total	\N
game_006_d7_retention_Total_2025-06-25T00:00:00.000Z	game_006	d7_retention	2025-06-25 00:00:00	0	Total	2025-07-11 08:12:14.7	2025-07-11 08:12:14.7	Total	\N
game_006_d7_retention_Total_2025-07-02T00:00:00.000Z	game_006	d7_retention	2025-07-02 00:00:00	0	Total	2025-07-11 08:12:14.7	2025-07-11 08:12:14.7	Total	\N
game_006_demographics_country_Kuwait	game_006	demographics_country	2025-07-11 08:12:14.681	72	Kuwait	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Singapore	game_006	demographics_country	2025-07-11 08:12:14.681	56	Singapore	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Uruguay	game_006	demographics_country	2025-07-11 08:12:14.681	44	Uruguay	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Slovakia	game_006	demographics_country	2025-07-11 08:12:14.681	34	Slovakia	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Cambodia	game_006	demographics_country	2025-07-11 08:12:14.681	23	Cambodia	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Bosnia and Herzegovina	game_006	demographics_country	2025-07-11 08:12:14.681	17	Bosnia and Herzegovina	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Laos	game_006	demographics_country	2025-07-11 08:12:14.681	13	Laos	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Faroe Islands	game_006	demographics_country	2025-07-11 08:12:14.681	1	Faroe Islands	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_monthly_active_users_by_day_Total_2025-06-17T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-17 00:00:00	17897	Total	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Total_2025-06-28T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-28 00:00:00	15561	Total	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Total_2025-07-04T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-07-04 00:00:00	15990	Total	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-15T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-15 00:00:00	108968	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-22T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-22 00:00:00	114296	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-07-04T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-07-04 00:00:00	125486	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_average_session_length_minutes_Total_2025-06-14T00:00:00.000Z	game_006	average_session_length_minutes	2025-06-14 00:00:00	5.837278366088867	Total	2025-07-11 08:12:14.689	2025-07-11 08:12:14.689	Total	\N
game_006_average_session_length_minutes_Total_2025-06-23T00:00:00.000Z	game_006	average_session_length_minutes	2025-06-23 00:00:00	7.148519515991211	Total	2025-07-11 08:12:14.689	2025-07-11 08:12:14.689	Total	\N
game_006_average_session_length_minutes_Total_2025-07-02T00:00:00.000Z	game_006	average_session_length_minutes	2025-07-02 00:00:00	8.710577011108398	Total	2025-07-11 08:12:14.689	2025-07-11 08:12:14.689	Total	\N
game_006_average_play_time_minutes_Total_2025-06-13T00:00:00.000Z	game_006	average_play_time_minutes	2025-06-13 00:00:00	7.521046161651611	Total	2025-07-11 08:12:14.691	2025-07-11 08:12:14.691	Total	\N
game_006_average_play_time_minutes_Total_2025-06-20T00:00:00.000Z	game_006	average_play_time_minutes	2025-06-20 00:00:00	7.572208404541016	Total	2025-07-11 08:12:14.691	2025-07-11 08:12:14.691	Total	\N
game_006_average_play_time_minutes_Total_2025-07-01T00:00:00.000Z	game_006	average_play_time_minutes	2025-07-01 00:00:00	9.408101081848145	Total	2025-07-11 08:12:14.691	2025-07-11 08:12:14.691	Total	\N
game_006_daily_active_users_Total_2025-06-12T00:00:00.000Z	game_006	daily_active_users	2025-06-12 00:00:00	753	Total	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Total_2025-06-23T00:00:00.000Z	game_006	daily_active_users	2025-06-23 00:00:00	376	Total	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Total_2025-06-28T00:00:00.000Z	game_006	daily_active_users	2025-06-28 00:00:00	444	Total	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-12T00:00:00.000Z	game_006	daily_active_users	2025-06-12 00:00:00	4243	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-13T00:00:00.000Z	game_006	daily_active_users	2025-06-13 00:00:00	4571	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-18T00:00:00.000Z	game_006	daily_active_users	2025-06-18 00:00:00	4605	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-22T00:00:00.000Z	game_006	daily_active_users	2025-06-22 00:00:00	5612	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-29T00:00:00.000Z	game_006	daily_active_users	2025-06-29 00:00:00	6683	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Benchmark (Top 10,000 experience)_2025-07-03T00:00:00.000Z	game_006	daily_active_users	2025-07-03 00:00:00	5218	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Benchmark (Top 10,000 experience)_2025-07-06T00:00:00.000Z	game_006	daily_active_users	2025-07-06 00:00:00	6339	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_d7_stickiness_Total_2025-06-12T00:00:00.000Z	game_006	d7_stickiness	2025-06-12 00:00:00	0.004878048785030842	Total	2025-07-11 08:12:14.696	2025-07-11 08:12:14.696	Total	\N
game_006_d7_stickiness_Total_2025-06-18T00:00:00.000Z	game_006	d7_stickiness	2025-06-18 00:00:00	0	Total	2025-07-11 08:12:14.696	2025-07-11 08:12:14.696	Total	\N
game_006_d7_stickiness_Total_2025-06-21T00:00:00.000Z	game_006	d7_stickiness	2025-06-21 00:00:00	0.001524390187114477	Total	2025-07-11 08:12:14.696	2025-07-11 08:12:14.696	Total	\N
game_006_d7_stickiness_Total_2025-06-28T00:00:00.000Z	game_006	d7_stickiness	2025-06-28 00:00:00	0	Total	2025-07-11 08:12:14.696	2025-07-11 08:12:14.696	Total	\N
game_006_d7_stickiness_Total_2025-06-29T00:00:00.000Z	game_006	d7_stickiness	2025-06-29 00:00:00	0.002659574383869767	Total	2025-07-11 08:12:14.696	2025-07-11 08:12:14.696	Total	\N
game_006_d1_stickiness_Total_2025-06-12T00:00:00.000Z	game_006	d1_stickiness	2025-06-12 00:00:00	0.0452127642929554	Total	2025-07-11 08:12:14.699	2025-07-11 08:12:14.699	Total	\N
game_006_d7_stickiness_Total_2025-07-07T00:00:00.000Z	game_006	d7_stickiness	2025-07-07 00:00:00	0.003030302934348583	Total	2025-07-11 08:12:14.696	2025-07-11 08:12:14.696	Total	\N
game_006_d1_stickiness_Total_2025-06-21T00:00:00.000Z	game_006	d1_stickiness	2025-06-21 00:00:00	0.04400977864861488	Total	2025-07-11 08:12:14.699	2025-07-11 08:12:14.699	Total	\N
game_006_d1_stickiness_Total_2025-06-20T00:00:00.000Z	game_006	d1_stickiness	2025-06-20 00:00:00	0.01431980915367603	Total	2025-07-11 08:12:14.699	2025-07-11 08:12:14.699	Total	\N
game_006_d1_stickiness_Total_2025-06-29T00:00:00.000Z	game_006	d1_stickiness	2025-06-29 00:00:00	0.02477477490901947	Total	2025-07-11 08:12:14.699	2025-07-11 08:12:14.699	Total	\N
game_006_d1_stickiness_Total_2025-07-04T00:00:00.000Z	game_006	d1_stickiness	2025-07-04 00:00:00	0.03396739065647125	Total	2025-07-11 08:12:14.699	2025-07-11 08:12:14.699	Total	\N
game_006_d7_retention_Total_2025-06-12T00:00:00.000Z	game_006	d7_retention	2025-06-12 00:00:00	0.003558718832209706	Total	2025-07-11 08:12:14.7	2025-07-11 08:12:14.7	Total	\N
game_006_d7_retention_Total_2025-06-15T00:00:00.000Z	game_006	d7_retention	2025-06-15 00:00:00	0	Total	2025-07-11 08:12:14.7	2025-07-11 08:12:14.7	Total	\N
game_006_d7_retention_Total_2025-06-20T00:00:00.000Z	game_006	d7_retention	2025-06-20 00:00:00	0.002710027154535055	Total	2025-07-11 08:12:14.7	2025-07-11 08:12:14.7	Total	\N
game_006_d7_retention_Total_2025-06-26T00:00:00.000Z	game_006	d7_retention	2025-06-26 00:00:00	0	Total	2025-07-11 08:12:14.7	2025-07-11 08:12:14.7	Total	\N
game_006_d7_retention_Total_2025-06-30T00:00:00.000Z	game_006	d7_retention	2025-06-30 00:00:00	0	Total	2025-07-11 08:12:14.7	2025-07-11 08:12:14.7	Total	\N
game_006_d7_retention_Total_2025-07-04T00:00:00.000Z	game_006	d7_retention	2025-07-04 00:00:00	0	Total	2025-07-11 08:12:14.7	2025-07-11 08:12:14.7	Total	\N
game_006_d7_retention_Total_2025-07-06T00:00:00.000Z	game_006	d7_retention	2025-07-06 00:00:00	0.004065040498971939	Total	2025-07-11 08:12:14.7	2025-07-11 08:12:14.7	Total	\N
game_006_d1_retention_Total_2025-06-17T00:00:00.000Z	game_006	d1_retention	2025-06-17 00:00:00	0.03100775182247162	Total	2025-07-11 08:12:14.701	2025-07-11 08:12:14.701	Total	\N
game_006_d1_retention_Total_2025-06-25T00:00:00.000Z	game_006	d1_retention	2025-06-25 00:00:00	0.02168674767017365	Total	2025-07-11 08:12:14.701	2025-07-11 08:12:14.701	Total	\N
game_006_d1_retention_Total_2025-07-05T00:00:00.000Z	game_006	d1_retention	2025-07-05 00:00:00	0.03789731115102768	Total	2025-07-11 08:12:14.701	2025-07-11 08:12:14.701	Total	\N
game_005_demographics_language_English	game_005	demographics_language	2025-07-11 10:44:16.38	13246	English	2025-07-11 10:44:16.38	2025-07-11 10:44:16.38	Total	\N
game_005_demographics_gender_Unknown	game_005	demographics_gender	2025-07-11 10:44:16.381	2096	Unknown	2025-07-11 10:44:16.381	2025-07-11 10:44:16.381	Total	\N
game_005_demographics_age_group_9-12	game_005	demographics_age_group	2025-07-11 10:44:16.377	1135	9-12	2025-07-11 10:44:16.377	2025-07-11 10:44:16.377	Total	\N
game_005_demographics_country_Thailand	game_005	demographics_country	2025-07-11 10:44:16.393	423	Thailand	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Poland	game_005	demographics_country	2025-07-11 10:44:16.393	253	Poland	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Netherlands	game_005	demographics_country	2025-07-11 10:44:16.393	181	Netherlands	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Czech Republic	game_005	demographics_country	2025-07-11 10:44:16.393	90	Czech Republic	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Algeria	game_005	demographics_country	2025-07-11 10:44:16.393	62	Algeria	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Singapore	game_005	demographics_country	2025-07-11 10:44:16.393	56	Singapore	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Uruguay	game_005	demographics_country	2025-07-11 10:44:16.393	44	Uruguay	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Costa Rica	game_005	demographics_country	2025-07-11 10:44:16.393	31	Costa Rica	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Cambodia	game_005	demographics_country	2025-07-11 10:44:16.393	23	Cambodia	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Lebanon	game_005	demographics_country	2025-07-11 10:44:16.393	16	Lebanon	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Mongolia	game_005	demographics_country	2025-07-11 10:44:16.393	9	Mongolia	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Libya	game_005	demographics_country	2025-07-11 10:44:16.393	2	Libya	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_monthly_active_users_by_day_Total_2025-06-16T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-16 00:00:00	17993	Total	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Total_2025-06-25T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-25 00:00:00	16216	Total	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Total_2025-07-05T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-07-05 00:00:00	16842	Total	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-15T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-15 00:00:00	108968	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-24T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-24 00:00:00	114292	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-07-04T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-07-04 00:00:00	125486	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_average_session_length_minutes_Total_2025-06-14T00:00:00.000Z	game_005	average_session_length_minutes	2025-06-14 00:00:00	5.837278366088867	Total	2025-07-11 10:44:16.397	2025-07-11 10:44:16.397	Total	\N
game_005_average_session_length_minutes_Total_2025-06-23T00:00:00.000Z	game_005	average_session_length_minutes	2025-06-23 00:00:00	7.148519515991211	Total	2025-07-11 10:44:16.397	2025-07-11 10:44:16.397	Total	\N
game_005_average_session_length_minutes_Total_2025-07-02T00:00:00.000Z	game_005	average_session_length_minutes	2025-07-02 00:00:00	8.710577011108398	Total	2025-07-11 10:44:16.397	2025-07-11 10:44:16.397	Total	\N
game_005_average_play_time_minutes_Total_2025-06-12T00:00:00.000Z	game_005	average_play_time_minutes	2025-06-12 00:00:00	7.15092945098877	Total	2025-07-11 10:44:16.398	2025-07-11 10:44:16.398	Total	\N
game_005_average_play_time_minutes_Total_2025-06-22T00:00:00.000Z	game_005	average_play_time_minutes	2025-06-22 00:00:00	8.88847541809082	Total	2025-07-11 10:44:16.398	2025-07-11 10:44:16.398	Total	\N
game_005_average_play_time_minutes_Total_2025-07-02T00:00:00.000Z	game_005	average_play_time_minutes	2025-07-02 00:00:00	10.85298442840576	Total	2025-07-11 10:44:16.398	2025-07-11 10:44:16.398	Total	\N
game_005_daily_active_users_Total_2025-06-12T00:00:00.000Z	game_005	daily_active_users	2025-06-12 00:00:00	753	Total	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Total_2025-06-22T00:00:00.000Z	game_005	daily_active_users	2025-06-22 00:00:00	376	Total	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Total_2025-06-30T00:00:00.000Z	game_005	daily_active_users	2025-06-30 00:00:00	660	Total	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Total_2025-07-09T00:00:00.000Z	game_005	daily_active_users	2025-07-09 00:00:00	1953	Total	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-20T00:00:00.000Z	game_005	daily_active_users	2025-06-20 00:00:00	5112	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-29T00:00:00.000Z	game_005	daily_active_users	2025-06-29 00:00:00	6683	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Benchmark (Top 10,000 experience)_2025-07-09T00:00:00.000Z	game_005	daily_active_users	2025-07-09 00:00:00	5864	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_d7_stickiness_Total_2025-06-19T00:00:00.000Z	game_005	d7_stickiness	2025-06-19 00:00:00	0	Total	2025-07-11 10:44:16.401	2025-07-11 10:44:16.401	Total	\N
game_005_d7_stickiness_Total_2025-06-28T00:00:00.000Z	game_005	d7_stickiness	2025-06-28 00:00:00	0	Total	2025-07-11 10:44:16.401	2025-07-11 10:44:16.401	Total	\N
game_005_d7_stickiness_Total_2025-07-08T00:00:00.000Z	game_005	d7_stickiness	2025-07-08 00:00:00	0.001642036135308444	Total	2025-07-11 10:44:16.401	2025-07-11 10:44:16.401	Total	\N
game_005_d1_stickiness_Total_2025-06-20T00:00:00.000Z	game_005	d1_stickiness	2025-06-20 00:00:00	0.01431980915367603	Total	2025-07-11 10:44:16.402	2025-07-11 10:44:16.402	Total	\N
game_005_d1_stickiness_Total_2025-06-28T00:00:00.000Z	game_005	d1_stickiness	2025-06-28 00:00:00	0.02542372792959213	Total	2025-07-11 10:44:16.402	2025-07-11 10:44:16.402	Total	\N
game_005_d1_stickiness_Total_2025-07-06T00:00:00.000Z	game_005	d1_stickiness	2025-07-06 00:00:00	0.02620967663824558	Total	2025-07-11 10:44:16.402	2025-07-11 10:44:16.402	Total	\N
game_005_d7_retention_Total_2025-06-17T00:00:00.000Z	game_005	d7_retention	2025-06-17 00:00:00	0	Total	2025-07-11 10:44:16.404	2025-07-11 10:44:16.404	Total	\N
game_005_d7_retention_Total_2025-06-26T00:00:00.000Z	game_005	d7_retention	2025-06-26 00:00:00	0	Total	2025-07-11 10:44:16.404	2025-07-11 10:44:16.404	Total	\N
game_005_d7_retention_Total_2025-07-06T00:00:00.000Z	game_005	d7_retention	2025-07-06 00:00:00	0.004065040498971939	Total	2025-07-11 10:44:16.404	2025-07-11 10:44:16.404	Total	\N
game_005_d1_retention_Total_2025-06-17T00:00:00.000Z	game_005	d1_retention	2025-06-17 00:00:00	0.03100775182247162	Total	2025-07-11 10:44:16.405	2025-07-11 10:44:16.405	Total	\N
game_005_d1_retention_Total_2025-06-25T00:00:00.000Z	game_005	d1_retention	2025-06-25 00:00:00	0.02168674767017365	Total	2025-07-11 10:44:16.405	2025-07-11 10:44:16.405	Total	\N
game_005_d1_retention_Total_2025-07-04T00:00:00.000Z	game_005	d1_retention	2025-07-04 00:00:00	0.03215926513075829	Total	2025-07-11 10:44:16.405	2025-07-11 10:44:16.405	Total	\N
game_006_d7_retention_Total_2025-07-09T00:00:00.000Z	game_006	d7_retention	2025-07-09 00:00:00	0.002406738931313157	Total	2025-07-11 08:12:14.7	2025-07-11 08:12:14.7	Total	\N
game_006_d1_retention_Total_2025-06-21T00:00:00.000Z	game_006	d1_retention	2025-06-21 00:00:00	0.04177545756101608	Total	2025-07-11 08:12:14.701	2025-07-11 08:12:14.701	Total	\N
game_006_d1_retention_Total_2025-07-02T00:00:00.000Z	game_006	d1_retention	2025-07-02 00:00:00	0.02683363109827042	Total	2025-07-11 08:12:14.701	2025-07-11 08:12:14.701	Total	\N
game_006_d7_retention_Total_2025-06-29T00:00:00.000Z	game_006	d7_retention	2025-06-29 00:00:00	0.002785515272989869	Total	2025-07-11 08:12:14.7	2025-07-11 08:12:14.7	Total	\N
game_005_demographics_language_Vietnamese	game_005	demographics_language	2025-07-11 10:44:16.38	400	Vietnamese	2025-07-11 10:44:16.38	2025-07-11 10:44:16.38	Total	\N
game_005_demographics_language_Thai	game_005	demographics_language	2025-07-11 10:44:16.38	324	Thai	2025-07-11 10:44:16.38	2025-07-11 10:44:16.38	Total	\N
game_005_demographics_gender_Female	game_005	demographics_gender	2025-07-11 10:44:16.381	9557	Female	2025-07-11 10:44:16.381	2025-07-11 10:44:16.381	Total	\N
game_005_demographics_country_Vietnam	game_005	demographics_country	2025-07-11 10:44:16.393	519	Vietnam	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_India	game_005	demographics_country	2025-07-11 10:44:16.393	411	India	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Spain	game_005	demographics_country	2025-07-11 10:44:16.393	182	Spain	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_United Arab Emirates	game_005	demographics_country	2025-07-11 10:44:16.393	101	United Arab Emirates	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Kuwait	game_005	demographics_country	2025-07-11 10:44:16.393	72	Kuwait	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Ireland	game_005	demographics_country	2025-07-11 10:44:16.393	60	Ireland	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Puerto Rico	game_005	demographics_country	2025-07-11 10:44:16.393	46	Puerto Rico	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Slovakia	game_005	demographics_country	2025-07-11 10:44:16.393	34	Slovakia	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Bolivia	game_005	demographics_country	2025-07-11 10:44:16.393	26	Bolivia	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Armenia	game_005	demographics_country	2025-07-11 10:44:16.393	18	Armenia	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Nicaragua	game_005	demographics_country	2025-07-11 10:44:16.393	14	Nicaragua	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Kosovo	game_005	demographics_country	2025-07-11 10:44:16.393	7	Kosovo	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_monthly_active_users_by_day_Total_2025-06-13T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-13 00:00:00	18237	Total	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Total_2025-06-24T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-24 00:00:00	16429	Total	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Total_2025-07-03T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-07-03 00:00:00	15862	Total	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-12T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-12 00:00:00	104406	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-21T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-21 00:00:00	113458	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-07-01T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-07-01 00:00:00	122167	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-07-09T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-07-09 00:00:00	129362	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_average_session_length_minutes_Total_2025-06-19T00:00:00.000Z	game_005	average_session_length_minutes	2025-06-19 00:00:00	6.302659034729004	Total	2025-07-11 10:44:16.397	2025-07-11 10:44:16.397	Total	\N
game_005_average_session_length_minutes_Total_2025-07-01T00:00:00.000Z	game_005	average_session_length_minutes	2025-07-01 00:00:00	7.774129390716553	Total	2025-07-11 10:44:16.397	2025-07-11 10:44:16.397	Total	\N
game_005_average_session_length_minutes_Total_2025-07-08T00:00:00.000Z	game_005	average_session_length_minutes	2025-07-08 00:00:00	8.971120834350586	Total	2025-07-11 10:44:16.397	2025-07-11 10:44:16.397	Total	\N
game_005_average_play_time_minutes_Total_2025-06-21T00:00:00.000Z	game_005	average_play_time_minutes	2025-06-21 00:00:00	7.330595016479492	Total	2025-07-11 10:44:16.398	2025-07-11 10:44:16.398	Total	\N
game_005_average_play_time_minutes_Total_2025-06-29T00:00:00.000Z	game_005	average_play_time_minutes	2025-06-29 00:00:00	7.936248302459717	Total	2025-07-11 10:44:16.398	2025-07-11 10:44:16.398	Total	\N
game_005_average_play_time_minutes_Total_2025-07-08T00:00:00.000Z	game_005	average_play_time_minutes	2025-07-08 00:00:00	10.84660339355469	Total	2025-07-11 10:44:16.398	2025-07-11 10:44:16.398	Total	\N
game_005_daily_active_users_Total_2025-06-17T00:00:00.000Z	game_005	daily_active_users	2025-06-17 00:00:00	398	Total	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Total_2025-06-27T00:00:00.000Z	game_005	daily_active_users	2025-06-27 00:00:00	472	Total	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Total_2025-07-06T00:00:00.000Z	game_005	daily_active_users	2025-07-06 00:00:00	3756	Total	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-17T00:00:00.000Z	game_005	daily_active_users	2025-06-17 00:00:00	4442	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-27T00:00:00.000Z	game_005	daily_active_users	2025-06-27 00:00:00	5795	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Benchmark (Top 10,000 experience)_2025-07-06T00:00:00.000Z	game_005	daily_active_users	2025-07-06 00:00:00	6339	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_d7_stickiness_Total_2025-06-16T00:00:00.000Z	game_005	d7_stickiness	2025-06-16 00:00:00	0.002049180213361979	Total	2025-07-11 10:44:16.401	2025-07-11 10:44:16.401	Total	\N
game_005_d7_stickiness_Total_2025-06-25T00:00:00.000Z	game_005	d7_stickiness	2025-06-25 00:00:00	0	Total	2025-07-11 10:44:16.401	2025-07-11 10:44:16.401	Total	\N
game_005_d7_stickiness_Total_2025-07-05T00:00:00.000Z	game_005	d7_stickiness	2025-07-05 00:00:00	0	Total	2025-07-11 10:44:16.401	2025-07-11 10:44:16.401	Total	\N
game_005_d1_stickiness_Total_2025-06-16T00:00:00.000Z	game_005	d1_stickiness	2025-06-16 00:00:00	0.02914798259735107	Total	2025-07-11 10:44:16.402	2025-07-11 10:44:16.402	Total	\N
game_005_d1_stickiness_Total_2025-06-23T00:00:00.000Z	game_005	d1_stickiness	2025-06-23 00:00:00	0.04255319014191628	Total	2025-07-11 10:44:16.402	2025-07-11 10:44:16.402	Total	\N
game_005_d1_stickiness_Total_2025-07-04T00:00:00.000Z	game_005	d1_stickiness	2025-07-04 00:00:00	0.03396739065647125	Total	2025-07-11 10:44:16.402	2025-07-11 10:44:16.402	Total	\N
game_005_d7_retention_Total_2025-06-15T00:00:00.000Z	game_005	d7_retention	2025-06-15 00:00:00	0	Total	2025-07-11 10:44:16.404	2025-07-11 10:44:16.404	Total	\N
game_005_d7_retention_Total_2025-06-24T00:00:00.000Z	game_005	d7_retention	2025-06-24 00:00:00	0.002717391354963183	Total	2025-07-11 10:44:16.404	2025-07-11 10:44:16.404	Total	\N
game_005_d7_retention_Total_2025-07-03T00:00:00.000Z	game_005	d7_retention	2025-07-03 00:00:00	0	Total	2025-07-11 10:44:16.404	2025-07-11 10:44:16.404	Total	\N
game_005_d1_retention_Total_2025-06-14T00:00:00.000Z	game_005	d1_retention	2025-06-14 00:00:00	0.02574525773525238	Total	2025-07-11 10:44:16.405	2025-07-11 10:44:16.405	Total	\N
game_005_d1_retention_Total_2025-06-22T00:00:00.000Z	game_005	d1_retention	2025-06-22 00:00:00	0.01746724918484688	Total	2025-07-11 10:44:16.405	2025-07-11 10:44:16.405	Total	\N
game_006_d1_retention_Total_2025-06-13T00:00:00.000Z	game_006	d1_retention	2025-06-13 00:00:00	0.02255639061331749	Total	2025-07-11 08:12:14.701	2025-07-11 08:12:14.701	Total	\N
game_006_d1_retention_Total_2025-06-18T00:00:00.000Z	game_006	d1_retention	2025-06-18 00:00:00	0.01630434766411781	Total	2025-07-11 08:12:14.701	2025-07-11 08:12:14.701	Total	\N
game_006_d1_retention_Total_2025-06-30T00:00:00.000Z	game_006	d1_retention	2025-06-30 00:00:00	0.02845528535544872	Total	2025-07-11 08:12:14.701	2025-07-11 08:12:14.701	Total	\N
game_006_d1_retention_Total_2025-07-09T00:00:00.000Z	game_006	d1_retention	2025-07-09 00:00:00	0.02349751442670822	Total	2025-07-11 08:12:14.701	2025-07-11 08:12:14.701	Total	\N
game_005_demographics_language_French	game_005	demographics_language	2025-07-11 10:44:16.38	595	French	2025-07-11 10:44:16.38	2025-07-11 10:44:16.38	Total	\N
game_005_demographics_language_German	game_005	demographics_language	2025-07-11 10:44:16.38	310	German	2025-07-11 10:44:16.38	2025-07-11 10:44:16.38	Total	\N
game_005_demographics_country_Date	game_005	demographics_country	2025-07-11 10:44:16.393	2025	Date	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Germany	game_005	demographics_country	2025-07-11 10:44:16.393	404	Germany	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Australia	game_005	demographics_country	2025-07-11 10:44:16.393	271	Australia	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Sweden	game_005	demographics_country	2025-07-11 10:44:16.393	134	Sweden	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_South Africa	game_005	demographics_country	2025-07-11 10:44:16.393	83	South Africa	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Morocco	game_005	demographics_country	2025-07-11 10:44:16.393	67	Morocco	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Lithuania	game_005	demographics_country	2025-07-11 10:44:16.393	53	Lithuania	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Honduras	game_005	demographics_country	2025-07-11 10:44:16.393	38	Honduras	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Uzbekistan	game_005	demographics_country	2025-07-11 10:44:16.393	27	Uzbekistan	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Qatar	game_005	demographics_country	2025-07-11 10:44:16.393	22	Qatar	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Trinidad and Tobago	game_005	demographics_country	2025-07-11 10:44:16.393	15	Trinidad and Tobago	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Albania	game_005	demographics_country	2025-07-11 10:44:16.393	14	Albania	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Curaçao	game_005	demographics_country	2025-07-11 10:44:16.393	2	Curaçao	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_monthly_active_users_by_day_Total_2025-06-18T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-18 00:00:00	17843	Total	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Total_2025-06-27T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-27 00:00:00	15770	Total	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Total_2025-07-06T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-07-06 00:00:00	19793	Total	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-17T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-17 00:00:00	107747	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-27T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-27 00:00:00	117647	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-07-07T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-07-07 00:00:00	127452	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_average_session_length_minutes_Total_2025-06-17T00:00:00.000Z	game_005	average_session_length_minutes	2025-06-17 00:00:00	6.892302513122559	Total	2025-07-11 10:44:16.397	2025-07-11 10:44:16.397	Total	\N
game_005_average_session_length_minutes_Total_2025-06-24T00:00:00.000Z	game_005	average_session_length_minutes	2025-06-24 00:00:00	6.310691356658936	Total	2025-07-11 10:44:16.397	2025-07-11 10:44:16.397	Total	\N
game_005_average_session_length_minutes_Total_2025-07-03T00:00:00.000Z	game_005	average_session_length_minutes	2025-07-03 00:00:00	7.75367546081543	Total	2025-07-11 10:44:16.397	2025-07-11 10:44:16.397	Total	\N
game_005_average_play_time_minutes_Total_2025-06-16T00:00:00.000Z	game_005	average_play_time_minutes	2025-06-16 00:00:00	8.987638473510742	Total	2025-07-11 10:44:16.398	2025-07-11 10:44:16.398	Total	\N
game_005_average_play_time_minutes_Total_2025-06-24T00:00:00.000Z	game_005	average_play_time_minutes	2025-06-24 00:00:00	7.367232322692871	Total	2025-07-11 10:44:16.398	2025-07-11 10:44:16.398	Total	\N
game_005_average_play_time_minutes_Total_2025-07-04T00:00:00.000Z	game_005	average_play_time_minutes	2025-07-04 00:00:00	10.18311309814453	Total	2025-07-11 10:44:16.398	2025-07-11 10:44:16.398	Total	\N
game_005_daily_active_users_Total_2025-06-13T00:00:00.000Z	game_005	daily_active_users	2025-06-13 00:00:00	803	Total	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Total_2025-06-21T00:00:00.000Z	game_005	daily_active_users	2025-06-21 00:00:00	493	Total	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Total_2025-07-02T00:00:00.000Z	game_005	daily_active_users	2025-07-02 00:00:00	927	Total	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-13T00:00:00.000Z	game_005	daily_active_users	2025-06-13 00:00:00	4571	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-24T00:00:00.000Z	game_005	daily_active_users	2025-06-24 00:00:00	4917	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-30T00:00:00.000Z	game_005	daily_active_users	2025-06-30 00:00:00	5874	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_d7_stickiness_Total_2025-06-14T00:00:00.000Z	game_005	d7_stickiness	2025-06-14 00:00:00	0.001584786106832325	Total	2025-07-11 10:44:16.401	2025-07-11 10:44:16.401	Total	\N
game_005_d7_stickiness_Total_2025-06-23T00:00:00.000Z	game_005	d7_stickiness	2025-06-23 00:00:00	0	Total	2025-07-11 10:44:16.401	2025-07-11 10:44:16.401	Total	\N
game_005_d7_stickiness_Total_2025-07-01T00:00:00.000Z	game_005	d7_stickiness	2025-07-01 00:00:00	0	Total	2025-07-11 10:44:16.401	2025-07-11 10:44:16.401	Total	\N
game_005_d7_stickiness_Total_2025-07-09T00:00:00.000Z	game_005	d7_stickiness	2025-07-09 00:00:00	0.00323624606244266	Total	2025-07-11 10:44:16.401	2025-07-11 10:44:16.401	Total	\N
game_005_d1_stickiness_Total_2025-06-18T00:00:00.000Z	game_005	d1_stickiness	2025-06-18 00:00:00	0.02010050229728222	Total	2025-07-11 10:44:16.402	2025-07-11 10:44:16.402	Total	\N
game_005_d1_stickiness_Total_2025-06-27T00:00:00.000Z	game_005	d1_stickiness	2025-06-27 00:00:00	0.01339285727590322	Total	2025-07-11 10:44:16.402	2025-07-11 10:44:16.402	Total	\N
game_005_d1_stickiness_Total_2025-07-08T00:00:00.000Z	game_005	d1_stickiness	2025-07-08 00:00:00	0.03297179937362671	Total	2025-07-11 10:44:16.402	2025-07-11 10:44:16.402	Total	\N
game_005_d7_retention_Total_2025-06-20T00:00:00.000Z	game_005	d7_retention	2025-06-20 00:00:00	0.002710027154535055	Total	2025-07-11 10:44:16.404	2025-07-11 10:44:16.404	Total	\N
game_005_d7_retention_Total_2025-06-28T00:00:00.000Z	game_005	d7_retention	2025-06-28 00:00:00	0	Total	2025-07-11 10:44:16.404	2025-07-11 10:44:16.404	Total	\N
game_005_d7_retention_Total_2025-07-05T00:00:00.000Z	game_005	d7_retention	2025-07-05 00:00:00	0	Total	2025-07-11 10:44:16.404	2025-07-11 10:44:16.404	Total	\N
game_005_d1_retention_Total_2025-06-15T00:00:00.000Z	game_005	d1_retention	2025-06-15 00:00:00	0.01642036065459251	Total	2025-07-11 10:44:16.405	2025-07-11 10:44:16.405	Total	\N
game_005_d1_retention_Total_2025-06-26T00:00:00.000Z	game_005	d1_retention	2025-06-26 00:00:00	0.01995012536644936	Total	2025-07-11 10:44:16.405	2025-07-11 10:44:16.405	Total	\N
game_005_d1_retention_Total_2025-07-06T00:00:00.000Z	game_005	d1_retention	2025-07-06 00:00:00	0.02520385384559631	Total	2025-07-11 10:44:16.405	2025-07-11 10:44:16.405	Total	\N
game_006_d1_retention_Total_2025-06-15T00:00:00.000Z	game_006	d1_retention	2025-06-15 00:00:00	0.01642036065459251	Total	2025-07-11 08:12:14.701	2025-07-11 08:12:14.701	Total	\N
game_006_d1_retention_Total_2025-06-29T00:00:00.000Z	game_006	d1_retention	2025-06-29 00:00:00	0.02427184395492077	Total	2025-07-11 08:12:14.701	2025-07-11 08:12:14.701	Total	\N
game_006_d1_retention_Total_2025-07-07T00:00:00.000Z	game_006	d1_retention	2025-07-07 00:00:00	0.02667423337697983	Total	2025-07-11 08:12:14.701	2025-07-11 08:12:14.701	Total	\N
game_005_demographics_age_group_13-17	game_005	demographics_age_group	2025-07-11 10:44:16.377	6392	13-17	2025-07-11 10:44:16.377	2025-07-11 10:44:16.377	Total	\N
game_005_demographics_country_United States	game_005	demographics_country	2025-07-11 10:44:16.393	6379	United States	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Indonesia	game_005	demographics_country	2025-07-11 10:44:16.393	1189	Indonesia	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_United Kingdom	game_005	demographics_country	2025-07-11 10:44:16.393	921	United Kingdom	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Japan	game_005	demographics_country	2025-07-11 10:44:16.393	203	Japan	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Iraq	game_005	demographics_country	2025-07-11 10:44:16.393	160	Iraq	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Pakistan	game_005	demographics_country	2025-07-11 10:44:16.393	83	Pakistan	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Hungary	game_005	demographics_country	2025-07-11 10:44:16.393	60	Hungary	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Jordan	game_005	demographics_country	2025-07-11 10:44:16.393	50	Jordan	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Austria	game_005	demographics_country	2025-07-11 10:44:16.393	42	Austria	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Bangladesh	game_005	demographics_country	2025-07-11 10:44:16.393	29	Bangladesh	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Tunisia	game_005	demographics_country	2025-07-11 10:44:16.393	23	Tunisia	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Kyrgyzstan	game_005	demographics_country	2025-07-11 10:44:16.393	15	Kyrgyzstan	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Iran	game_005	demographics_country	2025-07-11 10:44:16.393	6	Iran	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Jersey	game_005	demographics_country	2025-07-11 10:44:16.393	1	Jersey	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_monthly_active_users_by_day_Total_2025-06-21T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-21 00:00:00	17269	Total	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Total_2025-06-30T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-30 00:00:00	15399	Total	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Total_2025-07-07T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-07-07 00:00:00	21368	Total	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-20T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-20 00:00:00	111527	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-25T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-25 00:00:00	115003	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-07-03T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-07-03 00:00:00	123736	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_average_session_length_minutes_Total_2025-06-16T00:00:00.000Z	game_005	average_session_length_minutes	2025-06-16 00:00:00	7.510462284088135	Total	2025-07-11 10:44:16.397	2025-07-11 10:44:16.397	Total	\N
game_005_average_session_length_minutes_Total_2025-06-25T00:00:00.000Z	game_005	average_session_length_minutes	2025-06-25 00:00:00	5.641634464263916	Total	2025-07-11 10:44:16.397	2025-07-11 10:44:16.397	Total	\N
game_005_average_session_length_minutes_Total_2025-07-06T00:00:00.000Z	game_005	average_session_length_minutes	2025-07-06 00:00:00	8.48884391784668	Total	2025-07-11 10:44:16.397	2025-07-11 10:44:16.397	Total	\N
game_005_average_play_time_minutes_Total_2025-06-17T00:00:00.000Z	game_005	average_play_time_minutes	2025-06-17 00:00:00	8.398911476135254	Total	2025-07-11 10:44:16.398	2025-07-11 10:44:16.398	Total	\N
game_005_average_play_time_minutes_Total_2025-06-23T00:00:00.000Z	game_005	average_play_time_minutes	2025-06-23 00:00:00	8.34627628326416	Total	2025-07-11 10:44:16.398	2025-07-11 10:44:16.398	Total	\N
game_005_average_play_time_minutes_Total_2025-07-05T00:00:00.000Z	game_005	average_play_time_minutes	2025-07-05 00:00:00	9.31640911102295	Total	2025-07-11 10:44:16.398	2025-07-11 10:44:16.398	Total	\N
game_005_daily_active_users_Total_2025-06-16T00:00:00.000Z	game_005	daily_active_users	2025-06-16 00:00:00	422	Total	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Total_2025-06-25T00:00:00.000Z	game_005	daily_active_users	2025-06-25 00:00:00	422	Total	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Total_2025-07-03T00:00:00.000Z	game_005	daily_active_users	2025-07-03 00:00:00	736	Total	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-14T00:00:00.000Z	game_005	daily_active_users	2025-06-14 00:00:00	5199	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-22T00:00:00.000Z	game_005	daily_active_users	2025-06-22 00:00:00	5612	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Benchmark (Top 10,000 experience)_2025-07-02T00:00:00.000Z	game_005	daily_active_users	2025-07-02 00:00:00	5513	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Benchmark (Top 10,000 experience)_2025-07-08T00:00:00.000Z	game_005	daily_active_users	2025-07-08 00:00:00	5717	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_d7_stickiness_Total_2025-06-20T00:00:00.000Z	game_005	d7_stickiness	2025-06-20 00:00:00	0.003735990030691028	Total	2025-07-11 10:44:16.401	2025-07-11 10:44:16.401	Total	\N
game_005_d7_stickiness_Total_2025-06-30T00:00:00.000Z	game_005	d7_stickiness	2025-06-30 00:00:00	0	Total	2025-07-11 10:44:16.401	2025-07-11 10:44:16.401	Total	\N
game_005_d1_stickiness_Total_2025-06-12T00:00:00.000Z	game_005	d1_stickiness	2025-06-12 00:00:00	0.0452127642929554	Total	2025-07-11 10:44:16.402	2025-07-11 10:44:16.402	Total	\N
game_005_d1_stickiness_Total_2025-06-22T00:00:00.000Z	game_005	d1_stickiness	2025-06-22 00:00:00	0.01622718013823032	Total	2025-07-11 10:44:16.402	2025-07-11 10:44:16.402	Total	\N
game_005_d1_stickiness_Total_2025-06-29T00:00:00.000Z	game_005	d1_stickiness	2025-06-29 00:00:00	0.02477477490901947	Total	2025-07-11 10:44:16.402	2025-07-11 10:44:16.402	Total	\N
game_005_d1_stickiness_Total_2025-07-07T00:00:00.000Z	game_005	d1_stickiness	2025-07-07 00:00:00	0.02742278948426247	Total	2025-07-11 10:44:16.402	2025-07-11 10:44:16.402	Total	\N
game_005_d7_retention_Total_2025-06-21T00:00:00.000Z	game_005	d7_retention	2025-06-21 00:00:00	0.001642036135308444	Total	2025-07-11 10:44:16.404	2025-07-11 10:44:16.404	Total	\N
game_005_d7_retention_Total_2025-06-27T00:00:00.000Z	game_005	d7_retention	2025-06-27 00:00:00	0	Total	2025-07-11 10:44:16.404	2025-07-11 10:44:16.404	Total	\N
game_005_d7_retention_Total_2025-07-08T00:00:00.000Z	game_005	d7_retention	2025-07-08 00:00:00	0.001788908732123673	Total	2025-07-11 10:44:16.404	2025-07-11 10:44:16.404	Total	\N
game_005_d1_retention_Total_2025-06-18T00:00:00.000Z	game_005	d1_retention	2025-06-18 00:00:00	0.01630434766411781	Total	2025-07-11 10:44:16.405	2025-07-11 10:44:16.405	Total	\N
game_005_d1_retention_Total_2025-06-28T00:00:00.000Z	game_005	d1_retention	2025-06-28 00:00:00	0.02654867246747017	Total	2025-07-11 10:44:16.405	2025-07-11 10:44:16.405	Total	\N
game_005_d1_retention_Total_2025-07-05T00:00:00.000Z	game_005	d1_retention	2025-07-05 00:00:00	0.03789731115102768	Total	2025-07-11 10:44:16.405	2025-07-11 10:44:16.405	Total	\N
game_005_demographics_age_group_<9	game_005	demographics_age_group	2025-07-11 10:44:16.377	540	<9	2025-07-11 10:44:16.377	2025-07-11 10:44:16.377	Total	\N
game_005_demographics_language_Spanish	game_005	demographics_language	2025-07-11 10:44:16.38	2181	Spanish	2025-07-11 10:44:16.38	2025-07-11 10:44:16.38	Total	\N
game_005_demographics_country_Philippines	game_005	demographics_country	2025-07-11 10:44:16.393	941	Philippines	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Saudi Arabia	game_005	demographics_country	2025-07-11 10:44:16.393	439	Saudi Arabia	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Ukraine	game_005	demographics_country	2025-07-11 10:44:16.393	269	Ukraine	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Egypt	game_005	demographics_country	2025-07-11 10:44:16.393	160	Egypt	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Portugal	game_005	demographics_country	2025-07-11 10:44:16.393	92	Portugal	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Denmark	game_005	demographics_country	2025-07-11 10:44:16.393	59	Denmark	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Taiwan	game_005	demographics_country	2025-07-11 10:44:16.393	54	Taiwan	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Switzerland	game_005	demographics_country	2025-07-11 10:44:16.393	43	Switzerland	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Georgia	game_005	demographics_country	2025-07-11 10:44:16.393	28	Georgia	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Guatemala	game_005	demographics_country	2025-07-11 10:44:16.393	22	Guatemala	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Slovenia	game_005	demographics_country	2025-07-11 10:44:16.393	16	Slovenia	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Mauritius	game_005	demographics_country	2025-07-11 10:44:16.393	10	Mauritius	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Faroe Islands	game_005	demographics_country	2025-07-11 10:44:16.393	1	Faroe Islands	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_monthly_active_users_by_day_Total_2025-06-17T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-17 00:00:00	17897	Total	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Total_2025-06-29T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-29 00:00:00	15567	Total	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Total_2025-07-08T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-07-08 00:00:00	23146	Total	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-16T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-16 00:00:00	108360	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-28T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-28 00:00:00	119599	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-07-06T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-07-06 00:00:00	127400	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_average_session_length_minutes_Total_2025-06-18T00:00:00.000Z	game_005	average_session_length_minutes	2025-06-18 00:00:00	6.097349166870117	Total	2025-07-11 10:44:16.397	2025-07-11 10:44:16.397	Total	\N
game_005_average_session_length_minutes_Total_2025-06-26T00:00:00.000Z	game_005	average_session_length_minutes	2025-06-26 00:00:00	7.557888507843018	Total	2025-07-11 10:44:16.397	2025-07-11 10:44:16.397	Total	\N
game_005_average_session_length_minutes_Total_2025-07-05T00:00:00.000Z	game_005	average_session_length_minutes	2025-07-05 00:00:00	7.890049457550049	Total	2025-07-11 10:44:16.397	2025-07-11 10:44:16.397	Total	\N
game_005_average_play_time_minutes_Total_2025-06-14T00:00:00.000Z	game_005	average_play_time_minutes	2025-06-14 00:00:00	7.029649257659912	Total	2025-07-11 10:44:16.398	2025-07-11 10:44:16.398	Total	\N
game_005_average_play_time_minutes_Total_2025-06-26T00:00:00.000Z	game_005	average_play_time_minutes	2025-06-26 00:00:00	9.160565376281738	Total	2025-07-11 10:44:16.398	2025-07-11 10:44:16.398	Total	\N
game_005_average_play_time_minutes_Total_2025-07-01T00:00:00.000Z	game_005	average_play_time_minutes	2025-07-01 00:00:00	9.408101081848145	Total	2025-07-11 10:44:16.398	2025-07-11 10:44:16.398	Total	\N
game_005_daily_active_users_Total_2025-06-15T00:00:00.000Z	game_005	daily_active_users	2025-06-15 00:00:00	446	Total	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Total_2025-06-23T00:00:00.000Z	game_005	daily_active_users	2025-06-23 00:00:00	376	Total	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Total_2025-07-04T00:00:00.000Z	game_005	daily_active_users	2025-07-04 00:00:00	909	Total	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-15T00:00:00.000Z	game_005	daily_active_users	2025-06-15 00:00:00	5155	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-21T00:00:00.000Z	game_005	daily_active_users	2025-06-21 00:00:00	5618	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Benchmark (Top 10,000 experience)_2025-07-03T00:00:00.000Z	game_005	daily_active_users	2025-07-03 00:00:00	5218	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_d7_stickiness_Total_2025-06-13T00:00:00.000Z	game_005	d7_stickiness	2025-06-13 00:00:00	0.001483679516240954	Total	2025-07-11 10:44:16.401	2025-07-11 10:44:16.401	Total	\N
game_005_d7_stickiness_Total_2025-06-21T00:00:00.000Z	game_005	d7_stickiness	2025-06-21 00:00:00	0.001524390187114477	Total	2025-07-11 10:44:16.401	2025-07-11 10:44:16.401	Total	\N
game_005_d7_stickiness_Total_2025-07-02T00:00:00.000Z	game_005	d7_stickiness	2025-07-02 00:00:00	0	Total	2025-07-11 10:44:16.401	2025-07-11 10:44:16.401	Total	\N
game_005_d1_stickiness_Total_2025-06-13T00:00:00.000Z	game_005	d1_stickiness	2025-06-13 00:00:00	0.029216468334198	Total	2025-07-11 10:44:16.402	2025-07-11 10:44:16.402	Total	\N
game_005_d1_stickiness_Total_2025-06-21T00:00:00.000Z	game_005	d1_stickiness	2025-06-21 00:00:00	0.04400977864861488	Total	2025-07-11 10:44:16.402	2025-07-11 10:44:16.402	Total	\N
game_005_d1_stickiness_Total_2025-07-01T00:00:00.000Z	game_005	d1_stickiness	2025-07-01 00:00:00	0.03181818127632141	Total	2025-07-11 10:44:16.402	2025-07-11 10:44:16.402	Total	\N
game_005_d7_retention_Total_2025-06-13T00:00:00.000Z	game_005	d7_retention	2025-06-13 00:00:00	0	Total	2025-07-11 10:44:16.404	2025-07-11 10:44:16.404	Total	\N
game_005_d7_retention_Total_2025-06-18T00:00:00.000Z	game_005	d7_retention	2025-06-18 00:00:00	0	Total	2025-07-11 10:44:16.404	2025-07-11 10:44:16.404	Total	\N
game_005_d7_retention_Total_2025-06-30T00:00:00.000Z	game_005	d7_retention	2025-06-30 00:00:00	0	Total	2025-07-11 10:44:16.404	2025-07-11 10:44:16.404	Total	\N
game_005_d7_retention_Total_2025-07-07T00:00:00.000Z	game_005	d7_retention	2025-07-07 00:00:00	0.003316749585792422	Total	2025-07-11 10:44:16.404	2025-07-11 10:44:16.404	Total	\N
game_005_d1_retention_Total_2025-06-19T00:00:00.000Z	game_005	d1_retention	2025-06-19 00:00:00	0.02506963722407818	Total	2025-07-11 10:44:16.405	2025-07-11 10:44:16.405	Total	\N
game_005_d1_retention_Total_2025-06-27T00:00:00.000Z	game_005	d1_retention	2025-06-27 00:00:00	0.01179245300590992	Total	2025-07-11 10:44:16.405	2025-07-11 10:44:16.405	Total	\N
game_005_d1_retention_Total_2025-07-07T00:00:00.000Z	game_005	d1_retention	2025-07-07 00:00:00	0.02667423337697983	Total	2025-07-11 10:44:16.405	2025-07-11 10:44:16.405	Total	\N
game_005_demographics_country_Serbia	game_005	demographics_country	2025-07-11 10:44:16.393	37	Serbia	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Myanmar	game_005	demographics_country	2025-07-11 10:44:16.393	26	Myanmar	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Panama	game_005	demographics_country	2025-07-11 10:44:16.393	21	Panama	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Nepal	game_005	demographics_country	2025-07-11 10:44:16.393	14	Nepal	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Cyprus	game_005	demographics_country	2025-07-11 10:44:16.393	7	Cyprus	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_monthly_active_users_by_day_Total_2025-06-12T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-12 00:00:00	18043	Total	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Total_2025-06-22T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-22 00:00:00	17006	Total	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Total_2025-07-01T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-07-01 00:00:00	15341	Total	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Total_2025-07-09T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-07-09 00:00:00	24516	Total	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-19T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-19 00:00:00	109938	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-29T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-29 00:00:00	121518	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-07-08T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-07-08 00:00:00	127811	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_average_session_length_minutes_Total_2025-06-20T00:00:00.000Z	game_005	average_session_length_minutes	2025-06-20 00:00:00	6.269298076629639	Total	2025-07-11 10:44:16.397	2025-07-11 10:44:16.397	Total	\N
game_005_average_session_length_minutes_Total_2025-06-28T00:00:00.000Z	game_005	average_session_length_minutes	2025-06-28 00:00:00	6.197031497955322	Total	2025-07-11 10:44:16.397	2025-07-11 10:44:16.397	Total	\N
game_005_average_session_length_minutes_Total_2025-07-07T00:00:00.000Z	game_005	average_session_length_minutes	2025-07-07 00:00:00	9.997283935546875	Total	2025-07-11 10:44:16.397	2025-07-11 10:44:16.397	Total	\N
game_005_average_play_time_minutes_Total_2025-06-18T00:00:00.000Z	game_005	average_play_time_minutes	2025-06-18 00:00:00	7.176111221313477	Total	2025-07-11 10:44:16.398	2025-07-11 10:44:16.398	Total	\N
game_005_average_play_time_minutes_Total_2025-06-27T00:00:00.000Z	game_005	average_play_time_minutes	2025-06-27 00:00:00	8.818431854248047	Total	2025-07-11 10:44:16.398	2025-07-11 10:44:16.398	Total	\N
game_005_average_play_time_minutes_Total_2025-07-06T00:00:00.000Z	game_005	average_play_time_minutes	2025-07-06 00:00:00	10.53421211242676	Total	2025-07-11 10:44:16.398	2025-07-11 10:44:16.398	Total	\N
game_005_daily_active_users_Total_2025-06-18T00:00:00.000Z	game_005	daily_active_users	2025-06-18 00:00:00	390	Total	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Total_2025-06-26T00:00:00.000Z	game_005	daily_active_users	2025-06-26 00:00:00	448	Total	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Total_2025-07-05T00:00:00.000Z	game_005	daily_active_users	2025-07-05 00:00:00	1488	Total	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-16T00:00:00.000Z	game_005	daily_active_users	2025-06-16 00:00:00	4476	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-25T00:00:00.000Z	game_005	daily_active_users	2025-06-25 00:00:00	5123	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Benchmark (Top 10,000 experience)_2025-07-04T00:00:00.000Z	game_005	daily_active_users	2025-07-04 00:00:00	5333	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_d7_stickiness_Total_2025-06-15T00:00:00.000Z	game_005	d7_stickiness	2025-06-15 00:00:00	0	Total	2025-07-11 10:44:16.401	2025-07-11 10:44:16.401	Total	\N
game_005_d7_stickiness_Total_2025-06-24T00:00:00.000Z	game_005	d7_stickiness	2025-06-24 00:00:00	0.002512562787160277	Total	2025-07-11 10:44:16.401	2025-07-11 10:44:16.401	Total	\N
game_005_d7_stickiness_Total_2025-07-03T00:00:00.000Z	game_005	d7_stickiness	2025-07-03 00:00:00	0	Total	2025-07-11 10:44:16.401	2025-07-11 10:44:16.401	Total	\N
game_005_d1_stickiness_Total_2025-06-15T00:00:00.000Z	game_005	d1_stickiness	2025-06-15 00:00:00	0.01676829345524311	Total	2025-07-11 10:44:16.402	2025-07-11 10:44:16.402	Total	\N
game_005_d1_stickiness_Total_2025-06-24T00:00:00.000Z	game_005	d1_stickiness	2025-06-24 00:00:00	0.0452127642929554	Total	2025-07-11 10:44:16.402	2025-07-11 10:44:16.402	Total	\N
game_005_d1_stickiness_Total_2025-07-03T00:00:00.000Z	game_005	d1_stickiness	2025-07-03 00:00:00	0.02696871571242809	Total	2025-07-11 10:44:16.402	2025-07-11 10:44:16.402	Total	\N
game_005_d7_retention_Total_2025-06-12T00:00:00.000Z	game_005	d7_retention	2025-06-12 00:00:00	0.003558718832209706	Total	2025-07-11 10:44:16.404	2025-07-11 10:44:16.404	Total	\N
game_005_d7_retention_Total_2025-06-23T00:00:00.000Z	game_005	d7_retention	2025-06-23 00:00:00	0	Total	2025-07-11 10:44:16.404	2025-07-11 10:44:16.404	Total	\N
game_005_d7_retention_Total_2025-07-01T00:00:00.000Z	game_005	d7_retention	2025-07-01 00:00:00	0	Total	2025-07-11 10:44:16.404	2025-07-11 10:44:16.404	Total	\N
game_005_d7_retention_Total_2025-07-09T00:00:00.000Z	game_005	d7_retention	2025-07-09 00:00:00	0.002406738931313157	Total	2025-07-11 10:44:16.404	2025-07-11 10:44:16.404	Total	\N
game_005_d1_retention_Total_2025-06-20T00:00:00.000Z	game_005	d1_retention	2025-06-20 00:00:00	0.01269035506993532	Total	2025-07-11 10:44:16.405	2025-07-11 10:44:16.405	Total	\N
game_005_d1_retention_Total_2025-06-29T00:00:00.000Z	game_005	d1_retention	2025-06-29 00:00:00	0.02427184395492077	Total	2025-07-11 10:44:16.405	2025-07-11 10:44:16.405	Total	\N
game_005_d1_retention_Total_2025-07-08T00:00:00.000Z	game_005	d1_retention	2025-07-08 00:00:00	0.03170028701424599	Total	2025-07-11 10:44:16.405	2025-07-11 10:44:16.405	Total	\N
game_005_demographics_country_Moldova	game_005	demographics_country	2025-07-11 10:44:16.393	31	Moldova	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Latvia	game_005	demographics_country	2025-07-11 10:44:16.393	25	Latvia	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Bosnia and Herzegovina	game_005	demographics_country	2025-07-11 10:44:16.393	17	Bosnia and Herzegovina	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Laos	game_005	demographics_country	2025-07-11 10:44:16.393	13	Laos	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Virgin Islands (US)	game_005	demographics_country	2025-07-11 10:44:16.393	3	Virgin Islands (US)	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_monthly_active_users_by_day_Total_2025-06-15T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-15 00:00:00	17983	Total	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Total_2025-06-26T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-26 00:00:00	16027	Total	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Total_2025-07-02T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-07-02 00:00:00	15719	Total	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-14T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-14 00:00:00	107533	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-23T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-23 00:00:00	113803	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-07-02T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-07-02 00:00:00	122652	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_average_session_length_minutes_Total_2025-06-12T00:00:00.000Z	game_005	average_session_length_minutes	2025-06-12 00:00:00	6.146860599517822	Total	2025-07-11 10:44:16.397	2025-07-11 10:44:16.397	Total	\N
game_005_average_session_length_minutes_Total_2025-06-21T00:00:00.000Z	game_005	average_session_length_minutes	2025-06-21 00:00:00	6.231005668640137	Total	2025-07-11 10:44:16.397	2025-07-11 10:44:16.397	Total	\N
game_005_average_session_length_minutes_Total_2025-06-30T00:00:00.000Z	game_005	average_session_length_minutes	2025-06-30 00:00:00	7.567549228668213	Total	2025-07-11 10:44:16.397	2025-07-11 10:44:16.397	Total	\N
game_005_average_play_time_minutes_Total_2025-06-13T00:00:00.000Z	game_005	average_play_time_minutes	2025-06-13 00:00:00	7.521046161651611	Total	2025-07-11 10:44:16.398	2025-07-11 10:44:16.398	Total	\N
game_005_average_play_time_minutes_Total_2025-06-20T00:00:00.000Z	game_005	average_play_time_minutes	2025-06-20 00:00:00	7.572208404541016	Total	2025-07-11 10:44:16.398	2025-07-11 10:44:16.398	Total	\N
game_005_average_play_time_minutes_Total_2025-06-30T00:00:00.000Z	game_005	average_play_time_minutes	2025-06-30 00:00:00	9.310379028320312	Total	2025-07-11 10:44:16.398	2025-07-11 10:44:16.398	Total	\N
game_005_average_play_time_minutes_Total_2025-07-09T00:00:00.000Z	game_005	average_play_time_minutes	2025-07-09 00:00:00	10.56297969818115	Total	2025-07-11 10:44:16.398	2025-07-11 10:44:16.398	Total	\N
game_005_daily_active_users_Total_2025-06-20T00:00:00.000Z	game_005	daily_active_users	2025-06-20 00:00:00	409	Total	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Total_2025-06-28T00:00:00.000Z	game_005	daily_active_users	2025-06-28 00:00:00	444	Total	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Total_2025-07-08T00:00:00.000Z	game_005	daily_active_users	2025-07-08 00:00:00	2473	Total	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-19T00:00:00.000Z	game_005	daily_active_users	2025-06-19 00:00:00	4891	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-26T00:00:00.000Z	game_005	daily_active_users	2025-06-26 00:00:00	5111	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Benchmark (Top 10,000 experience)_2025-07-07T00:00:00.000Z	game_005	daily_active_users	2025-07-07 00:00:00	5600	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_d7_stickiness_Total_2025-06-18T00:00:00.000Z	game_005	d7_stickiness	2025-06-18 00:00:00	0	Total	2025-07-11 10:44:16.401	2025-07-11 10:44:16.401	Total	\N
game_005_d7_stickiness_Total_2025-06-27T00:00:00.000Z	game_005	d7_stickiness	2025-06-27 00:00:00	0	Total	2025-07-11 10:44:16.401	2025-07-11 10:44:16.401	Total	\N
game_005_d7_stickiness_Total_2025-07-06T00:00:00.000Z	game_005	d7_stickiness	2025-07-06 00:00:00	0.003802281338721514	Total	2025-07-11 10:44:16.401	2025-07-11 10:44:16.401	Total	\N
game_005_d1_stickiness_Total_2025-06-17T00:00:00.000Z	game_005	d1_stickiness	2025-06-17 00:00:00	0.03554502502083778	Total	2025-07-11 10:44:16.402	2025-07-11 10:44:16.402	Total	\N
game_005_d1_stickiness_Total_2025-06-26T00:00:00.000Z	game_005	d1_stickiness	2025-06-26 00:00:00	0.02369668334722519	Total	2025-07-11 10:44:16.402	2025-07-11 10:44:16.402	Total	\N
game_005_d1_stickiness_Total_2025-07-05T00:00:00.000Z	game_005	d1_stickiness	2025-07-05 00:00:00	0.03850385174155235	Total	2025-07-11 10:44:16.402	2025-07-11 10:44:16.402	Total	\N
game_005_d7_retention_Total_2025-06-16T00:00:00.000Z	game_005	d7_retention	2025-06-16 00:00:00	0.00220264308154583	Total	2025-07-11 10:44:16.404	2025-07-11 10:44:16.404	Total	\N
game_005_d7_retention_Total_2025-06-25T00:00:00.000Z	game_005	d7_retention	2025-06-25 00:00:00	0	Total	2025-07-11 10:44:16.404	2025-07-11 10:44:16.404	Total	\N
game_005_d7_retention_Total_2025-07-04T00:00:00.000Z	game_005	d7_retention	2025-07-04 00:00:00	0	Total	2025-07-11 10:44:16.404	2025-07-11 10:44:16.404	Total	\N
game_005_d1_retention_Total_2025-06-16T00:00:00.000Z	game_005	d1_retention	2025-06-16 00:00:00	0.0191846527159214	Total	2025-07-11 10:44:16.405	2025-07-11 10:44:16.405	Total	\N
game_005_d1_retention_Total_2025-06-24T00:00:00.000Z	game_005	d1_retention	2025-06-24 00:00:00	0.04437869787216187	Total	2025-07-11 10:44:16.405	2025-07-11 10:44:16.405	Total	\N
game_005_d1_retention_Total_2025-07-03T00:00:00.000Z	game_005	d1_retention	2025-07-03 00:00:00	0.02527075819671154	Total	2025-07-11 10:44:16.405	2025-07-11 10:44:16.405	Total	\N
game_005_demographics_country_Paraguay	game_005	demographics_country	2025-07-11 10:44:16.393	18	Paraguay	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Kenya	game_005	demographics_country	2025-07-11 10:44:16.393	10	Kenya	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Belize	game_005	demographics_country	2025-07-11 10:44:16.393	6	Belize	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_monthly_active_users_by_day_Total_2025-06-14T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-14 00:00:00	18174	Total	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Total_2025-06-23T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-23 00:00:00	16629	Total	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Total_2025-07-04T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-07-04 00:00:00	15990	Total	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-13T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-13 00:00:00	105314	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-22T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-22 00:00:00	114296	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-30T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-30 00:00:00	121900	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_average_session_length_minutes_Total_2025-06-13T00:00:00.000Z	game_005	average_session_length_minutes	2025-06-13 00:00:00	6.297601699829102	Total	2025-07-11 10:44:16.397	2025-07-11 10:44:16.397	Total	\N
game_005_average_session_length_minutes_Total_2025-06-22T00:00:00.000Z	game_005	average_session_length_minutes	2025-06-22 00:00:00	7.56123685836792	Total	2025-07-11 10:44:16.397	2025-07-11 10:44:16.397	Total	\N
game_005_average_session_length_minutes_Total_2025-06-29T00:00:00.000Z	game_005	average_session_length_minutes	2025-06-29 00:00:00	6.711361408233643	Total	2025-07-11 10:44:16.397	2025-07-11 10:44:16.397	Total	\N
game_005_average_session_length_minutes_Total_2025-07-09T00:00:00.000Z	game_005	average_session_length_minutes	2025-07-09 00:00:00	8.838688850402832	Total	2025-07-11 10:44:16.397	2025-07-11 10:44:16.397	Total	\N
game_005_average_play_time_minutes_Total_2025-06-19T00:00:00.000Z	game_005	average_play_time_minutes	2025-06-19 00:00:00	7.731662750244141	Total	2025-07-11 10:44:16.398	2025-07-11 10:44:16.398	Total	\N
game_005_average_play_time_minutes_Total_2025-06-28T00:00:00.000Z	game_005	average_play_time_minutes	2025-06-28 00:00:00	7.52297306060791	Total	2025-07-11 10:44:16.398	2025-07-11 10:44:16.398	Total	\N
game_005_average_play_time_minutes_Total_2025-07-07T00:00:00.000Z	game_005	average_play_time_minutes	2025-07-07 00:00:00	11.89698505401611	Total	2025-07-11 10:44:16.398	2025-07-11 10:44:16.398	Total	\N
game_005_daily_active_users_Total_2025-06-19T00:00:00.000Z	game_005	daily_active_users	2025-06-19 00:00:00	419	Total	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Total_2025-06-29T00:00:00.000Z	game_005	daily_active_users	2025-06-29 00:00:00	526	Total	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Total_2025-07-07T00:00:00.000Z	game_005	daily_active_users	2025-07-07 00:00:00	2305	Total	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-18T00:00:00.000Z	game_005	daily_active_users	2025-06-18 00:00:00	4605	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-28T00:00:00.000Z	game_005	daily_active_users	2025-06-28 00:00:00	6477	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Benchmark (Top 10,000 experience)_2025-07-05T00:00:00.000Z	game_005	daily_active_users	2025-07-05 00:00:00	5609	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_d7_stickiness_Total_2025-06-17T00:00:00.000Z	game_005	d7_stickiness	2025-06-17 00:00:00	0	Total	2025-07-11 10:44:16.401	2025-07-11 10:44:16.401	Total	\N
game_005_d7_stickiness_Total_2025-06-26T00:00:00.000Z	game_005	d7_stickiness	2025-06-26 00:00:00	0	Total	2025-07-11 10:44:16.401	2025-07-11 10:44:16.401	Total	\N
game_005_d7_stickiness_Total_2025-07-04T00:00:00.000Z	game_005	d7_stickiness	2025-07-04 00:00:00	0.002118644071742892	Total	2025-07-11 10:44:16.401	2025-07-11 10:44:16.401	Total	\N
game_005_d1_stickiness_Total_2025-06-14T00:00:00.000Z	game_005	d1_stickiness	2025-06-14 00:00:00	0.02615193091332912	Total	2025-07-11 10:44:16.402	2025-07-11 10:44:16.402	Total	\N
game_005_d1_stickiness_Total_2025-06-25T00:00:00.000Z	game_005	d1_stickiness	2025-06-25 00:00:00	0.02262443490326405	Total	2025-07-11 10:44:16.402	2025-07-11 10:44:16.402	Total	\N
game_005_d1_stickiness_Total_2025-07-02T00:00:00.000Z	game_005	d1_stickiness	2025-07-02 00:00:00	0.0279146134853363	Total	2025-07-11 10:44:16.402	2025-07-11 10:44:16.402	Total	\N
game_005_d7_retention_Total_2025-06-14T00:00:00.000Z	game_005	d7_retention	2025-06-14 00:00:00	0.001683501643128693	Total	2025-07-11 10:44:16.404	2025-07-11 10:44:16.404	Total	\N
game_005_d7_retention_Total_2025-06-22T00:00:00.000Z	game_005	d7_retention	2025-06-22 00:00:00	0	Total	2025-07-11 10:44:16.404	2025-07-11 10:44:16.404	Total	\N
game_005_d7_retention_Total_2025-07-02T00:00:00.000Z	game_005	d7_retention	2025-07-02 00:00:00	0	Total	2025-07-11 10:44:16.404	2025-07-11 10:44:16.404	Total	\N
game_005_d1_retention_Total_2025-06-13T00:00:00.000Z	game_005	d1_retention	2025-06-13 00:00:00	0.02255639061331749	Total	2025-07-11 10:44:16.405	2025-07-11 10:44:16.405	Total	\N
game_005_d1_retention_Total_2025-06-23T00:00:00.000Z	game_005	d1_retention	2025-06-23 00:00:00	0.04456824436783791	Total	2025-07-11 10:44:16.405	2025-07-11 10:44:16.405	Total	\N
game_005_d1_retention_Total_2025-07-01T00:00:00.000Z	game_005	d1_retention	2025-07-01 00:00:00	0.03150912001729012	Total	2025-07-11 10:44:16.405	2025-07-11 10:44:16.405	Total	\N
game_005_demographics_country_Brunei Darussalam	game_005	demographics_country	2025-07-11 10:44:16.393	16	Brunei Darussalam	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Reunion	game_005	demographics_country	2025-07-11 10:44:16.393	8	Reunion	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_demographics_country_Angola	game_005	demographics_country	2025-07-11 10:44:16.393	4	Angola	2025-07-11 10:44:16.393	2025-07-11 10:44:16.393	Total	\N
game_005_monthly_active_users_by_day_Total_2025-06-19T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-19 00:00:00	17696	Total	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Total_2025-06-28T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-28 00:00:00	15561	Total	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Total_2025-06-20T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-20 00:00:00	17437	Total	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-18T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-18 00:00:00	109063	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-26T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-06-26 00:00:00	115601	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-07-05T00:00:00.000Z	game_005	monthly_active_users_by_day	2025-07-05 00:00:00	126032	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.396	2025-07-11 10:44:16.396	Total	\N
game_005_average_session_length_minutes_Total_2025-06-15T00:00:00.000Z	game_005	average_session_length_minutes	2025-06-15 00:00:00	5.844844818115234	Total	2025-07-11 10:44:16.397	2025-07-11 10:44:16.397	Total	\N
game_005_average_session_length_minutes_Total_2025-06-27T00:00:00.000Z	game_005	average_session_length_minutes	2025-06-27 00:00:00	7.31511402130127	Total	2025-07-11 10:44:16.397	2025-07-11 10:44:16.397	Total	\N
game_005_average_session_length_minutes_Total_2025-07-04T00:00:00.000Z	game_005	average_session_length_minutes	2025-07-04 00:00:00	8.57078742980957	Total	2025-07-11 10:44:16.397	2025-07-11 10:44:16.397	Total	\N
game_005_average_play_time_minutes_Total_2025-06-15T00:00:00.000Z	game_005	average_play_time_minutes	2025-06-15 00:00:00	6.906352996826172	Total	2025-07-11 10:44:16.398	2025-07-11 10:44:16.398	Total	\N
game_005_average_play_time_minutes_Total_2025-06-25T00:00:00.000Z	game_005	average_play_time_minutes	2025-06-25 00:00:00	6.925039291381836	Total	2025-07-11 10:44:16.398	2025-07-11 10:44:16.398	Total	\N
game_005_average_play_time_minutes_Total_2025-07-03T00:00:00.000Z	game_005	average_play_time_minutes	2025-07-03 00:00:00	9.028396606445312	Total	2025-07-11 10:44:16.398	2025-07-11 10:44:16.398	Total	\N
game_005_daily_active_users_Total_2025-06-14T00:00:00.000Z	game_005	daily_active_users	2025-06-14 00:00:00	656	Total	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Total_2025-06-24T00:00:00.000Z	game_005	daily_active_users	2025-06-24 00:00:00	442	Total	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Total_2025-07-01T00:00:00.000Z	game_005	daily_active_users	2025-07-01 00:00:00	609	Total	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-12T00:00:00.000Z	game_005	daily_active_users	2025-06-12 00:00:00	4243	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-23T00:00:00.000Z	game_005	daily_active_users	2025-06-23 00:00:00	5030	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_daily_active_users_Benchmark (Top 10,000 experience)_2025-07-01T00:00:00.000Z	game_005	daily_active_users	2025-07-01 00:00:00	5475	Benchmark (Top 10,000 experience)	2025-07-11 10:44:16.4	2025-07-11 10:44:16.4	Total	\N
game_005_d7_stickiness_Total_2025-06-12T00:00:00.000Z	game_005	d7_stickiness	2025-06-12 00:00:00	0.004878048785030842	Total	2025-07-11 10:44:16.401	2025-07-11 10:44:16.401	Total	\N
game_005_d7_stickiness_Total_2025-06-22T00:00:00.000Z	game_005	d7_stickiness	2025-06-22 00:00:00	0	Total	2025-07-11 10:44:16.401	2025-07-11 10:44:16.401	Total	\N
game_005_d7_stickiness_Total_2025-06-29T00:00:00.000Z	game_005	d7_stickiness	2025-06-29 00:00:00	0.002659574383869767	Total	2025-07-11 10:44:16.401	2025-07-11 10:44:16.401	Total	\N
game_005_d7_stickiness_Total_2025-07-07T00:00:00.000Z	game_005	d7_stickiness	2025-07-07 00:00:00	0.003030302934348583	Total	2025-07-11 10:44:16.401	2025-07-11 10:44:16.401	Total	\N
game_005_d1_stickiness_Total_2025-06-19T00:00:00.000Z	game_005	d1_stickiness	2025-06-19 00:00:00	0.02307692356407642	Total	2025-07-11 10:44:16.402	2025-07-11 10:44:16.402	Total	\N
game_005_d1_stickiness_Total_2025-06-30T00:00:00.000Z	game_005	d1_stickiness	2025-06-30 00:00:00	0.028517110273242	Total	2025-07-11 10:44:16.402	2025-07-11 10:44:16.402	Total	\N
game_005_d1_stickiness_Total_2025-07-09T00:00:00.000Z	game_005	d1_stickiness	2025-07-09 00:00:00	0.02507076412439346	Total	2025-07-11 10:44:16.402	2025-07-11 10:44:16.402	Total	\N
game_005_d7_retention_Total_2025-06-19T00:00:00.000Z	game_005	d7_retention	2025-06-19 00:00:00	0	Total	2025-07-11 10:44:16.404	2025-07-11 10:44:16.404	Total	\N
game_005_d7_retention_Total_2025-06-29T00:00:00.000Z	game_005	d7_retention	2025-06-29 00:00:00	0.002785515272989869	Total	2025-07-11 10:44:16.404	2025-07-11 10:44:16.404	Total	\N
game_005_d1_retention_Total_2025-06-12T00:00:00.000Z	game_005	d1_retention	2025-06-12 00:00:00	0.03746397793292999	Total	2025-07-11 10:44:16.405	2025-07-11 10:44:16.405	Total	\N
game_005_d1_retention_Total_2025-06-21T00:00:00.000Z	game_005	d1_retention	2025-06-21 00:00:00	0.04177545756101608	Total	2025-07-11 10:44:16.405	2025-07-11 10:44:16.405	Total	\N
game_005_d1_retention_Total_2025-06-30T00:00:00.000Z	game_005	d1_retention	2025-06-30 00:00:00	0.02845528535544872	Total	2025-07-11 10:44:16.405	2025-07-11 10:44:16.405	Total	\N
game_005_d1_retention_Total_2025-07-09T00:00:00.000Z	game_005	d1_retention	2025-07-09 00:00:00	0.02349751442670822	Total	2025-07-11 10:44:16.405	2025-07-11 10:44:16.405	Total	\N
game_005_d1_retention_Total_2025-07-02T00:00:00.000Z	game_005	d1_retention	2025-07-02 00:00:00	0.02683363109827042	Total	2025-07-11 10:44:16.405	2025-07-11 10:44:16.405	Total	\N
game_006_demographics_country_Venezuela	game_006	demographics_country	2025-07-11 08:12:14.681	76	Venezuela	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Greece	game_006	demographics_country	2025-07-11 08:12:14.681	58	Greece	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Bulgaria	game_006	demographics_country	2025-07-11 08:12:14.681	45	Bulgaria	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Moldova	game_006	demographics_country	2025-07-11 08:12:14.681	31	Moldova	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Estonia	game_006	demographics_country	2025-07-11 08:12:14.681	25	Estonia	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Paraguay	game_006	demographics_country	2025-07-11 08:12:14.681	18	Paraguay	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Kenya	game_006	demographics_country	2025-07-11 08:12:14.681	10	Kenya	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Belize	game_006	demographics_country	2025-07-11 08:12:14.681	6	Belize	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_demographics_country_Curaçao	game_006	demographics_country	2025-07-11 08:12:14.681	2	Curaçao	2025-07-11 08:12:14.681	2025-07-11 08:12:14.681	Total	\N
game_006_monthly_active_users_by_day_Total_2025-06-21T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-21 00:00:00	17269	Total	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Total_2025-07-02T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-07-02 00:00:00	15719	Total	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-14T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-14 00:00:00	107533	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-06-23T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-06-23 00:00:00	113803	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_monthly_active_users_by_day_Benchmark (Top 10,000 experience)_2025-07-01T00:00:00.000Z	game_006	monthly_active_users_by_day	2025-07-01 00:00:00	122167	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.686	2025-07-11 08:12:14.686	Total	\N
game_006_average_session_length_minutes_Total_2025-06-13T00:00:00.000Z	game_006	average_session_length_minutes	2025-06-13 00:00:00	6.297601699829102	Total	2025-07-11 08:12:14.689	2025-07-11 08:12:14.689	Total	\N
game_006_average_session_length_minutes_Total_2025-06-21T00:00:00.000Z	game_006	average_session_length_minutes	2025-06-21 00:00:00	6.231005668640137	Total	2025-07-11 08:12:14.689	2025-07-11 08:12:14.689	Total	\N
game_006_average_session_length_minutes_Total_2025-06-30T00:00:00.000Z	game_006	average_session_length_minutes	2025-06-30 00:00:00	7.567549228668213	Total	2025-07-11 08:12:14.689	2025-07-11 08:12:14.689	Total	\N
game_006_average_session_length_minutes_Total_2025-07-09T00:00:00.000Z	game_006	average_session_length_minutes	2025-07-09 00:00:00	8.838688850402832	Total	2025-07-11 08:12:14.689	2025-07-11 08:12:14.689	Total	\N
game_006_average_play_time_minutes_Total_2025-06-21T00:00:00.000Z	game_006	average_play_time_minutes	2025-06-21 00:00:00	7.330595016479492	Total	2025-07-11 08:12:14.691	2025-07-11 08:12:14.691	Total	\N
game_006_average_play_time_minutes_Total_2025-06-29T00:00:00.000Z	game_006	average_play_time_minutes	2025-06-29 00:00:00	7.936248302459717	Total	2025-07-11 08:12:14.691	2025-07-11 08:12:14.691	Total	\N
game_006_average_play_time_minutes_Total_2025-07-08T00:00:00.000Z	game_006	average_play_time_minutes	2025-07-08 00:00:00	10.84660339355469	Total	2025-07-11 08:12:14.691	2025-07-11 08:12:14.691	Total	\N
game_006_daily_active_users_Total_2025-06-18T00:00:00.000Z	game_006	daily_active_users	2025-06-18 00:00:00	390	Total	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Total_2025-06-27T00:00:00.000Z	game_006	daily_active_users	2025-06-27 00:00:00	472	Total	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Total_2025-07-09T00:00:00.000Z	game_006	daily_active_users	2025-07-09 00:00:00	1953	Total	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-19T00:00:00.000Z	game_006	daily_active_users	2025-06-19 00:00:00	4891	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Benchmark (Top 10,000 experience)_2025-06-28T00:00:00.000Z	game_006	daily_active_users	2025-06-28 00:00:00	6477	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_daily_active_users_Benchmark (Top 10,000 experience)_2025-07-07T00:00:00.000Z	game_006	daily_active_users	2025-07-07 00:00:00	5600	Benchmark (Top 10,000 experience)	2025-07-11 08:12:14.694	2025-07-11 08:12:14.694	Total	\N
game_006_d7_stickiness_Total_2025-06-17T00:00:00.000Z	game_006	d7_stickiness	2025-06-17 00:00:00	0	Total	2025-07-11 08:12:14.696	2025-07-11 08:12:14.696	Total	\N
game_006_d7_stickiness_Total_2025-06-26T00:00:00.000Z	game_006	d7_stickiness	2025-06-26 00:00:00	0	Total	2025-07-11 08:12:14.696	2025-07-11 08:12:14.696	Total	\N
game_006_d7_stickiness_Total_2025-07-03T00:00:00.000Z	game_006	d7_stickiness	2025-07-03 00:00:00	0	Total	2025-07-11 08:12:14.696	2025-07-11 08:12:14.696	Total	\N
game_006_d1_stickiness_Total_2025-06-13T00:00:00.000Z	game_006	d1_stickiness	2025-06-13 00:00:00	0.029216468334198	Total	2025-07-11 08:12:14.699	2025-07-11 08:12:14.699	Total	\N
game_006_d1_stickiness_Total_2025-06-23T00:00:00.000Z	game_006	d1_stickiness	2025-06-23 00:00:00	0.04255319014191628	Total	2025-07-11 08:12:14.699	2025-07-11 08:12:14.699	Total	\N
game_006_d1_stickiness_Total_2025-07-02T00:00:00.000Z	game_006	d1_stickiness	2025-07-02 00:00:00	0.0279146134853363	Total	2025-07-11 08:12:14.699	2025-07-11 08:12:14.699	Total	\N
game_006_d1_stickiness_Total_2025-07-08T00:00:00.000Z	game_006	d1_stickiness	2025-07-08 00:00:00	0.03297179937362671	Total	2025-07-11 08:12:14.699	2025-07-11 08:12:14.699	Total	\N
game_006_d7_retention_Total_2025-06-21T00:00:00.000Z	game_006	d7_retention	2025-06-21 00:00:00	0.001642036135308444	Total	2025-07-11 08:12:14.7	2025-07-11 08:12:14.7	Total	\N
game_006_d7_retention_Total_2025-06-28T00:00:00.000Z	game_006	d7_retention	2025-06-28 00:00:00	0	Total	2025-07-11 08:12:14.7	2025-07-11 08:12:14.7	Total	\N
game_006_d1_retention_Total_2025-06-12T00:00:00.000Z	game_006	d1_retention	2025-06-12 00:00:00	0.03746397793292999	Total	2025-07-11 08:12:14.701	2025-07-11 08:12:14.701	Total	\N
game_006_d1_retention_Total_2025-06-22T00:00:00.000Z	game_006	d1_retention	2025-06-22 00:00:00	0.01746724918484688	Total	2025-07-11 08:12:14.701	2025-07-11 08:12:14.701	Total	\N
game_006_d1_retention_Total_2025-07-01T00:00:00.000Z	game_006	d1_retention	2025-07-01 00:00:00	0.03150912001729012	Total	2025-07-11 08:12:14.701	2025-07-11 08:12:14.701	Total	\N
game_006_d1_retention_Total_2025-06-28T00:00:00.000Z	game_006	d1_retention	2025-06-28 00:00:00	0.02654867246747017	Total	2025-07-11 08:12:14.701	2025-07-11 08:12:14.701	Total	\N
\.


--
-- Data for Name: GameOwner; Type: TABLE DATA; Schema: public; Owner: ngp_user
--

COPY public."GameOwner" (id, email, name, password, "createdAt", "updatedAt") FROM stdin;
9be282ab-42b0-4e1d-a9fa-c8facfea9470	info@metamindinglab.com	Ardy Lee	$2b$10$40q4MFcQgl5RtvywSfyIAeMcjp6O5s51jMMJRB83x0.YbPZR2Gkje	2025-06-25 16:31:54.663	2025-07-01 13:18:51.36
9d8257c5-b7ef-437d-95cc-e4cb8cb0201a	contact@dreamcraftstudios.com	DreamCraft Studios	$2b$10$mXRlGdYhiF3LJFU8vUtQk.KOzi3SY3gPCaljlc.34uiF.S1ah5GYi	2025-06-26 02:13:56.658	2025-06-26 02:13:56.658
dd698dec-8b90-4dd3-86b4-cd7d3d12f675	support@gamerrobot.com	Gamer Robot Inc	$2b$10$mf1I4SEfSfleCEjkvcaX7./hZPGOBMu0LjOrdSIrMX3QiK5/0XOlu	2025-06-26 02:13:56.746	2025-06-26 02:13:56.746
5c95f626-dc17-42db-b2f8-18ca07ec03dc	contact@stylisstudios.com	StyLiS Studios	$2b$10$JMeRtL./9uim8WRhPOrCdOkxAicXvZ746kvZAFA.EwDl/16F9kHW6	2025-06-26 02:13:56.833	2025-06-26 02:13:56.833
3e3829e3-a41b-40de-ab4c-85f71515c73e	info@paradoxstudios.net	ParadoxStudios	$2b$10$6AqZ6kZscqnM.zbtRidZPeCmKMs/EZRGgNJpxLs.uCpfgkZwVMaf.	2025-06-26 02:13:56.92	2025-06-26 02:13:56.92
\.


--
-- Data for Name: Playlist; Type: TABLE DATA; Schema: public; Owner: ngp_user
--

COPY public."Playlist" (id, name, description, type, "createdBy", metadata, "createdAt", "updatedAt") FROM stdin;
16238ece-2195-4699-8d05-b5d374543113	Amnesty International		standard	\N	{}	2025-07-07 18:00:45.604	2025-07-07 19:00:10.719
\.


--
-- Data for Name: PlaylistSchedule; Type: TABLE DATA; Schema: public; Owner: ngp_user
--

COPY public."PlaylistSchedule" (id, "playlistId", "gameAdId", "startDate", duration, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: RemovableAsset; Type: TABLE DATA; Schema: public; Owner: ngp_user
--

COPY public."RemovableAsset" (id, "robloxAssetId", name, "replacedBy", reason, "dateMarkedRemovable", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: _AssetPlaylists; Type: TABLE DATA; Schema: public; Owner: ngp_user
--

COPY public."_AssetPlaylists" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _GameAssets; Type: TABLE DATA; Schema: public; Owner: ngp_user
--

COPY public."_GameAssets" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _GamePlaylists; Type: TABLE DATA; Schema: public; Owner: ngp_user
--

COPY public."_GamePlaylists" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _GameToAds; Type: TABLE DATA; Schema: public; Owner: ngp_user
--

COPY public."_GameToAds" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: ngp_user
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
93a76825-d81f-42af-b1ae-734cc2ba2492	f7d089a87f6b81365f226386fa1a70dda47fce6d5b562c07272c387f2087e237	2025-07-07 15:05:50.201293+00	20250623172936_init	\N	\N	2025-07-07 15:05:50.035513+00	1
100ee76e-6d27-40ad-b63f-5161c7cc1d35	196d203c20b2cd24663a9199a07d0e7f740bf29d972b4b1a8881a4b93b419f96	2025-07-07 15:05:50.540456+00	20250629000000_add_missing_game_media_columns	\N	\N	2025-07-07 15:05:50.529063+00	1
421d49b4-7906-4a5d-aad0-5e4daeb39148	97494e69548276e0dd6fb15f136a9bb2afabcb5206e0b071abc3251bb1658dc7	2025-07-07 15:05:50.242748+00	20250623175219_add_game_ad_performance_and_removable_assets	\N	\N	2025-07-07 15:05:50.204558+00	1
4b3e872d-7cf1-4d27-ab57-aee3a422867b	10ba950f7d540f97a7f033bad16c3e7e517903936320435a3e6f934e785ac0ea	2025-07-07 15:05:50.25708+00	20250623175511_make_json_fields_optional	\N	\N	2025-07-07 15:05:50.24659+00	1
970ba338-08ba-4d86-8806-3a6b470d3212	1ae061c33ccaa9b6f216f31da6de27ceb9704e5cb3b215226d6560b896df6538	2025-07-07 15:05:50.270627+00	20250623175603_make_more_fields_optional	\N	\N	2025-07-07 15:05:50.260204+00	1
3a14b852-7bd6-409f-bb59-4f880eaac6dc	763c1eefbd698e264055de54f386401a90c9e462dc98525cada3c082c2115f97	2025-07-07 15:05:50.589444+00	20250630000005_safe_schema_update	\N	\N	2025-07-07 15:05:50.544237+00	1
cda54333-db00-4824-969b-721d5376d3a6	c507441d6f7193a755d8c1d231620f24eecc327991c06ae2b2758eb8a0f7f324	2025-07-07 15:05:50.290361+00	20250624150730_add_assets_json_to_gamead	\N	\N	2025-07-07 15:05:50.276644+00	1
cc3028c7-fce5-480f-9258-51fd67d2687f	e11a46d284379a87e6bc1907c3711a2f90624252ba4dd8c7005b3cfb1a8cf53b	2025-07-07 15:05:50.309488+00	20250626021100_add_game_owner_id	\N	\N	2025-07-07 15:05:50.293582+00	1
0f84d3bb-94b3-4e12-96b3-288aa4e58214	7f55b25e35206f1e50ec3e2b9b3a9afc75ac37eb723ad656a79182ae18a0fd78	2025-07-07 15:05:50.332956+00	20250627000000_add_deletion_protection	\N	\N	2025-07-07 15:05:50.31987+00	1
1e10e89e-54e7-44ac-a34e-4f30a684b6e5	998ea1c4087af38ecdf82f60248c8ff0f565c014d2476ba360692db9e6a90a0f	\N	20250630000006_sync_schema	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20250630000006_sync_schema\n\nDatabase error code: 42P07\n\nDatabase error:\nERROR: relation "Asset" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P07), message: "relation \\"Asset\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("heap.c"), line: Some(1201), routine: Some("heap_create_with_catalog") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20250630000006_sync_schema"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20250630000006_sync_schema"\n             at schema-engine/commands/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:236	2025-07-12 05:46:25.018538+00	2025-07-07 15:05:50.59479+00	0
2b95d6d4-7c5b-46fc-aaf2-82eb7b2b1827	0d81032338dca54e1cda03fedc21f63ae1ae817bc2976d3778a4871e1b00725d	2025-07-07 15:05:50.376332+00	20250627000001_add_game_media	\N	\N	2025-07-07 15:05:50.336567+00	1
8f9e603a-8359-45a7-afc5-7c7e2162d8a7	998ea1c4087af38ecdf82f60248c8ff0f565c014d2476ba360692db9e6a90a0f	2025-07-12 05:46:25.023174+00	20250630000006_sync_schema		\N	2025-07-12 05:46:25.023174+00	0
b7873f63-6656-4b58-8046-5f0ba06d4727	b5bf2ff6a8df782a0c5b49f43faa7720628a98bc81d96245f1587817b6819147	2025-07-07 15:05:50.394089+00	20250627000002_add_game_media_and_protection	\N	\N	2025-07-07 15:05:50.379599+00	1
f247d147-1f56-4554-8532-0b5ac7607e84	7c1b7639b6d6f046f90942748be9fcf263d5363e6c250cb4ef44c93a5d7ed4ca	2025-07-07 15:05:50.407415+00	20250627000003_add_game_media_fields	\N	\N	2025-07-07 15:05:50.397484+00	1
22e67b17-ff57-4507-8a89-c98d7b5deed8	b9ed2f4093e91fa401d539910158e1bbca6ad0413e89efe1607765ca61589328	2025-07-07 15:05:50.462262+00	20250628000000_add_game_ad_container	\N	\N	2025-07-07 15:05:50.410782+00	1
0e1f7be0-a2d6-4176-893f-3684034cea82	1343b137751b541374794e5b45221134df39db79d9049f16f70b139c486dec3b	2025-07-07 15:05:50.502464+00	20250628000001_add_game_owner	\N	\N	2025-07-07 15:05:50.465395+00	1
5bcb2ac5-b805-4ee0-a2c4-f9efd52654a8	7e406efcf0fd6502bee6d3c070568ab09e47b6f80af56d2167b774095177238d	2025-07-07 15:05:50.525967+00	20250629000000_add_game_media_fields	\N	\N	2025-07-07 15:05:50.510308+00	1
d5f3ddb8-7181-4835-a14a-682339a12952	05c595bba564bcf9609624ccda133c85d26c8f8222df2f07f42f6d83374e7ef8	\N	20250630000007_add_game_metric_data	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20250630000007_add_game_metric_data\n\nDatabase error code: 42P07\n\nDatabase error:\nERROR: relation "GameMetricData" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P07), message: "relation \\"GameMetricData\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("heap.c"), line: Some(1201), routine: Some("heap_create_with_catalog") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20250630000007_add_game_metric_data"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20250630000007_add_game_metric_data"\n             at schema-engine/commands/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:236	2025-07-12 05:47:45.643744+00	2025-07-12 05:47:27.690051+00	0
6a84ee4f-3e75-46c3-af47-dc2acedf56df	05c595bba564bcf9609624ccda133c85d26c8f8222df2f07f42f6d83374e7ef8	2025-07-12 05:47:45.648709+00	20250630000007_add_game_metric_data		\N	2025-07-12 05:47:45.648709+00	0
c0a137b6-69fe-4889-8dc4-9fe47c1f216a	31f0b3d135a4d6d77ac984a89022e823df1587bc1ee5c6a069fe6313bb390bd7	\N	20250630000008_add_metric_fields	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20250630000008_add_metric_fields\n\nDatabase error code: 42710\n\nDatabase error:\nERROR: type "MetricType" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42710), message: "type \\"MetricType\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("typecmds.c"), line: Some(1170), routine: Some("DefineEnum") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20250630000008_add_metric_fields"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20250630000008_add_metric_fields"\n             at schema-engine/commands/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:236	2025-07-12 05:48:19.370264+00	2025-07-12 05:47:59.541471+00	0
09e930aa-3b1c-47af-a204-e0e5ca159218	31f0b3d135a4d6d77ac984a89022e823df1587bc1ee5c6a069fe6313bb390bd7	2025-07-12 05:48:19.376115+00	20250630000008_add_metric_fields		\N	2025-07-12 05:48:19.376115+00	0
4418df33-ae8a-4d54-8216-5fd3817f2d01	2df049a175fc075728d72e0b4f9d2de7fb1afe65b2bec44db273b76cc2d8093b	2025-07-12 06:12:55.441185+00	20250107160000_add_roblox_info_field		\N	2025-07-12 06:12:55.441185+00	0
1f2059b8-8229-4a15-88db-206cae44808d	2df049a175fc075728d72e0b4f9d2de7fb1afe65b2bec44db273b76cc2d8093b	2025-07-12 06:13:58.371247+00	20250712061234_add_roblox_info_field		\N	2025-07-12 06:13:58.371247+00	0
\.


--
-- Name: AdContainer AdContainer_pkey; Type: CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."AdContainer"
    ADD CONSTRAINT "AdContainer_pkey" PRIMARY KEY (id);


--
-- Name: AdEngagement AdEngagement_pkey; Type: CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."AdEngagement"
    ADD CONSTRAINT "AdEngagement_pkey" PRIMARY KEY (id);


--
-- Name: Asset Asset_pkey; Type: CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."Asset"
    ADD CONSTRAINT "Asset_pkey" PRIMARY KEY (id);


--
-- Name: GameAdPerformance GameAdPerformance_pkey; Type: CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."GameAdPerformance"
    ADD CONSTRAINT "GameAdPerformance_pkey" PRIMARY KEY (id);


--
-- Name: GameAd GameAd_pkey; Type: CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."GameAd"
    ADD CONSTRAINT "GameAd_pkey" PRIMARY KEY (id);


--
-- Name: GameDeployment GameDeployment_pkey; Type: CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."GameDeployment"
    ADD CONSTRAINT "GameDeployment_pkey" PRIMARY KEY (id);


--
-- Name: GameMedia GameMedia_pkey; Type: CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."GameMedia"
    ADD CONSTRAINT "GameMedia_pkey" PRIMARY KEY (id);


--
-- Name: GameMetricData GameMetricData_pkey; Type: CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."GameMetricData"
    ADD CONSTRAINT "GameMetricData_pkey" PRIMARY KEY (id);


--
-- Name: GameOwner GameOwner_pkey; Type: CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."GameOwner"
    ADD CONSTRAINT "GameOwner_pkey" PRIMARY KEY (id);


--
-- Name: Game Game_pkey; Type: CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."Game"
    ADD CONSTRAINT "Game_pkey" PRIMARY KEY (id);


--
-- Name: PlaylistSchedule PlaylistSchedule_pkey; Type: CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."PlaylistSchedule"
    ADD CONSTRAINT "PlaylistSchedule_pkey" PRIMARY KEY (id);


--
-- Name: Playlist Playlist_pkey; Type: CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."Playlist"
    ADD CONSTRAINT "Playlist_pkey" PRIMARY KEY (id);


--
-- Name: RemovableAsset RemovableAsset_pkey; Type: CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."RemovableAsset"
    ADD CONSTRAINT "RemovableAsset_pkey" PRIMARY KEY (id);


--
-- Name: _AssetPlaylists _AssetPlaylists_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."_AssetPlaylists"
    ADD CONSTRAINT "_AssetPlaylists_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _GameAssets _GameAssets_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."_GameAssets"
    ADD CONSTRAINT "_GameAssets_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _GamePlaylists _GamePlaylists_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."_GamePlaylists"
    ADD CONSTRAINT "_GamePlaylists_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _GameToAds _GameToAds_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."_GameToAds"
    ADD CONSTRAINT "_GameToAds_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _GameToAds _GameToAds_AB_unique; Type: CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."_GameToAds"
    ADD CONSTRAINT "_GameToAds_AB_unique" UNIQUE ("A", "B");


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: AdContainer_currentAdId_idx; Type: INDEX; Schema: public; Owner: ngp_user
--

CREATE INDEX "AdContainer_currentAdId_idx" ON public."AdContainer" USING btree ("currentAdId");


--
-- Name: AdContainer_gameId_idx; Type: INDEX; Schema: public; Owner: ngp_user
--

CREATE INDEX "AdContainer_gameId_idx" ON public."AdContainer" USING btree ("gameId");


--
-- Name: AdEngagement_adId_idx; Type: INDEX; Schema: public; Owner: ngp_user
--

CREATE INDEX "AdEngagement_adId_idx" ON public."AdEngagement" USING btree ("adId");


--
-- Name: AdEngagement_containerId_idx; Type: INDEX; Schema: public; Owner: ngp_user
--

CREATE INDEX "AdEngagement_containerId_idx" ON public."AdEngagement" USING btree ("containerId");


--
-- Name: GameDeployment_gameId_idx; Type: INDEX; Schema: public; Owner: ngp_user
--

CREATE INDEX "GameDeployment_gameId_idx" ON public."GameDeployment" USING btree ("gameId");


--
-- Name: GameDeployment_scheduleId_idx; Type: INDEX; Schema: public; Owner: ngp_user
--

CREATE INDEX "GameDeployment_scheduleId_idx" ON public."GameDeployment" USING btree ("scheduleId");


--
-- Name: GameMedia_gameId_idx; Type: INDEX; Schema: public; Owner: ngp_user
--

CREATE INDEX "GameMedia_gameId_idx" ON public."GameMedia" USING btree ("gameId");


--
-- Name: GameMetricData_gameId_metricType_category_idx; Type: INDEX; Schema: public; Owner: ngp_user
--

CREATE INDEX "GameMetricData_gameId_metricType_category_idx" ON public."GameMetricData" USING btree ("gameId", "metricType", category);


--
-- Name: GameMetricData_gameId_metricType_date_idx; Type: INDEX; Schema: public; Owner: ngp_user
--

CREATE INDEX "GameMetricData_gameId_metricType_date_idx" ON public."GameMetricData" USING btree ("gameId", "metricType", date);


--
-- Name: GameMetricData_gameId_metricType_idx; Type: INDEX; Schema: public; Owner: ngp_user
--

CREATE INDEX "GameMetricData_gameId_metricType_idx" ON public."GameMetricData" USING btree ("gameId", "metricType");


--
-- Name: GameOwner_email_key; Type: INDEX; Schema: public; Owner: ngp_user
--

CREATE UNIQUE INDEX "GameOwner_email_key" ON public."GameOwner" USING btree (email);


--
-- Name: Game_serverApiKey_key; Type: INDEX; Schema: public; Owner: ngp_user
--

CREATE UNIQUE INDEX "Game_serverApiKey_key" ON public."Game" USING btree ("serverApiKey");


--
-- Name: PlaylistSchedule_gameAdId_idx; Type: INDEX; Schema: public; Owner: ngp_user
--

CREATE INDEX "PlaylistSchedule_gameAdId_idx" ON public."PlaylistSchedule" USING btree ("gameAdId");


--
-- Name: PlaylistSchedule_playlistId_idx; Type: INDEX; Schema: public; Owner: ngp_user
--

CREATE INDEX "PlaylistSchedule_playlistId_idx" ON public."PlaylistSchedule" USING btree ("playlistId");


--
-- Name: _AssetPlaylists_B_index; Type: INDEX; Schema: public; Owner: ngp_user
--

CREATE INDEX "_AssetPlaylists_B_index" ON public."_AssetPlaylists" USING btree ("B");


--
-- Name: _GameAssets_B_index; Type: INDEX; Schema: public; Owner: ngp_user
--

CREATE INDEX "_GameAssets_B_index" ON public."_GameAssets" USING btree ("B");


--
-- Name: _GamePlaylists_B_index; Type: INDEX; Schema: public; Owner: ngp_user
--

CREATE INDEX "_GamePlaylists_B_index" ON public."_GamePlaylists" USING btree ("B");


--
-- Name: _GameToAds_B_index; Type: INDEX; Schema: public; Owner: ngp_user
--

CREATE INDEX "_GameToAds_B_index" ON public."_GameToAds" USING btree ("B");


--
-- Name: GameAd protect_game_ad_deletion; Type: TRIGGER; Schema: public; Owner: ngp_user
--

CREATE TRIGGER protect_game_ad_deletion BEFORE DELETE ON public."GameAd" FOR EACH STATEMENT EXECUTE FUNCTION public.check_deletion_count();


--
-- Name: GameAdPerformance protect_game_ad_performance_deletion; Type: TRIGGER; Schema: public; Owner: ngp_user
--

CREATE TRIGGER protect_game_ad_performance_deletion BEFORE DELETE ON public."GameAdPerformance" FOR EACH STATEMENT EXECUTE FUNCTION public.check_deletion_count();


--
-- Name: Game protect_game_deletion; Type: TRIGGER; Schema: public; Owner: ngp_user
--

CREATE TRIGGER protect_game_deletion BEFORE DELETE ON public."Game" FOR EACH STATEMENT EXECUTE FUNCTION public.check_deletion_count();


--
-- Name: AdContainer AdContainer_currentAdId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."AdContainer"
    ADD CONSTRAINT "AdContainer_currentAdId_fkey" FOREIGN KEY ("currentAdId") REFERENCES public."GameAd"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AdContainer AdContainer_gameId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."AdContainer"
    ADD CONSTRAINT "AdContainer_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES public."Game"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AdEngagement AdEngagement_containerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."AdEngagement"
    ADD CONSTRAINT "AdEngagement_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES public."AdContainer"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GameAdPerformance GameAdPerformance_gameAdId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."GameAdPerformance"
    ADD CONSTRAINT "GameAdPerformance_gameAdId_fkey" FOREIGN KEY ("gameAdId") REFERENCES public."GameAd"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: GameAd GameAd_gameId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."GameAd"
    ADD CONSTRAINT "GameAd_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES public."Game"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: GameDeployment GameDeployment_gameId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."GameDeployment"
    ADD CONSTRAINT "GameDeployment_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES public."Game"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: GameDeployment GameDeployment_scheduleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."GameDeployment"
    ADD CONSTRAINT "GameDeployment_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES public."PlaylistSchedule"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GameMedia GameMedia_gameId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."GameMedia"
    ADD CONSTRAINT "GameMedia_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES public."Game"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GameMetricData GameMetricData_gameId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."GameMetricData"
    ADD CONSTRAINT "GameMetricData_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES public."Game"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Game Game_gameOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."Game"
    ADD CONSTRAINT "Game_gameOwnerId_fkey" FOREIGN KEY ("gameOwnerId") REFERENCES public."GameOwner"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PlaylistSchedule PlaylistSchedule_gameAdId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."PlaylistSchedule"
    ADD CONSTRAINT "PlaylistSchedule_gameAdId_fkey" FOREIGN KEY ("gameAdId") REFERENCES public."GameAd"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PlaylistSchedule PlaylistSchedule_playlistId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."PlaylistSchedule"
    ADD CONSTRAINT "PlaylistSchedule_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES public."Playlist"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _AssetPlaylists _AssetPlaylists_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."_AssetPlaylists"
    ADD CONSTRAINT "_AssetPlaylists_A_fkey" FOREIGN KEY ("A") REFERENCES public."Asset"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _AssetPlaylists _AssetPlaylists_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."_AssetPlaylists"
    ADD CONSTRAINT "_AssetPlaylists_B_fkey" FOREIGN KEY ("B") REFERENCES public."Playlist"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _GameAssets _GameAssets_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."_GameAssets"
    ADD CONSTRAINT "_GameAssets_A_fkey" FOREIGN KEY ("A") REFERENCES public."Asset"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _GameAssets _GameAssets_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."_GameAssets"
    ADD CONSTRAINT "_GameAssets_B_fkey" FOREIGN KEY ("B") REFERENCES public."Game"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _GamePlaylists _GamePlaylists_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."_GamePlaylists"
    ADD CONSTRAINT "_GamePlaylists_A_fkey" FOREIGN KEY ("A") REFERENCES public."Game"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _GamePlaylists _GamePlaylists_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."_GamePlaylists"
    ADD CONSTRAINT "_GamePlaylists_B_fkey" FOREIGN KEY ("B") REFERENCES public."Playlist"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _GameToAds _GameToAds_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."_GameToAds"
    ADD CONSTRAINT "_GameToAds_A_fkey" FOREIGN KEY ("A") REFERENCES public."Game"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _GameToAds _GameToAds_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ngp_user
--

ALTER TABLE ONLY public."_GameToAds"
    ADD CONSTRAINT "_GameToAds_B_fkey" FOREIGN KEY ("B") REFERENCES public."GameAd"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

