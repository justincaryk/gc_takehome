CREATE OR REPLACE FUNCTION get_team_event_summary(p_team_id uuid, p_collector_tstamp timestamp)
RETURNS TABLE (
    sport varchar,
    name varchar,
    total_fans_family integer,
    team_id uuid
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.sport,
        t.name,
        (e.num_fans + e.num_family) AS total_fans_family,
        t.id AS team_id
    FROM
        public.event e
    JOIN
        public.team t ON e.team_id = t.id
    JOIN
        public.user u ON e.user_id = u.id
    WHERE
        t.id = p_team_id
        AND e.milestone_1_ts BETWEEN (p_collector_tstamp - INTERVAL '1 week') AND p_collector_tstamp
        AND t.sport IN ('baseball', 'softball', 'basketball', 'volleyball')
        AND (e.num_fans + e.num_family) > 100;
END;
$$ LANGUAGE plpgsql;
