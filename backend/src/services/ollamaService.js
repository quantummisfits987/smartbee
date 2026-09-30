import axios from 'axios';

/**
 * Ollama AI Service for SmartBee
 * Interacts with local Ollama instance (e.g. running llama3.2:1b, qwen2.5:7b, etc.)
 * Strictly provides symptom-based health risk advisory.
 */

export const getOllamaUrl = () =>
  process.env.OLLAMA_BASE_URL || process.env.OLLAMA_URL || 'http://localhost:11434';

export const getConfiguredModel = () =>
  process.env.OLLAMA_MODEL || 'llama3.2:1b';

/**
 * Checks if the local Ollama instance is active and returns available models
 */
export async function checkOllamaStatus() {
  const baseUrl = getOllamaUrl();
  const configuredModel = getConfiguredModel();

  try {
    const response = await axios.get(`${baseUrl}/api/tags`, { timeout: 3000 });
    const models = (response.data?.models || []).map((m) => m.name);
    return {
      available: true,
      available_models: models,
      configured_model: configuredModel,
      url: baseUrl,
    };
  } catch (error) {
    return {
      available: false,
      available_models: [],
      configured_model: configuredModel,
      url: baseUrl,
      message: 'Ollama is unavailable. Please ensure local Ollama is running on port 11434.',
    };
  }
}

/**
 * Dedicated health check for GET /api/health/ollama
 */
export async function getOllamaHealth() {
  const baseUrl = getOllamaUrl();
  const configuredModel = getConfiguredModel();

  try {
    const response = await axios.get(`${baseUrl}/api/tags`, { timeout: 3000 });
    const models = (response.data?.models || []).map((m) => m.name);

    if (models.length === 0) {
      return {
        status: 'disconnected',
        provider: 'ollama',
        error: 'No Ollama model is installed. Please install a model first.',
        models: [],
      };
    }

    // Check if configured model exists
    const matchedModel = models.find(
      (m) =>
        m.toLowerCase() === configuredModel.toLowerCase() ||
        m.toLowerCase().startsWith(configuredModel.toLowerCase() + ':') ||
        m.split(':')[0].toLowerCase() === configuredModel.toLowerCase()
    );

    const activeModel = matchedModel || models[0];

    return {
      status: 'connected',
      provider: 'ollama',
      model: activeModel,
      available_models: models,
    };
  } catch (error) {
    return {
      status: 'disconnected',
      provider: 'ollama',
      error: 'Ollama is unavailable. Please ensure local Ollama is running on port 11434.',
      url: baseUrl,
    };
  }
}

/**
 * Generates an AI-based symptom risk advisory using local Ollama LLM
 */
