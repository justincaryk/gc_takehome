import { createMappings, CsvRow } from '../seed';

const mockData: CsvRow[] = [
  {
    team_id: 'a59f9159-11d5-4eb0-9441-321af3a6b4d8',
    team_name: 'UPC',
    team_city: 'Nashville',
    team_sport: 'hockey',
    num_fans: 67,
    num_family: 71,
    milestone_1_ts: new Date('2024-08-03T01:15:23'),
    user_id: 'ed0bbbb6-3a92-441f-9f6d-e510cc2bbf87',
    first_name: 'Carl',
    last_name: 'Harvey',
    email_address: 'Carl_Harvey1225@bqkv0.name',
    is_team_creator: 'TRUE',
    user_app_frequency: 'Seldom',
    user_team_status: 'added',
  },
  {
    team_id: '3016b6b0-b53d-49d5-8af2-ae1c4f5e7786',
    team_name: 'Apple Inc.',
    team_city: 'Bellevue',
    team_sport: 'soccer',
    num_fans: 4,
    num_family: 54,
    milestone_1_ts: new Date('Saturday, July 13, 2024 5:03:24 PM'),
    user_id: '4a95c007-0b67-4dcc-b7d5-814b85588891',
    first_name: 'Josh',
    last_name: 'Wade',
    email_address: 'Josh_Wade5329@ds59r.video',
    is_team_creator: 'FALSE',
    user_app_frequency: 'Yearly',
    user_team_status: 'invited',
  },
  {
    team_id: '079b1b68-8f84-443a-bb7b-08f64b5c73a3',
    team_name: 'Amazon.com',
    team_city: 'Rome',
    team_sport: 'volleyball',
    num_fans: 65,
    num_family: 2,
    milestone_1_ts: new Date('2024-08-03T01:15:23'),
    user_id: 'd7f3a77b-9c18-4c36-aa6e-c16c113f23f7',
    first_name: 'Bob',
    last_name: 'Hopkins',
    email_address: 'Bob_Hopkins2207@bu2lo.solutions',
    is_team_creator: 'TRUE',
    user_app_frequency: 'Once',
    user_team_status: 'added',
  },
];

jest.mock('../seed', () => {
  const actualModule = jest.requireActual('../seed');
  return {
    run: jest.fn(() => null),
    createMappings: actualModule.createMappings,
  };
});

describe('createMappings', () => {
  it('should correctly populate userMap, teamMap, and userTeamStatusMap', () => {
    const maps = createMappings(mockData);

    // Assert userMap
    expect(maps.userMap.size).toBe(new Set(mockData.map((x) => x.user_id)).size);
    expect(maps.userMap.get(mockData[0].user_id)).toEqual({
      id: mockData[0].user_id,
      first_name: mockData[0].first_name,
      last_name: mockData[0].last_name,
      email_address: mockData[0].email_address,
      user_app_frequency: mockData[0].user_app_frequency,
    });

    // Assert teamMap
    const teamWithCreator = mockData.find((x) => x.is_team_creator === 'TRUE');
    expect(maps.teamMap.size).toBe(new Set(mockData.map((x) => x.team_id)).size);
    expect(maps.teamMap.get(teamWithCreator?.team_id || '')).toEqual({
      id: teamWithCreator?.team_id,
      team_sport: teamWithCreator?.team_sport,
      team_city: teamWithCreator?.team_city,
      team_name: teamWithCreator?.team_name,
      creator: teamWithCreator?.user_id,
    });

    // Assert userTeamStatusMap
    expect(maps.userTeamStatusMap.size).toBe(
      new Set(mockData.map((x) => `${x.team_id}-${x.user_id}`)).size,
    );

    expect(maps.userTeamStatusMap.get(`${mockData[0].team_id}-${mockData[0].user_id}`)).toEqual({
      user_id: mockData[0].user_id,
      team_id: mockData[0].team_id,
      status: mockData[0].user_team_status,
    });
  });

  it('should update the team creator if the user is a team creator', () => {
    const rows2: CsvRow[] = [
      {
        team_sport: 'soccer',
        user_id: 'user1',
        first_name: 'John',
        last_name: 'Doe',
        email_address: 'john.doe@example.com',
        milestone_1_ts: new Date(),
        team_city: 'CityA',
        num_fans: 1,
        num_family: 1,
        team_name: 'TeamA',
        team_id: 'team1',
        is_team_creator: 'FALSE',
        user_app_frequency: 'Daily',
        user_team_status: 'added',
      },
      {
        team_sport: 'soccer',
        user_id: 'user2',
        first_name: 'Jane',
        last_name: 'Doe',
        num_fans: 1,
        num_family: 1,
        email_address: 'jane.doe@example.com',
        milestone_1_ts: new Date(),
        team_city: 'CityA',
        team_name: 'TeamA',
        team_id: 'team1',
        is_team_creator: 'TRUE',
        user_app_frequency: 'Weekly',
        user_team_status: 'added',
      },
    ];

    const maps = createMappings(rows2);

    // Assert teamMap creator is updated
    expect(maps.teamMap.get('team1')?.creator).toBe('user2');
  });
});
