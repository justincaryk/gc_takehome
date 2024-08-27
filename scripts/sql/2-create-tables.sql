CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.user (
	id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
	first_name varchar(155),
	last_name varchar(155),
	email_address text,
	/* daily, monthly, never, often, once, rarely, seldom, weekly, yearly */
	user_app_frequency varchar(50)
);

CREATE TABLE IF NOT EXISTS public.team (
	id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
	name varchar(100),
	city TEXT,
	creator uuid REFERENCES public.user (id) NOT NULL,
	sport varchar(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_team_status (
    user_id uuid REFERENCES public.user(id),
    team_id uuid REFERENCES public.team(id),
    status varchar(50) CHECK (status IN ('added', 'inactive', 'invited', 'removed')),
    PRIMARY KEY (user_id, team_id) -- use a composite primary key
);

/* maybe games would be more descriptive? */
CREATE TABLE IF NOT EXISTS public.event (
	id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
	team_id uuid REFERENCES public.team (id) NOT NULL,
	num_fans INTEGER DEFAULT 0,
	num_family INTEGER DEFAULT 0,
	milestone_1_ts TIMESTAMP NOT NULL,
	user_id uuid REFERENCES public.user (id) NOT NULL
);

/* create indexes */
CREATE INDEX idx_event_team_id ON public.event(team_id);
CREATE INDEX idx_event_milestone_1_ts ON public.event(milestone_1_ts);
CREATE INDEX idx_team_sport ON public.team(sport);
CREATE INDEX idx_events_num_fans_family ON public.event(num_fans, num_family);