export async function generateHealthAdvisory({
  hiveCode,
  hiveLocation,
  hiveStatus,
  miteCount,
  beeActivity,
  broodPattern,
  deadBees,
  sensorData,
  weatherData,
  alerts = [],
  model,
}) {
  const baseUrl = getOllamaUrl();
  const defaultModel = getConfiguredModel();

  // 1. Verify Ollama availability & installed models
  let installedModels = [];
  try {
    const tagsRes = await axios.get(`${baseUrl}/api/tags`, { timeout: 3000 });
    installedModels = (tagsRes.data?.models || []).map((m) => m.name);
  } catch (err) {
    const error = new Error('Ollama is unavailable. Please start Ollama and ensure a supported local model is installed.');
    error.statusCode = 503;
    error.code = 'OLLAMA_UNAVAILABLE';
    throw error;
  }

  if (installedModels.length === 0) {
    const err = new Error('No Ollama model is installed. Please install a model first.');
    err.statusCode = 400;
    err.code = 'NO_MODELS_INSTALLED';
    throw err;
  }

  // Pick target model: explicitly requested, configured in env, or first available installed model
  let targetModel = model || defaultModel;
  const modelMatches = installedModels.find(
    (m) =>
      m.toLowerCase() === targetModel.toLowerCase() ||
      m.toLowerCase().startsWith(targetModel.toLowerCase() + ':') ||
      m.split(':')[0].toLowerCase() === targetModel.toLowerCase()
  );

  if (!modelMatches) {
    // If exact target model not found, fallback to first available installed model
    targetModel = installedModels[0];
  } else {
    targetModel = modelMatches;
  }

  // 2. Format alert and sensor context
  const alertSummary = alerts.length > 0
    ? alerts.map((a) => `[${a.severity || 'ALERT'}] ${a.message || a.type}`).join('; ')
    : 'None (Sensors within normal telemetry range)';

  // 3. Construct structured prompt
  const prompt = `You are an expert agricultural apiculture (beekeeping) advisory assistant.
Analyze the supplied real hive observations, IoT sensor telemetry, and environmental context.
Do NOT make medical claims or pretend to have definitive veterinary authority.

Provide a practical health and risk advisory for the beekeeper.

Allowed risk levels:
- Low
- Moderate
- High
- Critical

Format your response strictly as a JSON object with this exact structure:
{
  "risk_level": "Low" | "Moderate" | "High" | "Critical",
  "possible_concern": "Short concise summary of potential issue (e.g. Varroa mite stress or chilled brood)",
  "possible_causes": [
    "Cause 1",
    "Cause 2"
  ],
  "observations": [
    "Observation 1 based on actual data",
    "Observation 2 based on sensor readings"
  ],
  "recommendation": [
    "Practical action step 1",
    "Practical action step 2",
    "Consult a certified apiary inspector if symptoms persist"
  ]
}

Actual Hive Telemetry & Symptom Observations:
- Hive Unit: ${hiveCode || 'HIVE-001'} (${hiveLocation || 'Apiary'})
- Hive Status: ${hiveStatus || 'Active'}
- Varroa Mite Count: ${miteCount || 'Low'}
- Bee Entrance / Foraging Activity: ${beeActivity || 'Normal'}
- Brood Pattern Quality: ${broodPattern || 'Normal'}
- Dead Bees (Bottom Board): ${deadBees ?? 0}
- Brood Core Temperature: ${sensorData?.temperature ? sensorData.temperature + ' °C' : '35.0 °C'}
- Relative Humidity: ${sensorData?.humidity ? sensorData.humidity + ' %' : '55.0 %'}
- Hive Weight: ${sensorData?.weight ? sensorData.weight + ' kg' : '42.0 kg'}
- Telemetry Flight Activity: ${sensorData?.bee_activity || beeActivity || 'Normal'}
- Active Telemetry Alerts: ${alertSummary}
- Ambient Weather: ${weatherData?.temperature ? weatherData.temperature + ' °C' : '22.0 °C'}, Humidity: ${weatherData?.humidity ? weatherData.humidity + ' %' : '50.0 %'}

Respond ONLY with valid raw JSON. Do not include markdown formatting, backticks, or preamble text.`;

  try {
    const response = await axios.post(
      `${baseUrl}/api/generate`,
      {
        model: targetModel,
        prompt: prompt,
        stream: false,
        format: 'json',
        options: {
          temperature: 0.2,
          top_p: 0.9,
        },
      },
      { timeout: 45000 }
    );

    const rawResponse = response.data?.response;
    if (!rawResponse) {
      throw new Error('Empty response received from Ollama model');
    }

    let parsed;
    try {
      const cleaned = rawResponse
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.warn('[OllamaService] Safely parsing non-JSON response from Ollama:', parseErr.message);
      parsed = normalizeMalformedResponse(rawResponse, miteCount, deadBees);
    }

    // Normalize risk level
    const validLevels = ['Low', 'Moderate', 'High', 'Critical'];
    let riskLevel = parsed.risk_level;
    if (!validLevels.includes(riskLevel)) {
      riskLevel = miteCount === 'High' || deadBees > 30 ? 'High' : miteCount === 'Medium' ? 'Moderate' : 'Low';
    }

    // Normalize observations to string[]
    let observations = [];
    if (Array.isArray(parsed.observations)) {
      observations = parsed.observations.map(String);
    } else if (typeof parsed.observations === 'string') {
      observations = parsed.observations.split('\n').map((s) => s.replace(/^[-*•\d.]+\s*/, '').trim()).filter(Boolean);
    }
    if (observations.length === 0) {
      observations = [
        `Varroa mite level: ${miteCount}`,
        `Bee entrance activity: ${beeActivity}`,
        `Brood pattern quality: ${broodPattern}`,
      ];
    }

    // Normalize recommendations to string[]
    let recommendation = [];
    const rawRec = parsed.recommendation || parsed.recommendations;
    if (Array.isArray(rawRec)) {
      recommendation = rawRec.map(String);
    } else if (typeof rawRec === 'string') {
      recommendation = rawRec.split('\n').map((s) => s.replace(/^[-*•\d.]+\s*/, '').trim()).filter(Boolean);
    }
    if (recommendation.length === 0) {
      recommendation = [
        'Inspect affected brood frames for capped cell punctures or spotty laying.',
        'Conduct a standardized alcohol wash or sugar shake mite count.',
        'Consult a certified apiary specialist if symptoms persist.',
      ];
    }

    // Possible causes
    let possibleCauses = [];
    if (Array.isArray(parsed.possible_causes)) {
      possibleCauses = parsed.possible_causes.map(String);
    } else if (typeof parsed.possible_causes === 'string') {
      possibleCauses = [parsed.possible_causes];
    }

    const possibleConcern = parsed.possible_concern || (
      miteCount === 'High' ? 'Possible Varroa mite-related colony stress' : 'Routine colony observation'
    );

    return {
      risk_level: riskLevel,
      possible_concern: possibleConcern,
      possible_causes: possibleCauses,
      observations: observations,
      recommendation: recommendation,
      modelUsed: targetModel,
      disclaimer: 'AI-powered advisory — not a definitive veterinary diagnosis.',
      analyzedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
      const err = new Error('Ollama is unavailable. Please start Ollama and ensure a supported local model is installed.');
      err.statusCode = 503;
      err.code = 'OLLAMA_UNAVAILABLE';
      throw err;
    }
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      const err = new Error('Ollama generation timed out. The local model took too long to respond.');
      err.statusCode = 504;
      err.code = 'OLLAMA_TIMEOUT';
      throw err;
    }
    throw error;
  }
}

function normalizeMalformedResponse(rawText, miteCount, deadBees) {
  const risk = miteCount === 'High' || deadBees > 30 ? 'High' : miteCount === 'Medium' ? 'Moderate' : 'Low';
  return {
    risk_level: risk,
    possible_concern: 'Risk indication based on observed symptoms',
    possible_causes: ['Colony environmental or pest factors'],
    observations: [
      rawText.slice(0, 200).replace(/\s+/g, ' ').trim() || 'Evaluated symptom report against telemetry standards.',
    ],
    recommendation: [
      'Inspect affected frames',
      'Monitor mite levels with follow-up wash',
      'Consult a certified apiary specialist if symptoms persist',
    ],
  };
}
