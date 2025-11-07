import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';
import JSZip from 'https://esm.sh/jszip@3.10.1';

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

// Helper to extract text from PPTX slides (PPTX is a ZIP file)
async function extractSlideTextFromPPTX(arrayBuffer: ArrayBuffer): Promise<string[]> {
  try {
    const zip = new JSZip();
    await zip.loadAsync(arrayBuffer);
    
    const slideTexts: string[] = [];
    const slideFiles: string[] = [];
    
    // Find all slide XML files
    zip.folder('ppt/slides')?.forEach((relativePath, file) => {
      if (relativePath.match(/slide\d+\.xml$/)) {
        slideFiles.push(relativePath);
      }
    });
    
    // Sort slides by number
    slideFiles.sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml$/)?.[1] || '0');
      const numB = parseInt(b.match(/slide(\d+)\.xml$/)?.[1] || '0');
      return numA - numB;
    });
    
    console.log(`Found ${slideFiles.length} slides in PPTX`);
    
    // Extract text from each slide
    for (const slideFile of slideFiles) {
      const file = zip.file(`ppt/slides/${slideFile}`);
      if (file) {
        const content = await file.async('text');
        // Extract text from XML - remove all tags and get just the text content
        const textContent = content
          .replace(/<a:t>/g, '') // Remove opening text tags
          .replace(/<\/a:t>/g, '\n') // Replace closing text tags with newlines
          .replace(/<[^>]+>/g, '') // Remove all other XML tags
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .join('\n');
        
        slideTexts.push(textContent);
        console.log(`Extracted text from slide ${slideTexts.length}:`, textContent.substring(0, 200));
      }
    }
    
    return slideTexts;
  } catch (error) {
    console.error('Error extracting text from PPTX:', error);
    return [];
  }
}

// Helper to extract slide relationships to match images to slides
async function getSlideImageMapping(arrayBuffer: ArrayBuffer): Promise<Map<number, string>> {
  try {
    const zip = new JSZip();
    await zip.loadAsync(arrayBuffer);
    
    const slideImageMap = new Map<number, string>();
    
    // Check slide relationships to find which image belongs to which slide
    const slideFiles: Array<{num: number, file: string}> = [];
    zip.folder('ppt/slides/_rels')?.forEach((relativePath, file) => {
      const match = relativePath.match(/slide(\d+)\.xml\.rels$/);
      if (match) {
        slideFiles.push({num: parseInt(match[1]), file: relativePath});
      }
    });
    
    slideFiles.sort((a, b) => a.num - b.num);
    
    // Parse each slide's relationships to find the first image
    for (const slideFile of slideFiles) {
      const file = zip.file(`ppt/slides/_rels/${slideFile.file}`);
      if (file) {
        const content = await file.async('text');
        // Find first image relationship (usually Target="../media/image1.jpeg")
        const imageMatch = content.match(/Target="\.\.\/media\/([^"]+\.(jpg|jpeg|png))"/i);
        if (imageMatch) {
          slideImageMap.set(slideFile.num, imageMatch[1]);
        }
      }
    }
    
    console.log(`Mapped ${slideImageMap.size} slides to images`);
    return slideImageMap;
  } catch (error) {
    console.error('Error mapping slide images:', error);
    return new Map();
  }
}

