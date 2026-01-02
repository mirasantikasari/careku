import {
  fetchUserDocument,
  updateUserFields,
  getAccessTokenFromRefreshToken,
  getBaseUrl,
} from './firestore';
import { FIREBASE_PROJECT_ID as FILE_PROJECT_ID } from '../config/env';

export type HomeData = {
  mood?: string;
  waterIntake?: number;
  painLevel?: number;
};

export type DailyMetric = {
  date: string;
  mood?: string;
  waterIntake?: number;
  painLevel?: number;
};

const readNumber = (val: any) => {
  if (typeof val?.integerValue !== 'undefined') {
    return Number(val.integerValue);
  }
  if (typeof val?.doubleValue !== 'undefined') {
    return Number(val.doubleValue);
  }
  return undefined;
};

export const getHomeData = async (uid: string, refreshToken: string): Promise<HomeData> => {
  const doc = await fetchUserDocument(uid, refreshToken);
  const fields = doc?.fields || {};

  return {
    mood: fields?.mood?.stringValue,
    waterIntake: readNumber(fields?.waterIntake) || 0,
    painLevel: readNumber(fields?.painLevel) || 0,
  };
};

export const updateHomeData = async (
  uid: string,
  refreshToken: string,
  data: Partial<HomeData>,
) => {
  await updateUserFields(uid, refreshToken, {
    ...(data.mood !== undefined ? { mood: data.mood } : {}),
    ...(data.waterIntake !== undefined ? { waterIntake: data.waterIntake } : {}),
    ...(data.painLevel !== undefined ? { painLevel: data.painLevel } : {}),
    updatedAt: new Date().toISOString(),
  });
  await logDailyMetrics(uid, refreshToken, data);
};

const logDailyMetrics = async (
  uid: string,
  refreshToken: string,
  data: Partial<HomeData>,
) => {
  if (!FILE_PROJECT_ID && !(globalThis as any)?.process?.env?.FIREBASE_PROJECT_ID) {
    // skip if project id is missing; upstream will already error
    return;
  }
  const accessToken = await getAccessTokenFromRefreshToken(refreshToken);
  const base = getBaseUrl();
  const today = new Date().toISOString().slice(0, 10);

  const fields: Record<string, any> = {
    date: { stringValue: today },
    updatedAt: { timestampValue: new Date().toISOString() },
  };

  const updateMask: string[] = ['updateMask.fieldPaths=date', 'updateMask.fieldPaths=updatedAt'];

  if (data.mood !== undefined) {
    fields.mood = { stringValue: data.mood };
    updateMask.push('updateMask.fieldPaths=mood');
  }
  if (data.waterIntake !== undefined) {
    fields.waterIntake = { integerValue: data.waterIntake };
    updateMask.push('updateMask.fieldPaths=waterIntake');
  }
  if (data.painLevel !== undefined) {
    fields.painLevel = { integerValue: data.painLevel };
    updateMask.push('updateMask.fieldPaths=painLevel');
  }

  const query = updateMask.join('&');
  const url = `${base}/users/${uid}/metrics/${today}?${query}`;

  await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ fields }),
  });
};

export const getMetricsRange = async (
  uid: string,
  refreshToken: string,
  startDate: string, // YYYY-MM-DD
  endDate: string,   // YYYY-MM-DD
): Promise<DailyMetric[]> => {
  const accessToken = await getAccessTokenFromRefreshToken(refreshToken);
  const runQueryUrl = `${getBaseUrl()}:runQuery`;
  const parent = `${getBaseUrl()}/users/${uid}`;

  const body = {
    parent,
    structuredQuery: {
      from: [{ collectionId: 'metrics' }],
      where: {
        compositeFilter: {
          op: 'AND',
          filters: [
            {
              fieldFilter: {
                field: { fieldPath: 'date' },
                op: 'GREATER_THAN_OR_EQUAL',
                value: { stringValue: startDate },
              },
            },
            {
              fieldFilter: {
                field: { fieldPath: 'date' },
                op: 'LESS_THAN_OR_EQUAL',
                value: { stringValue: endDate },
              },
            },
          ],
        },
      },
      orderBy: [{ field: { fieldPath: 'date' }, direction: 'ASCENDING' }],
    },
  };

  const res = await fetch(runQueryUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gagal mengambil statistik: ${text}`);
  }

  const rows = await res.json();
  const result: DailyMetric[] = [];

  rows.forEach((row: any) => {
    const doc = row?.document;
    if (!doc?.fields) return;
    const fields = doc.fields;
    const date = fields?.date?.stringValue;
    if (!date) return;
    result.push({
      date,
      mood: fields?.mood?.stringValue,
      waterIntake: readNumber(fields?.waterIntake) || 0,
      painLevel: readNumber(fields?.painLevel) || 0,
    });
  });

  return result;
};
