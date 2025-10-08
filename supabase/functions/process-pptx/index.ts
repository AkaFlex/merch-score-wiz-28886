import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

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

// Helper to extract images from PPTX (PPTX is a ZIP file)
async function extractImagesFromPPTX(arrayBuffer: ArrayBuffer): Promise<Uint8Array[]> {
  const images: Uint8Array[] = [];
  
  try {
    // PPTX files are ZIP archives
    // We'll look for image files in the ppt/media folder
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Find PNG/JPG signatures in the binary data
    // PNG signature: 89 50 4E 47
    // JPEG signature: FF D8 FF
    
    let i = 0;
    while (i < uint8Array.length - 4) {
      // Check for JPEG signature
      if (uint8Array[i] === 0xFF && uint8Array[i + 1] === 0xD8 && uint8Array[i + 2] === 0xFF) {
        // Find end of JPEG (FF D9)
        let end = i + 2;
        while (end < uint8Array.length - 1) {
          if (uint8Array[end] === 0xFF && uint8Array[end + 1] === 0xD9) {
            end += 2;
            break;
          }
          end++;
        }
        images.push(uint8Array.slice(i, end));
        i = end;
      }
      // Check for PNG signature
      else if (uint8Array[i] === 0x89 && uint8Array[i + 1] === 0x50 && 
               uint8Array[i + 2] === 0x4E && uint8Array[i + 3] === 0x47) {
        // Find end of PNG (IEND chunk)
        let end = i + 4;
        while (end < uint8Array.length - 8) {
          if (uint8Array[end] === 0x49 && uint8Array[end + 1] === 0x45 && 
              uint8Array[end + 2] === 0x4E && uint8Array[end + 3] === 0x44) {
            end += 8; // Include IEND chunk
            break;
          }
          end++;
        }
        images.push(uint8Array.slice(i, end));
        i = end;
      }
      else {
        i++;
      }
    }
    
    console.log(`Found ${images.length} images in PPTX`);
    return images;
  } catch (error) {
    console.error('Error extracting images:', error);
    return [];
  }
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

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Extract text content
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const fileContent = decoder.decode(uint8Array);
    
    console.log('Extracting images from PPTX...');
    const images = await extractImagesFromPPTX(arrayBuffer);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Upload images to storage and get URLs
    const imageUrls: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const filename = `slide-${Date.now()}-${i}.jpg`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('slide-images')
        .upload(filename, image, {
          contentType: 'image/jpeg',
          upsert: false
        });
      
      if (uploadError) {
        console.error(`Error uploading image ${i}:`, uploadError);
        continue;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('slide-images')
        .getPublicUrl(filename);
      
      imageUrls.push(publicUrl);
      console.log(`Uploaded image ${i + 1}/${images.length}: ${filename}`);
    }
    
    console.log(`Successfully uploaded ${imageUrls.length} images`);
    
    // Use Lovable AI to extract structured data with vision
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Calling Lovable AI to extract data from each slide...');
    
    const extractedData: ExtractedSlideData[] = [];
    
    // Process each image with AI vision
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      
      console.log(`Processing slide ${i + 1} with AI vision: ${imageUrl}`);
      
      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-pro',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `Analise esta imagem de um slide de merchandising e extraia as seguintes informações EXATAS:

1. Código Parceiro: Procure por "Junco" seguido de números (exemplo: "Junco 225699" → extraia apenas "225699")
2. Nome da Loja: O nome da loja geralmente aparece próximo ao código (exemplo: "CARVALHO RUI BARBOSA")
3. Colaborador/Promotor: Procure por "Scala Colaborador:" ou apenas "Scala" seguido de um nome completo
4. Superior/Líder: Procure por "Superior:" seguido de um nome completo
5. Data do Envio: Procure por "Data do Envio:" seguido de data e hora no formato DD/MM/YYYY HH:MM:SS

INSTRUÇÕES IMPORTANTES:
- Leia TODO o texto visível na imagem com atenção
- Extraia os valores EXATOS conforme aparecem no slide
- Se não encontrar alguma informação, retorne string vazia para esse campo
- Seja preciso e extraia apenas os dados solicitados
- Não invente ou suponha informações que não estão visíveis`
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: imageUrl
                    }
                  }
                ]
              }
            ],
            tools: [{
              type: "function",
              function: {
                name: "extract_slide_data",
                description: "Extrai dados estruturados de um slide de merchandising",
                parameters: {
                  type: "object",
                  properties: {
                    codigoParceiro: { 
                      type: "string", 
                      description: "Apenas o número que aparece após 'Junco' (sem o texto 'Junco')"
                    },
                    nomeLoja: { 
                      type: "string", 
                      description: "Nome completo da loja"
                    },
                    colaborador: { 
                      type: "string", 
                      description: "Nome completo do colaborador/promotor que aparece após 'Scala Colaborador:' ou 'Scala'"
                    },
                    superior: { 
                      type: "string", 
                      description: "Nome completo do superior/líder que aparece após 'Superior:'"
                    },
                    dataEnvio: { 
                      type: "string", 
                      description: "Data e hora completa no formato DD/MM/YYYY HH:MM:SS que aparece após 'Data do Envio:'"
                    }
                  },
                  required: ["codigoParceiro", "nomeLoja", "colaborador", "superior", "dataEnvio"]
                }
              }
            }],
            tool_choice: { type: "function", function: { name: "extract_slide_data" } }
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error(`AI API Error for slide ${i + 1}:`, aiResponse.status, errorText);
          continue;
        }

        const aiData = await aiResponse.json();
        console.log(`AI Response for slide ${i + 1}:`, JSON.stringify(aiData, null, 2));
        
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        
        if (toolCall && toolCall.function?.arguments) {
          const slideData = JSON.parse(toolCall.function.arguments);
          console.log(`Extracted data for slide ${i + 1}:`, JSON.stringify(slideData, null, 2));
          
          extractedData.push({
            ...slideData,
            slideNumber: i + 1,
            imageUrl: imageUrl
          });
          console.log(`Successfully extracted and stored data from slide ${i + 1}`);
        } else {
          console.error(`No tool call found in AI response for slide ${i + 1}`);
          console.error(`Full AI response:`, JSON.stringify(aiData, null, 2));
        }
      } catch (error) {
        console.error(`Error processing slide ${i + 1}:`, error);
        if (error instanceof Error) {
          console.error(`Error details: ${error.message}`);
          console.error(`Error stack: ${error.stack}`);
        }
      }
    }

    if (extractedData.length === 0) {
      throw new Error('Nenhum dado foi extraído dos slides. Verifique se o arquivo está no formato correto.');
    }

    console.log(`Successfully processed ${extractedData.length} slides`);

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
