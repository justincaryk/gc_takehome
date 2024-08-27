```sql
Table user as U {
	id uuid
	first_name varchar(155)
	last_name varchar(155)
	email_address text
	/* daily, monthly, never, often, once, rarely, seldom, weekly, yearly */
	user_app_frequency varchar(50)
}

Table team as T {
	id uuid
	team_name varchar(100)
	city TEXT
	creator uuid
	sport varchar(100)

  Indexes {
    (sport) [name: 'idx_team_sport']
  }
}

Table user_team_status as UTS {
    user_id uuid [ref: > U.id]
    team_id uuid [ref: > T.id]
    status varchar(50)
    PRIMARY KEY (user_id, team_id)
}

Table event as E{
	id uuid
	team_id uuid [ref: > T.id]
  user_id uuid [ref: > U.id]
	num_fans INTEGER
	num_family INTEGER
	milestone_1_ts TIMESTAMP

  Indexes {
    (team_id) [name: 'idx_event_team_id']
    (milestone_1_ts) [name: 'idx_event_milestone_1_ts']
    (num_fans, num_family) [name: 'idx_events_num_fans_family']
  }
}
```
