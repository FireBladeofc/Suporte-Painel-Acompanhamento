import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Input validation constants
const MAX_IMAGES = 50;
const MAX_COLLABORATOR_NAME_LENGTH = 100;
const ALLOWED_ROLES = ['N1', 'N2'];
const ALLOWED_DOMAINS = ['jdtzepjudyujpiixncge.supabase.co'];
const ALLOWED_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif'];
const MAX_ARRAY_LENGTH = 20;
const MAX_STRING_FIELD_LENGTH = 5000;
const COLLABORATOR_NAME_REGEX = /^[\p{L}\p{N}\s\-'.]+$/u;

function sanitizeString(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  return value.trim().slice(0, maxLength) || null;
}

function sanitizeStringArray(value: unknown, maxItems: number, maxItemLength: number): string[] | null {
  if (!Array.isArray(value)) return null;
  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .slice(0, maxItems)
    .map((item) => item.trim().slice(0, maxItemLength));
}

function validateAnalysisResult(raw: unknown): Record<string, unknown> | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;

  const validEngagement = ['positive', 'neutral', 'negative'];
  const engagement = typeof r.engagement_level === 'string' && validEngagement.includes(r.engagement_level)
    ? r.engagement_level
    : 'neutral';

  const validResolutions = ['resolvido', 'parcialmente resolvido', 'não resolvido', 'encaminhado'];
  const resolution = typeof r.resolution_status === 'string' && validResolutions.includes(r.resolution_status)
    ? r.resolution_status
    : sanitizeString(r.resolution_status, 100);

  return {
    tone_attendant: sanitizeString(r.tone_attendant, 200),
    tone_client: sanitizeString(r.tone_client, 200),
    complaints_count: typeof r.complaints_count === 'number' && Number.isInteger(r.complaints_count) && r.complaints_count >= 0
      ? Math.min(r.complaints_count, 9999)
      : 0,
    questions_count: typeof r.questions_count === 'number' && Number.isInteger(r.questions_count) && r.questions_count >= 0
      ? Math.min(r.questions_count, 9999)
      : 0,
    processes_executed: sanitizeStringArray(r.processes_executed, MAX_ARRAY_LENGTH, 500),
    resolution_status: resolution,
    summary: sanitizeString(r.summary, MAX_STRING_FIELD_LENGTH),
    insights: sanitizeStringArray(r.insights, MAX_ARRAY_LENGTH, 1000),
    patterns: sanitizeStringArray(r.patterns, MAX_ARRAY_LENGTH, 1000),
    strengths: sanitizeStringArray(r.strengths, MAX_ARRAY_LENGTH, 1000),
    improvements: sanitizeStringArray(r.improvements, MAX_ARRAY_LENGTH, 1000),
    engagement_level: engagement,
    feedback: sanitizeString(r.feedback, MAX_STRING_FIELD_LENGTH),
    // New structured fields
    transfer_detected: typeof r.transfer_detected === 'boolean' ? r.transfer_detected : false,
    transfer_reason: sanitizeString(r.transfer_reason, 500),
    instance_code_requested: typeof r.instance_code_requested === 'boolean' ? r.instance_code_requested : false,
    client_sentiment_start: sanitizeString(r.client_sentiment_start, 200),
    client_sentiment_end: sanitizeString(r.client_sentiment_end, 200),
    robotic_communication: typeof r.robotic_communication === 'boolean' ? r.robotic_communication : false,
    robotic_communication_details: sanitizeString(r.robotic_communication_details, 1000),
    efficiency_conclusion: sanitizeString(r.efficiency_conclusion, 1000),
    top_phrases: sanitizeStringArray(r.top_phrases, 3, 500),
  };
}