// Helper to extract only required images (one per slide)
async function extractRequiredImages(arrayBuffer: ArrayBuffer, slideImageMap: Map<number, string>): Promise<Map<number, Uint8Array>> {
  try {
    const zip = new JSZip();
    await zip.loadAsync(arrayBuffer);
    
    const images = new Map<number, Uint8Array>();
    
    for (const [slideNum, imageName] of slideImageMap.entries()) {
      const file = zip.file(`ppt/media/${imageName}`);
      if (file) {
        const arrayBuffer = await file.async('arraybuffer');
        images.set(slideNum, new Uint8Array(arrayBuffer));
      }
    }
    
    console.log(`Extracted ${images.size} slide images`);
    return images;
  } catch (error) {
    console.error('Error extracting images:', error);
    return new Map();
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
    
    console.log('Extracting text from PPTX slides...');
    const slideTexts = await extractSlideTextFromPPTX(arrayBuffer);
    
    if (slideTexts.length === 0) {
      throw new Error('Nenhum slide com texto foi encontrado no arquivo PPTX');
    }
    
    console.log('Mapping slides to images...');
    const slideImageMap = await getSlideImageMapping(arrayBuffer);
    
    console.log('Extracting required images from PPTX...');
    const slideImages = await extractRequiredImages(arrayBuffer, slideImageMap);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Upload images to storage in parallel batches
    const imageUrlMap = new Map<number, string>();
    const IMAGE_BATCH_SIZE = 30; // Increased batch size
    const slideNumbers = Array.from(slideImages.keys());
    
    console.log(`Uploading ${slideImages.size} images in batches of ${IMAGE_BATCH_SIZE}...`);
    
    for (let i = 0; i < slideNumbers.length; i += IMAGE_BATCH_SIZE) {
      const batchSlideNums = slideNumbers.slice(i, Math.min(i + IMAGE_BATCH_SIZE, slideNumbers.length));
      
      const uploadPromises = batchSlideNums.map(async (slideNum) => {
        const image = slideImages.get(slideNum);
        if (!image) return { slideNum, url: '' };
        
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        const filename = `slide-${timestamp}-${random}-${slideNum}.jpg`;
        
        try {
          const { error: uploadError } = await supabase.storage
            .from('slide-images')
            .upload(filename, image, {
              contentType: 'image/jpeg',
              upsert: false
            });
          
          if (uploadError) {
            console.error(`Error uploading image for slide ${slideNum}:`, uploadError);
            return { slideNum, url: '' };
          }
          
          const { data: { publicUrl } } = supabase.storage
            .from('slide-images')
            .getPublicUrl(filename);
          
          return { slideNum, url: publicUrl };
        } catch (error) {
          console.error(`Failed to upload image for slide ${slideNum}:`, error);
          return { slideNum, url: '' };
        }
      });
      
      const batchResults = await Promise.all(uploadPromises);
      batchResults.forEach(({ slideNum, url }) => {
        if (url) imageUrlMap.set(slideNum, url);
      });
      
      console.log(`✓ Uploaded batch ${Math.floor(i / IMAGE_BATCH_SIZE) + 1}/${Math.ceil(slideNumbers.length / IMAGE_BATCH_SIZE)} (${imageUrlMap.size}/${slideImages.size} successful)`);
    }
    
    // Use Lovable AI to extract structured data
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Calling Lovable AI to extract data from text...');
    console.log(`Processing ${slideTexts.length} slides in parallel batches...`);
    
    const extractedData: ExtractedSlideData[] = [];
    
    // Process slides in parallel batches - larger batches for huge files
    const BATCH_SIZE = 20; // Process 20 slides at a time for faster processing
    const batches = [];
    
    for (let i = 0; i < slideTexts.length; i += BATCH_SIZE) {
      batches.push(slideTexts.slice(i, Math.min(i + BATCH_SIZE, slideTexts.length)));
    }
    
    console.log(`Created ${batches.length} batches of up to ${BATCH_SIZE} slides each`);
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const startSlideIndex = batchIndex * BATCH_SIZE;
      
      console.log(`Processing batch ${batchIndex + 1}/${batches.length} (slides ${startSlideIndex + 1}-${startSlideIndex + batch.length})`);
      
      // Process all slides in the batch in parallel
      const batchPromises = batch.map(async (slideText, relativeIndex) => {
        const absoluteIndex = startSlideIndex + relativeIndex;
        const slideNumber = absoluteIndex + 1;
        const imageUrl = imageUrlMap.get(slideNumber) || '';
        
        try {
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
                  role: 'user',
                  content: `Você é um extrator de dados especializado em slides de merchandising. Analise o texto abaixo e extraia EXATAMENTE as informações solicitadas.

TEXTO DO SLIDE:
${slideText}

REGRAS DE EXTRAÇÃO (SIGA RIGOROSAMENTE):

1. Código Parceiro:
   - Procure por "Junco" seguido de números (ex: "Junco 225699" → extrair "225699")
   - Ou procure por "Código:" ou "Parceiro:" seguido de números
   - SEMPRE extraia APENAS os dígitos numéricos, SEM prefixos ou texto
   - Se houver múltiplos números, pegue o primeiro que aparece após "Junco" ou similar

2. Nome da Loja:
   - Procure o nome da loja que geralmente aparece após o código
   - Exemplo: "225699 CARVALHO RUI BARBOSA" → extrair "CARVALHO RUI BARBOSA"
   - Não inclua números ou códigos no nome da loja

3. Colaborador:
   - Procure por "Colaborador:", "Scala Colaborador:", "Promotor:" ou similar
   - Extraia o nome completo que vem após esses termos
   - Não inclua os prefixos no valor extraído

4. Superior:
   - Procure por "Superior:", "Líder:", "Gestor:" ou similar
   - Extraia o nome completo que vem após esses termos
   - Não inclua os prefixos no valor extraído

5. Data do Envio:
   - Procure por "Data do Envio:", "Data:", "Enviado em:" ou similar
   - Formato esperado: DD/MM/YYYY HH:MM:SS ou DD/MM/YYYY
   - Mantenha o formato original encontrado

IMPORTANTE:
- Extraia SOMENTE os valores, sem prefixos ou labels
- Se não encontrar algum campo, retorne string vazia ("")
- Seja PRECISO e não invente dados
- O Código Parceiro deve ser APENAS números`
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
                        description: "APENAS os números do código, sem texto ou prefixos (ex: '225699')" 
                      },
                      nomeLoja: { 
                        type: "string", 
                        description: "Nome completo da loja, sem códigos numéricos" 
                      },
                      colaborador: { 
                        type: "string", 
                        description: "Nome completo do colaborador/promotor, sem prefixos" 
                      },
                      superior: { 
                        type: "string", 
                        description: "Nome completo do superior/líder, sem prefixos" 
                      },
                      dataEnvio: { 
                        type: "string", 
                        description: "Data e hora completa no formato encontrado (DD/MM/YYYY HH:MM:SS ou DD/MM/YYYY)" 
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
            console.error(`AI API Error for slide ${slideNumber}:`, aiResponse.status, errorText);
            return null;
          }

          const aiData = await aiResponse.json();
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          
          if (toolCall && toolCall.function?.arguments) {
            const slideData = JSON.parse(toolCall.function.arguments);
            console.log(`✓ Slide ${slideNumber} extracted:`, {
              codigo: slideData.codigoParceiro?.substring(0, 10),
              loja: slideData.nomeLoja?.substring(0, 20),
              hasImage: !!imageUrl
            });
            
            return {
              ...slideData,
              slideNumber,
              imageUrl: imageUrl || ''
            };
          } else {
            console.error(`No tool call found in AI response for slide ${slideNumber}`);
            return null;
          }
        } catch (error) {
          console.error(`Error processing slide ${slideNumber}:`, error);
          return null;
        }
      });
      
      // Wait for all slides in the batch to complete
      const batchResults = await Promise.all(batchPromises);
      
      // Add successful results to extractedData
      for (const result of batchResults) {
        if (result) {
          extractedData.push(result);
        }
      }
      
      console.log(`Batch ${batchIndex + 1}/${batches.length} completed. Total extracted: ${extractedData.length}/${slideTexts.length}`);
    }

    if (extractedData.length === 0) {
      throw new Error('Nenhum dado foi extraído dos slides. Verifique se o arquivo contém slides com as informações esperadas (Código Parceiro, Nome da Loja, Colaborador, Superior, Data do Envio).');
    }
    
    console.log(`Successfully extracted data:`, JSON.stringify(extractedData, null, 2));

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
