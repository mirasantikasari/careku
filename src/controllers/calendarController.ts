import { getAccessTokenFromRefreshToken, getBaseUrl } from '../services/firestore';

export type CalendarEvent = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  time?: string;
  type: EventType;
};

export type EventType = 'appointment' | 'medication' | 'period' | 'checkup';

const mapDoc = (doc: any): CalendarEvent | null => {
  if (!doc?.name || !doc?.fields) return null;
  const id = doc.name.split('/').pop() as string;
  const f = doc.fields;
  return {
    id,
    date: f?.date?.stringValue || '',
    title: f?.title?.stringValue || '',
    time: f?.time?.stringValue,
    type: (f?.type?.stringValue as EventType) || 'appointment',
  };
};

export const fetchEventsForMonth = async (
  uid: string,
  refreshToken: string,
  startDate: string,
  endDate: string,
): Promise<CalendarEvent[]> => {
  const base = getBaseUrl();
  const accessToken = await getAccessTokenFromRefreshToken(refreshToken);

  const body = {
    structuredQuery: {
      from: [{ collectionId: 'events' }],
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

  const res = await fetch(`${base}/users/${uid}:runQuery`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gagal memuat event: ${text}`);
  }

  const rows = await res.json();
  return rows.map((r: any) => mapDoc(r.document)).filter(Boolean) as CalendarEvent[];
};

export const addEvent = async (
  uid: string,
  refreshToken: string,
  data: Omit<CalendarEvent, 'id'>,
): Promise<CalendarEvent> => {
  const base = getBaseUrl();
  const accessToken = await getAccessTokenFromRefreshToken(refreshToken);

  const document = {
    fields: {
      date: { stringValue: data.date },
      title: { stringValue: data.title },
      time: data.time ? { stringValue: data.time } : undefined,
      type: { stringValue: data.type },
      createdAt: { timestampValue: new Date().toISOString() },
    },
  };

  const res = await fetch(`${base}/users/${uid}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(document),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gagal menambah event: ${text}`);
  }

  const doc = await res.json();
  const mapped = mapDoc(doc);
  if (!mapped) {
    throw new Error('Response event tidak valid');
  }
  return mapped;
};

export const deleteEvent = async (uid: string, refreshToken: string, eventId: string) => {
  const base = getBaseUrl();
  const accessToken = await getAccessTokenFromRefreshToken(refreshToken);

  const res = await fetch(`${base}/users/${uid}/events/${eventId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gagal menghapus event: ${text}`);
  }
};
