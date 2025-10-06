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
    
    console.log('Parsing PPTX structure...');
    
    // PPTX files are ZIP archives containing XML files
    // We'll extract the text from slide XML files
    const decoder = new TextDecoder();
    let extractedText = '';
    
    // Simple pattern matching to find XML content
    // Look for slide content patterns in the binary data
    const fileContent = decoder.decode(uint8Array);
    
    // Extract data using regex patterns for the known format
    const extractedData: ExtractedSlideData[] = [];
    
    // Pattern to find "Junco" followed by code and name
    const juncoPattern = /Junco\s+(\d+)\s+-\s+([A-Z\s]+)/g;
    // Pattern to find Colaborador
    const colaboradorPattern = /Scala Colaborador:\s*\n?\s*Scala\s+([A-Z\s]+)/gi;
    // Pattern to find Superior
    const superiorPattern = /Superior:\s*\n?\s*([A-Z\s]+)/gi;
    // Pattern to find Data
    const dataPattern = /Data do Envio:\s*\n?\s*(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/gi;
    
    const juncoMatches = [...fileContent.matchAll(juncoPattern)];
    const colaboradorMatches = [...fileContent.matchAll(colaboradorPattern)];
    const superiorMatches = [...fileContent.matchAll(superiorPattern)];
    const dataMatches = [...fileContent.matchAll(dataPattern)];
    
    console.log(`Found ${juncoMatches.length} slides`);
    
    // Process each match
    for (let i = 0; i < juncoMatches.length; i++) {
      const slideData: ExtractedSlideData = {
        codigoParceiro: juncoMatches[i][1] || '',
        nomeLoja: juncoMatches[i][2]?.trim() || '',
        colaborador: colaboradorMatches[i]?.[1]?.trim() || '',
        superior: superiorMatches[i]?.[1]?.trim() || '',
        dataEnvio: dataMatches[i]?.[1] || '',
        slideNumber: i + 1
      };
      
      extractedData.push(slideData);
    }
    
    console.log(`Processed ${extractedData.length} slides with data`);

    // If no data was extracted, return an error
    if (extractedData.length === 0) {
      throw new Error('Nenhum dado encontrado no arquivo. Verifique se o formato está correto.');
    }

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
