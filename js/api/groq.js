// ==========================================
// CineVerso AI - Groq AI Service (Enhanced)
// ==========================================

import { CONFIG } from '../config.js';

const { GROQ, GROQ_API_KEY } = CONFIG;

// Enhanced system prompts for better AI responses
const SYSTEM_PROMPTS = {
    general: `Eres CineBot, el asistente de IA experto en cine de CineVerso. 
Personalidad: Apasionado, conocedor, amigable. Usas emojis con moderación.
Conocimiento: Todas las películas, series, anime de la historia. Datos de producción, actores, directores, premios, taquilla, curiosidades, teorías.
Idioma: Español latinoamericano, casual pero informativo.
Límites: Máximo 200 palabras. Si hay spoilers, advierte primero. No inventes datos.
Si te preguntan por recomendaciones, menciona títulos REALES y específicos con año.`,

    search: `Eres un experto analizador de búsquedas cinematográficas. Tu trabajo es interpretar lo que el usuario realmente quiere encontrar.

INSTRUCCIONES:
1. Analiza la intención del usuario
2. Identifica películas/series REALES que coincidan
3. Genera términos de búsqueda optimizados para TMDB

RESPONDE SIEMPRE EN JSON VÁLIDO con esta estructura exacta:
{
    "intent": "specific|mood|similar|genre|question|actor|director",
    "explanation": "Explicación breve de lo que entendiste (máx 50 palabras)",
    "searchTerms": ["término principal", "término alternativo"],
    "suggestions": [
        {"title": "Título exacto de película/serie", "year": 2024, "reason": "Por qué coincide"},
        {"title": "Otro título", "year": 2023, "reason": "Por qué coincide"}
    ],
    "filters": {
        "type": "movie|tv|any",
        "genres": ["acción", "drama"],
        "yearRange": {"min": 1990, "max": 2024},
        "mood": "descripción del estado de ánimo"
    }
}

EJEMPLOS:
- "algo para ver triste" → intent: "mood", suggestions con películas emotivas como "Manchester by the Sea", "Eternal Sunshine"
- "películas como Inception" → intent: "similar", buscar thrillers de ciencia ficción con giros mentales
- "todo de Nolan" → intent: "director", listar filmografía de Christopher Nolan
- "esa donde el tipo se queda solo en Marte" → intent: "specific", sugerir "The Martian" (2015)

IMPORTANTE: Las sugerencias deben ser películas/series REALES que existen. Incluye al menos 3-5 sugerencias relevantes.`,

    guessMovie: `Eres un experto en crear descripciones crípticas de películas para un juego de adivinanzas.

REGLAS ESTRICTAS:
- NO menciones: título, actores, personajes por nombre, citas textuales
- SÍ usa: simbolismo, metáforas visuales, temas abstractos, atmósfera
- Dificultad: {difficulty}
- Máximo: 80 palabras
- Solo la descripción, sin preámbulos ni explicaciones

EJEMPLOS:
- Fácil: Pistas obvias sobre la trama principal
- Normal: Metáforas y referencias indirectas  
- Difícil: Solo simbolismo y atmósfera abstracta`,

    trivia: `Genera UNA pregunta de trivia cinematográfica.
Categoría: {category}
Dificultad: {difficulty}

RESPONDE SOLO EN JSON VÁLIDO:
{
    "question": "La pregunta completa",
    "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
    "correct": 0,
    "explanation": "Explicación de la respuesta correcta",
    "funFact": "Dato curioso adicional relacionado"
}

Las preguntas deben ser sobre datos REALES y verificables. No inventes información.`,

    director: `Eres un productor de Hollywood desarrollando un pitch de película basado en la idea del usuario.

FORMATO DE RESPUESTA:
🎬 **TÍTULO**
[Título en inglés] / [Título en español]

📝 **LOGLINE** (1 oración, máx 30 palabras)

📖 **SINOPSIS** (3 párrafos cortos)

🎭 **CASTING**
- [Actor real] como [Personaje] - [Breve descripción]
(4-5 actores reales apropiados para los roles)

🎥 **EQUIPO CREATIVO**
- Director: [Director real cuyo estilo encaje]
- Compositor: [Compositor real]
- Director de fotografía: [Sugerencia]

📊 **DATOS DE PRODUCCIÓN**
- Presupuesto estimado: $XX millones
- Rating: [G/PG/PG-13/R]
- Géneros: [lista]
- Duración estimada: XX minutos

🌟 **PREDICCIONES**
- Rating crítico: X.X/10
- Taquilla estimada: $XXX millones
- Comparables: [Películas similares exitosas]

Sé creativo pero realista. Usa actores, directores y compositores reales que encajen con el proyecto.`
};

