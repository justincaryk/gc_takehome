import fs from 'fs';
import path from 'path';

import csv from 'csv-parser';
import dotenv from 'dotenv';

import { getPgClient, parseCustomDate } from './utils';

dotenv.config();

export type CsvRow = {
  team_sport: string;
  num_fans: number;
  num_family: number;
  milestone_1_ts: Date;
  team_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email_address: string;
  is_team_creator: 'TRUE' | 'FALSE';
  user_app_frequency: string;
  user_team_status: string;
  team_city: string;
  team_name: string;
};

export async function processCsv() {
  const rows: CsvRow[] = [];

  return new Promise<CsvRow[]>((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, '..', 'data.csv'))
      .pipe(csv())
      .on('data', (row) => {
        rows.push({
          ...row,
          milestone_1_ts: parseCustomDate(row.milestone_1_ts),
        });
      })
      .on('end', () => {
        // Sort rows in descending order
        try {
          rows.sort((a, b) => b.milestone_1_ts.getTime() - a.milestone_1_ts.getTime());
          console.log('done parsing CSV');
          resolve(rows);
        } catch (err) {
          console.log('error: ', err);
          reject();
        }
      });
  });
}

interface MungedMaps {
  userMap: Map<
    string,
    {
      id: string;
      first_name: string;
      last_name: string;
      email_address: string;
      user_app_frequency: string;
    }
  >;
  teamMap: Map<
    string,
    {
      id: string;
      team_name: string;
      team_sport: string;
      team_city: string;
      creator: string;
    }
  >;
  userTeamStatusMap: Map<
    string,
    {
      user_id: string;
      team_id: string;
      status: string;
    }
  >;
}
export function createMappings(rows: CsvRow[]): MungedMaps {
  const userMap = new Map();
  const teamMap = new Map();
  const userTeamStatusMap = new Map();

  for (const row of rows) {
    const {
      team_sport,
      user_id,
      first_name,
      last_name,
      email_address,
      team_city,
      team_name,
      team_id,
      is_team_creator,
      user_app_frequency,
      user_team_status,
    } = row;

    // Add user to userMap if it doesn't already exist
    if (!userMap.has(user_id)) {
      userMap.set(user_id, {
        id: user_id,
        first_name,
        last_name,
        email_address,
        user_app_frequency,
      });
    }

    // Add team to teamMap if it doesn't already exist
    if (!teamMap.has(team_id)) {
      teamMap.set(team_id, {
        id: team_id,
        team_sport,
        team_city,
        team_name,
        creator: is_team_creator === 'TRUE' ? user_id : null, // Set creator if it is a team creator
      });
    } else if (is_team_creator === 'TRUE') {
      // Update the creator of the team if the current user is the team creator
      teamMap.get(team_id).creator = user_id;
    }

    const compositeId = `${team_id}-${user_id}`;

    if (!userTeamStatusMap.has(compositeId)) {
      userTeamStatusMap.set(compositeId, {
        user_id,
        team_id,
        status: user_team_status,
      });
    }
  }

  console.log('User and team map generated');

  return {
    userMap,
    teamMap,
    userTeamStatusMap,
  };
}
async function hydrateCoreTables({ userMap, teamMap, userTeamStatusMap }: MungedMaps) {
  const client = getPgClient();
  await client.connect();

  const users = Array.from(userMap.values());
  const teams = Array.from(teamMap.values());
  const userTeamStatuses = Array.from(userTeamStatusMap.values());
  console.log('users size: ', users.length);
  console.log('teams size: ', teams.length);
  console.log('userTeamStatuses size: ', userTeamStatuses.length);

  for (const user of users) {
    try {
      await client.query(
        `
                INSERT INTO public.user (id, first_name, last_name, email_address, user_app_frequency)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (id) DO UPDATE
                SET first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    email_address = EXCLUDED.email_address,
                    user_app_frequency = EXCLUDED.user_app_frequency
            `,
        [user.id, user.first_name, user.last_name, user.email_address, user.user_app_frequency],
      );
    } catch (err) {
      console.error('user insert error: ', err);
      console.error(user);
    }
  }

  for (const team of teams) {
    try {
      await client.query(
        `
                INSERT INTO public.team (id, name, sport, city, creator)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (id) DO UPDATE
                SET name = EXCLUDED.name,
                    sport = EXCLUDED.sport,
                    city = EXCLUDED.city,
                    creator = EXCLUDED.creator
            `,
        [team.id, team.team_name, team.team_sport, team.team_city, team.creator],
      );
    } catch (err) {
      console.error('team insert error: ', err);
      console.error(team);
    }
  }

  for (const userTeamStatus of userTeamStatuses) {
    try {
      await client.query(
        `
                INSERT INTO public.user_team_status (user_id, team_id, status)
                VALUES ($1, $2, $3)
                ON CONFLICT (user_id, team_id) DO UPDATE
                SET status = EXCLUDED.status
            `,
        [userTeamStatus.user_id, userTeamStatus.team_id, userTeamStatus.status],
      );
    } catch (err) {
      console.error('userTeamStatus insert error: ', err);
      console.error(userTeamStatus);
    }
  }

  // confirm we got all desired inserts.
  const userResult = await client.query(`SELECT COUNT(*) FROM public.user`);
  const teamResult = await client.query(`SELECT COUNT(*) FROM public.team`);
  const userTeamStatusResult = await client.query(`SELECT COUNT(*) FROM public.user_team_status`);

  console.log('results: ', {
    userResult: userResult.rows[0].count,
    teamResult: teamResult.rows[0].count,
    userTeamStatusResult: userTeamStatusResult.rows[0].count,
  });

  await client.end();
}

// seed the event tables
async function hydrateEventTable(rows: CsvRow[]) {
  const client = getPgClient();
  await client.connect();

  console.log('events (rows) size: ', rows.length);

  for (const row of rows) {
    try {
      const { team_id, num_fans, num_family, milestone_1_ts, user_id } = row;

      // Insert or update event
      await client.query(
        `
                INSERT INTO public.event (team_id, num_fans, num_family, milestone_1_ts, user_id)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (id) DO UPDATE
                SET num_fans = EXCLUDED.num_fans,
                    num_family = EXCLUDED.num_family,
                    milestone_1_ts = EXCLUDED.milestone_1_ts,
                    user_id = EXCLUDED.user_id
                `,
        [team_id, num_fans, num_family, milestone_1_ts, user_id],
      );
    } catch (err) {
      console.error('Error upserting row:', err);
    }
  }

  const eventResult = await client.query(`SELECT COUNT(*) FROM public.event`);

  console.log('event results: ', {
    eventResult: eventResult.rows[0].count,
  });

  await client.end();
}

export async function run() {
  try {
    // get csv parsed, sorted by date, munged, and into working memory
    const rows = await processCsv();
    // map out all unique users, teams, user_team_statuses
    const maps = createMappings(rows);
    await hydrateCoreTables(maps);
    await hydrateEventTable(rows);
    console.log('Database seeding completed successfully.');
  } catch (error) {
    console.error('Error occurred:', error);
  }
}

if (require.main === module) {
  run();
}
