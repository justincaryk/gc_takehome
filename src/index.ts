import fs from 'fs';
import https from 'https';

import dotenv from 'dotenv';
import express from 'express';
import { QueryResult } from 'pg';

import { postToBraze } from './braze';
import { getPgClient, parseCustomDate } from './utils';

dotenv.config();

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;

const options = {
  key: fs.readFileSync('private_key.pem'),
  cert: fs.readFileSync('certificate.pem'),
  minVersion: 'TLSv1',
  maxVersion: 'TLSv1.2',
} as https.ServerOptions;

type EventTeamContext = {
  team_id?: string;
};
type EventBody = {
  _source: {
    collector_tstamp: string;
    contexts_com_gc_user_: EventTeamContext[];
  };
};

app.post('/event', async (req, res) => {
  const body: EventBody = req.body;

  const collectorTimestamp = parseCustomDate(body._source.collector_tstamp);
  const teamId = extractTeamId(body);

  if (!teamId) {
    console.error(`Error finding teamId from body ${body._source}`);
    res.status(400).json({
      message: `Error finding teamId from body ${body._source}`,
    });

    return;
  }

  const teamEventSummary = await fetchTeamEventSummary(teamId, collectorTimestamp);

  if (teamEventSummary?.rows) {
    const result = await postToBraze(teamEventSummary.rows);

    res.status(200).json({
      message: {
        ...result,
      },
    });

    return;
  }

  res.status(200).json({
    message: 'Success',
  });
});

https.createServer(options, app).listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

function extractTeamId(body: EventBody): string | null {
  // apparently the key will regularly change but we can count on prefix 'contexts_com_gc_user_'
  const teamKey = Object.keys(body._source).find((key) => key.includes('contexts_com_gc_user_'));

  // an array that potentially contains a number of red herring objects
  const teamContextArray = body._source[
    teamKey as keyof EventBody['_source']
  ] as EventTeamContext[];

  // find the proper object by searching for property 'team_id'
  const teamObject = teamContextArray.find((x) =>
    Object.prototype.hasOwnProperty.call(x, 'team_id'),
  );

  return teamObject?.team_id || null;
}

async function fetchTeamEventSummary(
  teamId: string,
  collectorTimestamp: Date,
): Promise<QueryResult<{
  sport: string;
  name: string;
  total_fans_family: number;
  team_id: string;
}> | null> {
  const client = getPgClient();
  let result = null;

  try {
    await client.connect();
    const queryText = 'SELECT * FROM public.get_team_event_summary($1, $2)';
    const values = [teamId, collectorTimestamp];
    result = await client.query(queryText, values);
  } catch (err) {
    console.error('Database query error:', err);
  } finally {
    await client.end();
  }

  return result;
}