/**
 * Make a chat completion request to Groq
 */
export async function chatCompletion(messages, options = {}) {
    const response = await fetch(GROQ.API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: GROQ.MODEL,
            messages,
            temperature: options.temperature ?? GROQ.TEMPERATURE,
            max_tokens: options.maxTokens ?? GROQ.MAX_TOKENS,
            stream: options.stream ?? false
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Groq API Error:', errorText);
        throw new Error(`Groq Error: ${response.status}`);
    }

    if (options.stream) {
        return response;
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

/**
 * Chat with CineBot
 */
export async function chat(userMessage, history = [], context = null) {
    const messages = [
        { role: 'system', content: SYSTEM_PROMPTS.general + (context ? `\n\nContexto actual: ${context}` : '') },
        ...history,
        { role: 'user', content: userMessage }
    ];

    return chatCompletion(messages);
}

/**
 * Stream chat response
 */
export async function chatStream(userMessage, history = [], context = null, onChunk) {
    const messages = [
        { role: 'system', content: SYSTEM_PROMPTS.general + (context ? `\n\nContexto actual: ${context}` : '') },
        ...history,
        { role: 'user', content: userMessage }
    ];

    const response = await chatCompletion(messages, { stream: true });
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content || '';
                fullText += content;
                if (onChunk) onChunk(content, fullText);
            } catch (e) { }
        }
    }

    return fullText;
}

/**
 * Enhanced AI-powered search intent detection
 */
export async function analyzeSearchIntent(query) {
    const messages = [
        { role: 'system', content: SYSTEM_PROMPTS.search },
        { role: 'user', content: `Analiza esta búsqueda: "${query}"` }
    ];

    try {
        const response = await chatCompletion(messages, {
            temperature: 0.3,
            maxTokens: 1500
        });

        // Try to extract JSON from response
        let jsonStr = response;

        // Handle markdown code blocks
        const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        }

        // Handle raw JSON
        const jsonStartIndex = jsonStr.indexOf('{');
        const jsonEndIndex = jsonStr.lastIndexOf('}');
        if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
            jsonStr = jsonStr.substring(jsonStartIndex, jsonEndIndex + 1);
        }

        const parsed = JSON.parse(jsonStr);

        // Validate and ensure required fields
        return {
            intent: parsed.intent || 'search',
            explanation: parsed.explanation || '',
            searchTerms: parsed.searchTerms || [query],
            suggestions: parsed.suggestions || [],
            filters: parsed.filters || { type: 'any' }
        };
    } catch (e) {
        console.error('AI search analysis error:', e);
        return {
            intent: 'search',
            searchTerms: [query],
            explanation: '',
            suggestions: [],
            filters: { type: 'any' }
        };
    }
}

/**
 * Get AI recommendations based on mood/preference
 */
