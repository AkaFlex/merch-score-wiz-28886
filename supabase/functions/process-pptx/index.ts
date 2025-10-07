import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedSlideData {
  codigoParceiro: string;
  nomeLoja: string;
  colaborador: string;
  superior: string;
  dataEnvio: string;
  slideNumber: number;
  imageUrl?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting PPTX processing...');
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      throw new Error('No file provided');
    }

    console.log(`Processing file: ${file.name}, size: ${file.size} bytes`);

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    console.log('Extracting text from PPTX...');
    
    // Decode the binary content
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const fileContent = decoder.decode(uint8Array);
    
    console.log('File content length:', fileContent.length);
    
    // Use Lovable AI to extract structured data
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Calling Lovable AI to extract data...');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Você é um assistente especializado em extrair dados estruturados de apresentações PowerPoint de merchandising.
Extraia as seguintes informações de cada slide:
- Código Parceiro (número que vem depois de "Junco")
- Nome da Loja (texto após o código parceiro)
- Colaborador/Promotor (nome que vem após "Scala Colaborador:" e "Scala")
- Superior/Líder (nome que vem após "Superior:")
- Data do Envio (data e hora após "Data do Envio:")

IMPORTANTE: Retorne APENAS um JSON array válido, sem markdown, sem explicações.`
          },
          {
            role: 'user',
            content: `Extraia os dados desta apresentação:\n\n${fileContent.substring(0, 50000)}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_slide_data",
            description: "Extrai dados estruturados dos slides",
            parameters: {
              type: "object",
              properties: {
                slides: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      codigoParceiro: { type: "string", description: "Código numérico do parceiro" },
                      nomeLoja: { type: "string", description: "Nome da loja" },
                      colaborador: { type: "string", description: "Nome do colaborador/promotor" },
                      superior: { type: "string", description: "Nome do superior/líder" },
                      dataEnvio: { type: "string", description: "Data e hora do envio" }
                    },
                    required: ["codigoParceiro", "nomeLoja", "colaborador", "superior", "dataEnvio"]
                  }
                }
              },
              required: ["slides"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "extract_slide_data" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', aiResponse.status, errorText);
      throw new Error(`Erro ao processar com AI: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI Response:', JSON.stringify(aiData));

    // Extract the tool call result
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || !toolCall.function?.arguments) {
      throw new Error('Nenhum dado foi extraído pelo AI. Verifique se o arquivo está no formato correto.');
    }

    const extractedResult = JSON.parse(toolCall.function.arguments);
    const slides = extractedResult.slides || [];

    if (slides.length === 0) {
      throw new Error('Nenhum slide foi encontrado no arquivo. Verifique se o formato está correto.');
    }

    // Add slide numbers
    const extractedData: ExtractedSlideData[] = slides.map((slide: any, index: number) => ({
      ...slide,
      slideNumber: index + 1
    }));

    console.log(`Successfully extracted ${extractedData.length} slides`);

    return new Response(
      JSON.stringify({
        success: true,
        data: extractedData,
        totalSlides: extractedData.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error processing PPTX:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
