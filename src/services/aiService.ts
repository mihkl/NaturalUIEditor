import { GoogleGenAI } from '@google/genai';
import type { ModificationRequest, ModificationResponse } from '@/types';

const SYSTEM_PROMPT = `You are a React/TypeScript UI code modifier.

CRITICAL RULES:
1. Return ONLY the modified version of the EXACT code provided - same structure, same boundaries
2. Do NOT add imports - they are handled separately
3. Do NOT change the function/component name or signature
4. Maintain exact indentation style
5. Only modify what's necessary for the instruction

OUTPUT FORMAT (strict JSON):
{
  "modifiedCode": "... the modified code ...",
  "explanation": "Brief explanation"
}

The modifiedCode must be a valid replacement for the provided code block - nothing more, nothing less.`;

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export async function generateModification(
  request: ModificationRequest
): Promise<ModificationResponse> {
  const userPrompt = `
CURRENT CODE (lines ${request.source.lineNumber}+):
\`\`\`tsx
${request.currentCode}
\`\`\`

INSTRUCTION: ${request.instruction}

Return JSON with the modified version of ONLY the code above. Do not add imports or change the component structure.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${SYSTEM_PROMPT}\n\n${userPrompt}`,
    });

    console.log('Raw API response type:', typeof response);
    console.log('Response keys:', Object.keys(response));
    
    let content = '';
    
    // Try to extract text from various possible response structures
    if (typeof response.text === 'string') {
      content = response.text;
      console.log('Using response.text');
    } else if (typeof response === 'object' && 'candidates' in response) {
      // Handle raw API response structure
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiResponse = response as any;
      if (apiResponse.candidates?.[0]?.content?.parts?.[0]?.text) {
        content = apiResponse.candidates[0].content.parts[0].text;
        console.log('Extracted from candidates[0].content.parts[0].text');
      }
    } else if (typeof response === 'string') {
      content = response;
      console.log('Response is already a string');
    }

    if (!content) {
      console.error('Could not extract text from response:', response);
      throw new Error('Invalid API response structure');
    }

    const parsed = parseAIResponse(content);

    return {
      success: true,
      originalCode: request.currentCode,
      modifiedCode: parsed.modifiedCode,
      explanation: parsed.explanation,
    };
  } catch (error) {
    console.error('AI Service Error:', error);
    return {
      success: false,
      originalCode: request.currentCode,
      modifiedCode: '',
      explanation: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function parseAIResponse(content: string): { modifiedCode: string; explanation: string } {
  console.log('Parsing AI response, content length:', content.length);
  console.log('First 200 chars:', content.substring(0, 200));
  
  try {
    // Extract JSON from potential markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
    const jsonStr = jsonMatch[1]?.trim() || content.trim();
    console.log('Extracted JSON string length:', jsonStr.length);
    
    const parsed = JSON.parse(jsonStr);
    console.log('Parsed object keys:', Object.keys(parsed));

    if (parsed.modifiedCode) {
      console.log('Modified code length:', parsed.modifiedCode.length);
      console.log('Modified code starts with:', parsed.modifiedCode.substring(0, 100));
      
      // Normalize line endings from Windows to Unix
      const normalizedCode = parsed.modifiedCode.replace(/\r\n/g, '\n');
      
      return {
        modifiedCode: normalizedCode,
        explanation: parsed.explanation || 'Code modified successfully',
      };
    }
  } catch (error) {
    console.error('JSON parse error:', error);
    // If JSON parsing fails, try to extract code block
    const codeMatch = content.match(/```(?:tsx?|jsx?)?\s*([\s\S]*?)```/);
    if (codeMatch) {
      console.log('Extracted code block instead');
      const normalizedCode = codeMatch[1].trim().replace(/\r\n/g, '\n');
      return {
        modifiedCode: normalizedCode,
        explanation: content.replace(codeMatch[0], '').trim() || 'Code modified successfully',
      };
    }
  }

  console.error('Could not parse AI response at all');
  throw new Error('Could not parse AI response');
}