export async function getAIRecommendations(query, count = 5) {
    const messages = [
        {
            role: 'system',
            content: `Eres un experto en recomendaciones cinematográficas. 
Cuando el usuario describe lo que quiere ver, recomienda películas/series REALES y EXISTENTES.

RESPONDE EN JSON VÁLIDO:
{
    "recommendations": [
        {
            "title": "Título exacto",
            "year": 2024,
            "type": "movie|tv",
            "reason": "Por qué esta recomendación es perfecta",
            "mood": "alegre|triste|emocionante|reflexivo|etc",
            "rating": 8.5
        }
    ],
    "explanation": "Resumen de por qué estas recomendaciones"
}

Incluye ${count} recomendaciones diversas pero relevantes. Solo títulos REALES.`
        },
        { role: 'user', content: query }
    ];

    try {
        const response = await chatCompletion(messages, {
            temperature: 0.6,
            maxTokens: 1500
        });

        // Extract JSON
        let jsonStr = response;
        const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        }
        const jsonStartIndex = jsonStr.indexOf('{');
        const jsonEndIndex = jsonStr.lastIndexOf('}');
        if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
            jsonStr = jsonStr.substring(jsonStartIndex, jsonEndIndex + 1);
        }

        return JSON.parse(jsonStr);
    } catch (e) {
        console.error('AI recommendations error:', e);
        return { recommendations: [], explanation: '' };
    }
}

/**
 * Generate movie description for guessing game
 */
export async function generateMovieDescription(movieTitle, difficulty = 'normal') {
    const prompt = SYSTEM_PROMPTS.guessMovie.replace('{difficulty}', difficulty);
    const messages = [
        { role: 'system', content: prompt },
        { role: 'user', content: `Película: ${movieTitle}` }
    ];

    return chatCompletion(messages, { temperature: 0.8 });
}

/**
 * Generate trivia question
 */
export async function generateTrivia(category = 'general', difficulty = 'normal') {
    const prompt = SYSTEM_PROMPTS.trivia
        .replace('{category}', category)
        .replace('{difficulty}', difficulty);

    const messages = [
        { role: 'system', content: prompt },
        { role: 'user', content: 'Genera una pregunta de trivia' }
    ];

    try {
        const response = await chatCompletion(messages, { temperature: 0.7 });

        // Extract JSON
        let jsonStr = response;
        const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        }
        const jsonStartIndex = jsonStr.indexOf('{');
        const jsonEndIndex = jsonStr.lastIndexOf('}');
        if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
            jsonStr = jsonStr.substring(jsonStartIndex, jsonEndIndex + 1);
        }

        return JSON.parse(jsonStr);
    } catch (e) {
        console.error('Trivia generation error:', e);
        return null;
    }
}

/**
 * Generate movie pitch (Director game)
 */
export async function generateMoviePitch(idea) {
    const messages = [
        { role: 'system', content: SYSTEM_PROMPTS.director },
        { role: 'user', content: idea }
    ];

    return chatCompletion(messages, { temperature: 0.8, maxTokens: 2000 });
}

/**
 * Get movie recommendation with explanation
 */
export async function getRecommendation(preferences) {
    const messages = [
        { role: 'system', content: SYSTEM_PROMPTS.general },
        {
            role: 'user', content: `Recomiéndame películas/series basándote en: ${preferences}. 
Dame 3-5 recomendaciones con título, año y una breve explicación de por qué cada una es perfecta para esto.` }
    ];

    return chatCompletion(messages);
}

/**
 * Analyze a movie/show for deeper insights
 */
export async function analyzeContent(title, type = 'movie') {
    const messages = [
        {
            role: 'system',
            content: `Eres un crítico de cine experto. Proporciona análisis profundos pero accesibles.`
        },
        {
            role: 'user',
            content: `Analiza "${title}" (${type === 'movie' ? 'película' : 'serie'}):
1. Temas principales
2. Simbolismo y metáforas
3. Lo mejor y lo mejorable
4. Para quién es ideal
5. Películas similares que disfrutarían

Sé conciso pero perspicaz.`
        }
    ];

    return chatCompletion(messages, { maxTokens: 1000 });
}

export default {
    chat,
    chatStream,
    analyzeSearchIntent,
    getAIRecommendations,
    generateMovieDescription,
    generateTrivia,
    generateMoviePitch,
    getRecommendation,
    analyzeContent
};
