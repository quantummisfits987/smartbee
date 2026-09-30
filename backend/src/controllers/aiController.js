import { query } from '../db/index.js';
import { generateHealthAdvisory, checkOllamaStatus, getOllamaHealth } from '../services/ollamaService.js';
import { getWeatherData } from '../services/weatherService.js';
import { getSmartAlerts } from '../services/alertService.js';

/**
 * AI Health Advisory Controller
 * Connects to local Ollama API for symptom risk evaluation
 */

/**
 * Dedicated health check endpoint: GET /api/health/ollama
 */
export async function getOllamaHealthHandler(req, res, next) {
  try {
    const health = await getOllamaHealth();
    if (health.status === 'connected') {
      return res.status(200).json({
        status: 'connected',
        provider: 'ollama',
        model: health.model,
      });
    }

    return res.status(503).json({
      status: 'disconnected',
      provider: 'ollama',
      error: health.error || 'Ollama is unavailable',
    });
  } catch (error) {
    res.status(503).json({
      status: 'disconnected',
      provider: 'ollama',
      error: error.message,
    });
  }
}

export async function getAiStatus(req, res, next) {
  try {
    const status = await checkOllamaStatus();
    res.status(200).json({
      success: true,
      data: status,
      available: status.available,
      available_models: status.available_models || [],
      configured_model: status.configured_model,
      message: status.message || (status.available ? 'Ollama service is active.' : 'Ollama is offline.'),
    });
  } catch (error) {
    next(error);
  }
}

export async function analyzeHiveHealth(req, res, next) {
  try {
    const { hive_id, mite_count, bee_activity, brood_pattern, dead_bees } = req.body;

    // Validate hive_id
    if (!hive_id || isNaN(Number(hive_id))) {
      return res.status(400).json({
        success: false,
        error: 'Valid numeric hive_id is required',
        message: 'Valid numeric hive_id is required',
      });
    }

    const parsedHiveId = parseInt(hive_id, 10);

    // Validate symptoms fields
    const validMiteLevels = ['Low', 'Medium', 'High'];
    if (!mite_count || !validMiteLevels.includes(mite_count)) {
      return res.status(400).json({
        success: false,
        error: "mite_count must be one of 'Low', 'Medium', or 'High'",
        message: "mite_count must be one of 'Low', 'Medium', or 'High'",
      });
    }

    const validActivities = ['Normal', 'Low'];
    if (!bee_activity || !validActivities.includes(bee_activity)) {
      return res.status(400).json({
        success: false,
        error: "bee_activity must be either 'Normal' or 'Low'",
        message: "bee_activity must be either 'Normal' or 'Low'",
      });
    }

    const validBroodPatterns = ['Normal', 'Irregular'];
    if (!brood_pattern || !validBroodPatterns.includes(brood_pattern)) {
      return res.status(400).json({
        success: false,
        error: "brood_pattern must be either 'Normal' or 'Irregular'",
        message: "brood_pattern must be either 'Normal' or 'Irregular'",
      });
    }

    const deadBeesCount = parseInt(dead_bees !== undefined ? dead_bees : '0', 10);
    if (isNaN(deadBeesCount) || deadBeesCount < 0) {
      return res.status(400).json({
        success: false,
        error: 'dead_bees count must be a non-negative integer',
        message: 'dead_bees count must be a non-negative integer',
      });
    }

    // 1. Fetch real hive details from PostgreSQL
    const hiveRes = await query('SELECT * FROM hives WHERE id = $1', [parsedHiveId]);
    if (hiveRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Hive with ID ${parsedHiveId} not found`,
        message: `Hive with ID ${parsedHiveId} not found`,
      });
    }
    const hive = hiveRes.rows[0];

    // 2. Fetch latest real sensor telemetry from PostgreSQL
    const sensorRes = await query(
      'SELECT * FROM sensor_readings WHERE hive_id = $1 ORDER BY recorded_at DESC LIMIT 1',
      [parsedHiveId]
    );
    const latestSensor = sensorRes.rows[0] || null;

    // 3. Fetch active telemetry alerts from PostgreSQL data
    let hiveAlerts = [];
    try {
      hiveAlerts = await getSmartAlerts(parsedHiveId);
    } catch {
      // Non-fatal
    }

    // 4. Fetch latest ambient weather
    let weatherData = null;
    try {
      weatherData = await getWeatherData();
    } catch {
      // Non-fatal if weather API fails
    }

    // 5. Save reported symptoms into PostgreSQL symptoms table
    await query(
      `INSERT INTO symptoms (hive_id, mite_count, bee_activity, brood_pattern, dead_bees)
       VALUES ($1, $2, $3, $4, $5)`,
      [parsedHiveId, mite_count, bee_activity, brood_pattern, deadBeesCount]
    );

    // 6. Call local Ollama API if available, or fall back to rule-based assessment
    let advisory;
    try {
      advisory = await generateHealthAdvisory({
        hiveCode: hive.hive_code,
        hiveLocation: hive.location,
        hiveStatus: hive.status,
        miteCount: mite_count,
        beeActivity: bee_activity,
        broodPattern: brood_pattern,
        deadBees: deadBeesCount,
        sensorData: latestSensor,
        weatherData: weatherData,
        alerts: hiveAlerts,
      });
    } catch (ollamaErr) {
      console.warn('[AI Controller] Ollama unavailable, using rule-based fallback:', ollamaErr.message);
      advisory = generateFallbackAdvisory({
        hiveCode: hive.hive_code,
        miteCount: mite_count,
        beeActivity: bee_activity,
        broodPattern: brood_pattern,
        deadBees: deadBeesCount,
      });
    }

    // 7. Save advisory into PostgreSQL ai_advisories table
    const analysisText = Array.isArray(advisory.observations)
      ? advisory.observations.join('. ')
      : String(advisory.observations);

    const recommendationText = Array.isArray(advisory.recommendation)
      ? advisory.recommendation.join('. ')
      : String(advisory.recommendation);

    const savedAdvisory = await query(
      `INSERT INTO ai_advisories (hive_id, risk_level, analysis, recommendation)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [parsedHiveId, advisory.risk_level, analysisText, recommendationText]
    );

    // Update hive status if High or Critical risk
    if (advisory.risk_level === 'High' || advisory.risk_level === 'Critical') {
      await query('UPDATE hives SET status = $1 WHERE id = $2', ['Attention', parsedHiveId]);
    }

    const responsePayload = {
      id: savedAdvisory.rows[0]?.id,
      hive_id: parsedHiveId,
      hive_code: hive.hive_code,
      risk_level: advisory.risk_level,
      possible_concern: advisory.possible_concern,
      possible_causes: advisory.possible_causes || [],
      observations: advisory.observations,
      recommendation: advisory.recommendation,
      modelUsed: advisory.modelUsed,
      disclaimer: 'AI-powered advisory — not a definitive veterinary diagnosis.',
      created_at: savedAdvisory.rows[0]?.created_at || new Date().toISOString(),
    };

    res.status(201).json({
      success: true,
      data: responsePayload,
      advisory: responsePayload,
    });
  } catch (error) {
    next(error);
  }
}

