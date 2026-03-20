function summarizeUnexpectedBody(body) {
  const text = body.replace(/\s+/g, ' ').trim();

  if (!text) {
    return 'API returned an empty response';
  }

  if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
    return 'API route is unavailable in this deployment';
  }

  return text.slice(0, 160);
}

export async function readApiResponse(res, fallbackMessage = 'Request failed') {
  const body = await res.text();
  const contentType = res.headers.get('content-type') || '';
  let data = null;

  if (!body) {
    throw new Error(res.ok ? 'API returned an empty response' : fallbackMessage);
  }

  if (contentType.includes('application/json')) {
    try {
      data = JSON.parse(body);
    } catch {
      throw new Error('Server returned malformed JSON');
    }
  } else {
    throw new Error(summarizeUnexpectedBody(body));
  }

  if (!res.ok) {
    const error = new Error(data?.error || fallbackMessage);
    error.status = res.status;
    throw error;
  }

  return data;
}
