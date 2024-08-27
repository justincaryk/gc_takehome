import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BRAZE_API_KEY = process.env.BRAZE_API_KEY;
const BRAZE_ENDPOINT_URL = process.env.BRAZE_ENDPOINT_URL as string;
const CANVAS_ID = process.env.CANVAS_ID;

interface BrazePayload {
  sport: string;
  name: string;
  total_fans_family: number;
  team_id: string;
}

export async function postToBraze(payload: BrazePayload[]) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${BRAZE_API_KEY}`,
    };

    const requestBody = {
      canvas_id: CANVAS_ID,
      recipients: payload.map((event) => ({
        canvas_id: CANVAS_ID,
        external_user_id: event.team_id,
        canvas_entry_properties: {
          Sport: event.sport,
          Team_Name: event.name,
          Num_fans_family: event.total_fans_family, // Sum of Num_fans + Num_family
          Team_id: event.team_id,
        },
      })),
    };

    // Send the POST request
    const response = await axios.post(BRAZE_ENDPOINT_URL, requestBody, { headers });

    // Return the result
    return response.data;
  } catch (error) {
    // Handle any errors
    console.error('Error posting to Braze:', error);
    throw error;
  }
}