function generateFallbackAdvisory({ hiveCode, miteCount, beeActivity, broodPattern, deadBees }) {
  let riskLevel = 'Low';
  let concern = 'Colony operating within normal telemetry parameters';
  const observations = [
    `Varroa mite count reported: ${miteCount}`,
    `Entrance bee activity: ${beeActivity}`,
    `Brood pattern state: ${broodPattern}`,
    `Bottom board dead bee count: ${deadBees}`,
  ];
  const recommendation = [
    'Perform routine apiary inspections every 7–14 days.',
    'Ensure adequate clean water and pollen/nectar availability near hive.',
  ];

  if (miteCount === 'High' || deadBees > 30) {
    riskLevel = 'High';
    concern = 'Elevated Varroa mite density and high mortality risk';
    recommendation.unshift(
      'Conduct an immediate alcohol wash or sugar shake test to verify mite levels.',
      'Apply an approved seasonal Varroa treatment to prevent colony loss.'
    );
  } else if (miteCount === 'Medium' || beeActivity === 'Low' || broodPattern === 'Irregular') {
    riskLevel = 'Moderate';
    concern = 'Moderate colony stress or irregular brood laying pattern detected';
    recommendation.unshift('Inspect queen health, brood laying pattern, and hive ventilation.');
  }

  return {
    risk_level: riskLevel,
    possible_concern: concern,
    possible_causes: [
      miteCount === 'High' ? 'Varroa destructor pest buildup' : 'Seasonal weather fluctuation or queen age',
    ],
    observations,
    recommendation,
    modelUsed: 'SmartBee Rule-Based Fallback (Ollama Offline)',
    disclaimer: 'Automated fallback advisory — not a definitive veterinary diagnosis.',
    analyzedAt: new Date().toISOString(),
  };
}
