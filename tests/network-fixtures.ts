const HOURS = 48;

export function airPayload(aqi = 165) {
  const time = Array.from({ length: HOURS }, (_, index) => `2026-11-20T${String(index).padStart(2, '0')}:00`);
  return {
    latitude: 28.6139,
    longitude: 77.209,
    timezone: 'Asia/Kolkata',
    current: {
      time: '2026-11-20T08:00',
      us_aqi: aqi,
      pm2_5: 62.4,
      pm10: 140,
      carbon_monoxide: 800,
      nitrogen_dioxide: 45,
      sulphur_dioxide: 12,
      ozone: 30,
      us_aqi_pm2_5: aqi,
      us_aqi_pm10: 120,
      us_aqi_carbon_monoxide: 20,
      us_aqi_nitrogen_dioxide: 30,
      us_aqi_sulphur_dioxide: 10,
      us_aqi_ozone: 25,
    },
    hourly: {
      time,
      us_aqi: time.map((_, index) => Math.max(20, aqi - index * 3)),
      pm2_5: time.map(() => 60),
      pm10: time.map(() => 130),
    },
  };
}

export function geocodingPayload() {
  return {
    results: [
      {
        name: 'Delhi',
        latitude: 28.6139,
        longitude: 77.209,
        country: 'India',
        admin1: 'Delhi',
        timezone: 'Asia/Kolkata',
      },
    ],
  };
}

const COMPLETION = `HEADLINE: A cleaner afternoon is ahead
NARRATIVE: The current AQI is 165, which is Unhealthy. Keep strenuous activity short.
ACTION: Move play indoors :: Use the cleaner window after midday for a gentle walk :: afternoon
ACTION: Run the purifier :: Keep it on while the gas stove is used :: during cooking
ACTION: Cycle the school run :: Leave the car at home to save 1.66 kg CO2e :: next trip`;

export function openRouterStream(): Response {
  const payload = COMPLETION.split('')
    .map((character) => `data: ${JSON.stringify({ choices: [{ delta: { content: character } }] })}\n\n`)
    .join('');
  const body = `${payload}data: [DONE]\n\n`;
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

export function installFetchMock(options: { aqi?: number; failAir?: boolean } = {}) {
  const calls: string[] = [];
  const mock = async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    if (url.includes('geocoding-api')) return Response.json(geocodingPayload());
    if (url.includes('air-quality-api')) {
      if (options.failAir) return new Response('upstream down', { status: 503 });
      return Response.json(airPayload(options.aqi ?? 165));
    }
    if (url.includes('openrouter.ai')) return openRouterStream();
    throw new Error(`Unexpected fetch: ${url}`);
  };
  return { mock, calls };
}
