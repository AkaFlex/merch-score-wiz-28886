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

// Helper to extract first image from PPTX for each slide (for visualization)
async function extractSlideImagesFromPPTX(arrayBuffer: ArrayBuffer): Promise<Uint8Array[]> {
  try {
    const zip = new JSZip();
    await zip.loadAsync(arrayBuffer);
    
    const images: Uint8Array[] = [];
    
    // Get all image files from ppt/media folder
    const imageFiles: string[] = [];
    zip.folder('ppt/media')?.forEach((relativePath, file) => {
      if (relativePath.match(/\.(jpg|jpeg|png)$/i)) {
        imageFiles.push(relativePath);
      }
    });
    
    console.log(`Found ${imageFiles.length} images in PPTX media folder`);
    
    // Sort and take first images (usually one per slide)
    imageFiles.sort();
    
    for (const imageFile of imageFiles) {
      const file = zip.file(`ppt/media/${imageFile}`);
      if (file) {
        const arrayBuffer = await file.async('arraybuffer');
        images.push(new Uint8Array(arrayBuffer));
      }
    }
    
    console.log(`Extracted ${images.length} images for visualization`);
    return images;
  } catch (error) {
    console.error('Error extracting images from PPTX:', error);
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
    
    console.log('Extracting text from PPTX slides...');
    const slideTexts = await extractSlideTextFromPPTX(arrayBuffer);
    
    console.log('Extracting images from PPTX...');
    const images = await extractSlideImagesFromPPTX(arrayBuffer);
    
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

    console.log('Calling Lovable AI to extract data from text...');
    console.log(`Processing ${slideTexts.length} slides in parallel batches...`);
    
    const extractedData: ExtractedSlideData[] = [];
    
    // Process slides in parallel batches for better performance
    const BATCH_SIZE = 10; // Process 10 slides at a time
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
        const imageUrl = imageUrls[absoluteIndex] || '';
        
        try {
          console.log(`Processing slide ${slideNumber} with AI text analysis`);
          
          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash', // Faster model for large batches
              messages: [
                {
                  role: 'user',
                  content: `Analise este texto extraído de um slide de merchandising e extraia as seguintes informações EXATAS:

TEXTO DO SLIDE:
${slideText}

INSTRUÇÕES DE EXTRAÇÃO:
1. Código Parceiro: Procure por números após "Junco" ou no início do texto (exemplo: "225699")
2. Nome da Loja: Nome da loja após o código (exemplo: "CARVALHO RUI BARBOSA")
3. Colaborador: Nome após "Colaborador:" ou "Scala Colaborador:"
4. Superior: Nome após "Superior:"
5. Data do Envio: Data e hora após "Data do Envio:" no formato DD/MM/YYYY HH:MM:SS

IMPORTANTE: Extraia apenas os valores, sem prefixos. Se não encontrar, retorne string vazia.`
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
                      codigoParceiro: { type: "string", description: "Apenas o número do código" },
                      nomeLoja: { type: "string", description: "Nome da loja" },
                      colaborador: { type: "string", description: "Nome do colaborador" },
                      superior: { type: "string", description: "Nome do superior" },
                      dataEnvio: { type: "string", description: "Data e hora no formato DD/MM/YYYY HH:MM:SS" }
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
            console.log(`✓ Extracted data for slide ${slideNumber}`);
            
            return {
              ...slideData,
              slideNumber,
              imageUrl: imageUrl || `https://bqecjzfaefdljfrjppvz.supabase.co/storage/v1/object/public/slide-images/slide-${Date.now()}-${absoluteIndex}.jpg`
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
