import { Platform } from 'react-native';
import { GROQ_API_KEY as FILE_GROQ_API_KEY } from '../config/env';

type RagDoc = {
  id: string;
  title: string;
  content: string;
  tags: string[];
};

type RagResult = {
  answer: string;
  usedDocs: RagDoc[];
};

const knowledgeBase: RagDoc[] = [
  {
    id: 'hidrasi-harian',
    title: 'Hidrasi harian',
    content:
      'Minum 6-8 gelas air per hari, tambah 1-2 gelas saat banyak aktivitas fisik. Perhatikan urine berwarna pucat sebagai tanda cukup hidrasi.',
    tags: ['minum', 'air', 'hidrasi', 'dehidrasi'],
  },
  {
    id: 'olahraga-ringkas',
    title: 'Olahraga singkat',
    content:
      'Targetkan 20-30 menit aktivitas intensitas ringan-sedang (jalan cepat, peregangan dinamis). Jika nyeri, mulai dari 10 menit lalu tambah 5 menit tiap minggu.',
    tags: ['olahraga', 'gerak', 'exercise', 'latihan'],
  },
  {
    id: 'pola-makan-lembut',
    title: 'Pola makan lembut',
    content:
      'Prioritaskan makanan rendah lemak dan tidak pedas. Sup ayam, oatmeal, pisang, dan smoothie buah adalah opsi aman saat perut sensitif.',
    tags: ['makan', 'diet', 'pedas', 'lambung', 'food'],
  },
  {
    id: 'pola-tidur',
    title: 'Pola tidur',
    content:
      'Tidur 7-9 jam, hindari layar 60 menit sebelum tidur, dan jaga jadwal tidur konsisten termasuk akhir pekan.',
    tags: ['tidur', 'sleep', 'istirahat'],
  },
  {
    id: 'catatan-nyeri',
    title: 'Catatan nyeri',
    content:
      'Pantau lokasi, durasi, dan pemicu nyeri. Gunakan kompres hangat/dingin selama 10-15 menit sesuai kenyamanan dan konsultasi bila nyeri memburuk.',
    tags: ['nyeri', 'pain', 'cedera'],
  },
];

const envKey = (globalThis as any)?.process?.env?.GROQ_API_KEY as string | undefined;
const GROQ_API_KEY = envKey || FILE_GROQ_API_KEY || '';

const MODEL = 'llama-3.1-8b-instant';
const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

const scoreDoc = (query: string, doc: RagDoc) => {
  const queryTokens = normalize(query);
  const haystack = normalize(`${doc.title} ${doc.content} ${doc.tags.join(' ')}`);

  const hits = queryTokens.reduce((score, token) => {
    return haystack.includes(token) ? score + 2 : score;
  }, 0);

  const partials = doc.tags.reduce((score, tag) => {
    return query.toLowerCase().includes(tag) ? score + 1 : score;
  }, 0);

  return hits + partials;
};

const retrieveContext = (query: string, limit = 3) => {
  const sorted = [...knowledgeBase].sort((a, b) => scoreDoc(query, b) - scoreDoc(query, a));
  const top = sorted.filter((doc, idx) => scoreDoc(query, doc) > 0 || idx === 0).slice(0, limit);
  return top;
};

export const fetchRagAnswer = async (question: string): Promise<RagResult> => {
  if (!GROQ_API_KEY) {
    throw new Error(
      'GROQ_API_KEY belum diset. Daftar gratis di groq.com lalu set environment variable atau isi di ragClient.ts',
    );
  }

  const contextDocs = retrieveContext(question);
  const contextText = contextDocs
    .map(doc => `- ${doc.title}: ${doc.content}`)
    .join('\n');

  const prompt = [
    'Gunakan konteks berikut untuk menjawab singkat dan jelas dalam bahasa Indonesia.',
    'Jika konteks tidak relevan, beritahu pengguna dan beri saran umum yang aman.',
    'Format jawaban maksimal 3 poin.',
    '',
    'Konteks:',
    contextText,
    '',
    `Pertanyaan: ${question}`,
  ].join('\n');

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content:
            'Kamu adalah CAREKU AI, asisten kesehatan suportif. Jawab ringkas, hindari klaim medis pasti, sarankan konsultasi profesional bila perlu.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Gagal memanggil RAG (status ${response.status}): ${errorBody.substring(0, 120)}`,
    );
  }

  const json = await response.json();
  const answer =
    json?.choices?.[0]?.message?.content?.trim() ||
    'Maaf, aku belum bisa menemukan jawaban. Coba ulangi pertanyaanmu.';

  return { answer, usedDocs: contextDocs };
};

export const getRagSourceInfo = () =>
  `RAG lokal + ${MODEL} via Groq (${Platform.OS})`;