function getUrlExtension(urlString: string): string | null {
  try {
    const url = new URL(urlString);
    const pathname = url.pathname;
    const lastDot = pathname.lastIndexOf('.');
    if (lastDot === -1) return null;
    return pathname.slice(lastDot + 1).toLowerCase();
  } catch {
    return null;
  }
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const RATE_LIMIT_MAX = 20; // max requests per hour
const RATE_LIMIT_WINDOW_HOURS = 1;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header');
      return jsonResponse({ success: false, error: 'Unauthorized - missing token' }, 401);
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Service role client for rate limiting (bypasses RLS)
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      console.error('Token validation failed:', claimsError);
      return jsonResponse({ success: false, error: 'Unauthorized - invalid token' }, 401);
    }

    const userId = claimsData.claims.sub;
    console.log(`Authenticated user: ${userId}`);

    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    const userRole = roleData?.role;
    if (roleError && roleError.code !== 'PGRST116') {
      console.error('Error fetching user role:', roleError);
    }

    if (userRole !== 'admin' && userRole !== 'manager') {
      console.error(`User ${userId} with role ${userRole || 'none'} attempted unauthorized analysis`);
      return jsonResponse({ 
        success: false, 
        error: 'Permissões insuficientes - somente gerentes e administradores podem realizar análises' 
      }, 403);
    }

    console.log(`User role: ${userRole} - authorized for analysis`);

    // Rate limiting check
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
    const { count, error: rlError } = await serviceClient
      .from('rate_limit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('function_name', 'analyze-feedback')
      .gte('created_at', windowStart);

    if (!rlError && (count ?? 0) >= RATE_LIMIT_MAX) {
      console.warn(`Rate limit exceeded for user ${userId}`);
      return jsonResponse({ success: false, error: 'Limite de requisições excedido. Tente novamente mais tarde.' }, 429);
    }

    // Log this request for rate limiting
    await serviceClient.from('rate_limit_logs').insert({
      user_id: userId,
      function_name: 'analyze-feedback',
    });

    // Cleanup old entries periodically (1% chance per request)
    if (Math.random() < 0.01) {
      await serviceClient.rpc('cleanup_rate_limit_logs');
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return jsonResponse({ success: false, error: 'Invalid JSON body' }, 400);
    }

    const { images, collaboratorName, collaboratorRole } = body;

    if (!images || !Array.isArray(images)) {
      return jsonResponse({ success: false, error: 'images must be an array' }, 400);
    }

    if (images.length === 0) {
      return jsonResponse({ success: false, error: 'No images provided for analysis' }, 400);
    }

    if (images.length > MAX_IMAGES) {
      return jsonResponse({ success: false, error: `Maximum ${MAX_IMAGES} images allowed` }, 400);
    }

    for (const imageUrl of images) {
      if (typeof imageUrl !== 'string') {
        return jsonResponse({ success: false, error: 'Invalid image URL format' }, 400);
      }

      try {
        const url = new URL(imageUrl);
        if (!ALLOWED_DOMAINS.includes(url.hostname)) {
          return jsonResponse({ success: false, error: 'Image URLs must be from allowed domains' }, 400);
        }
      } catch (e) {
        return jsonResponse({ success: false, error: 'Invalid URL format' }, 400);
      }

      const ext = getUrlExtension(imageUrl);
      if (!ext || !ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
        return jsonResponse(
          {
            success: false,
            error: `Formato não suportado: .${ext ?? 'desconhecido'}. Envie apenas PNG, JPG, JPEG, WebP ou GIF.`,
          },
          400,
        );
      }
    }

    if (!collaboratorName || typeof collaboratorName !== 'string') {
      return jsonResponse({ success: false, error: 'Invalid collaborator name' }, 400);
    }

    const trimmedName = collaboratorName.trim();
    if (trimmedName.length === 0 || trimmedName.length > MAX_COLLABORATOR_NAME_LENGTH) {
      return jsonResponse(
        { success: false, error: `Collaborator name must be 1-${MAX_COLLABORATOR_NAME_LENGTH} characters` },
        400,
      );
    }

    if (!COLLABORATOR_NAME_REGEX.test(trimmedName)) {
      return jsonResponse(
        { success: false, error: 'Collaborator name contains invalid characters' },
        400,
      );
    }

    if (!collaboratorRole || !ALLOWED_ROLES.includes(collaboratorRole)) {
      return jsonResponse(
        { success: false, error: `Invalid collaborator role. Must be one of: ${ALLOWED_ROLES.join(', ')}` },
        400,
      );
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return jsonResponse({ success: false, error: 'AI service not configured' }, 500);
    }

    console.log(`Analyzing ${images.length} images for ${collaboratorName} (${collaboratorRole})`);

    const imageContent = images.map((imageUrl: string) => ({
      type: "image_url",
      image_url: { url: imageUrl }
    }));

    const systemPrompt = `Você é um analista especializado em avaliação de qualidade de atendimento ao cliente para equipes de Suporte Técnico da ChatPro. Sua função é analisar prints de conversas entre atendentes e clientes para gerar feedback estruturado e acionável.

Analise as imagens de conversas fornecidas e retorne uma análise detalhada em formato JSON.

IMPORTANTE:
- Seja objetivo e profissional
- Foque em melhorias acionáveis
- Considere o contexto de Suporte Técnico da ChatPro
- Identifique padrões comportamentais
- Avalie comunicação, empatia, eficiência e resolução

CRITÉRIOS OBRIGATÓRIOS DE AVALIAÇÃO:
1. EFICIÊNCIA: Determine se o atendimento foi concluído de maneira eficiente ou se a situação NÃO foi solucionada. Explique o porquê.
2. TRANSFERÊNCIA: Identifique se houve transferência de atendimento para outro agente ou escalonamento para N2. O ideal é que o atendimento seja resolvido por apenas 1 atendente, salvo necessidade real de N2.
3. CÓDIGO DE INSTÂNCIA: Verifique se o atendente solicitou o código de instância do cliente (formato: chatpro-xxxxxx). Este é um processo OBRIGATÓRIO em todo atendimento.
4. SENTIMENTO DO CLIENTE: Avalie o sentimento/humor do cliente NO INÍCIO do atendimento e AO FINAL do atendimento separadamente.
5. COMUNICAÇÃO ROBÓTICA: Identifique se o atendente utilizou comunicação robótica/mecânica (respostas copiadas sem personalização, falta de empatia, linguagem artificial). Isso é um ponto NEGATIVO grave.`;

    const userPrompt = `Analise os prints de atendimento do colaborador "${trimmedName}" (${collaboratorRole}) e retorne APENAS um JSON válido com a seguinte estrutura:

{
  "tone_attendant": "string - tom geral do atendente (ex: profissional, empático, frio, ansioso, robótico)",
  "tone_client": "string - tom geral do cliente (ex: satisfeito, frustrado, neutro, irritado)",
  "complaints_count": number - quantidade de reclamações identificadas,
  "questions_count": number - quantidade de dúvidas do cliente,
  "processes_executed": ["array de strings com processos/procedimentos executados pelo atendente"],
  "resolution_status": "string - resolvido, parcialmente resolvido, não resolvido, encaminhado",
  "summary": "string - resumo breve de 2-3 frases sobre o atendimento, incluindo se foi eficiente e se o problema foi solucionado",
  "insights": ["array de strings com insights operacionais e comportamentais"],
  "patterns": ["array de strings com principais padrões identificados"],
  "strengths": ["array de strings com pontos fortes do colaborador"],
  "improvements": ["array de strings com pontos de melhoria sugeridos"],
  "engagement_level": "positive" | "neutral" | "negative",
  "feedback": "string - feedback estruturado e construtivo para aplicar ao colaborador (3-5 parágrafos)",
  "transfer_detected": boolean - true se houve transferência de atendimento ou escalonamento para outro agente/N2,
  "transfer_reason": "string ou null - motivo da transferência, se houve. Ex: 'Escalonado para N2 por questão técnica avançada'",
  "instance_code_requested": boolean - true se o atendente solicitou o código de instância do cliente (chatpro-xxxxxx),
  "client_sentiment_start": "string - sentimento do cliente NO INÍCIO do atendimento (ex: frustrado, ansioso, neutro, calmo)",
  "client_sentiment_end": "string - sentimento do cliente AO FINAL do atendimento (ex: satisfeito, aliviado, ainda frustrado, indiferente)",
  "robotic_communication": boolean - true se o atendente teve comunicação robótica/mecânica (respostas genéricas copiadas, sem personalização),
  "robotic_communication_details": "string ou null - detalhes sobre a comunicação robótica identificada, se houver",
  "efficiency_conclusion": "string - conclusão sobre a eficiência do atendimento: se foi resolvido de forma eficiente, se demorou mais que o necessário, se não foi solucionado e o porquê",
  "top_phrases": ["array de exatamente 3 strings - as 3 frases/expressões mais utilizadas/repetidas pelo atendente durante o atendimento. Identifique padrões de linguagem recorrentes."]
}

Retorne APENAS o JSON, sem markdown ou texto adicional.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: [
              { type: "text", text: userPrompt },
              ...imageContent
            ]
          },
        ],
        max_tokens: 6000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return jsonResponse({ success: false, error: 'Rate limit exceeded. Please try again later.' }, 429);
      }
      if (response.status === 402) {
        return jsonResponse({ success: false, error: 'Payment required. Please add credits to continue.' }, 402);
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 400 && /Unsupported image format/i.test(errorText)) {
        return jsonResponse(
          {
            success: false,
            error: 'Formato não suportado. Envie apenas PNG, JPG, JPEG, WebP ou GIF.',
          },
          400,
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: "AI analysis service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in AI response");
      return jsonResponse({ success: false, error: 'No response from AI' }, 500);
    }

    console.log("AI Response received, parsing JSON...");

    let rawParsed;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      rawParsed = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", content);
      return jsonResponse({ success: false, error: 'Failed to parse analysis result' }, 500);
    }

    const analysisResult = validateAnalysisResult(rawParsed);
    if (!analysisResult) {
      console.error("AI response failed schema validation:", rawParsed);
      return jsonResponse({ success: false, error: 'AI response does not match expected format' }, 500);
    }

    console.log("Analysis completed and validated successfully");

    return new Response(JSON.stringify({ success: true, analysis: analysisResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-feedback:", error);
    return jsonResponse({ success: false, error: 'An unexpected error occurred' }, 500);
  }
});