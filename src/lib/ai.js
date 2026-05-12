/**
 * AI calls go through Express (/api/ai/*) for security and fallback logic.
 */

async function postJson(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || res.statusText || 'Request failed');
  }
  return data;
}

export const aiService = {
  async diagnose(brand, model, issueDescription) {
    return postJson('/api/ai/diagnose', { brand, model, issueDescription });
  },

  async analyzeIssue(brand, model, issueDescription) {
    return this.diagnose(brand, model, issueDescription);
  },

  async getInsight(vehicles, history) {
    const { insight } = await postJson('/api/ai/vehicle-insight', {
      vehicles: vehicles || [],
      serviceHistory: history || [],
    });
    return insight;
  },

  async getMonthlyReport(records) {
    const { report } = await postJson('/api/ai/monthly-report', { records: records || [] });
    return report;
  },

  async chat(message, history) {
    const { response } = await postJson('/api/ai/chat', {
      message,
      history: history || [],
    });
    return response;
  },

  async estimateCost(brand, model, serviceType, issueDescription) {
    return postJson('/api/ai/cost-estimate', {
      brand,
      model,
      serviceType,
      issueDescription,
    });
  },
};
