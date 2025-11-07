-- Create table for processing jobs
CREATE TABLE public.pptx_processing_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  total_slides INTEGER,
  processed_slides INTEGER DEFAULT 0,
  extracted_data JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.pptx_processing_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no authentication required)
CREATE POLICY "Anyone can view processing jobs" 
ON public.pptx_processing_jobs 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create processing jobs" 
ON public.pptx_processing_jobs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update processing jobs" 
ON public.pptx_processing_jobs 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_pptx_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pptx_jobs_updated_at
BEFORE UPDATE ON public.pptx_processing_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_pptx_jobs_updated_at();

-- Create index for faster queries
CREATE INDEX idx_pptx_jobs_status ON public.pptx_processing_jobs(status);
CREATE INDEX idx_pptx_jobs_created_at ON public.pptx_processing_jobs(created_at DESC);